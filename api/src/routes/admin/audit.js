import express from 'express';
import { getAuditLogs } from '../../services/audit.js';

const router = express.Router();

/**
 * GET /api/admin/audit
 * List audit logs with filtering
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, admin_id, resource_type } = req.query;

    const result = await getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      admin_id,
      resource_type
    });

    res.json(result);
  } catch (err) {
    console.error('[GET_AUDIT_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
