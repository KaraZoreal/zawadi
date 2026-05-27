-- Migration 001: Add production tables for subscriptions, audit logs, and usage tracking

-- Add published fields to scholarships table
ALTER TABLE scholarships
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'plus', 'pro', 'mentor')),
  paystack_reference TEXT UNIQUE,
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'KES',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  before_values JSONB,
  after_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('essay_generation', 'application_tracking')),
  count INT DEFAULT 1,
  period_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, usage_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start);

-- RLS Policies for subscriptions (users can see their own)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for audit_logs (admin only)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_admin_only ON audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for usage_tracking (users can see their own)
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY usage_tracking_select_own ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY usage_tracking_insert_own ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY usage_tracking_update_own ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update scholarships published field RLS
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY scholarships_public_published ON scholarships
  FOR SELECT USING (published = true);

CREATE POLICY scholarships_admin_all ON scholarships
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT ON subscriptions TO anon, authenticated;
GRANT SELECT ON subscriptions TO service_role;
GRANT INSERT, UPDATE ON subscriptions TO authenticated, service_role;

GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON audit_logs TO service_role;
GRANT INSERT ON audit_logs TO service_role;

GRANT SELECT, INSERT, UPDATE ON usage_tracking TO authenticated, service_role;
