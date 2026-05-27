import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env.local'), override: false });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: false });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Client with anon key (for user context)
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Service role client (for admin operations)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE || SUPABASE_KEY // Fallback to anon key if service role not available
);

export const config = {
  port: process.env.API_PORT || (process.env.PORT && process.env.PORT !== '5173' ? process.env.PORT : 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  supabaseUrl: SUPABASE_URL,
  paystackKey: process.env.PAYSTACK_PUBLIC_KEY,
  paystackSecret: process.env.PAYSTACK_SECRET_KEY,
  botSecret: process.env.BOT_SECRET || 'bot-secret-token',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',')
};

export default config;
