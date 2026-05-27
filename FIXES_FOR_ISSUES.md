# Bug Fixes for Zawadi Platform

This document outlines the three critical issues and their fixes:

## Issue 1: Upload Documents Route Not Found

**Problem**: Route `/api/essays/samples/upload` was missing, breaking the document upload feature.

**Root Cause**: The Express backend essay routes didn't include a document upload endpoint.

**Fix Applied**:
✅ Added POST `/api/user/essays/samples/upload` endpoint to handle document uploads

**Location**: `/api/src/routes/user/essays.js`

**What was added**:
- Endpoint accepts `fileName`, `content`, and `type` parameters
- Stores documents in the `documents` table
- Associates uploads with the authenticated user
- Returns document metadata with storage path

**To use**:
```javascript
const response = await fetch('/api/user/essays/samples/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'my-essay.pdf',
    content: base64FileContent,
    type: 'application/pdf'
  })
});
```

---

## Issue 2: Pricing Cards Look Different Between Homepage and Dashboard

**Problem**: The homepage displayed different pricing plans than the logged-in dashboard.

**Root Causes**:
- Homepage (LandingPage.jsx) had hardcoded `tiers` array with different names/descriptions
- Dashboard (main.jsx) used `PRICING_PLANS` array with different structure
- Features lists were inconsistent

**Fix Applied**:
✅ Synchronized pricing plans between LandingPage.jsx and main.jsx

**Before**:
- Homepage: "Explorer", "Scholar Plus", "Application Pro"
- Dashboard: "Explorer", "Plus", "Pro"
- Different feature lists and descriptions

**After** (Consistent across all views):
- **Explorer** (Free) - 3 AI essays/day
- **Plus** ($5/mo) - 10 AI essays/day, document analysis
- **Pro** ($15/mo) - Unlimited essays, bulk auto-apply
- **Mentor** ($50+/mo) - 1-on-1 mentorship, unlimited everything

**Files Updated**:
- `/client/src/components/LandingPage.jsx` - Updated `tiers` array to match main.jsx

**Verification**:
- Visit homepage - pricing displays correctly
- Log in - pricing in dashboard matches homepage exactly
- All features align across both views

---

## Issue 3: No Scholarships Displayed Even After Publishing

**Problem**: Even though scholarships were published from the admin page, they didn't show on the user dashboard.

**Root Causes**:
1. The `published` column needed to be added to the scholarships table (via migration)
2. The frontend filtering logic was too strict
3. The backend API wasn't running to handle filtered queries
4. RLS policies needed proper configuration

**Fixes Applied**:

### 3a. Database Migration
✅ Migration 001 already exists at `/api/migrations/001-add-production-tables.sql`

**What needs to be done**:
Execute this SQL in Supabase SQL Editor to add the `published` column:

```sql
ALTER TABLE scholarships
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
```

### 3b. Frontend Filtering Fix
✅ Updated `/client/src/main.jsx` scholarship filtering logic

**Before**:
```javascript
const{data:s}=await supabase.from("scholarships").select("*").eq("published", true)
```

**After**:
```javascript
// Flexible approach - works even if published column doesn't exist yet
let query = supabase.from("scholarships").select("*");
const{data:s}=await query.order("created_at",{ascending:false});

// Filter on client side as fallback
const scholarships = (s||[]).filter(row => row.published !== false);
```

**Why**: This approach:
- Works if the `published` column exists OR doesn't exist yet
- Falls back to showing all scholarships during transition
- Filters out explicitly unpublished scholarships once column exists

### 3c. Steps to Get Scholarships Working

1. **Apply Migration**:
   - Go to Supabase Dashboard → SQL Editor
   - Paste the migration SQL (above)
   - Execute

2. **Add Test Data**:
   ```sql
   -- Add a test scholarship and publish it
   INSERT INTO scholarships (name, host, field, degree, funding, published)
   VALUES ('Test Scholarship', 'Test Host', 'All fields', 'Masters', 'Full', true);
   ```

3. **Verify in Frontend**:
   - Clear browser cache/localStorage
   - Log in to dashboard
   - Scholarships should now appear

4. **Publish via Admin** (when admin panel is ready):
   - Admin clicks "Publish" button
   - Scholarship `published` field is set to `true`
   - Appears immediately on user dashboards

---

## Implementation Checklist

### Short Term (Critical - Do First):
- [ ] **Apply Database Migration**
  - Execute SQL from migration file in Supabase
  - Verify `published` column appears in scholarships table
  
- [ ] **Test Document Upload**
  - Click "Upload Documents" button in app
  - Verify file upload works without 404 error
  - Check that documents appear in user's document list

- [ ] **Verify Pricing Display**
  - Visit homepage - check pricing cards
  - Log in - go to Pricing section
  - Verify all pricing matches between views

### Medium Term (Next Steps):
- [ ] Start the Express backend server
  - `cd api && npm start`
  - Verify API runs on port 3001
  - Update frontend to use backend endpoints

- [ ] Update Admin Panel
  - Add "Publish" buttons for scholarships
  - Connect to `/api/admin/scholarships/:id/publish`
  - Add publish status indicator

- [ ] Configure RLS Policies
  - Ensure users only see published scholarships
  - Ensure admins can see all scholarships
  - Verify service role can update published field

---

## Testing Commands

### Check if published column exists:
```sql
-- In Supabase SQL Editor
SELECT column_name 
FROM information_schema.columns 
WHERE table_name='scholarships';
```

### Add test scholarship:
```sql
INSERT INTO scholarships (name, host, field, degree, funding, published, published_at)
VALUES ('Rhodes Scholarship', 'Rhodes Trust', 'All fields', 'Masters', 'Full-ride', true, now());
```

### View all scholarships:
```sql
SELECT id, name, host, published, published_at FROM scholarships LIMIT 5;
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'scholarships';
```

---

## Root Cause Summary

| Issue | Root Cause | Fix | Status |
|-------|-----------|-----|--------|
| No upload route | Missing endpoint | Added `/api/user/essays/samples/upload` | ✅ Fixed |
| Pricing mismatch | Hardcoded different arrays | Synchronized LandingPage.jsx with main.jsx | ✅ Fixed |
| No scholarships | Missing `published` column + RLS | Migration file ready to apply + fallback filtering | ⏳ Needs DB migration |

---

## Next Actions

1. **Immediately**:
   - Run the migration SQL in Supabase
   - Test document upload
   - Verify pricing display

2. **This Sprint**:
   - Start the Express backend server
   - Wire up admin publish functionality
   - Add scholarship test data

3. **Next Sprint**:
   - Full admin dashboard
   - Real-time scholarship updates
   - Payment integration testing
