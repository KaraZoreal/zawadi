# Zawadi Platform - Backend API

Production-grade REST API server for the Zawadi scholarship management platform built with Express.js and Node.js.

## Overview

This backend provides:
- **User Authentication**: JWT-based auth with Supabase
- **Subscription Management**: Multi-tier subscription system (Free, Plus, Pro, Mentor)
- **Admin Dashboard**: Full scholarship management with audit logging
- **Bot Integration**: Automated scholarship ingestion with validation
- **Payment Webhooks**: Paystack payment processing
- **Usage Tracking**: Daily/monthly limits for essay generation
- **Rate Limiting**: DDoS protection and abuse prevention

## Architecture

```
api/
├── src/
│   ├── server.js                 # Express app entry point
│   ├── config.js                 # Environment and Supabase config
│   ├── middleware/
│   │   ├── auth.js              # JWT verification & admin checks
│   │   └── subscription.js      # Subscription tier enforcement
│   ├── routes/
│   │   ├── admin/               # Admin endpoints
│   │   ├── user/                # User endpoints
│   │   ├── public/              # Public endpoints
│   │   └── bot/                 # Bot integration endpoints
│   ├── services/
│   │   └── audit.js             # Audit logging service
│   └── types.js                 # TypeScript interfaces (optional)
├── migrations/
│   └── 001-add-production-tables.sql  # Database schema
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project with proper configuration

### Installation

```bash
cd api
npm install
```

### Environment Setup

Copy `.env.example` from the root directory and populate:

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

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

### Database Setup

Run the migration in Supabase SQL editor:

```sql
-- Execute migrations/001-add-production-tables.sql in Supabase dashboard
```

This creates:
- `subscriptions` table with RLS policies
- `audit_logs` table for admin action tracking
- `usage_tracking` table for rate limiting

### Development

```bash
# Start development server (auto-reloads on changes)
npm run dev

# Server runs on http://localhost:3001
```

### Production Deployment

```bash
# Deploy to Vercel
npm run build

# Vercel will automatically:
# 1. Install dependencies
# 2. Build the project
# 3. Deploy to serverless functions
```

## API Endpoints

### Authentication & Users

**POST** `/api/public/auth/signup`
- Register new user
- Body: `{ email, password, fullName }`

**POST** `/api/public/auth/login`
- Login user
- Body: `{ email, password }`
- Returns: Access token

**POST** `/api/public/auth/reset-password`
- Request password reset
- Body: `{ email }`

**GET** `/api/user/profile`
- Get current user profile
- Auth: Required
- Returns: User + subscription + limits

### Scholarships

**GET** `/api/public/scholarships`
- List published scholarships
- Query: `page, limit, search, country, category`
- No auth required

**GET** `/api/public/scholarships/:id`
- Get scholarship details
- No auth required

### Essays & Usage

**GET** `/api/user/essays/usage`
- Check daily/monthly essay generation limits
- Auth: Required
- Returns: `{ essaysPerDay, essaysPerMonth, plan }`

**POST** `/api/user/essays/generate`
- Generate essay (enforces daily limits)
- Auth: Required
- Returns: Success + remaining count

### Applications

**GET** `/api/user/applications`
- List user's applications
- Auth: Required
- Query: `page, limit`

**POST** `/api/user/applications`
- Create application
- Auth: Required
- Body: `{ scholarship_id, status, notes }`

**PATCH** `/api/user/applications/:id`
- Update application
- Auth: Required
- Body: Any fields to update

**DELETE** `/api/user/applications/:id`
- Delete application
- Auth: Required

### Admin Endpoints

All require `Authorization: Bearer <token>` with admin role.

**GET** `/api/admin/overview`
- Dashboard stats
- Returns: User counts, scholarship stats, subscription counts

**GET** `/api/admin/scholarships`
- List all scholarships (published + unpublished)
- Query: `page, limit, search, published`

**PATCH** `/api/admin/scholarships/:id/publish`
- Publish scholarship to users
- Logs: Audit trail

**PATCH** `/api/admin/scholarships/:id/unpublish`
- Hide scholarship from users
- Logs: Audit trail

**POST** `/api/admin/scholarships/bulk`
- Import multiple scholarships
- Body: `{ scholarships: [...] }`

**DELETE** `/api/admin/scholarships/:id`
- Delete scholarship
- Logs: Audit trail

**GET** `/api/admin/users`
- List all users with subscription status
- Query: `page, limit, search`

**PATCH** `/api/admin/users/:id`
- Update user details
- Body: Any fields

**GET** `/api/admin/subscriptions`
- List all subscriptions
- Query: `page, limit, plan, status`

**PATCH** `/api/admin/subscriptions/:id`
- Update subscription
- Body: `{ plan, status, expires_at }`

**GET** `/api/admin/audit`
- View admin action audit trail
- Query: `page, limit, action, admin_id, resource_type`

**POST** `/api/admin/webhooks/paystack`
- Webhook handler for Paystack payments
- Signature verified
- Auto-creates/updates subscriptions

### Bot Integration

**POST** `/api/bot/scholarships/ingest`
- Ingest scholarships from bot
- Auth: `X-Bot-Secret` header
- Body: `{ scholarships: [{ name, host, deadline, ... }] }`
- Returns: Added count + scholarship IDs

**GET** `/api/bot/status`
- Health check
- Auth: `X-Bot-Secret` header

## Subscription Tiers

### Free
- 3 essays/day
- 30 essays/month
- All published scholarships
- Basic matching

### Plus ($5/month)
- 15 essays/day
- 200 essays/month
- AI-powered matching
- Premium categories

### Pro ($12/month)
- 50 essays/day
- 1000 essays/month
- Full AI features
- Priority support

### Mentor
- Unlimited essays
- All features
- Custom implementation

## Usage Limits

Enforced server-side:

| Feature | Free | Plus | Pro | Mentor |
|---------|------|------|-----|--------|
| Essays/Day | 3 | 15 | 50 | ∞ |
| Essays/Month | 30 | 200 | 1000 | ∞ |
| Scholarships/Query | 50 | 100 | 500 | 5000 |
| AI Matching | ✗ | ✓ | ✓ | ✓ |

## Real-Time Sync

When admin publishes/unpublishes scholarships:

1. Admin clicks "Publish" in dashboard
2. Backend updates `scholarships.published = true`
3. Logs audit entry
4. Frontend polls `/api/user/profile` every 30s
5. User sees updated scholarship list within 30s

**Future**: Upgrade to WebSockets for instant sync.

## Security

- **Authentication**: Supabase JWT tokens verified per request
- **Authorization**: Role-based access control (user/admin)
- **Rate Limiting**: 100 requests/15min per IP
- **Bot Verification**: Secret token in `X-Bot-Secret` header
- **Webhook Verification**: Paystack signature validation
- **RLS Policies**: Database-level row-level security
- **Input Validation**: Request body validation
- **CORS**: Configured for frontend origins only

## Monitoring & Logging

- Console logs for errors and important events
- Audit logs stored in `audit_logs` table
- All admin mutations recorded with before/after values
- Paystack webhook events logged

## Error Handling

Standard HTTP status codes:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing/invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Testing

### Test Bot Ingestion
```bash
curl -X POST http://localhost:3001/api/bot/scholarships/ingest \
  -H "X-Bot-Secret: your-bot-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "scholarships": [
      {
        "name": "Test Scholarship",
        "host": "Test Host",
        "deadline": "2025-12-31",
        "field": "All fields",
        "funding": "$5000",
        "apply_url": "https://example.com",
        "categories": ["Test"],
        "africa_eligible": true
      }
    ]
  }'
