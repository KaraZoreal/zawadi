import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyAuth } from './middleware/auth.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestLogger, performanceLogger, errorLogger } from './middleware/logger.js';
import { corsOptions, generalLimiter, authLimiter, paymentLimiter, helmetConfig, validateInput, requestId, hsts } from './middleware/security.js';
import adminRoutes from './routes/admin/index.js';
import userRoutes from './routes/user/index.js';
import publicRoutes from './routes/public/index.js';
import botRoutes from './routes/bot/index.js';
import essaysRoutes from './routes/user/essays.js';
import { fetchSubscription } from './middleware/subscription.js';
import { supabase } from './config.js';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmetConfig);

// CORS
app.use(cors(corsOptions));

// Request ID
app.use(requestId);

// HSTS
app.use(hsts);

// Logging
app.use(requestLogger);
app.use(performanceLogger());

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Input validation
app.use(validateInput);

// Rate limiting
app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/payment', paymentLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.post('/api/admin/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data?.user || !data?.session) {
    return res.status(401).json({ error: error?.message || 'Invalid admin credentials' });
  }

  const role = data.user.user_metadata?.role || data.user.app_metadata?.role || 'user';
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  res.json({
    user: { id: data.user.id, email: data.user.email, role },
    session: data.session,
    access_token: data.session.access_token
  });
}));

app.get('/api/admin/check', verifyAuth, (req, res) => {
  res.json({ isAdmin: req.user.role === 'admin', user: req.user });
});

app.get('/api/billing/usage', verifyAuth, fetchSubscription, (req, res) => {
  const plan = req.subscription?.plan || 'free';
  const limits = {
    free: { maxDocuments: 3, maxEssayGenerationsPerDay: 3 },
    plus: { maxDocuments: 15, maxEssayGenerationsPerDay: 10 },
    pro: { maxDocuments: 50, maxEssayGenerationsPerDay: 999 },
    mentor: { maxDocuments: 999, maxEssayGenerationsPerDay: 999 }
  }[plan] || { maxDocuments: 3, maxEssayGenerationsPerDay: 3 };

  res.json({
    plan,
    daily: { essayGenerations: 0 },
    limits
  });
});

// API Routes
app.use('/api/essays', verifyAuth, fetchSubscription, essaysRoutes);
app.use('/api/admin', verifyAuth, adminRoutes);
app.use('/api/user', verifyAuth, userRoutes);
app.use('/api', publicRoutes);
app.use('/api/bot', botRoutes);

// Error logging
app.use(errorLogger);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'ROUTE_NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, just log for monitoring
});

process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught Exception:', error);
  // Exit on uncaught exception
  process.exit(1);
});

const PORT = process.env.API_PORT || (process.env.PORT && process.env.PORT !== '5173' ? process.env.PORT : 3001);
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  Zawadi API Server                                     ║
╠════════════════════════════════════════════════════════╣
║  Port:        ${PORT.toString().padEnd(47)} ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(40)} ║
║  Database:    ${(process.env.SUPABASE_URL ? 'Connected' : 'Not connected').padEnd(41)} ║
║  Timestamp:   ${new Date().toISOString().padEnd(45)} ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;
