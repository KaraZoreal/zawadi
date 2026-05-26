import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { logAuditAction } from '../../services/audit.js';

const router = express.Router();

/**
 * GET /api/admin/users
 * List all users with their subscription status
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('user_profiles')
      .select(`
        *,
        subscriptions(plan, status, expires_at),
        applications(count),
        documents(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      users: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[LIST_USERS_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.json(data);
  } catch (err) {
    console.error('[GET_USER_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get before state
    const { data: before } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    // Update
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'UPDATE_USER',
      resource_type: 'user',
      resource_id: id,
      before_values: before,
      after_values: updates,
      ip_address: req.ip
    });

    res.json(data[0]);
  } catch (err) {
    console.error('[UPDATE_USER_ERROR]', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
