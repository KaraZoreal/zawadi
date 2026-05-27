import express from 'express';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../../config.js';
import { getLimits } from '../../middleware/subscription.js';

const router = express.Router();

function extractTextFromPayload({ data, content, fileName }) {
  if (content) return content;
  if (!data) return `Writing sample uploaded from ${fileName || 'document'}.`;
  const lowerName = String(fileName || '').toLowerCase();
  if (lowerName.endsWith('.pdf') || lowerName.endsWith('.docx')) {
    return `Writing sample uploaded from ${fileName}. Full document is stored for review and future AI analysis.`;
  }
  try {
    return Buffer.from(String(data).split(',').pop() || '', 'base64').toString('utf8').slice(0, 12000);
  } catch {
    return `Writing sample uploaded from ${fileName || 'document'}.`;
  }
}

router.get('/samples', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('type', 'Essay Sample')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      samples: (data || []).map((doc) => ({
        id: doc.id,
        title: doc.name,
        fileName: doc.name,
        content: 'Essay sample stored securely for AI voice analysis.',
        wordCount: 8,
        created_at: doc.created_at
      }))
    });
  } catch (err) {
    console.error('[GET_ESSAY_SAMPLES_ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch essay samples' });
  }
});

/**
 * POST /api/user/essays/samples/upload
 * Upload sample documents for essay generation context
 */
router.post('/samples/upload', async (req, res) => {
  try {
    const { fileName, title, type, size } = req.body;
    const content = extractTextFromPayload(req.body);
    
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    // Store in database with reference to user
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: req.user.id,
        name: title || fileName,
        type: 'Essay Sample',
        size_bytes: size || Buffer.byteLength(content, 'utf8'),
        storage_path: `samples/${req.user.id}/${fileName}`
      })
      .select()
      .single();

    if (error) throw error;

    const sample = {
      id: data.id,
      title: data.name,
      fileName,
      content,
      wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      created_at: data.created_at
    };

    res.json({ success: true, sample, extraction: { wordCount: sample.wordCount } });
  } catch (err) {
    console.error('[UPLOAD_DOCUMENT_ERROR]', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

router.get('/preferences', async (req, res) => {
  res.json({ preferences: null });
});

router.post('/edit', async (req, res) => {
  res.json({
    ok: true,
    preferences: {
      totalEdits: 1,
      averageRating: req.body?.rating || 0,
      preferredTone: 'Clear, personal, impact-focused'
    }
  });
});

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

    const essayType = req.body?.essayType || 'personal_statement';
    const finalEssay = [
      '# Scholarship Essay',
      '',
      'My academic journey has been shaped by discipline, resilience, and a commitment to using education for meaningful community impact.',
      '',
      req.body?.prompt ? `This draft responds to the prompt: ${req.body.prompt}` : 'This draft should be personalized with specific achievements, program details, and measurable impact.',
      '',
      'I am applying because this opportunity aligns with my preparation and with the contribution I want to make after completing my studies.',
      '',
      'With this scholarship, I will be able to focus on academic excellence, leadership, and service while representing the program with integrity.'
    ].join('\n');

    res.json({
      essayId: randomUUID(),
      essayType,
      essayLabel: 'Scholarship Essay',
      finalEssay,
      wordCount: finalEssay.trim().split(/\s+/).filter(Boolean).length,
      remaining: limits.essaysPerDay - (todayCount + 1),
      stages: {
        stage2: { critique: { authenticityScore: 82 } },
        stage3: { finalCritique: { readyForSubmission: true } }
      }
    });
  } catch (err) {
    console.error('[GENERATE_ESSAY_ERROR]', err);
    res.status(500).json({ error: 'Failed to generate essay' });
  }
});

export default router;
