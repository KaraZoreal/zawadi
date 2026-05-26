import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { getLimits } from '../../middleware/subscription.js';

const router = express.Router();

/**
 * GET /api/user/essays/usage
 * Check essay generation usage for current period
 */
router.get('/usage', async (req, res) => {
  try {
    const limits = getLimits(req.subscription.plan);
    
    // Get today's usage
    const today = new Date().toISOString().split('T')[0];
    const { data: todayUsage, error: todayError } = await supabaseAdmin
      .from('usage_tracking')
      .select('count')
      .eq('user_id', req.user.id)
      .eq('usage_type', 'essay_generation')
      .eq('period_start', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') throw todayError;

    // Get current month usage
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const { data: monthUsage, error: monthError } = await supabaseAdmin
      .from('usage_tracking')
      .select('count')
      .eq('user_id', req.user.id)
      .eq('usage_type', 'essay_generation')
      .gte('period_start', monthStartStr)
      .lte('period_start', today);

    if (monthError && monthError.code !== 'PGRST116') throw monthError;

    const todayCount = todayUsage?.count || 0;
    const monthCount = (monthUsage || []).reduce((sum, u) => sum + u.count, 0);

    res.json({
      essaysPerDay: {
        used: todayCount,
        limit: limits.essaysPerDay,
        remaining: Math.max(0, limits.essaysPerDay - todayCount)
      },
      essaysPerMonth: {
        used: monthCount,
        limit: limits.essaysPerMonth,
        remaining: Math.max(0, limits.essaysPerMonth - monthCount)
      },
      plan: req.subscription.plan
    });
  } catch (err) {
    console.error('[GET_USAGE_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

/**
 * POST /api/user/essays/generate
 * Generate an essay with limit enforcement
 */
router.post('/generate', async (req, res) => {
  try {
    const limits = getLimits(req.subscription.plan);
    const today = new Date().toISOString().split('T')[0];

    // Check daily limit
    const { data: todayUsage, error: todayError } = await supabaseAdmin
      .from('usage_tracking')
      .select('count')
      .eq('user_id', req.user.id)
      .eq('usage_type', 'essay_generation')
      .eq('period_start', today)
      .single();

    if (todayError && todayError.code !== 'PGRST116') throw todayError;

    const todayCount = todayUsage?.count || 0;
    if (todayCount >= limits.essaysPerDay) {
      return res.status(429).json({
        error: 'Daily essay generation limit reached',
        limit: limits.essaysPerDay,
        used: todayCount
      });
    }

    // In real app, here you'd call AI service
    // For now, just track the usage
    
    if (todayUsage) {
      // Update existing record
      await supabaseAdmin
        .from('usage_tracking')
        .update({ count: todayCount + 1 })
        .eq('user_id', req.user.id)
        .eq('usage_type', 'essay_generation')
        .eq('period_start', today);
    } else {
      // Create new record
      await supabaseAdmin
        .from('usage_tracking')
        .insert({
          user_id: req.user.id,
          usage_type: 'essay_generation',
          count: 1,
          period_start: today
        });
    }

    res.json({
      success: true,
      message: 'Essay generation recorded',
      remaining: limits.essaysPerDay - (todayCount + 1)
    });
  } catch (err) {
    console.error('[GENERATE_ESSAY_ERROR]', err);
    res.status(500).json({ error: 'Failed to generate essay' });
  }
});

export default router;
