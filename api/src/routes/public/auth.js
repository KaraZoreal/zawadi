import express from 'express';
import { supabase, supabaseAdmin } from '../../config.js';

const router = express.Router();

// Language group mapping
const LANGUAGE_GROUPS = {
  "Anglophone": ["Botswana", "Eswatini", "Gambia", "Ghana", "Kenya", "Lesotho", "Liberia", "Malawi", "Mauritius", "Namibia", "Nigeria", "Rwanda", "Seychelles", "Sierra Leone", "South Africa", "South Sudan", "Tanzania", "Uganda", "Zambia", "Zimbabwe"],
  "Francophone": ["Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic", "Chad", "Congo", "Côte d'Ivoire", "DR Congo", "Equatorial Guinea", "Gabon", "Guinea", "Guinea-Bissau", "Mali", "Niger", "Senegal", "Togo"],
  "Arabophone": ["Algeria", "Comoros", "Djibouti", "Egypt", "Eritrea", "Libya", "Mauritania", "Morocco", "Sudan", "Tunisia"],
  "Lusophone": ["Angola", "Cape Verde", "Mozambique", "Sao Tome and Principe"]
};

function getLanguageGroup(country) {
  for (const [group, countries] of Object.entries(LANGUAGE_GROUPS)) {
    if (countries.includes(country)) return group;
  }
  return "English";
}

/**
 * POST /api/public/auth/signup
 * Sign up with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, country, languageGroup } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Determine language group
    const detectedLanguageGroup = languageGroup || getLanguageGroup(country || "Kenya");

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          country: country || 'Kenya',
          language_group: detectedLanguageGroup
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create profile with new fields
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        name: name || '',
        country: country || 'Kenya',
        language_group: detectedLanguageGroup,
        plan: 'free',
        is_admin: false,
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
 * POST /api/public/auth/admin-login
 * Admin login with email and password
 */
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message || 'Invalid credentials' });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, country, plan, is_admin, role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('[ADMIN_PROFILE_ERROR]', profileError);
      return res.status(401).json({ error: 'User profile not found' });
    }

    // Verify admin status
    if (!profile.is_admin && profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.name,
        country: profile.country,
        role: 'admin',
        is_admin: true,
        plan: profile.plan
      },
      session: data.session,
      access_token: data.session.access_token
    });
  } catch (err) {
    console.error('[ADMIN_LOGIN_ERROR]', err);
    res.status(500).json({ error: 'Admin login failed' });
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

/**
 * POST /api/public/auth/confirm-reset
 * Confirm password reset with token
 */
router.post('/confirm-reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('[CONFIRM_RESET_ERROR]', err);
    res.status(500).json({ error: 'Password reset confirmation failed' });
  }
});

export default router;