```

### Test Admin Authentication
```bash
# Use Supabase JWT token from login
curl -X GET http://localhost:3001/api/admin/overview \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN"
```

## Deployment

### To Vercel

1. Push code to GitHub
2. In Vercel dashboard, import repository
3. Set environment variables
4. Deploy

```bash
# Environment variables to set in Vercel:
SUPABASE_URL
SUPABASE_KEY
SUPABASE_SERVICE_ROLE
PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY
BOT_SECRET
```

### Database Migration

Run migration in Supabase after deploy:
```sql
-- Copy & paste migrations/001-add-production-tables.sql
-- into Supabase SQL editor
-- Execute
```

## Troubleshooting

**"Missing authorization token"**
- Ensure `Authorization: Bearer <token>` is sent
- Verify token is valid Supabase JWT

**"Admin access required"**
- Verify user has `role: 'admin'` in Supabase auth.users

**"Database unavailable"**
- Check `SUPABASE_SERVICE_ROLE` env var
- Verify Supabase project is running

**"Bot secret invalid"**
- Verify `X-Bot-Secret` header matches `BOT_SECRET` env var

**"Rate limit exceeded"**
- Wait 15 minutes before retrying
- Implement request queuing on client

## Performance

- Subscriptions cached in memory (30s TTL)
- Audit logs indexed on admin_id, action, created_at
- Usage tracking indexed on user_id, period_start
- Database queries optimized with indexes

## Future Improvements

- [ ] WebSocket support for real-time updates
- [ ] Redis caching for subscriptions
- [ ] Batch processing for bulk operations
- [ ] GraphQL API as alternative to REST
- [ ] OpenAPI/Swagger documentation
- [ ] Integration tests
- [ ] Load testing at 10k+ concurrent users
- [ ] Custom email notifications
- [ ] PDF report generation

## Support

For issues or questions:
1. Check logs: `npm run dev` shows errors
2. Verify environment variables
3. Check Supabase dashboard for database status
4. Review API error messages (detailed in development mode)

## License

Proprietary - Zawadi Platform
