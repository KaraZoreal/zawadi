import express from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import scholarshipsRouter from './scholarships.js';
import usersRouter from './users.js';
import subscriptionsRouter from './subscriptions.js';
import auditRouter from './audit.js';
import webhooksRouter from './webhooks.js';
import statisticsRouter from './statistics.js';

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// Mount sub-routers
router.use('/scholarships', scholarshipsRouter);
router.use('/users', usersRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/audit', auditRouter);
router.use('/webhooks', webhooksRouter);
router.use('/statistics', statisticsRouter);

// Admin dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../../config.js');

    const [
      { count: totalUsers },
      { count: totalScholarships },
      { count: publishedScholarships },
      { count: totalSubscriptions }
    ] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*', { count: 'exact' }).range(0, 0),
      supabaseAdmin.from('scholarships').select('*', { count: 'exact' }).range(0, 0),
      supabaseAdmin.from('scholarships').select('*', { count: 'exact' }).eq('published', true).range(0, 0),
      supabaseAdmin.from('subscriptions').select('*', { count: 'exact' }).range(0, 0)
    ]);

    res.json({
      totalUsers,
      totalScholarships,
      publishedScholarships,
      unpublishedScholarships: totalScholarships - publishedScholarships,
      totalSubscriptions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ADMIN_OVERVIEW_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

export default router;
