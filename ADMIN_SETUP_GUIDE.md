# Admin Setup Guide

## Creating Admin Credentials for Zawadi

### Problem
- Admin login returns "request failed"
- Need to properly create admin user account

### Solution

Follow these 5 steps to create an admin user:

---

## Step 1: Create Auth User in Supabase Dashboard

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user"
3. Enter:
   - Email: `admin@zawadi.tech`
   - Password: `zawadi-admin-2026`
   - Auto confirm: Toggle ON
4. Click "Create user"
5. Copy the generated User ID (UUID)

### Expected Result
You'll see the new user in the auth.users table with an email verified status.

---

## Step 2: Get the User UUID

If you need to find the UUID:

Run in Supabase SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email = 'admin@zawadi.tech';
```

Copy the `id` value (looks like: `550e8400-e29b-41d4-a716-446655440000`)

---

## Step 3: Create user_profile Entry

In Supabase SQL Editor, run:

```sql
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
  'PASTE_USER_ID_HERE'::UUID,
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
);
```

Replace `PASTE_USER_ID_HERE` with the UUID from Step 2.

### Expected Result
User profile created with `is_admin = true` and `role = 'admin'`

---

## Step 4: Create admin_users Entry

In Supabase SQL Editor, run:

```sql
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
  'PASTE_USER_ID_HERE'::UUID,
  'PASTE_USER_ID_HERE'::UUID,
  'admin@zawadi.tech',
  'Zawadi Admin',
  'admin',
  '{"view_all_users","manage_scholarships","view_reports","manage_admins","system_settings"}'::TEXT[],
  true,
  NOW(),
  NOW()
);
```

Replace `PASTE_USER_ID_HERE` with the same UUID from Step 2 (two places).

### Expected Result
Admin user record created with `is_active = true`

---

## Step 5: Verify Admin Was Created

Run in Supabase SQL Editor:

```sql
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
```

### Expected Result
Should return 1 row with:
- `is_admin = true`
- `role = 'admin'`
- `admin_role = 'admin'`
- `is_active = true`

---

## Test Admin Login

1. Go to http://localhost:5173
2. Click "Get Started"
3. Switch to "Sign in" tab
4. Check the "Admin" checkbox
5. Enter:
   - Email: `admin@zawadi.tech`
   - Password: `zawadi-admin-2026`
6. Click "Sign In"

### Expected Result
Login succeeds and admin dashboard loads.

---

## Troubleshooting

### "Policy ... already exists" Error
**Cause:** The database migrations were already run (which is correct).
**Solution:** Just ignore this error and proceed with Steps 1-5 above. The policies already exist and are working.

### Admin Login Still Returns "request failed"
Check these:

1. **Verify auth user exists:**
   ```sql
   SELECT id, email, confirmed_at FROM auth.users WHERE email = 'admin@zawadi.tech';
   ```
   Should return 1 row with `confirmed_at` populated.

2. **Verify user_profile has is_admin = true:**
   ```sql
   SELECT id, email, is_admin, role FROM public.user_profiles WHERE email = 'admin@zawadi.tech';
   ```
   Should show `is_admin = true` and `role = 'admin'`.

3. **Verify admin_users entry exists:**
   ```sql
   SELECT id, email, is_active FROM public.admin_users WHERE email = 'admin@zawadi.tech';
   ```
   Should return 1 row with `is_active = true`.

4. **Check backend logs:**
   Look in terminal for any errors when admin login is attempted.

### All Checks Pass But Still Fails
1. Restart dev server: `npm run dev`
2. Clear browser cache/cookies
3. Try in incognito window
4. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct in `.env`

---

## Admin Credentials (After Setup)

```
Email:    admin@zawadi.tech
Password: zawadi-admin-2026
Role:     Admin
Status:   Active
```

Keep these safe! These are the master admin credentials.

---

## Next Steps

Once admin login works:

1. Test admin dashboard features
2. Add more scholarships
3. Manage user accounts
4. View analytics and reports
5. Create additional admin users if needed

---

## Notes

- Admin users have full read/write access to all tables
- Users can only see their own data (RLS policies enforce this)
- All admin actions are logged in `admin_users.last_action`
- Admins must have `is_active = true` to access the system
