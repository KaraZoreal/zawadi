# Zawadi Platform - Deployment Guide

## Production Architecture

### Components
- **Frontend**: React + Vite (localhost:5173 in dev, Vercel CDN in prod)
- **Backend API**: Express.js (localhost:3001 in dev, Vercel Serverless in prod)
- **Database**: Supabase PostgreSQL with RLS policies
- **Auth**: Supabase Auth with JWT tokens
- **Real-Time**: WebSocket with HTTP polling fallback
- **Payments**: Paystack integration with webhook handling

## Environment Variables

Set these in Vercel project settings:

```
# Core
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key

# API
API_PORT=3001
ALLOWED_ORIGINS=https://zawadi.app,https://www.zawadi.app

# Payments
PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_SECRET_KEY=sk_live_...

# Bot Integration
BOT_SECRET=your-long-random-bot-token

# Optional: AI Integration
AI_PROVIDER=deepseek
AI_API_KEY=sk-...
```

## Database Setup

1. Create a new Supabase project
2. Run the migration in `api/migrations/001-add-production-tables.sql`:

```bash
# Connect to your Supabase database and run:
psql -h db.your-project.supabase.co -U postgres -d postgres -f api/migrations/001-add-production-tables.sql
```

This creates:
- `subscriptions` table with billing info
- `payments` table for payment history
- `audit_logs` table for admin actions
- `usage_tracking` table for feature usage
- Proper RLS policies for data isolation

## Deployment to Vercel

### 1. Connect Repository
```bash
vercel link
```

### 2. Configure Build
```bash
# Root directory: .
# Build command: cd client && npm run build
# Output directory: client/dist
```

### 3. Deploy
```bash
vercel deploy --prod
```

### 4. Configure Serverless Function
The `api/src/server.js` will be deployed as a Vercel serverless function. Ensure:
- Function timeout: 60 seconds
- Memory: 1024 MB
- Region: auto

## Post-Deployment

### 1. DNS Configuration
- Point `zawadi.app` to Vercel nameservers
- Enable automatic HTTPS

### 2. Verify Health
```bash
curl https://zawadi.app/api/health
```

### 3. Database Backups
Supabase handles automatic backups. Configure:
- Daily automated backups
- 30-day retention
- Backup encryption

### 4. Monitoring

#### Logging
- Access logs: `logs/access.log`
- Error logs: `logs/error.log`
- Slow requests: `logs/slow-requests.log`

#### Metrics
- Monitor via Vercel Analytics
- Set up alerts for:
  - API errors (5xx)
  - High response times (> 1s)
  - Database connection issues
  - Payment webhook failures

#### Rate Limiting
- General: 100 requests/15 min per user
- Auth: 5 requests/15 min per email
- Payment: 10 requests/hour per user

### 5. Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Configure CSP headers
- [ ] Set HSTS max-age to 31536000
- [ ] Enable rate limiting
- [ ] Validate Paystack webhooks
- [ ] Rotate JWT_SECRET regularly
- [ ] Enable database encryption at rest
- [ ] Configure RLS policies properly
- [ ] Set up CORS whitelist
- [ ] Enable API authentication

### 6. API Endpoint Testing

```bash
# Health check
curl https://zawadi.app/api/health

# Public scholarships
curl https://zawadi.app/api/scholarships

# Admin login
curl -X POST https://zawadi.app/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin statistics
curl https://zawadi.app/api/admin/statistics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Payment webhook
curl -X POST https://zawadi.app/api/payment/webhook \
  -H "x-paystack-signature: YOUR_SIGNATURE" \
  -d '{...}'
```

## Troubleshooting

### Database Connection Issues
```bash
# Check Supabase status
curl https://status.supabase.com/

# Verify connection string
psql -h db.your-project.supabase.co -U postgres -c "SELECT version();"
```

### API Not Responding
1. Check Vercel logs: `vercel logs`
2. Verify environment variables are set
3. Check function timeout settings
4. Review error logs

### Payment Webhook Not Working
1. Verify Paystack public/secret keys
2. Check webhook signature validation
3. Ensure ngrok/tunnel if testing locally
4. Test with Paystack test keys first

### Real-Time Not Syncing
1. Check WebSocket connection: `wss://zawadi.app/api/realtime`
2. Fallback to polling: `GET /api/sync/scholarships`
3. Verify authentication tokens

## Scaling

### Horizontal Scaling
- Vercel handles auto-scaling automatically
- Set concurrent function limits in Vercel settings
- Monitor cold start times

### Database Scaling
- Upgrade Supabase plan for higher connections
- Consider connection pooling via pgBouncer
- Monitor row-level security performance

### Caching
- Implement Redis for:
  - Session caching
  - Rate limit tracking
  - Popular scholarship caching
- Use Vercel Edge Cache for static assets

## Maintenance

### Regular Tasks
- Monitor API error rates
- Review slow query logs
- Update dependencies monthly
- Rotate secrets quarterly
- Test disaster recovery

### Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit fix

# Deploy updates
git push origin main
```

## Support & Monitoring

### Important URLs
- Dashboard: https://zawadi.app
- Admin: https://zawadi.app/admin.html
- API Docs: https://zawadi.app/api/docs
- Health: https://zawadi.app/api/health

### Alerting
Set up alerts for:
1. API error rate > 1%
2. Response time > 2s (p95)
3. Payment webhook failures
4. Database connection pool exhaustion
5. Authentication failures > 10/min

### Escalation
- Critical: Page on-call engineer
- High: Email team
- Medium: Slack notification
- Low: Daily summary

## Backup & Recovery

### Database Backup
```bash
# Manual backup
pg_dump \
  -h db.your-project.supabase.co \
  -U postgres \
  postgres > backup.sql

# Restore
psql \
  -h db.your-project.supabase.co \
  -U postgres \
  postgres < backup.sql
```

### Code Rollback
```bash
git revert <commit-hash>
git push origin main
vercel deploy --prod
```

## Performance Optimization

### Frontend
- Code splitting enabled
- Asset compression enabled
- Image optimization via Vercel
- CDN caching enabled

### Backend
- Database query optimization
- Connection pooling
- Async/await patterns
- Request timeouts configured

### Monitoring
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- API latency percentiles
- Error rate tracking
