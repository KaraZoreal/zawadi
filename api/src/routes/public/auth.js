import express from 'express';
import { supabase, supabaseAdmin } from '../../config.js';

const router = express.Router();

/**
 * POST /api/public/auth/signup
 * Sign up with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName || '',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('[PROFILE_CREATE_ERROR]', profileError);
    }

    res.status(201).json({
      user: authData.user,
      message: 'Signup successful. Check your email for confirmation.'
    });
  } catch (err) {
    console.error('[SIGNUP_ERROR]', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

/**
 * POST /api/public/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user: data.user,
      session: data.session,
      access_token: data.session.access_token
    });
  } catch (err) {
    console.error('[LOGIN_ERROR]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/public/auth/reset-password
 * Request password reset
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('[RESET_PASSWORD_ERROR]', err);
    res.status(500).json({ error: 'Reset password failed' });
  }
});

export default router;
