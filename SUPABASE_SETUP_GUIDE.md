# TECHSARI ZAWADI - SUPABASE SETUP GUIDE

## Fresh Database Setup (No Migrations)

This guide shows how to set up the complete Supabase database from scratch using the SQL file provided.

## Prerequisites

- Supabase project created
- Access to Supabase SQL Editor
- Connection details saved in `.env`

## Setup Steps

### 1. Connect to Supabase Project

```bash
# Set environment variables in .env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Run the SQL Setup

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase-setup.sql`
4. Paste into the SQL Editor
5. Click "Run"

Wait for completion - you should see: `Techsari Zawadi Database Setup Complete`

### 3. Verify Tables Created

Run this query to verify:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see these tables:
- admin_users
- applications
- country_language_mapping
- documents
- language_settings
- recommendation_scores
- scholarships
- user_profiles
- user_recommendations

### 4. Create Admin User

```sql
-- First, create auth user via Supabase UI or API
-- Then run this to create admin profile:

INSERT INTO public.user_profiles (
  id, email, name, country, language_group, 
  is_admin, role, plan, profile_complete
)
VALUES (
  'USER_UUID_FROM_AUTH',
  'admin@zawadi.com',
  'Admin User',
  'Kenya',
  'Anglophone',
  true,
  'admin',
  'premium',
  true
);

-- Create admin_users entry
INSERT INTO public.admin_users (
  id, user_profile_id, email, name, 
  role, is_active
)
VALUES (
  'USER_UUID_FROM_AUTH',
  'USER_UUID_FROM_AUTH',
  'admin@zawadi.com',
  'Admin User',
  'admin',
  true
);
```

### 5. Add Sample Scholarships

```sql
INSERT INTO public.scholarships (
  name, description, provider, country,
  coverage_type, coverage_amount, 
  target_levels, target_fields,
  application_url, deadline, is_active
) VALUES (
  'African Excellence Scholarship',
  'Full tuition scholarship for African students',
  'Global Scholarship Fund',
  'Kenya',
  'Full Tuition',
  75000.00,
  ARRAY['Master''s', 'PhD'],
  ARRAY['STEM', 'Engineering', 'Computer Science'],
  'https://example.com/apply',
  CURRENT_DATE + INTERVAL '6 months',
  true
);
```

## Database Schema Overview

### Tables

1. **user_profiles**: User account information and profile data
   - Stores: name, country, language_group, field_of_study, etc.
   - RLS: Users can only view/edit their own data

2. **admin_users**: Admin-specific information
   - Stores: role, permissions, last_login, activity logs
   - RLS: Only admins can view

3. **scholarships**: Scholarship opportunities
   - Stores: eligibility criteria, deadlines, coverage amounts
   - RLS: Public read, admins can manage

4. **applications**: User scholarship applications
   - Stores: application status, form data, documents
   - RLS: Users see only their own

5. **recommendation_scores**: AI matching scores (8 dimensions)
   - Dimensions: education, country, field, level, language, GPA, coverage, timing
   - RLS: Users see their own recommendations

6. **documents**: Uploaded documents (transcripts, certs, etc.)
   - RLS: Users manage their own documents

7. **language_settings**: User language preferences
   - RLS: Users manage their own

8. **user_recommendations**: Top scholarship matches for each user
   - RLS: Users see their own recommendations

## Functions & Procedures

### Recommendation Engine Functions

All scoring functions are built into the database:

- `calculate_education_match()` - Match user level to scholarship
- `calculate_country_match()` - Country eligibility
- `calculate_field_match()` - Field of study match
- `calculate_gpa_match()` - GPA eligibility
- `calculate_language_match()` - Language requirements
- `calculate_recommendation_score()` - Overall scoring

### Stored Procedures

- `get_user_recommendations(user_id, limit)` - Get top recommendations
- `update_admin_login(admin_id)` - Update admin login time

## Row Level Security (RLS)

All tables have RLS enabled:

- Users see only their own data
- Admins can see and manage all data
- Scholarships are publicly readable (if active)
- Sensitive data (admin_users, documents) restricted

## Triggers

Automatic data management:

- `user_profiles_update_timestamp` - Update modified time
- `applications_update_timestamp` - Update modified time
- `user_profile_create_recommendations` - Auto-generate recommendations on signup

## Country & Language Mapping

54 African countries mapped to 5 language groups:

1. **Anglophone** (20 countries): Kenya, Nigeria, South Africa, etc.
2. **Francophone** (17 countries): Senegal, Cameroon, Côte d'Ivoire, etc.
3. **Arabophone** (10 countries): Egypt, Algeria, Morocco, etc.
4. **Lusophone** (4 countries): Angola, Mozambique, Cape Verde, etc.
5. **Bilingual**: Multi-language support

## Backend API Integration

The backend (`api/src/routes/public/auth.js`) uses these endpoints:

### Signup
```
POST /api/public/auth/signup
Body: { email, password, name, country }
```

### Login
```
POST /api/public/auth/login
Body: { email, password }
```

### Admin Login
```
POST /api/public/auth/admin-login
Body: { email, password }
Returns: admin user data + session
```

### Get Recommendations
```
GET /api/recommendations/:userId
Returns: Top 20 scholarship matches with scores
```

## Testing the Setup

1. Sign up a test user via the app
2. Verify user_profile created
3. Check recommendation_scores populated
4. Test admin login (if admin user created)
5. Verify RLS policies working

## Troubleshooting

### "Request failed" on admin login
- Check admin_users table has entry
- Verify is_admin = true in user_profiles
- Check RLS policies are correct

### Recommendations not appearing
- Verify scholarships are is_active = true
- Check user profile has required fields
- Run recommendation score calculation manually

### RLS blocking queries
- Verify user is authenticated
- Check user_id matches in RLS policies
- For admins, verify is_admin flag set

## Production Checklist

- [ ] Run supabase-setup.sql
- [ ] Create admin user
- [ ] Add sample scholarships
- [ ] Test signup flow
- [ ] Test admin login
- [ ] Verify recommendations generate
- [ ] Test RLS policies
- [ ] Enable Supabase backups
- [ ] Set up monitoring/alerts
- [ ] Configure custom domains

## Support

For issues, check:
1. Supabase logs and error messages
2. Backend console logs
3. RLS policy definitions
4. Database connection status
