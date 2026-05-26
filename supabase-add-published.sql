-- ============================================================================
-- Zawadi — Add published and verifiedAt fields to scholarships
-- Run this in Supabase Dashboard → SQL Editor after the main migration
-- ============================================================================

-- Add published and verifiedAt columns to scholarships table
ALTER TABLE scholarships
ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verifiedAt TIMESTAMPTZ;

-- Create an index on published status for faster filtering
CREATE INDEX IF NOT EXISTS idx_scholarships_published 
  ON scholarships (published) 
  WHERE published = true;

-- Create an index on verifiedAt for sorting
CREATE INDEX IF NOT EXISTS idx_scholarships_verifiedAt 
  ON scholarships (verifiedAt DESC);
