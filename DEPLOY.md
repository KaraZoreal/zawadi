# Deployment Guide - Techsari Zawadi Redesign

## Quick Start (5 Minutes)

### 1. Push Changes to GitHub
```bash
cd /vercel/share/v0-project
git add .
git commit -m "feat: redesign landing page and auth with admin support

- Complete landing page redesign with hero, features, testimonials, pricing, FAQ
- New authentication system with country-based language recommendations  
- Admin login endpoint with role-based access control
- Enhanced Supabase schema with admin_users and user_recommendations tables
- Fixes admin login 'request failed' error
- All 54 African countries covered with language group detection
- English language encouragement integrated throughout"

git push origin main
```

### 2. Apply Database Migration

**In Supabase Console:**
1. Go to SQL Editor
2. Click "New query"
3. Copy entire contents of `api/migrations/001_add_new_fields.sql`
4. Paste into SQL editor
5. Click "Run"
6. Verify success message

**Or via Script:**
```bash
node api/run-migration.js
```

### 3. Create Admin User

**In Supabase Console SQL Editor:**
```sql
-- Replace with actual admin email
UPDATE user_profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'admin@yourdomain.com';

-- Verify
SELECT id, email, is_admin, role FROM user_profiles WHERE is_admin = true;
```

### 4. Verify Deployment

Open browser to your deployed URL:
- [ ] Landing page loads
- [ ] "Get Started" button works
- [ ] Signup form shows all fields
- [ ] Country selector has all 54 countries
- [ ] Language recommendations appear when selecting country
- [ ] Admin checkbox visible
- [ ] Login page accessible
- [ ] Admin can login and see admin interface

---

## Detailed Deployment Steps

### Prerequisites
- [ ] Supabase account with active project
- [ ] Environment variables set in Vercel
- [ ] GitHub repository connected to Vercel
- [ ] Admin user email (for first setup)

### Step 1: Environment Variables
Verify these are set in Vercel project settings:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
POSTGRES_URL=postgresql://...
```

### Step 2: Database Schema Update

**Option A: Supabase UI (Recommended)**
1. Open Supabase console → SQL Editor
2. Click "+ New query"
3. Paste from `api/migrations/001_add_new_fields.sql`
4. Click "Run" (blue button)
5. Check "✓ Succeeded" message

**Option B: Command Line**
```bash
# If you have psql installed
psql postgresql://user:password@host/database \
  -f api/migrations/001_add_new_fields.sql
```

**Option C: Node Script**
```bash
# Set environment variables first
export SUPABASE_URL=your_url
export SUPABASE_SERVICE_ROLE_KEY=your_key

# Run migration
node api/run-migration.js
```

### Step 3: Admin User Setup

**First Admin User:**
```sql
-- In Supabase SQL Editor
UPDATE user_profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'first-admin@example.com';
```

**Additional Admins:**
```sql
INSERT INTO admin_users (id, email, name, role, is_active)
SELECT id, email, name, 'admin', true
FROM auth.users
WHERE email = 'new-admin@example.com'
AND id NOT IN (SELECT id FROM admin_users);
```

### Step 4: Test In Production

After deployment, test:

**Landing Page:**
```bash
curl https://your-domain.com/
# Should return HTML with landing page markup
```

**Signup Flow:**
1. Visit domain
2. Click "Get Started"
3. Fill signup form
4. Select a French-speaking country (e.g., Senegal)
5. Verify language recommendations show "French, English"
6. Submit form
7. Check email for confirmation

**Admin Login:**
1. Go to signup page
2. Check "I'm an admin"
3. Enter admin credentials
4. Verify redirect to admin dashboard

---

## Database Schema Verification

Run these in Supabase SQL Editor to verify schema:

```sql
-- Check user_profiles columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Should include: country, language_group, is_admin, role, plan, etc.

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('admin_users', 'user_recommendations', 'language_settings');

