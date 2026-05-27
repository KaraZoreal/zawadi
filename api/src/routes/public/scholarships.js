import express from 'express';
import { supabaseAdmin } from '../../config.js';
import { verifyAuth } from '../../middleware/auth.js';
import { fetchSubscription, getLimits } from '../../middleware/subscription.js';

const router = express.Router();

/**
 * GET /api/public/scholarships
 * Get published scholarships (optionally filtered by subscription tier)
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, country, category, tier } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('scholarships')
      .select('*', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (country) {
      query = query.ilike('countries', `%${country}%`);
    }

    if (category) {
      query = query.ilike('categories', `%${category}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    // If authenticated, apply tier-based limits
    let filteredData = data;
    if (req.headers.authorization) {
      // The limit is just for display - backend enforces via middleware
      // For now, return all published scholarships
    }

    res.json({
      scholarships: filteredData,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
    });
  } catch (err) {
    console.error('[GET_SCHOLARSHIPS_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch scholarships' });
  }
});

/**
 * GET /api/public/scholarships/:id
 * Get single scholarship details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .eq('published', true)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Scholarship not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('[GET_SCHOLARSHIP_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch scholarship' });
  }
});

export default router;
