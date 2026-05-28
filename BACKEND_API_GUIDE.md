# TECHSARI ZAWADI - BACKEND API GUIDE

## Backend Architecture

The backend is built with Express.js and connects to Supabase for all data operations.

## Authentication Endpoints

### 1. User Signup

```
POST /api/public/auth/signup
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "country": "Kenya"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "Signup successful. Check your email for confirmation."
}
```

**Backend Logic:**
1. Validates email and password
2. Detects language group from country
3. Creates Supabase auth user
4. Inserts user_profile record
5. Triggers recommendation score generation

**Language Detection:**
- Kenya → Anglophone
- Senegal → Francophone
- Egypt → Arabophone
- Angola → Lusophone

---

### 2. User Login

```
POST /api/public/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "country": "Kenya",
    "plan": "free",
    "is_admin": false
  },
  "session": {
    "access_token": "eyJhbG...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

---

### 3. Admin Login (FIXED)

```
POST /api/public/auth/admin-login
```

**Request:**
```json
{
  "email": "admin@zawadi.com",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "admin@zawadi.com",
    "name": "Admin Name",
    "country": "Kenya",
    "role": "admin",
    "is_admin": true,
    "plan": "premium"
  },
  "session": {
    "access_token": "eyJhbG...",
    "refresh_token": "..."
  },
  "access_token": "eyJhbG..."
}
```

**Backend Logic:**
1. Authenticates with Supabase
2. **NEW:** Fetches user_profile to check is_admin flag
3. **NEW:** Verifies admin_users entry exists
4. Returns admin-specific data
5. Updates last_login timestamp
6. **FIXED:** Proper error handling for non-admin users

**Error Handling:**
- Invalid credentials → 401 Unauthorized
- User not admin → 403 Forbidden (NEW - fixes "request failed" error)
- Profile not found → 401 Unauthorized

---

### 4. Password Reset Request

```
POST /api/public/auth/reset-password
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

---

### 5. Confirm Password Reset

```
POST /api/public/auth/confirm-reset
```

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "new_secure_password"
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

## Recommendation Endpoints

### 6. Get User Recommendations

```
GET /api/recommendations/:userId
```

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 20)

**Response:**
```json
{
  "recommendations": [
    {
      "scholarship_id": "uuid",
      "scholarship_name": "African Excellence Scholarship",
      "provider": "Global Fund",
      "country": "Kenya",
      "coverage_amount": 75000,
      "match_score": 0.95,
      "match_percentage": 95
    },
    ...
  ]
}
```

**Backend Logic:**
1. Fetches user profile
2. Calls `get_user_recommendations()` Supabase function
3. Returns sorted by match_score DESC
4. Uses RLS to secure user data

---

### 7. Get Single Recommendation Score

```
GET /api/recommendations/:userId/:scholarshipId
```

**Response:**
```json
{
  "education_match": 100,
  "country_match": 90,
  "field_match": 85,
  "level_match": 100,
  "language_match": 100,
  "gpa_match": 95,
  "coverage_match": 90,
  "timing_match": 100,
  "overall_score": 0.94
}
```

---

## Profile Endpoints

### 8. Get User Profile

```
GET /api/profile/:userId
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "country": "Kenya",
  "language_group": "Anglophone",
  "institution": "University of Nairobi",
  "field_of_study": "Computer Science",
  "study_level": "Master's",
  "target_countries": ["USA", "UK", "Canada"],
  "gpa": 3.8,
  "profile_complete": true
}
```

---

### 9. Update User Profile

```
PUT /api/profile/:userId
```

**Request:**
```json
{
  "name": "John Doe",
  "institution": "University of Nairobi",
  "field_of_study": "Computer Science",
  "study_level": "Master's",
  "gpa": 3.8,
  "target_countries": ["USA", "UK", "Canada"]
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "updated_fields": ["name", "institution", "field_of_study", "gpa"]
}
```

**Backend Logic:**
1. Validates user authentication
2. Updates user_profiles table
3. Triggers recommendation recalculation
4. Returns updated profile

---

## Application Endpoints

### 10. Create Application

```
POST /api/applications
```

**Request:**
```json
{
  "scholarship_id": "uuid",
  "form_data": {
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678"
  },
  "essay_content": "My story..."
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "scholarship_name": "African Excellence",
  "status": "draft",
  "created_at": "2024-05-28T10:00:00Z"
}
```

---

### 11. Get Applications

```
GET /api/applications/:userId
```

**Query Parameters:**
- `status` (optional): "draft", "submitted", "rejected", "approved"

**Response:**
```json
{
  "applications": [
    {
      "application_id": "uuid",
      "scholarship_name": "...",
      "status": "draft",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### 12. Submit Application

```
PUT /api/applications/:applicationId/submit
```

**Request:**
```json
{
  "status": "submitted"
}
```

**Response:**
```json
{
  "message": "Application submitted successfully",
  "submitted_at": "2024-05-28T10:30:00Z"
}
```

---

## Document Endpoints

### 13. Upload Document

```
POST /api/documents/upload
```

**Request:**
```
Content-Type: multipart/form-data

file: <binary_data>
document_type: "transcript" | "certificate" | "ielts_score" | "passport"
```

**Response:**
```json
{
  "document_id": "uuid",
  "file_path": "s3://bucket/documents/...",
  "document_type": "transcript",
  "uploaded_at": "2024-05-28T10:00:00Z"
}
```

---

### 14. Get Documents

```
GET /api/documents/:userId
```

**Response:**
```json
{
  "documents": [
    {
      "document_id": "uuid",
      "document_type": "transcript",
      "uploaded_at": "...",
      "is_verified": true
    }
  ]
}
```

---

## Admin Endpoints

### 15. Get Dashboard Stats (Admin Only)

```
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_users": 1234,
  "total_applications": 5678,
  "active_scholarships": 89,
  "pending_verifications": 12,
  "monthly_signups": 234
}
```

---

### 16. Get All Users (Admin Only)

```
GET /api/admin/users
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)
- `country`: Filter by country
- `status`: "active", "inactive", "banned"

---

### 17. Verify Document (Admin Only)

```
POST /api/admin/documents/:documentId/verify
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "verified": true,
  "notes": "Document verified successfully"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "error_code": "INVALID_EMAIL",
  "status": 400
}
```

### Common Error Codes

- `INVALID_EMAIL` - Email format invalid
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `USER_NOT_FOUND` - User doesn't exist
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `ADMIN_REQUIRED` - Admin access required
- `INVALID_CREDENTIALS` - Email/password incorrect
- `USER_NOT_ADMIN` - User is not an admin
- `PROFILE_NOT_FOUND` - User profile missing

---

## Authentication Headers

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

Example:
```bash
curl -H "Authorization: Bearer eyJhbG..." \
  https://api.zawadi.com/api/profile/user-id
```

---

## Rate Limiting

- Signup/Login: 5 requests per 15 minutes per IP
- General API: 100 requests per minute per user
- File uploads: 10 per hour per user

---

## CORS Headers

```
Access-Control-Allow-Origin: https://zawadi.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Implementation Checklist

- [ ] All endpoints tested with Postman
- [ ] Admin login returns proper admin flag
- [ ] Recommendations generated on signup
- [ ] RLS policies enforced
- [ ] Error handling comprehensive
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] Logging implemented
- [ ] Monitoring set up

---

## Testing

```bash
# Test signup
curl -X POST http://localhost:3000/api/public/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!","name":"Test User","country":"Kenya"}'

# Test admin login
curl -X POST http://localhost:3000/api/public/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zawadi.com","password":"admin_password"}'

# Test recommendations
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/recommendations/USER_ID
```
