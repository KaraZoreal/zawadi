import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { verifyAuth } from './middleware/auth.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestLogger, performanceLogger, errorLogger } from './middleware/logger.js';
import { corsOptions, generalLimiter, authLimiter, helmetConfig, validateInput, requestId, hsts } from './middleware/security.js';
import adminRoutes from './routes/admin/index.js';
import userRoutes from './routes/user/index.js';
import publicRoutes from './routes/public/index.js';
import botRoutes from './routes/bot/index.js';

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
app.use('/api/payment', require('./middleware/security.js').paymentLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
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

const PORT = process.env.PORT || 3001;
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
