import { supabaseAdmin } from '../config.js';

/**
 * Fetch user's current subscription plan
 * Attaches subscription info to request
 */
export async function fetchSubscription(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[SUBSCRIPTION_ERROR]', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    // Default to free plan if no subscription found
    req.subscription = data || {
      user_id: req.user.id,
      plan: 'free',
      status: 'active',
      expires_at: null
    };

    // Check if subscription has expired
    if (req.subscription.expires_at) {
      const expiresAt = new Date(req.subscription.expires_at);
      if (expiresAt < new Date()) {
        req.subscription.plan = 'free';
        req.subscription.status = 'expired';
      }
    }

    next();
  } catch (err) {
    console.error('[SUBSCRIPTION_FETCH_ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get daily/monthly limits based on subscription plan
 */
export function getLimits(plan) {
  const limits = {
    free: {
      essaysPerDay: 3,
      essaysPerMonth: 30,
      applicationsUnlimited: true,
      scholarshipsPerQuery: 50,
      aiMatching: false
    },
    plus: {
      essaysPerDay: 15,
      essaysPerMonth: 200,
      applicationsUnlimited: true,
      scholarshipsPerQuery: 100,
      aiMatching: true
    },
    pro: {
      essaysPerDay: 50,
      essaysPerMonth: 1000,
      applicationsUnlimited: true,
      scholarshipsPerQuery: 500,
      aiMatching: true
    },
    mentor: {
      essaysPerDay: 999,
      essaysPerMonth: 999999,
      applicationsUnlimited: true,
      scholarshipsPerQuery: 5000,
      aiMatching: true
    }
  };

  return limits[plan] || limits.free;
}

/**
 * Enforce subscription tier access
 */
export function requirePlan(...allowedPlans) {
  return (req, res, next) => {
    if (!allowedPlans.includes(req.subscription.plan)) {
      return res.status(403).json({
        error: `This feature requires one of: ${allowedPlans.join(', ')}`,
        currentPlan: req.subscription.plan,
        upgrade_url: '/pricing'
      });
    }
    next();
  };
}
