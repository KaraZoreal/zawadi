import express from 'express';
import { supabaseAdmin } from '../../config.js';

const router = express.Router();

// Store last sync timestamp per client
const clientSyncTimestamps = new Map();

/**
 * GET /api/sync/scholarships
 * Poll for scholarship updates since last sync
 * Used as fallback when WebSocket is not available
 */
router.get('/scholarships', async (req, res) => {
  try {
    const clientId = req.query.clientId || req.ip;
    const lastSync = clientSyncTimestamps.get(clientId) || new Date(Date.now() - 60000); // Default to 1 min ago

    // Get scholarships updated since last sync
    const { data: scholarships, error } = await supabaseAdmin
      .from('scholarships')
      .select('*')
      .eq('published', true)
      .gte('updated_at', lastSync.toISOString())
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Update sync timestamp
    clientSyncTimestamps.set(clientId, new Date());

    res.json({
      lastSync: lastSync.toISOString(),
      currentSync: new Date().toISOString(),
      updated: scholarships?.length || 0,
      scholarships: scholarships || [],
      shouldReload: scholarships?.some(s => s.published === false) // If unpublished, client should reload
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync scholarships' });
  }
});

/**
 * POST /api/sync/status
 * Send client sync status for monitoring
 */
router.post('/status', async (req, res) => {
  try {
    const { clientId, lastSync, version } = req.body;

    // Track client sync health
    if (clientId) {
      clientSyncTimestamps.set(clientId, new Date(lastSync || Date.now()));
    }

    res.json({
      status: 'ok',
      serverTime: new Date().toISOString(),
      clientId
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * Cleanup old client timestamps periodically
 */
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [clientId, timestamp] of clientSyncTimestamps.entries()) {
    if (timestamp < oneHourAgo) {
      clientSyncTimestamps.delete(clientId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export default router;
