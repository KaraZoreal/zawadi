-- ============================================
-- TECHSARI ZAWADI - COMPLETE SUPABASE SETUP
-- ============================================
-- Run this SQL directly in Supabase SQL Editor to set up entire database fresh
-- No migrations needed - this creates everything from scratch

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  country TEXT,
  language_group TEXT,
  date_of_birth DATE,
  phone TEXT,
  institution TEXT,
  field_of_study TEXT,
  study_level TEXT,
  target_countries TEXT[],
  target_universities TEXT[],
  gpa DECIMAL(3,2),
  essay_topics JSONB DEFAULT '[]'::jsonb,
  profile_complete BOOLEAN DEFAULT FALSE,
  plan TEXT DEFAULT 'free',
  is_admin BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  last_login TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 3. ADMIN USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_profile_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'moderator',
  permissions TEXT[] DEFAULT '{"view_reports","manage_users"}'::text[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  last_login TIMESTAMP WITH TIME ZONE,
  last_action TEXT
);

-- ============================================
-- 4. SCHOLARSHIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  country TEXT NOT NULL,
  coverage_type TEXT,
  coverage_amount DECIMAL(12,2),
  eligibility_criteria JSONB DEFAULT '{}'::jsonb,
  target_countries TEXT[],
  target_levels TEXT[],
  target_fields TEXT[],
  application_url TEXT,
  deadline DATE,
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  is_active BOOLEAN DEFAULT TRUE,
  match_score DECIMAL(3,2)
);

-- ============================================
-- 5. APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft',
  form_data JSONB DEFAULT '{}'::jsonb,
  essay_content TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  notes TEXT,
  UNIQUE(user_id, scholarship_id)
);

-- ============================================
-- 6. RECOMMENDATION SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  
  -- 8-dimension scoring system
  education_match DECIMAL(3,2) DEFAULT 0,
  country_match DECIMAL(3,2) DEFAULT 0,
  field_match DECIMAL(3,2) DEFAULT 0,
  level_match DECIMAL(3,2) DEFAULT 0,
  language_match DECIMAL(3,2) DEFAULT 0,
  gpa_match DECIMAL(3,2) DEFAULT 0,
  coverage_match DECIMAL(3,2) DEFAULT 0,
  timing_match DECIMAL(3,2) DEFAULT 0,
  
  -- Overall score
  overall_score DECIMAL(3,2) DEFAULT 0,
  match_percentage INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(user_id, scholarship_id)
);

-- ============================================
-- 7. DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  extracted_text TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  is_verified BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 8. LANGUAGE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.language_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'English',
  language_group TEXT,
  supported_languages TEXT[] DEFAULT '{"English"}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- ============================================
-- 9. USER RECOMMENDATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  rank INTEGER,
  score DECIMAL(3,2),
  recommendation_reason TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()),
  UNIQUE(user_id, scholarship_id)
);

