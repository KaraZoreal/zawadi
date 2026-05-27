import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { getPaymentStats } from '../../services/payment.js';
import { getSystemUsageStats } from '../../services/usage.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admin/statistics
 * Get platform-wide statistics
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    // Get subscription statistics
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('tier, status')
      .order('created_at', { ascending: false });

    if (subError) throw subError;

    const subscriptionStats = {
      total_active: 0,
      by_tier: { free: 0, plus: 0, pro: 0, mentor: 0 },
      mrr: 0, // Monthly Recurring Revenue
      by_status: { active: 0, expired: 0, cancelled: 0 }
    };

    const tierPrices = { plus: 5, pro: 12, mentor: 99 };

    (subscriptions || []).forEach(sub => {
      subscriptionStats.by_tier[sub.tier] = (subscriptionStats.by_tier[sub.tier] || 0) + 1;
      subscriptionStats.by_status[sub.status] = (subscriptionStats.by_status[sub.status] || 0) + 1;

      if (sub.status === 'active' && tierPrices[sub.tier]) {
        subscriptionStats.mrr += tierPrices[sub.tier];
        subscriptionStats.total_active++;
      }
    });

    // Get user statistics
    const { data: users, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (userError) throw userError;

    // Get scholarship statistics
    const { data: scholarships, error: scholarError } = await supabaseAdmin
      .from('scholarships')
      .select('published')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (scholarError) throw scholarError;

    // Get payment statistics
    const paymentStats = await getPaymentStats(days);

    // Get usage statistics
    const usageStats = await getSystemUsageStats(days);

    // Get applications statistics
    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('status')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (appError) throw appError;

    const applicationStats = {
      total: applications?.length || 0,
      by_status: {}
    };

    (applications || []).forEach(app => {
      applicationStats.by_status[app.status] = (applicationStats.by_status[app.status] || 0) + 1;
    });

    res.json({
      period: {
        days,
        start: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      subscriptions: subscriptionStats,
      users: {
        total_all_time: subscriptions?.length || 0,
        new_this_period: users?.length || 0
      },
      scholarships: {
        total: scholarships?.length || 0,
        published: (scholarships || []).filter(s => s.published).length,
        pending: (scholarships || []).filter(s => !s.published).length
      },
      payments: paymentStats,
      usage: usageStats,
      applications: applicationStats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/statistics/users
 * Get detailed user statistics
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const stats = {
      total: users?.length || 0,
      by_month: {},
      top_active: []
    };

    (users || []).forEach(user => {
      const month = new Date(user.created_at).toISOString().split('T')[0].substring(0, 7);
      stats.by_month[month] = (stats.by_month[month] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('User statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * GET /api/admin/statistics/revenue
 * Get revenue statistics
 */
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 90;
    const paymentStats = await getPaymentStats(days);

    // Get subscription count by tier
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('tier, status')
      .eq('status', 'active');

    const tierPrices = { plus: 5, pro: 12, mentor: 99 };
    const mrr = (subscriptions || []).reduce((sum, sub) => {
      return sum + (tierPrices[sub.tier] || 0);
    }, 0);

    const arr = mrr * 12; // Annual Recurring Revenue

    res.json({
      mrr,
      arr,
      ...paymentStats,
      subscriptions_by_tier: subscriptions?.reduce((acc, sub) => {
        acc[sub.tier] = (acc[sub.tier] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Revenue statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

export default router;
