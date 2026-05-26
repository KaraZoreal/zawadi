# Zawadi Platform - Production Backend Setup Guide

## Overview

This guide walks through setting up the production-grade backend for the Zawadi scholarship platform.

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │ (React + Vite at :5173)
│  (client/)      │
└────────┬────────┘
         │ /api/* proxy
         ▼
┌─────────────────┐
│   Backend API   │ (Express at :3001)
│   (api/src/)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Supabase     │
│   PostgreSQL    │
│   + Auth        │
└─────────────────┘
```

## Installation Steps

### Step 1: Install Backend Dependencies

```bash
# From project root
cd api
npm install
cd ..
```

### Step 2: Set Environment Variables

Copy and populate `.env.local` (gitignored):

```bash
# Backend API
API_PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Bot Integration
BOT_SECRET=your-long-random-token

# Paystack (optional for payment testing)
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx

# JWT Secret
JWT_SECRET=your-secret-key-change-this

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Step 3: Set up Supabase Database

Run the migration in Supabase SQL editor:

1. Go to https://supabase.com → Your Project → SQL Editor
2. Create new query
3. Copy & paste contents from `api/migrations/001-add-production-tables.sql`
4. Execute

This creates:
- ✅ `subscriptions` table with RLS policies
- ✅ `audit_logs` table for admin tracking
- ✅ `usage_tracking` table for rate limiting
- ✅ Indexes on critical columns
- ✅ Published field on scholarships

### Step 4: Set Admin Role in Supabase

1. Go to Supabase Dashboard → Authentication → Users
2. Find your admin user
3. Click the three dots → Edit User
4. In "User Metadata", add:

```json
{
  "role": "admin"
}
```

Click "Save".

### Step 5: Start Development Servers

Terminal 1 - Frontend:
```bash
npm run dev
# Runs on http://localhost:5173
```

Terminal 2 - Backend:
```bash
cd api
npm run dev
# Runs on http://localhost:3001
```

The frontend will automatically proxy `/api/*` requests to the backend.

## Testing the System

### Test 1: User Login
1. Go to http://localhost:5173
2. Sign up with email/password
3. Should see scholarship list (empty if none published)

### Test 2: Admin Dashboard
1. Go to http://localhost:5173/admin.html
2. Login with your admin email/password
3. Click "Publish" on any scholarship
4. Go back to main dashboard
5. Scholarship should now appear in list (within 30 seconds)

### Test 3: Bot Integration
```bash
curl -X POST http://localhost:3001/api/bot/scholarships/ingest \
  -H "X-Bot-Secret: your-long-random-token" \
  -H "Content-Type: application/json" \
  -d '{
    "scholarships": [
      {
        "name": "Test Scholarship",
        "host": "Test Host",
        "deadline": "2025-12-31",
        "field": "Engineering",
        "funding": "$5000/year",
        "apply_url": "https://example.com/apply",
        "categories": ["STEM", "Africa"],
        "africa_eligible": true,
        "ai_ml_track": false
      }
    ]
  }'
```

Should return:
```json
{
  "status": "success",
  "added": 1,
  "scholarships": [...]
}
```

### Test 4: Essay Generation Limits
```bash
# Get user profile with limits
curl http://localhost:5173/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Should show:
# {
#   "subscription": { "plan": "free", ... },
#   "limits": { "essaysPerDay": 3, "essaysPerMonth": 30, ... }
# }
```

### Test 5: Admin Audit Logs
```bash
curl http://localhost:3001/api/admin/audit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Should show all admin actions (publish, unpublish, delete).

## Key API Endpoints

### Public
- `GET /api/public/scholarships` - List published scholarships
- `POST /api/public/auth/signup` - Register
- `POST /api/public/auth/login` - Login

### User (requires auth)
- `GET /api/user/profile` - User details + limits
- `GET /api/user/essays/usage` - Check essay generation usage
- `POST /api/user/essays/generate` - Generate essay (with limits)

### Admin (requires auth + admin role)
- `GET /api/admin/overview` - Dashboard stats
- `GET /api/admin/scholarships` - List all scholarships
- `PATCH /api/admin/scholarships/:id/publish` - Publish
- `PATCH /api/admin/scholarships/:id/unpublish` - Unpublish
- `DELETE /api/admin/scholarships/:id` - Delete
- `GET /api/admin/audit` - View audit logs

### Bot (requires X-Bot-Secret header)
- `POST /api/bot/scholarships/ingest` - Ingest scholarships

See `api/README.md` for full documentation.

## Real-Time Sync Flow

**Current (Polling):**
1. Admin publishes scholarship at 10:00
2. Backend updates database immediately
3. Frontend polls `/api/user/profile` every 30 seconds
4. User sees change by 10:00:30

**Future (WebSockets):**
1. Admin publishes scholarship
2. Backend broadcasts to all connected clients
3. User sees change in < 1 second

## Deployment to Vercel

### Prerequisites
- GitHub repository connected
- Vercel account (free)

### Steps

1. **Push code to GitHub**
```bash
git add .
git commit -m "Add production backend"
git push origin main
```

2. **Import in Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Select your GitHub repo
   - Click "Import"

3. **Set Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
     - `SUPABASE_SERVICE_ROLE`
     - `BOT_SECRET`
     - `PAYSTACK_PUBLIC_KEY`
     - `PAYSTACK_SECRET_KEY`
     - `NODE_ENV=production`

4. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes for deployment
   - Your API is now live at `https://your-vercel-url.vercel.app/api`

5. **Update Frontend API URL**
   - In frontend code, change API calls from `localhost:3001` to production URL
   - Or use relative paths `/api` which will work in production

## Subscription Tiers

| Plan | Essays/Day | Essays/Month | Price |
|------|-----------|--------------|-------|
| Free | 3 | 30 | Free |
| Plus | 15 | 200 | $5/month |
| Pro | 50 | 1000 | $12/month |
| Mentor | ∞ | ∞ | Custom |

Limits enforced on backend in `/api/src/middleware/subscription.js`.

## Database Schema

### subscriptions
```
id (UUID)
user_id (UUID) - foreign key to auth.users
plan (text) - 'free', 'plus', 'pro', 'mentor'
status (text) - 'active', 'cancelled', 'expired'
paystack_reference (text) - for payment tracking
expires_at (timestamp) - when subscription ends
created_at (timestamp)
```

### audit_logs
```
id (UUID)
admin_id (UUID) - who made the change
action (text) - 'PUBLISH_SCHOLARSHIP', etc.
resource_type (text) - 'scholarship', 'user', etc.
resource_id (UUID) - what was changed
before_values (JSONB) - previous state
after_values (JSONB) - new state
ip_address (text)
created_at (timestamp)
```

### usage_tracking
```
id (UUID)
user_id (UUID)
usage_type (text) - 'essay_generation', 'application_tracking'
count (int) - how many used
period_start (date) - 2025-05-26 for today
created_at (timestamp)
UNIQUE(user_id, usage_type, period_start)
```

### scholarships (additions)
```
published (boolean) - visible to users?
published_by (UUID) - admin who published
published_at (timestamp) - when published
```

## Troubleshooting

**"Missing authorization token"**
- Admin.html not storing token in localStorage
- Check browser DevTools → Application → Local Storage
- Should see `zawadi:admin_token`

**"Admin access required"**
- User doesn't have `role: 'admin'` metadata
- Go to Supabase → Auth → Users → Edit User
- Add `{ "role": "admin" }` to metadata

**"Database unavailable"**
- Check `SUPABASE_SERVICE_ROLE` env var
- Must be service_role_key, not anon key
- Get from Supabase dashboard → API

**Scholarships not appearing after publish**
- Check that scholarship has `published = true` in database
- Frontend polls every 30 seconds
- Manually refresh to see immediately

**Bot ingestion returns 403**
- `X-Bot-Secret` header doesn't match `BOT_SECRET`
- Check env var in terminal: `echo $BOT_SECRET`
- Verify in curl command

## Next Steps

1. ✅ Backend running locally
2. ✅ Admin dashboard publishing scholarships
3. ✅ Scholarships appearing to users
4. → Test payment flow with Paystack test keys
5. → Deploy to Vercel
6. → Load test at 1000+ concurrent users
7. → Set up monitoring/alerts

## Support

For questions or issues:
1. Check `api/README.md` for detailed endpoint docs
2. Check browser console for error messages
3. Check Supabase dashboard for database issues
4. Check environment variables in `.env.local`

## Files Modified/Created

**New Files:**
- `api/` - Entire backend directory
- `api/src/server.js` - Express app
- `api/src/middleware/` - Auth, subscription enforcement
- `api/src/routes/` - All API endpoints
- `api/migrations/001-add-production-tables.sql` - Database setup
- `api/README.md` - Full API documentation
- `BACKEND_SETUP.md` - This file

**Modified Files:**
- `public/admin.html` - Updated to use real backend API
- `vite.config.js` - Added API proxy
- `vercel.json` - Added backend routes
- `.env.example` - Added backend env vars

**Removed Files:**
- `server-admin.js` - Temporary test server
- `supabase-add-published.sql` - Replaced with real migration

## Version History

- v1.0.0 - Initial production backend with admin dashboard
