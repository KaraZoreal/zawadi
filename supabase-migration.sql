-- ============================================================
-- Techsari Zawadi — Supabase Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. GRANT existing tables to all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholarships TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_scholarships TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon, authenticated, service_role;

-- 2. Enable RLS on all tables
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Scholarships: anyone can read, only admin can write
DROP POLICY IF EXISTS "Anyone can read scholarships" ON public.scholarships;
CREATE POLICY "Anyone can read scholarships" ON public.scholarships
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert scholarships" ON public.scholarships;
CREATE POLICY "Admin can insert scholarships" ON public.scholarships
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin can update scholarships" ON public.scholarships;
CREATE POLICY "Admin can update scholarships" ON public.scholarships
  FOR UPDATE USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admin can delete scholarships" ON public.scholarships;
CREATE POLICY "Admin can delete scholarships" ON public.scholarships
  FOR DELETE USING (auth.role() = 'service_role');

-- 4. user_scholarships: users manage their own
DROP POLICY IF EXISTS "Users can read own saved scholarships" ON public.user_scholarships;
CREATE POLICY "Users can read own saved scholarships" ON public.user_scholarships
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved scholarships" ON public.user_scholarships;
CREATE POLICY "Users can insert own saved scholarships" ON public.user_scholarships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved scholarships" ON public.user_scholarships;
CREATE POLICY "Users can update own saved scholarships" ON public.user_scholarships
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved scholarships" ON public.user_scholarships;
CREATE POLICY "Users can delete own saved scholarships" ON public.user_scholarships
  FOR DELETE USING (auth.uid() = user_id);

-- 5. users: users manage own profile, public read
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 6. Create documents table for file uploads
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own documents" ON public.documents;
CREATE POLICY "Users manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- 7. Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID REFERENCES public.scholarships(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own applications" ON public.applications;
CREATE POLICY "Users manage own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id);

-- 8. Create user_profiles table (synced with auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  country TEXT DEFAULT 'Kenya',
  plan TEXT DEFAULT 'free',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users manage own profile" ON public.user_profiles;
CREATE POLICY "Users manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- 9. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, country, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Kenya'),
    'free'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
