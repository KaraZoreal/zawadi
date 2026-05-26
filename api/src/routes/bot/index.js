import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../../config.js';
import { verifyBotSecret } from '../../middleware/auth.js';
import { logAuditAction } from '../../services/audit.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Stricter rate limiting for bot endpoint
const botLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests from bot, please try again later.'
});

router.use(botLimiter);
router.use(verifyBotSecret);

/**
 * POST /api/bot/scholarships/ingest
 * Accept scholarship JSON from bot
 * 
 * Expected payload:
 * {
 *   scholarships: [
 *     {
 *       name: "Scholarship Name",
 *       host: "Host Organization",
 *       deadline: "2025-12-31",
 *       field: "Field of study",
 *       funding: "Full-ride",
 *       apply_url: "https://example.com",
 *       categories: ["Africa", "Full-ride"],
 *       africa_eligible: true,
 *       ai_ml_track: false
 *     }
 *   ]
 * }
 */
router.post('/scholarships/ingest', async (req, res) => {
  try {
    const { scholarships } = req.body;

    if (!Array.isArray(scholarships) || scholarships.length === 0) {
      return res.status(400).json({
        error: 'Invalid payload: scholarships array required',
        example: {
          scholarships: [
            {
              name: 'Scholarship Name',
              host: 'Host',
              deadline: '2025-12-31',
              field: 'Field',
              funding: 'Amount',
              apply_url: 'https://...',
              categories: ['Category'],
              africa_eligible: true
            }
          ]
        }
      });
    }

    if (scholarships.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 scholarships per request' });
    }

    // Validate and prepare scholarships
    const validated = scholarships.map((s, idx) => {
      if (!s.name || !s.host || !s.apply_url) {
        throw new Error(`Scholarship ${idx}: name, host, and apply_url required`);
      }

      return {
        id: uuidv4(),
        ...s,
        published: false, // Unpublished by default
        created_by: 'bot-ingestion',
        created_at: new Date().toISOString()
      };
    });

    // Insert scholarships
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('scholarships')
      .insert(validated)
      .select();

    if (insertError) {
      console.error('[BOT_INSERT_ERROR]', insertError);
      return res.status(500).json({ error: 'Failed to insert scholarships' });
    }

    // Log the ingestion
    await logAuditAction({
      admin_id: 'bot-system',
      action: 'BOT_INGEST_SCHOLARSHIPS',
      resource_type: 'scholarships',
      resource_id: null,
      before_values: null,
      after_values: { count: inserted.length },
      ip_address: req.ip
    });

    res.status(201).json({
      status: 'success',
      added: inserted.length,
      scholarships: inserted.map(s => ({
        id: s.id,
        name: s.name,
        host: s.host,
        published: s.published
      }))
    });
  } catch (err) {
    console.error('[BOT_INGEST_ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/bot/status
 * Health check endpoint
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bot-integration',
    timestamp: new Date().toISOString()
  });
});

export default router;
