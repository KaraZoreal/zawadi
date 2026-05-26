import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Paystack-Signature']
};

/**
 * Rate limiting middleware
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: (req) => req.path.startsWith('/health')
});

/**
 * Stricter rate limiting for auth endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip
});

/**
 * Rate limiting for payment endpoints
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10, // 10 requests per hour
  message: 'Too many payment attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip
});

/**
 * Helmet security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    usb: [],
    accelerometer: [],
    gyroscope: [],
    magnetometer: [],
    payment: ['self']
  }
});

/**
 * Input validation middleware
 */
export function validateInput(req, res, next) {
  // Prevent large payloads
  const contentLength = parseInt(req.get('content-length'), 10);
  if (contentLength > 5 * 1024 * 1024) { // 5MB limit
    return res.status(413).json({ error: 'Payload too large' });
  }

  // Sanitize common XSS patterns
  const sanitizeValue = (value) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, ''); // Remove event handlers
  };

  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(v => 
          typeof v === 'string' ? sanitizeValue(v) : sanitizeObject(v)
        );
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = sanitizeValue(value);
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  next();
}

/**
 * Request ID middleware
 */
export function requestId(req, res, next) {
  const id = req.get('x-request-id') || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = id;
  res.set('X-Request-ID', id);
  next();
}

/**
 * HSTS middleware
 */
export function hsts(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
}

/**
 * Disable caching for sensitive endpoints
 */
export function noCache(req, res, next) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function ipWhitelist(whitelist = []) {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip in development
    }

    if (whitelist.length === 0) {
      return next(); // No whitelist configured
    }

    const clientIp = req.ip;
    if (!whitelist.includes(clientIp)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}
