import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../config.js';
import { logAuditAction } from '../../services/audit.js';

const router = express.Router();

/**
 * POST /api/admin/webhooks/paystack
 * Handle Paystack payment webhooks
 */
router.post('/paystack', async (req, res) => {
  try {
    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, authorization, metadata, amount } = data;
      const { user_id, plan } = metadata || {};

      if (!user_id || !plan) {
        return res.status(400).json({ error: 'Missing metadata' });
      }

      // Update or create subscription
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user_id)
        .single();

      const subscriptionData = {
        user_id,
        plan,
        paystack_reference: reference,
        amount_paid: amount / 100, // Paystack sends in kobo
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };

      let result;
      if (existingSub) {
        const { data: updated, error } = await supabaseAdmin
          .from('subscriptions')
          .update(subscriptionData)
          .eq('user_id', user_id)
          .select();
        result = { data: updated, error };
      } else {
        const { data: created, error } = await supabaseAdmin
          .from('subscriptions')
          .insert([subscriptionData])
          .select();
        result = { data: created, error };
      }

      if (result.error) {
        console.error('[PAYSTACK_WEBHOOK_ERROR]', result.error);
        return res.status(500).json({ error: 'Failed to update subscription' });
      }

      // Log this transaction
      await logAuditAction({
        admin_id: 'paystack-webhook',
        action: 'SUBSCRIPTION_UPDATED_PAYMENT',
        resource_type: 'subscription',
        resource_id: user_id,
        before_values: existingSub || null,
        after_values: subscriptionData,
        ip_address: req.ip
      });

      res.json({ status: 'success' });
    } else {
      res.json({ status: 'ignored' });
    }
  } catch (err) {
    console.error('[PAYSTACK_WEBHOOK_ERROR]', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
