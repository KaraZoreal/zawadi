-- ============================================
-- CREATE ADMIN USER IN SUPABASE
-- ============================================
-- Run this SQL in Supabase SQL Editor to create an admin user
-- Admin Email: admin@zawadi.tech
-- Admin Password: zawadi-admin-2026

-- ============================================
-- STEP 1: Create user in auth.users
-- ============================================
-- This is done via Supabase Dashboard or Auth API
-- Email: admin@zawadi.tech
-- Password: zawadi-admin-2026

-- ============================================
-- STEP 2: Get the User ID from auth.users
-- ============================================
-- After creating in auth, get the UUID
-- Query to find it:
-- SELECT id, email FROM auth.users WHERE email = 'admin@zawadi.tech';

-- ============================================
-- STEP 3: Create user_profile entry
-- ============================================
-- Replace 'YOUR_USER_ID' with the actual UUID from Step 2
INSERT INTO public.user_profiles (
  id,
  email,
  name,
  country,
  language_group,
  is_admin,
  role,
  profile_complete,
  plan,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID'::UUID,
  'admin@zawadi.tech',
  'Zawadi Admin',
  'Kenya',
  'Anglophone',
  true,
  'admin',
  true,
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  role = 'admin',
  updated_at = NOW();

-- ============================================
-- STEP 4: Create admin_users entry
-- ============================================
-- Replace 'YOUR_USER_ID' with the actual UUID from Step 2
INSERT INTO public.admin_users (
  id,
  user_profile_id,
  email,
  name,
  role,
  permissions,
  is_active,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID'::UUID,
  'YOUR_USER_ID'::UUID,
  'admin@zawadi.tech',
  'Zawadi Admin',
  'admin',
  '{"view_all_users","manage_scholarships","view_reports","manage_admins","system_settings"}'::TEXT[],
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- ============================================
-- STEP 5: Verify admin was created
-- ============================================
SELECT 
  up.id,
  up.email,
  up.name,
  up.is_admin,
  up.role,
  au.email as admin_email,
  au.role as admin_role,
  au.is_active
FROM public.user_profiles up
LEFT JOIN public.admin_users au ON up.id = au.user_profile_id
WHERE up.email = 'admin@zawadi.tech';

-- ============================================
-- TROUBLESHOOTING
-- ============================================
-- If you get error: "policy ... already exists"
-- This means migrations were already run. Just proceed with Steps 1-5 above.
--
-- If admin login still fails:
-- 1. Verify email is admin@zawadi.tech (check in auth.users)
-- 2. Verify is_admin = true in user_profiles
-- 3. Verify record exists in admin_users table
-- 4. Check that admin_users.is_active = true
