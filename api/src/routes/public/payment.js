import express from 'express';
import { verifyPaystackSignature, handlePaymentSuccess, handlePaymentFailure, createPaymentReference, getUserPaymentHistory } from '../../services/payment.js';
import { requireAuth } from '../../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payment/webhook
 * Handle Paystack webhook (no auth required)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    // Parse body if it's a buffer
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
    }

    // Verify signature
    if (!verifyPaystackSignature(body, signature)) {
      console.warn('Invalid Paystack signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Handle different event types
    let result;
    if (body.event === 'charge.success') {
      result = await handlePaymentSuccess(body);
    } else if (body.event === 'charge.failed') {
      result = await handlePaymentFailure(body);
    } else {
      result = { success: true, message: 'Event received' };
    }

    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/payment/initialize
 * Initialize payment for subscription upgrade
 */
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    const user = req.user;

    if (!tier || !['plus', 'pro', 'mentor'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const reference = await createPaymentReference(user.id, tier, user.email);

    res.json({
      reference,
      paymentUrl: `https://checkout.paystack.com/${reference.reference}`,
      message: 'Payment initialized. Redirect user to paymentUrl'
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

/**
 * GET /api/payment/history
 * Get current user's payment history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const payments = await getUserPaymentHistory(req.user.id);
    res.json({ payments });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

export default router;
