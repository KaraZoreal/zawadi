# Troubleshooting Guide

## Issue 1: Admin Login Returns "Request Failed"

### Root Cause
The admin user account doesn't exist in your database yet. Even though the email/password authentication works, the system can't find the admin record.

### Solution

Follow **QUICK_ADMIN_SETUP.md** - 3 simple steps:

1. Create auth user in Supabase Dashboard
2. Run the provided SQL in Supabase SQL Editor
3. Test admin login

---

## Issue 2: "Policy ... already exists" Error When Running SQL

### Root Cause
The database migrations (`supabase-setup.sql`) have **already been successfully applied** to your Supabase database. This is good! The policies are already there.

### Solution

**DO NOT run `supabase-setup.sql` again.**

Instead:
1. Use the SQL from **QUICK_ADMIN_SETUP.md** to create the admin user
2. The SQL in that file uses `INSERT ... ON CONFLICT` which safely handles existing data
3. It will create the admin user without errors

---

## Why Both Issues?

**Timeline:**
1. ✅ We ran all 4 migrations to Supabase (001-004)
   - Created 9 tables
   - Created 15 RLS policies
   - Created recommendation engine
   - Loaded countries & scholarships

2. ❌ We didn't create an admin user account (manual step)
   - Auth system is ready
   - Database is ready
   - Just need actual admin credentials

3. ❌ You tried to run `supabase-setup.sql` again
   - Got "policy already exists" (expected - migrations already ran)
   - Couldn't create admin user manually from that file

---

## Quick Verification

To check your current state, run in Supabase SQL Editor:

```sql
-- Check if migrations ran
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check if countries are loaded
SELECT COUNT(*) FROM public.country_language_mapping;

-- Check if scholarships are loaded
SELECT COUNT(*) FROM public.scholarships;

-- Check if admin user exists
SELECT * FROM public.admin_users;
```

Expected output:
```
tablename: applications, admin_users, country_language_mapping, documents, etc.
countries: 54
scholarships: 10
admin_users: (empty - this is what we're about to fix)
```

---

## Step-by-Step: Creating Admin User

### 1. Create Auth User
**Supabase Dashboard → Authentication → Users → Add user**

- Email: `admin@zawadi.tech`
- Password: `zawadi-admin-2026`
- Auto confirm: ON

Copy the generated UUID.

### 2. Create Database Records
**Supabase → SQL Editor → Paste this:**

```sql
INSERT INTO public.user_profiles (
  id, email, name, country, language_group, is_admin, role, profile_complete, plan, created_at, updated_at
) VALUES (
  'PASTE_UUID_HERE'::UUID,
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

INSERT INTO public.admin_users (
  id, user_profile_id, email, name, role, permissions, is_active, created_at, updated_at
) VALUES (
  'PASTE_UUID_HERE'::UUID,
  'PASTE_UUID_HERE'::UUID,
  'admin@zawadi.tech',
  'Zawadi Admin',
  'admin',
  '{"view_all_users","manage_scholarships","view_reports","manage_admins","system_settings"}'::TEXT[],
  true,
  NOW(),
  NOW()
);
```

Replace `PASTE_UUID_HERE` with the UUID from Step 1 (appears twice).

### 3. Verify
```sql
SELECT email, is_admin, role FROM public.user_profiles WHERE email = 'admin@zawadi.tech';
SELECT email, is_active FROM public.admin_users WHERE email = 'admin@zawadi.tech';
```

Should return 1 row each with is_admin=true and is_active=true.

### 4. Test Login
- Go to http://localhost:5173
- Click "Get Started"
- Toggle "Admin" checkbox
- Enter: admin@zawadi.tech / zawadi-admin-2026
- Click "Sign In"

✅ Should work now!

---

## Other Common Issues

### "NEXT_PUBLIC_SUPABASE_URL is not set"
Check your `.env` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from Supabase Dashboard → Project Settings → API.

### "Database connection failed"
- Check POSTGRES_URL in `.env`
- Check Supabase is running (check dashboard)
- Check your internet connection
- Try restarting the dev server: `npm run dev`

### Admin login still fails after creating user
Run these checks in SQL Editor:

```sql
-- Check auth user
SELECT id, email, confirmed_at FROM auth.users WHERE email = 'admin@zawadi.tech';

-- Check profile
SELECT id, email, is_admin, role FROM public.user_profiles WHERE email = 'admin@zawadi.tech';

-- Check admin record
SELECT id, email, is_active FROM public.admin_users WHERE email = 'admin@zawadi.tech';
```

All three should return 1 row with matching UUIDs.

---

## Support

If you're still stuck:

1. Check the ADMIN_SETUP_GUIDE.md for detailed steps
2. Review QUICK_ADMIN_SETUP.md for the minimal version
3. Run the SQL verification queries above
4. Check browser console for errors (F12)
5. Check server logs for errors (terminal where dev server runs)

---

## Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Admin login "request failed" | Admin user doesn't exist | Create auth user + database records |
| "Policy already exists" error | Migrations already ran | Don't rerun old SQL, use new admin setup script |
| Database connection error | Wrong env vars or server down | Check `.env` and Supabase dashboard |
| Still can't login after setup | Missing admin_users record | Run verification SQL above |
