import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { logAuditAction } from '../../services/audit.js';

const router = express.Router();

/**
 * GET /api/admin/subscriptions
 * List all subscriptions
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, plan, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (plan) query = query.eq('plan', plan);
    if (status) query = query.eq('status', status);

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      subscriptions: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[LIST_SUBSCRIPTIONS_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * PATCH /api/admin/subscriptions/:id
 * Update a subscription
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get before state
    const { data: before } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    // Update
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'UPDATE_SUBSCRIPTION',
      resource_type: 'subscription',
      resource_id: id,
      before_values: before,
      after_values: updates,
      ip_address: req.ip
    });

    res.json(data[0]);
  } catch (err) {
    console.error('[UPDATE_SUBSCRIPTION_ERROR]', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;
