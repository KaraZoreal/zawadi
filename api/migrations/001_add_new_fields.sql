-- Add new columns to user_profiles table to support new features
-- This migration adds support for language groups, admin users, and improved recommendation system

-- Alter user_profiles table to add new columns
ALTER TABLE IF EXISTS public.user_profiles
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Kenya',
  ADD COLUMN IF NOT EXISTS language_group VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS target_level VARCHAR(100) DEFAULT 'Masters',
  ADD COLUMN IF NOT EXISTS field_interests JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS study_countries JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS profile JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  permissions JSONB DEFAULT '{
    "manage_scholarships": true,
    "manage_users": true,
    "manage_payments": true,
    "view_analytics": true
  }'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_recommendations table for tracking recommendation system
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country VARCHAR(100),
  language_group VARCHAR(50),
  academic_level VARCHAR(100),
  field_interests JSONB DEFAULT '[]'::jsonb,
  study_countries JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP DEFAULT NOW(),
  recommendation_score FLOAT DEFAULT 0,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create language_settings table
CREATE TABLE IF NOT EXISTS public.language_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(50) DEFAULT 'English',
  language_group VARCHAR(50),
  other_languages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON public.user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_language_group ON public.user_profiles(language_group);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON public.user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_language_group ON public.user_recommendations(language_group);
CREATE INDEX IF NOT EXISTS idx_language_settings_user_id ON public.language_settings(user_id);

-- Set up Row Level Security (RLS) for admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to view their own admin record
CREATE POLICY admin_users_self_select ON public.admin_users
  FOR SELECT USING (auth.uid() = id);

-- Create policy for admin users to view all admin records (if they are admin)
CREATE POLICY admin_users_admin_select ON public.admin_users
  FOR SELECT USING (EXISTS(SELECT 1 FROM public.admin_users WHERE id = auth.uid()));

-- Update RLS policies for user_profiles if they exist
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_profiles_self_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_self_update ON public.user_profiles;

-- Create new policies for user_profiles
CREATE POLICY user_profiles_self_select ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_profiles_self_update ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Set up RLS for language_settings
ALTER TABLE public.language_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY language_settings_self_select ON public.language_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY language_settings_self_insert ON public.language_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY language_settings_self_update ON public.language_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Set up RLS for user_recommendations
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_recommendations_self_select ON public.user_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_recommendations_self_insert ON public.user_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT SELECT ON public.language_settings TO authenticated;
GRANT INSERT, UPDATE, SELECT ON public.language_settings TO authenticated;
GRANT SELECT, INSERT ON public.user_recommendations TO authenticated;
GRANT UPDATE ON public.user_recommendations TO authenticated;

-- Create or update a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_timestamp();

-- Insert sample admin user (replace with actual credentials)
-- This is for testing only - change in production
INSERT INTO public.admin_users (id, email, name, role, is_active)
SELECT id, email, raw_user_meta_data->>'name', 'admin', true
FROM auth.users
WHERE email LIKE '%@zawadi%' OR email LIKE '%@techsari%'
ON CONFLICT (id) DO NOTHING;

COMMIT;
