import express from 'express';
import { getUserSubscription, canUserPerformAction, SUBSCRIPTION_TIERS } from '../../services/subscription.js';
import { getUserUsageStats } from '../../services/usage.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/user/subscription
 * Get current user's subscription status and limits
 */
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await getUserSubscription(userId);
    const usage = await getUserUsageStats(userId, 'month');

    res.json({
      subscription,
      usage,
      availableTiers: Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
        id: key,
        ...tier
      }))
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/user/subscription/check-action
 * Check if user can perform an action
 */
router.post('/subscription/check-action', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const result = await canUserPerformAction(userId, action);
    res.json(result);
  } catch (error) {
    console.error('Error checking action:', error);
    res.status(500).json({ error: 'Failed to check action' });
  }
});

/**
 * GET /api/user/subscription/plans
 * Get available subscription plans
 */
router.get('/subscription/plans', (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      name: tier.name,
      price: tier.price,
      interval: tier.interval || 'monthly',
      essayLimit: tier.essayLimit,
      applicationsLimit: tier.applicationsLimit,
      documentsLimit: tier.documentsLimit,
      features: tier.features
    }));

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

export default router;
