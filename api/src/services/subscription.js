import { supabaseAdmin } from '../config.js';

// Subscription tiers with their limits
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    essayLimit: 3, // Monthly
    essayDailyLimit: 1,
    applicationsLimit: 5,
    documentsLimit: 3,
    features: ['scholarship_matching', 'basic_essays'],
    price: 0
  },
  plus: {
    name: 'Scholar Plus',
    essayLimit: 20, // Monthly
    essayDailyLimit: 2,
    applicationsLimit: 20,
    documentsLimit: 15,
    features: ['scholarship_matching', 'unlimited_essays', 'essay_feedback', 'interview_prep'],
    price: 5,
    interval: 'monthly'
  },
  pro: {
    name: 'Application Pro',
    essayLimit: 100, // Monthly
    essayDailyLimit: 5,
    applicationsLimit: 100,
    documentsLimit: 50,
    features: ['all_plus_features', 'priority_support', 'interview_coaching'],
    price: 12,
    interval: 'monthly'
  },
  mentor: {
    name: 'Mentor',
    essayLimit: -1, // Unlimited
    essayDailyLimit: -1,
    applicationsLimit: -1,
    documentsLimit: -1,
    features: ['all_features', 'direct_mentor', 'lifetime_support'],
    price: 99,
    interval: 'lifetime'
  }
};

/**
 * Get user's current subscription status and usage
 */
export async function getUserSubscription(userId) {
  try {
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is expected for free users
      throw error;
    }

    const tier = subscription?.tier || 'free';
    const tierInfo = SUBSCRIPTION_TIERS[tier];

    // Get current month usage
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const { data: usage } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('resource', 'essays')
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false });

    const essaysUsedThisMonth = (usage || []).length;
    const essaysRemaining = tierInfo.essayLimit === -1 ? -1 : Math.max(0, tierInfo.essayLimit - essaysUsedThisMonth);

    return {
      tier,
      tierInfo,
      subscription,
      usage: {
        essaysUsedThisMonth,
        essaysRemaining,
        essayLimitMonthly: tierInfo.essayLimit,
        essayLimitDaily: tierInfo.essayDailyLimit
      },
      isActive: subscription ? new Date(subscription.ended_at) > new Date() : false,
      features: tierInfo.features
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    // Return free tier as default
    return {
      tier: 'free',
      tierInfo: SUBSCRIPTION_TIERS.free,
      subscription: null,
      usage: {
        essaysUsedThisMonth: 0,
        essaysRemaining: SUBSCRIPTION_TIERS.free.essayLimit,
        essayLimitMonthly: SUBSCRIPTION_TIERS.free.essayLimit,
        essayLimitDaily: SUBSCRIPTION_TIERS.free.essayDailyLimit
      },
      isActive: false,
      features: SUBSCRIPTION_TIERS.free.features
    };
  }
}

/**
 * Check if user can perform action based on subscription
 */
export async function canUserPerformAction(userId, action) {
  const subscription = await getUserSubscription(userId);

  switch (action) {
    case 'create_essay':
      if (subscription.usage.essaysRemaining === 0 && subscription.usage.essayLimitMonthly !== -1) {
        return {
          allowed: false,
          reason: 'Monthly essay limit reached. Upgrade your plan for more essays.',
          current: subscription.usage.essaysUsedThisMonth,
          limit: subscription.usage.essayLimitMonthly
        };
      }
      return { allowed: true };

    case 'create_application':
      if (subscription.usage.applicationsRemaining === 0 && subscription.tierInfo.applicationsLimit !== -1) {
        return {
          allowed: false,
          reason: 'Application limit reached. Upgrade your plan.',
          current: subscription.usage.applicationsUsed || 0,
          limit: subscription.tierInfo.applicationsLimit
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

/**
 * Track resource usage
 */
export async function trackUsage(userId, resource, metadata = {}) {
  try {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .insert({
        user_id: userId,
        resource,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking usage:', error);
    return null;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(userId, tier, paystackReference = null) {
  try {
    const tierInfo = SUBSCRIPTION_TIERS[tier];
    if (!tierInfo) {
      throw new Error(`Invalid subscription tier: ${tier}`);
    }

    const now = new Date();
    let endDate = new Date(now);

    if (tier === 'mentor') {
      endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Monthly
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        tier,
        status: 'active',
        started_at: now.toISOString(),
        ended_at: endDate.toISOString(),
        paystack_reference: paystackReference,
        auto_renew: tier !== 'mentor'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        ended_at: new Date().toISOString(),
        auto_renew: false
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Renew subscription
 */
export async function renewSubscription(userId, tier = null) {
  try {
    const subscription = await getUserSubscription(userId);
    const currentTier = tier || subscription.tier;

    const endDate = new Date();
    if (currentTier === 'mentor') {
      endDate.setFullYear(endDate.getFullYear() + 100);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        tier: currentTier,
        ended_at: endDate.toISOString(),
        renewed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
}