-- ============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON public.user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_user_profiles_language_group ON public.user_profiles(language_group);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON public.user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_scholarships_country ON public.scholarships(country);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON public.scholarships(is_active);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_scholarship_id ON public.applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_user_id ON public.recommendation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_scores_scholarship_id ON public.recommendation_scores(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON public.user_recommendations(user_id);

-- ============================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

-- USER PROFILES RLS
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ADMIN USERS RLS
CREATE POLICY "Only admins can view admin users" ON public.admin_users
  FOR SELECT USING ((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Only admins can manage admin users" ON public.admin_users
  FOR ALL USING ((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

-- SCHOLARSHIPS RLS (public read)
CREATE POLICY "Anyone can view active scholarships" ON public.scholarships
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Only admins can manage scholarships" ON public.scholarships
  FOR ALL USING ((SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

-- APPLICATIONS RLS
CREATE POLICY "Users can view their own applications" ON public.applications
  FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

CREATE POLICY "Users can update their own applications" ON public.applications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own applications" ON public.applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RECOMMENDATION SCORES RLS
CREATE POLICY "Users can view their own recommendations" ON public.recommendation_scores
  FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

-- DOCUMENTS RLS
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- LANGUAGE SETTINGS RLS
CREATE POLICY "Users can manage their language settings" ON public.language_settings
  FOR ALL USING (user_id = auth.uid());

-- USER RECOMMENDATIONS RLS
CREATE POLICY "Users can view their recommendations" ON public.user_recommendations
  FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()) = TRUE);

-- ============================================
-- 12. FUNCTIONS FOR RECOMMENDATION ENGINE
-- ============================================

-- Function to calculate education match (0-100)
CREATE OR REPLACE FUNCTION calculate_education_match(
  user_level TEXT,
  scholarship_levels TEXT[]
)
RETURNS DECIMAL AS $$
BEGIN
  IF user_level = ANY(scholarship_levels) THEN
    RETURN 100;
  ELSIF scholarship_levels IS NULL OR array_length(scholarship_levels, 1) = 0 THEN
    RETURN 75;
  ELSE
    RETURN 25;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate country match (0-100)
CREATE OR REPLACE FUNCTION calculate_country_match(
  user_country TEXT,
  scholarship_country TEXT,
  target_countries TEXT[]
)
RETURNS DECIMAL AS $$
BEGIN
  IF user_country = scholarship_country THEN
    RETURN 100;
  ELSIF user_country = ANY(target_countries) THEN
    RETURN 90;
  ELSE
    RETURN 50;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate field match (0-100)
CREATE OR REPLACE FUNCTION calculate_field_match(
  user_field TEXT,
  scholarship_fields TEXT[]
)
RETURNS DECIMAL AS $$
BEGIN
  IF user_field = ANY(scholarship_fields) THEN
    RETURN 100;
  ELSIF scholarship_fields IS NULL OR array_length(scholarship_fields, 1) = 0 THEN
    RETURN 80;
  ELSE
    RETURN 20;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate GPA match (0-100)
CREATE OR REPLACE FUNCTION calculate_gpa_match(
  user_gpa DECIMAL,
  user_country TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  min_gpa DECIMAL;
BEGIN
  -- Different minimum GPA requirements by country education system
  SELECT CASE
    WHEN user_country IN ('Kenya', 'Nigeria', 'South Africa', 'Ghana') THEN 2.5
    WHEN user_country IN ('Egypt', 'Ethiopia', 'Uganda') THEN 2.0
    ELSE 2.2
  END INTO min_gpa;
  
  IF user_gpa >= 3.8 THEN
    RETURN 100;
  ELSIF user_gpa >= 3.5 THEN
    RETURN 95;
  ELSIF user_gpa >= 3.0 THEN
    RETURN 90;
  ELSIF user_gpa >= min_gpa THEN
    RETURN 70;
  ELSE
    RETURN 30;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate language match (0-100)
CREATE OR REPLACE FUNCTION calculate_language_match(
  user_language_group TEXT,
  scholarship_country TEXT
)
RETURNS DECIMAL AS $$
DECLARE
  country_language_group TEXT;
BEGIN
  -- Map countries to their primary language groups
  SELECT CASE
    WHEN scholarship_country IN ('Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Uganda', 'Tanzania', 'Rwanda', 'Botswana', 'Namibia', 'Zambia', 'Zimbabwe', 'Mauritius', 'Seychelles', 'Malawi', 'Lesotho', 'Eswatini', 'Gambia', 'Liberia', 'Sierra Leone') THEN 'Anglophone'
    WHEN scholarship_country IN ('Senegal', 'Cameroon', 'Ivory Coast', 'Mali', 'Burkina Faso', 'Niger', 'Guinea', 'Gabon', 'Congo', 'DRC', 'Chad', 'Benin', 'Togo', 'Equatorial Guinea', 'CAR', 'Burundi', 'Guinea-Bissau') THEN 'Francophone'
    WHEN scholarship_country IN ('Egypt', 'Algeria', 'Morocco', 'Tunisia', 'Libya', 'Sudan', 'Djibouti', 'Mauritania', 'Comoros', 'Eritrea') THEN 'Arabophone'
    WHEN scholarship_country IN ('Angola', 'Mozambique', 'Cape Verde', 'Sao Tome and Principe') THEN 'Lusophone'
    ELSE 'Anglophone'
  END INTO country_language_group;
  
  IF user_language_group = country_language_group THEN
    RETURN 100;
  ELSIF user_language_group = 'Bilingual' THEN
    RETURN 90;
  ELSE
    RETURN 60;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Main function to calculate overall recommendation score
CREATE OR REPLACE FUNCTION calculate_recommendation_score(
  user_id UUID,
  scholarship_id UUID
)
RETURNS TABLE (
  education_score DECIMAL,
  country_score DECIMAL,
  field_score DECIMAL,
  level_score DECIMAL,
  language_score DECIMAL,
  gpa_score DECIMAL,
  coverage_score DECIMAL,
  timing_score DECIMAL,
  overall_score DECIMAL
) AS $$
DECLARE
  v_user_level TEXT;
  v_user_field TEXT;
  v_user_gpa DECIMAL;
  v_user_country TEXT;
  v_user_language_group TEXT;
  v_scholarship_levels TEXT[];
  v_scholarship_fields TEXT[];
  v_scholarship_country TEXT;
  v_scholarship_deadline DATE;
  v_scholarship_coverage DECIMAL;
  v_education_match DECIMAL;
  v_country_match DECIMAL;
  v_field_match DECIMAL;
  v_level_match DECIMAL;
  v_language_match DECIMAL;
  v_gpa_match DECIMAL;
  v_coverage_match DECIMAL;
  v_timing_match DECIMAL;
  v_overall DECIMAL;
BEGIN
  -- Get user data
  SELECT study_level, field_of_study, gpa, country, language_group
  INTO v_user_level, v_user_field, v_user_gpa, v_user_country, v_user_language_group
  FROM public.user_profiles WHERE id = user_id;
  
  -- Get scholarship data
  SELECT target_levels, target_fields, country, deadline, coverage_amount
  INTO v_scholarship_levels, v_scholarship_fields, v_scholarship_country, v_scholarship_deadline, v_scholarship_coverage
  FROM public.scholarships WHERE id = scholarship_id;
  
  -- Calculate individual dimensions
  v_education_match := calculate_education_match(v_user_level, v_scholarship_levels);
  v_country_match := calculate_country_match(v_user_country, v_scholarship_country, ARRAY[]::text[]);
  v_field_match := calculate_field_match(v_user_field, v_scholarship_fields);
  v_level_match := COALESCE((v_user_level = ANY(v_scholarship_levels))::int * 100, 50)::DECIMAL;
  v_language_match := calculate_language_match(v_user_language_group, v_scholarship_country);
  v_gpa_match := calculate_gpa_match(v_user_gpa, v_user_country);
  v_coverage_match := CASE WHEN v_scholarship_coverage > 50000 THEN 100 WHEN v_scholarship_coverage > 20000 THEN 85 ELSE 70 END;
  v_timing_match := CASE WHEN v_scholarship_deadline > CURRENT_DATE + INTERVAL '30 days' THEN 100 WHEN v_scholarship_deadline > CURRENT_DATE THEN 80 ELSE 20 END;
  
  -- Calculate overall score (weighted average)
  v_overall := (
    (v_education_match * 0.15) +
    (v_country_match * 0.20) +
    (v_field_match * 0.15) +
    (v_level_match * 0.10) +
    (v_language_match * 0.15) +
    (v_gpa_match * 0.10) +
    (v_coverage_match * 0.08) +
    (v_timing_match * 0.07)
  ) / 100;
  
  RETURN QUERY SELECT
    v_education_match::DECIMAL,
    v_country_match::DECIMAL,
    v_field_match::DECIMAL,
    v_level_match::DECIMAL,
    v_language_match::DECIMAL,
    v_gpa_match::DECIMAL,
    v_coverage_match::DECIMAL,
    v_timing_match::DECIMAL,
    v_overall::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

-- Trigger to update user_profiles updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_update_timestamp
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_user_profiles_timestamp();

-- Trigger to update applications updated_at
CREATE OR REPLACE FUNCTION update_applications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_update_timestamp
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION update_applications_timestamp();

-- Trigger to update recommendation_scores
CREATE OR REPLACE FUNCTION update_recommendation_scores()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.recommendation_scores (
    user_id, scholarship_id, education_match, country_match, field_match, level_match,
    language_match, gpa_match, coverage_match, timing_match, overall_score
  )
  SELECT
    NEW.id AS user_id,
    s.id AS scholarship_id,
    res.education_score,
    res.country_score,
    res.field_score,
    res.level_score,
    res.language_score,
    res.gpa_score,
    res.coverage_score,
    res.timing_score,
    res.overall_score
  FROM public.scholarships s
  CROSS JOIN LATERAL calculate_recommendation_score(NEW.id, s.id) res
  WHERE s.is_active = TRUE
  ON CONFLICT (user_id, scholarship_id) DO UPDATE SET
    education_match = EXCLUDED.education_match,
    country_match = EXCLUDED.country_match,
    field_match = EXCLUDED.field_match,
    level_match = EXCLUDED.level_match,
    language_match = EXCLUDED.language_match,
    gpa_match = EXCLUDED.gpa_match,
    coverage_match = EXCLUDED.coverage_match,
    timing_match = EXCLUDED.timing_match,
    overall_score = EXCLUDED.overall_score,
    updated_at = TIMEZONE('utc'::TEXT, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profile_create_recommendations
AFTER INSERT ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_recommendation_scores();

-- ============================================
-- 14. STORED PROCEDURES
-- ============================================

-- Get top recommendations for a user
CREATE OR REPLACE FUNCTION get_user_recommendations(
  user_id UUID,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  scholarship_id UUID,
  scholarship_name TEXT,
  provider TEXT,
  country TEXT,
  coverage_amount DECIMAL,
  match_score DECIMAL,
  match_percentage INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.provider,
    s.country,
    s.coverage_amount,
    rs.overall_score,
    ROUND((rs.overall_score * 100)::NUMERIC, 0)::INT
  FROM public.recommendation_scores rs
  JOIN public.scholarships s ON rs.scholarship_id = s.id
  WHERE rs.user_id = get_user_recommendations.user_id
  AND s.is_active = TRUE
  ORDER BY rs.overall_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Update admin login timestamp
CREATE OR REPLACE FUNCTION update_admin_login(admin_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admin_users
  SET last_login = TIMEZONE('utc'::TEXT, NOW())
  WHERE id = admin_id;
  
  UPDATE public.user_profiles
  SET last_login = TIMEZONE('utc'::TEXT, NOW())
  WHERE id = admin_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 15. COUNTRY AND LANGUAGE MAPPING
-- ============================================

CREATE TABLE IF NOT EXISTS public.country_language_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL UNIQUE,
  language_group TEXT NOT NULL,
  primary_language TEXT,
  secondary_languages TEXT[],
  region TEXT
);

INSERT INTO public.country_language_mapping (country_name, country_code, language_group, primary_language, secondary_languages, region) VALUES
-- Anglophone
('Kenya', 'KE', 'Anglophone', 'English', ARRAY['Swahili'], 'East Africa'),
('Nigeria', 'NG', 'Anglophone', 'English', ARRAY['Yoruba', 'Igbo', 'Hausa'], 'West Africa'),
('South Africa', 'ZA', 'Anglophone', 'English', ARRAY['Xhosa', 'Zulu'], 'Southern Africa'),
('Ghana', 'GH', 'Anglophone', 'English', ARRAY['Twi', 'Fante'], 'West Africa'),
('Uganda', 'UG', 'Anglophone', 'English', ARRAY['Luganda', 'Swahili'], 'East Africa'),
('Tanzania', 'TZ', 'Anglophone', 'English', ARRAY['Swahili'], 'East Africa'),
('Rwanda', 'RW', 'Anglophone', 'English', ARRAY['Kinyarwanda', 'French'], 'East Africa'),
('Botswana', 'BW', 'Anglophone', 'English', ARRAY['Setswana'], 'Southern Africa'),
('Namibia', 'NA', 'Anglophone', 'English', ARRAY['Afrikaans'], 'Southern Africa'),
('Zambia', 'ZM', 'Anglophone', 'English', ARRAY['Bemba', 'Nyanja'], 'Southern Africa'),
('Zimbabwe', 'ZW', 'Anglophone', 'English', ARRAY['Shona', 'Ndebele'], 'Southern Africa'),
('Mauritius', 'MU', 'Anglophone', 'English', ARRAY['Mauritian Creole', 'French'], 'East Africa'),
('Seychelles', 'SC', 'Anglophone', 'English', ARRAY['Seychellois Creole', 'French'], 'East Africa'),
('Malawi', 'MW', 'Anglophone', 'English', ARRAY['Chichewa', 'Lomwe'], 'Southern Africa'),
('Lesotho', 'LS', 'Anglophone', 'English', ARRAY['Sotho'], 'Southern Africa'),
('Eswatini', 'SZ', 'Anglophone', 'English', ARRAY['Swati', 'Zulu'], 'Southern Africa'),
('Gambia', 'GM', 'Anglophone', 'English', ARRAY['Mandinka', 'Wolof'], 'West Africa'),
('Liberia', 'LR', 'Anglophone', 'English', ARRAY['Kpelle', 'Bassa'], 'West Africa'),
('Sierra Leone', 'SL', 'Anglophone', 'English', ARRAY['Krio', 'Mende'], 'West Africa'),
('South Sudan', 'SS', 'Anglophone', 'English', ARRAY['Dinka', 'Nuer'], 'East Africa'),

-- Francophone
('Senegal', 'SN', 'Francophone', 'French', ARRAY['Wolof', 'Pulaar', 'English'], 'West Africa'),
('Cameroon', 'CM', 'Francophone', 'French', ARRAY['Pidgin English', 'Fang'], 'Central Africa'),
('Côte d''Ivoire', 'CI', 'Francophone', 'French', ARRAY['Akan', 'Mandinka'], 'West Africa'),
('Mali', 'ML', 'Francophone', 'French', ARRAY['Bambara', 'Fula'], 'West Africa'),
('Burkina Faso', 'BF', 'Francophone', 'French', ARRAY['Moore', 'Dioula'], 'West Africa'),
('Niger', 'NE', 'Francophone', 'French', ARRAY['Hausa', 'Djerma'], 'West Africa'),
('Guinea', 'GN', 'Francophone', 'French', ARRAY['Susu', 'Pular'], 'West Africa'),
('Gabon', 'GA', 'Francophone', 'French', ARRAY['Fang', 'Bantu'], 'Central Africa'),
('Republic of the Congo', 'CG', 'Francophone', 'French', ARRAY['Kongo', 'Teke'], 'Central Africa'),
('Democratic Republic of the Congo', 'CD', 'Francophone', 'French', ARRAY['Lingala', 'Kikongo'], 'Central Africa'),
('Chad', 'TD', 'Francophone', 'French', ARRAY['Arabic', 'Sara'], 'Central Africa'),
('Benin', 'BJ', 'Francophone', 'French', ARRAY['Fon', 'Yoruba'], 'West Africa'),
('Togo', 'TG', 'Francophone', 'French', ARRAY['Ewe', 'Kabye'], 'West Africa'),
('Central African Republic', 'CF', 'Francophone', 'French', ARRAY['Sango'], 'Central Africa'),
('Equatorial Guinea', 'GQ', 'Francophone', 'French', ARRAY['Spanish', 'Fang'], 'Central Africa'),
('Burundi', 'BI', 'Francophone', 'French', ARRAY['Kirundi', 'English'], 'East Africa'),
('Guinea-Bissau', 'GW', 'Francophone', 'Portuguese', ARRAY['Crioulo', 'Mandinka'], 'West Africa'),

-- Arabophone
('Egypt', 'EG', 'Arabophone', 'Arabic', ARRAY['English', 'French'], 'North Africa'),
('Algeria', 'DZ', 'Arabophone', 'Arabic', ARRAY['French', 'Berber'], 'North Africa'),
('Morocco', 'MA', 'Arabophone', 'Arabic', ARRAY['French', 'Berber'], 'North Africa'),
('Tunisia', 'TN', 'Arabophone', 'Arabic', ARRAY['French', 'English'], 'North Africa'),
('Libya', 'LY', 'Arabophone', 'Arabic', ARRAY['English', 'Italian'], 'North Africa'),
('Sudan', 'SD', 'Arabophone', 'Arabic', ARRAY['English', 'Dinka'], 'East Africa'),
('Mauritania', 'MR', 'Arabophone', 'Arabic', ARRAY['French', 'Wolof'], 'West Africa'),
('Djibouti', 'DJ', 'Arabophone', 'Arabic', ARRAY['French', 'Somali'], 'East Africa'),
('Comoros', 'KM', 'Arabophone', 'Arabic', ARRAY['French', 'Comorian'], 'East Africa'),
('Eritrea', 'ER', 'Arabophone', 'Arabic', ARRAY['Tigrinya', 'English'], 'East Africa'),

-- Lusophone
('Angola', 'AO', 'Lusophone', 'Portuguese', ARRAY['Umbundu', 'Kikongo'], 'Southern Africa'),
('Mozambique', 'MZ', 'Lusophone', 'Portuguese', ARRAY['Makhuwa', 'English'], 'Southern Africa'),
('Cape Verde', 'CV', 'Lusophone', 'Portuguese', ARRAY['Crioulo', 'English'], 'West Africa'),
('São Tomé and Príncipe', 'ST', 'Lusophone', 'Portuguese', ARRAY['Forro', 'French'], 'Central Africa');

-- ============================================
-- 16. VERIFY SETUP
-- ============================================
SELECT 'Techsari Zawadi Database Setup Complete' AS status,
       COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name NOT LIKE 'pg_%';