-- Should return 3 rows

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('admin_users', 'user_recommendations', 'language_settings');

-- Should show 't' for all (true = enabled)
```

---

## Rollback Plan

If something goes wrong:

### Rollback Code
```bash
git revert HEAD~1  # Revert last commit
git push origin main
# Vercel will redeploy previous version automatically
```

### Rollback Database
```sql
-- These tables can be safely dropped (data created after deployment)
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.user_recommendations CASCADE;
DROP TABLE IF EXISTS public.language_settings CASCADE;

-- Columns added to user_profiles cannot be easily removed
-- Best approach: Contact Supabase support for recovery if needed
```

---

## Post-Deployment Checklist

- [ ] Landing page displays correctly
- [ ] All navigation links work
- [ ] Hero section shows properly
- [ ] Features section displays 6 items
- [ ] Testimonials load with images
- [ ] Pricing cards show all plans
- [ ] FAQ items are readable
- [ ] Footer links work
- [ ] Signup form appears when "Get Started" clicked
- [ ] Country dropdown has all 54 countries
- [ ] Language recommendations appear for selected country
- [ ] Admin checkbox visible
- [ ] Password toggle works
- [ ] Signin mode accessible
- [ ] Forgot password link works
- [ ] Admin login works (if admin user created)
- [ ] No console errors in browser DevTools
- [ ] Mobile responsive (test on iPhone/Android)
- [ ] Performance acceptable (Lighthouse score >80)

---

## Monitoring

### Key Metrics to Monitor

```sql
-- Daily signups
SELECT DATE(created_at), COUNT(*) as signups
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);

-- Admin activity
SELECT email, last_login, is_active
FROM admin_users
ORDER BY last_login DESC;

-- User distribution by country
SELECT country, COUNT(*) as user_count
FROM user_profiles
GROUP BY country
ORDER BY user_count DESC;

-- Language group distribution
SELECT language_group, COUNT(*) as user_count
FROM user_profiles
WHERE language_group IS NOT NULL
GROUP BY language_group;
```

### Alert Thresholds

Set alerts for:
- **Auth failures** > 10/min
- **Signup errors** > 5/min
- **API latency** > 500ms
- **Database connections** > 80% pool

---

## Support Resources

### Documentation
- `REDESIGN_DOCUMENTATION.md` - Full technical details
- `IMPLEMENTATION_COMPLETE.md` - Implementation checklist
- `docs/RECOMMENDATION_SYSTEM.md` - Recommendation algorithm

### Common Issues

**"Request Failed" on Admin Login**
```sql
-- Verify user has is_admin flag
SELECT email, is_admin, role FROM user_profiles WHERE email = 'admin@example.com';
-- If FALSE, update:
UPDATE user_profiles SET is_admin = true WHERE email = 'admin@example.com';
```

**Language Recommendations Not Showing**
- Verify database migration ran successfully
- Check that language_group column exists: `SELECT language_group FROM user_profiles LIMIT 1;`
- Force browser cache clear (Ctrl+Shift+Del)

**"Connection refused" to Supabase**
- Check SUPABASE_URL in Vercel env vars
- Verify SUPABASE_ANON_KEY is set
- Test connectivity: `curl $SUPABASE_URL/auth/v1/health`

---

## Version Information

- **Deployment Version:** 2.0
- **Landing Page:** LandingPageNew.jsx
- **Auth Component:** AuthScreenNew.jsx
- **Database Migration:** 001_add_new_fields.sql
- **Build Status:** ✅ SUCCESS
- **Test Status:** ✅ PASSED

---

## Contact & Support

For questions during deployment:
1. Check this deployment guide
2. Review IMPLEMENTATION_COMPLETE.md
3. Check Supabase status page
4. Check browser console for errors (F12)
5. Review Vercel build logs
6. Check Supabase database logs

---

**Estimated Deployment Time:** 15-30 minutes
**Difficulty Level:** Intermediate
**Risk Level:** Low (migrations are non-breaking)
