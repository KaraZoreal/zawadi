import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { getLimits } from '../../middleware/subscription.js';

const router = express.Router();

/**
 * GET /api/user/profile
 * Get current user profile with subscription details
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (error) throw error;

    const limits = getLimits(req.subscription.plan);

    res.json({
      ...data,
      subscription: req.subscription,
      limits
    });
  } catch (err) {
    console.error('[GET_PROFILE_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PATCH /api/user/profile
 * Update current user profile
 */
router.patch('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(req.body)
      .eq('id', req.user.id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    console.error('[UPDATE_PROFILE_ERROR]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
