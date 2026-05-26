import { supabaseAdmin } from '../config.js';
import { createSubscription, renewSubscription } from './subscription.js';
import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify Paystack webhook signature
 */
export function verifyPaystackSignature(body, signature) {
  if (!PAYSTACK_SECRET) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  return hash === signature;
}

/**
 * Handle successful payment
 */
export async function handlePaymentSuccess(event) {
  try {
    const { reference, customer, amount, metadata } = event.data;
    
    if (event.event !== 'charge.success') {
      return { success: false, error: 'Invalid event type' };
    }

    // Get user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (userError) {
      console.error('User not found:', customer.email);
      return { success: false, error: 'User not found' };
    }

    // Determine subscription tier from metadata or amount
    let tier = metadata?.tier || 'plus';
    
    // Map amount to tier if tier not in metadata
    const tierPrices = {
      plus: 500, // 5 USD in smallest unit
      pro: 1200, // 12 USD
      mentor: 9900 // 99 USD
    };

    if (!metadata?.tier) {
      for (const [t, price] of Object.entries(tierPrices)) {
        if (amount >= price * 100) { // Convert to cents
          tier = t;
          break;
        }
      }
    }

    // Create or renew subscription
    let subscription;
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingSub && existingSub.status === 'active') {
      subscription = await renewSubscription(user.id, tier);
    } else {
      subscription = await createSubscription(user.id, tier, reference);
    }

    // Record payment
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        reference,
        amount,
        currency: 'NGN',
        provider: 'paystack',
        status: 'completed',
        metadata: {
          customer_email: customer.email,
          tier
        }
      });

    if (paymentError) {
      console.error('Payment record error:', paymentError);
    }

    return {
      success: true,
      subscription,
      message: `Subscription upgraded to ${tier}`
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle payment failure
 */
export async function handlePaymentFailure(event) {
  try {
    const { reference, customer } = event.data;

    const { data: user } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('email', customer.email)
      .single();

    if (user) {
      await supabaseAdmin
        .from('payments')
        .insert({
          user_id: user.id,
          reference,
          provider: 'paystack',
          status: 'failed',
          metadata: { customer_email: customer.email }
        });
    }

    return { success: true, message: 'Payment failure recorded' };
  } catch (error) {
    console.error('Payment failure handling error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create payment reference for checkout
 */
export async function createPaymentReference(userId, tier, email) {
  try {
    const tierPrices = {
      plus: 500, // 5 USD
      pro: 1200, // 12 USD
      mentor: 9900 // 99 USD
    };

    const amount = tierPrices[tier] * 100; // Convert to cents

    if (!amount) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // In real app, you'd call Paystack API here
    // For now, return a structure for the frontend

    return {
      reference: `zawadi_${userId}_${Date.now()}`,
      amount,
      tier,
      email,
      metadata: { tier, user_id: userId }
    };
  } catch (error) {
    console.error('Error creating payment reference:', error);
    throw error;
  }
}

/**
 * Get user's payment history
 */
export async function getUserPaymentHistory(userId) {
  try {
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return payments || [];
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return [];
  }
}

/**
 * Get payment statistics for admin
 */
export async function getPaymentStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    const stats = {
      total_payments: (payments || []).length,
      total_revenue: 0,
      by_tier: {},
      by_provider: {}
    };

    (payments || []).forEach(payment => {
      stats.total_revenue += payment.amount || 0;

      const tier = payment.metadata?.tier || 'unknown';
      if (!stats.by_tier[tier]) {
        stats.by_tier[tier] = { count: 0, amount: 0 };
      }
      stats.by_tier[tier].count++;
      stats.by_tier[tier].amount += payment.amount || 0;

      const provider = payment.provider || 'unknown';
      if (!stats.by_provider[provider]) {
        stats.by_provider[provider] = { count: 0, amount: 0 };
      }
      stats.by_provider[provider].count++;
      stats.by_provider[provider].amount += payment.amount || 0;
    });

    return stats;
  } catch (error) {
    console.error('Error getting payment stats:', error);
    return {
      total_payments: 0,
      total_revenue: 0,
      by_tier: {},
      by_provider: {}
    };
  }
}
