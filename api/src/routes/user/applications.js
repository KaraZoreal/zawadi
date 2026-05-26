import express from 'express';
import { supabaseAdmin } from '../../config.js';

const router = express.Router();

/**
 * GET /api/user/applications
 * Get user's applications
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      applications: data,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[GET_APPLICATIONS_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

/**
 * POST /api/user/applications
 * Create new application
 */
router.post('/', async (req, res) => {
  try {
    const { scholarship_id, status, notes } = req.body;

    if (!scholarship_id) {
      return res.status(400).json({ error: 'scholarship_id required' });
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: req.user.id,
        scholarship_id,
        status: status || 'pending',
        notes: notes || ''
      })
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    console.error('[CREATE_APPLICATION_ERROR]', err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

/**
 * PATCH /api/user/applications/:id
 * Update application
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    console.error('[UPDATE_APPLICATION_ERROR]', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

/**
 * DELETE /api/user/applications/:id
 * Delete application
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete
    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Application deleted' });
  } catch (err) {
    console.error('[DELETE_APPLICATION_ERROR]', err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

export default router;
