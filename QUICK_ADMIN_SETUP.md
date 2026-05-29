# Quick Admin Setup (3 Steps)

## The Issue
The admin user doesn't exist yet in your database. The "request failed" error happens because the authentication passes, but the admin check fails (user is not in the admin_users table or doesn't have is_admin=true).

## The Solution (3 Simple Steps)

### Step 1: Create Auth User
Go to **Supabase Dashboard → Authentication → Users → Add user**

Create a new user with:
- **Email:** admin@zawadi.tech  
- **Password:** zawadi-admin-2026  
- **Auto confirm:** Toggle ON

Then copy the User ID (UUID).

---

### Step 2: Paste This SQL in Supabase SQL Editor

Replace `YOUR_USER_ID` with the UUID from Step 1:

```sql
-- Create user profile
INSERT INTO public.user_profiles (
  id, email, name, country, language_group, is_admin, role, profile_complete, plan, created_at, updated_at
) VALUES (
  'YOUR_USER_ID'::UUID, 'admin@zawadi.tech', 'Zawadi Admin', 'Kenya', 'Anglophone', true, 'admin', true, 'admin', NOW(), NOW()
);

-- Create admin user record
INSERT INTO public.admin_users (
  id, user_profile_id, email, name, role, permissions, is_active, created_at, updated_at
) VALUES (
  'YOUR_USER_ID'::UUID, 'YOUR_USER_ID'::UUID, 'admin@zawadi.tech', 'Zawadi Admin', 'admin',
  '{"view_all_users","manage_scholarships","view_reports","manage_admins","system_settings"}'::TEXT[],
  true, NOW(), NOW()
);
```

---

### Step 3: Test Admin Login

1. Go to http://localhost:5173
2. Click "Get Started"
3. Toggle the **Admin** checkbox
4. Enter:
   - Email: `admin@zawadi.tech`
   - Password: `zawadi-admin-2026`
5. Click "Sign In"

✅ **Done!** Admin login should now work.

---

## If You Get "Policy ... already exists" Error

That's GOOD! It means the migrations were already applied correctly. Just run the SQL in Step 2 - it will insert the admin user without errors.

---

## Admin Credentials
```
Email:    admin@zawadi.tech
Password: zawadi-admin-2026
```

That's it! 🎉
