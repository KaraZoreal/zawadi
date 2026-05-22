-- ============================================================================
-- Zawadi Scholarship Platform — Supabase Schema
-- ============================================================================

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Kenya',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro', 'mentor')),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SCHOLARSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  host TEXT NOT NULL DEFAULT 'Verify host',
  field TEXT NOT NULL DEFAULT 'All fields',
  degree TEXT NOT NULL DEFAULT 'Masters',
  funding TEXT NOT NULL DEFAULT 'Verify funding',
  deadline TEXT NOT NULL DEFAULT 'Check portal',
  africa_eligible BOOLEAN NOT NULL DEFAULT false,
  ai_ml_track BOOLEAN NOT NULL DEFAULT false,
  barrier TEXT NOT NULL DEFAULT '',
  apply_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Duplicate prevention: a scholarship is unique by name + host combination
  CONSTRAINT scholarships_name_host_unique UNIQUE (name, host)
);

-- ============================================================================
-- USER_SCHOLARSHIPS (Junction / Tracking Table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_scholarships (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Not started',
  notes TEXT NOT NULL DEFAULT '',
  tracking JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, scholarship_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Scholarships: fast filtering
CREATE INDEX IF NOT EXISTS idx_scholarships_africa_eligible
  ON scholarships (africa_eligible) WHERE africa_eligible = true;

CREATE INDEX IF NOT EXISTS idx_scholarships_ai_ml_track
  ON scholarships (ai_ml_track) WHERE ai_ml_track = true;

CREATE INDEX IF NOT EXISTS idx_scholarships_degree
  ON scholarships (degree);

CREATE INDEX IF NOT EXISTS idx_scholarships_field
  ON scholarships (field);

CREATE INDEX IF NOT EXISTS idx_scholarships_funding
  ON scholarships (funding);

CREATE INDEX IF NOT EXISTS idx_scholarships_deadline
  ON scholarships (deadline);

CREATE INDEX IF NOT EXISTS idx_scholarships_created_at
  ON scholarships (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scholarships_name_host
  ON scholarships (name, host);

-- Full-text search index on scholarship name and field
CREATE INDEX IF NOT EXISTS idx_scholarships_name_trgm
  ON scholarships USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scholarships_field_trgm
  ON scholarships USING gin (field gin_trgm_ops);

-- Enable trigram extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- User scholarships: fast lookup
CREATE INDEX IF NOT EXISTS idx_user_scholarships_user_id
  ON user_scholarships (user_id);

CREATE INDEX IF NOT EXISTS idx_user_scholarships_scholarship_id
  ON user_scholarships (scholarship_id);

CREATE INDEX IF NOT EXISTS idx_user_scholarships_status
  ON user_scholarships (status);

-- Users: fast lookup
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_plan
  ON users (plan);

-- ============================================================================
-- AUTO-UPDATE `updated_at` TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to scholarships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scholarships_updated_at'
  ) THEN
    CREATE TRIGGER trg_scholarships_updated_at
      BEFORE UPDATE ON scholarships
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Attach to user_scholarships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_scholarships_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_scholarships_updated_at
      BEFORE UPDATE ON user_scholarships
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scholarships ENABLE ROW LEVEL SECURITY;

-- USERS: You can only read/update your own row
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own row (on signup)
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- SCHOLARSHIPS: Anyone authenticated can read; only admins can insert/update/delete
CREATE POLICY scholarships_select_all ON scholarships
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY scholarships_insert_admin ON scholarships
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY scholarships_update_admin ON scholarships
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY scholarships_delete_admin ON scholarships
  FOR DELETE
  USING (auth.role() = 'service_role');

-- USER_SCHOLARSHIPS: Users can manage their own tracking rows
CREATE POLICY user_scholarships_select_own ON user_scholarships
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_scholarships_insert_own ON user_scholarships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_scholarships_update_own ON user_scholarships
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_scholarships_delete_own ON user_scholarships
  FOR DELETE
  USING (auth.uid() = user_id);
