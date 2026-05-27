import jwt from 'jsonwebtoken';
import { supabase } from '../config.js';

/**
 * Verify JWT token from Authorization header
 * Token can be Supabase JWT from client auth or custom admin token
 */
export async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.slice(7);

    // Verify with Supabase (this validates Supabase JWTs)
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user context to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.user_metadata?.role || data.user.app_metadata?.role || 'user'
    };

    next();
  } catch (err) {
    console.error('[AUTH_ERROR]', err);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export const requireAuth = verifyAuth;

/**
 * Check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Verify bot integration secret
 */
export function verifyBotSecret(req, res, next) {
  const secret = req.headers['x-bot-secret'];
  const expectedSecret = process.env.BOT_SECRET || 'bot-secret-token';
  
  if (secret !== expectedSecret) {
    return res.status(403).json({ error: 'Invalid bot secret' });
  }
  
  next();
}
