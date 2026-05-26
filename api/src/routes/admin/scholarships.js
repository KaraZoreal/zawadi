import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config.js';
import { logAuditAction } from '../../services/audit.js';
import { eventEmitter } from '../../services/events.js';

const router = express.Router();

/**
 * GET /api/admin/scholarships
 * List all scholarships with publish status
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, published } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('scholarships')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (published !== undefined) {
      query = query.eq('published', published === 'true');
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      scholarships: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    console.error('[SCHOLARSHIPS_LIST_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch scholarships' });
  }
});

/**
 * PATCH /api/admin/scholarships/:id/publish
 * Publish a scholarship to users
 */
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;

    // Get before state
    const { data: before } = await supabaseAdmin
      .from('scholarships')
      .select('published')
      .eq('id', id)
      .single();

    // Update
    const { data, error } = await supabaseAdmin
      .from('scholarships')
      .update({
        published: true,
        published_by: req.user.id,
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'PUBLISH_SCHOLARSHIP',
      resource_type: 'scholarship',
      resource_id: id,
      before_values: before,
      after_values: { published: true },
      ip_address: req.ip
    });

    // Emit real-time event
    eventEmitter.publishScholarshipUpdate(id, 'publish', data[0]);

    res.json(data[0]);
  } catch (err) {
    console.error('[PUBLISH_ERROR]', err);
    res.status(500).json({ error: 'Failed to publish scholarship' });
  }
});

/**
 * PATCH /api/admin/scholarships/:id/unpublish
 * Unpublish a scholarship from users
 */
router.patch('/:id/unpublish', async (req, res) => {
  try {
    const { id } = req.params;

    // Get before state
    const { data: before } = await supabaseAdmin
      .from('scholarships')
      .select('published')
      .eq('id', id)
      .single();

    // Update
    const { data, error } = await supabaseAdmin
      .from('scholarships')
      .update({ published: false })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'UNPUBLISH_SCHOLARSHIP',
      resource_type: 'scholarship',
      resource_id: id,
      before_values: before,
      after_values: { published: false },
      ip_address: req.ip
    });

    // Emit real-time event
    eventEmitter.publishScholarshipUpdate(id, 'unpublish', data[0]);

    res.json(data[0]);
  } catch (err) {
    console.error('[UNPUBLISH_ERROR]', err);
    res.status(500).json({ error: 'Failed to unpublish scholarship' });
  }
});

/**
 * POST /api/admin/scholarships/bulk
 * Ingest multiple scholarships (from bot)
 */
router.post('/bulk', async (req, res) => {
  try {
    const { scholarships } = req.body;

    if (!Array.isArray(scholarships) || scholarships.length === 0) {
      return res.status(400).json({ error: 'Scholarships array required' });
    }

    // Validate and add IDs
    const toInsert = scholarships.map(s => ({
      id: uuidv4(),
      ...s,
      published: false,
      created_by: req.user.id
    }));

    const { data, error } = await supabaseAdmin
      .from('scholarships')
      .insert(toInsert)
      .select();

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'BULK_IMPORT_SCHOLARSHIPS',
      resource_type: 'scholarships',
      resource_id: null,
      before_values: null,
      after_values: { count: toInsert.length },
      ip_address: req.ip
    });

    res.json({
      added: data.length,
      scholarships: data
    });
  } catch (err) {
    console.error('[BULK_IMPORT_ERROR]', err);
    res.status(500).json({ error: 'Failed to import scholarships' });
  }
});

/**
 * DELETE /api/admin/scholarships/:id
 * Delete a scholarship
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get before state for audit
    const { data: before } = await supabaseAdmin
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();

    // Delete
    const { error } = await supabaseAdmin
      .from('scholarships')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log audit
    await logAuditAction({
      admin_id: req.user.id,
      action: 'DELETE_SCHOLARSHIP',
      resource_type: 'scholarship',
      resource_id: id,
      before_values: before,
      after_values: null,
      ip_address: req.ip
    });

    res.json({ message: 'Scholarship deleted' });
  } catch (err) {
    console.error('[DELETE_ERROR]', err);
    res.status(500).json({ error: 'Failed to delete scholarship' });
  }
});

export default router;
