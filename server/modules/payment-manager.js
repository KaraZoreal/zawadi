// Payment & Subscription Manager
// Full payment lifecycle: subscribe, upgrade, downgrade, cancel, renew, history.
// Integrates with Paystack for processing but works standalone in demo mode.

import crypto from "node:crypto";

function nowIso() {
  return new Date().toISOString();
}

// --- Plan Definitions ---

const PLANS = {
  free: {
    id: "free",
    name: "Explorer",
    monthlyKes: 0,
    annualKes: 0,
    badge: "Free",
    description: "Scholarship discovery and basic application tracking.",
    limits: {
      maxApplications: 10,
      maxDocuments: 3,
      maxEssayGenerations: 90,      // 3 per day x 30 days
      maxEssayGenerationsPerDay: 3,  // Daily cap
      maxAutoAppliesPerDay: 3,       // 3 scholarship applications per day on free tier
      premiumFilters: false,
      documentAnalysis: false,
      prioritySupport: false
    },
    features: [
      "Open scholarship database",
      "Basic country, level and field filters",
      "10 tracked applications",
      "3 document records",
      "3 AI essay generations per day",
      "3 scholarship applications per day",
      "Weekly in-app updates"
    ]
  },
  plus: {
    id: "plus",
    name: "Scholar Plus",
    monthlyKes: 399,
    annualKes: 3990,
    badge: "Best value",
    description: "Premium matching and deadline control for active applicants.",
    limits: {
      maxApplications: Infinity,
      maxDocuments: Infinity,
      maxEssayGenerations: 10,
      maxAutoAppliesPerDay: 20,
      premiumFilters: true,
      documentAnalysis: true,
      prioritySupport: false
    },
    features: [
      "Unlimited application tracking",
      "Premium accessibility and amount filters",
      "Smart match score from your profile",
      "Document gap analysis",
      "10 AI essay generations/month",
      "20 auto-applies/day",
      "Document intelligence analysis"
    ]
  },
  pro: {
    id: "pro",
    name: "Application Pro",
    monthlyKes: 999,
    annualKes: 9990,
    badge: "Power user",
    description: "For applicants managing many countries, schools and deadlines.",
    limits: {
      maxApplications: Infinity,
      maxDocuments: Infinity,
      maxEssayGenerations: 50,
      maxAutoAppliesPerDay: 100,
      premiumFilters: true,
      documentAnalysis: true,
      prioritySupport: true
    },
    features: [
      "Everything in Scholar Plus",
      "50 AI essay generations/month",
      "100 auto-applies/day",
      "Priority urgency feed",
      "Advanced school and scholarship type filters",
      "CSV exports and intake tools"
    ]
  },
  mentor: {
    id: "mentor",
    name: "Mentor Review",
    monthlyKes: 2999,
    annualKes: 29990,
    badge: "Concierge",
    description: "A higher tier for hands-on review workflows.",
    limits: {
      maxApplications: Infinity,
      maxDocuments: Infinity,
      maxEssayGenerations: 200,
      maxAutoAppliesPerDay: 500,
      premiumFilters: true,
      documentAnalysis: true,
      prioritySupport: true
    },
    features: [
      "Everything in Application Pro",
      "200 AI essay generations/month",
      "500 auto-applies/day",
      "Review queue for CV, SOP and essays",
      "Interview preparation tracker",
      "Application readiness checklist",
      "Designed for later human mentor operations"
    ]
  }
};

// --- Subscription State ---

const SUBSCRIPTION_STATUS = {
  FREE: "free",
  TRIAL: "trial",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  EXPIRED: "expired"
};

// --- Trial Management ---

const TRIAL_DAYS = 14;
const TRIAL_FEATURES = ["plus"]; // Trial gives Scholar Plus features

function isTrialActive(user) {
  if (user.planStatus !== SUBSCRIPTION_STATUS.TRIAL) return false;
  if (!user.trialStartedAt) return false;

  const started = new Date(user.trialStartedAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - started) / (1000 * 60 * 60 * 24));

  return elapsed < TRIAL_DAYS;
}

function trialsDaysLeft(user) {
  if (!user.trialStartedAt) return 0;
  const started = new Date(user.trialStartedAt).getTime();
  const elapsed = Math.floor((Date.now() - started) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - elapsed);
}

function startTrial(user) {
  user.plan = "plus";        // Trial gives Scholar Plus
  user.planName = "Scholar Plus (Trial)";
  user.planStatus = SUBSCRIPTION_STATUS.TRIAL;
  user.trialStartedAt = nowIso();
  user.trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function endTrial(user) {
  if (user.planStatus === SUBSCRIPTION_STATUS.TRIAL) {
    user.plan = "free";
    user.planName = "Explorer";
    user.planStatus = SUBSCRIPTION_STATUS.FREE;
    user.trialEndedAt = nowIso();
  }
}

// --- Usage Tracking ---

function getUserUsage(db, userId) {
  if (!db.usageTracking) db.usageTracking = {};

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const dayKey = `${monthKey}-${String(now.getDate()).padStart(2, "0")}`;

  if (!db.usageTracking[userId]) {
    db.usageTracking[userId] = { monthly: {}, daily: {} };
  }

  const tracking = db.usageTracking[userId];

  if (!tracking.monthly[monthKey]) {
    tracking.monthly[monthKey] = {
      essayGenerations: 0,
      autoApplies: 0,
      applicationsCreated: 0,
      documentsUploaded: 0,
      documentAnalyses: 0
    };
  }

  if (!tracking.daily[dayKey]) {
    tracking.daily[dayKey] = {
      essayGenerations: 0,
      autoApplies: 0
    };
  }

  return {
    monthly: tracking.monthly[monthKey],
    daily: tracking.daily[dayKey],
    monthKey,
    dayKey
  };
}

function trackUsage(db, userId, type, count = 1) {
  if (!db.usageTracking) db.usageTracking = {};
  const usage = getUserUsage(db, userId);

  const monthlyFields = ["essayGenerations", "autoApplies", "applicationsCreated", "documentsUploaded", "documentAnalyses"];
  const dailyFields = ["essayGenerations", "autoApplies"];

  if (monthlyFields.includes(type)) {
    usage.monthly[type] = (usage.monthly[type] || 0) + count;
  }

  if (dailyFields.includes(type)) {
    usage.daily[type] = (usage.daily[type] || 0) + count;
  }
}

// --- Limit Enforcement ---

function checkLimits(user, type) {
  const plan = PLANS[user.plan] || PLANS.free;
  const limits = plan.limits;

  // If on trial, use plus limits
  if (isTrialActive(user)) {
    return checkLimitAgainst(PLANS.plus.limits, type, 0, 0);
  }

  return { allowed: true, limit: limits[`max${capitalizeField(type)}`] || Infinity };
}

function checkLimitWithUsage(user, type, monthlyUsed, dailyUsed) {
  const plan = isTrialActive(user) ? PLANS.plus : (PLANS[user.plan] || PLANS.free);
  const limits = plan.limits;

  const monthlyLimit = limits[`max${capitalizeField(type)}`];
  const dailyLimit = limits[`max${capitalizeField(type)}PerDay`] || limits[`max${capitalizeField(type)}`];

  const blockedMonthly = monthlyLimit !== undefined && monthlyUsed >= monthlyLimit;
  const blockedDaily = dailyLimit !== undefined && dailyUsed >= dailyLimit;

  if (blockedMonthly) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${monthlyUsed}/${monthlyLimit}). Upgrade your plan for more.`,
      limit: monthlyLimit,
      used: monthlyUsed
    };
  }

  if (blockedDaily) {
    return {
      allowed: false,
      reason: `Daily limit reached (${dailyUsed}/${dailyLimit}). Try again tomorrow or upgrade.`,
      limit: dailyLimit,
      used: dailyUsed
    };
  }

  return {
    allowed: true,
    limit: monthlyLimit || Infinity,
    used: monthlyUsed,
    remaining: (monthlyLimit || Infinity) - monthlyUsed
  };
}

function capitalizeField(field) {
  const map = {
    essaygenerations: "EssayGenerations",
    autoApplies: "AutoApplies",
    applicationsCreated: "ApplicationsCreated",
    documentsUploaded: "DocumentsUploaded",
    documentAnalyses: "DocumentAnalyses"
  };
  return map[field] || field.charAt(0).toUpperCase() + field.slice(1);
}

// --- Subscription Actions ---

function subscribe(db, user, planId, reference, amount, currency = "KES") {
  const plan = PLANS[planId];
  if (!plan || plan.id === "free") return { error: "Invalid plan" };

  user.plan = plan.id;
  user.planName = plan.name;
  user.planStatus = SUBSCRIPTION_STATUS.ACTIVE;
  user.subscriptionReference = reference;
  user.subscriptionAmount = amount;
  user.subscriptionCurrency = currency;
  user.subscribedAt = nowIso();
  user.subscriptionRenewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // Clear trial if upgrading from trial
  if (user.planStatus === SUBSCRIPTION_STATUS.TRIAL) {
    user.trialEndedAt = nowIso();
  }

  db.payments.push({
    id: crypto.randomUUID(),
    userId: user.id,
    planId,
    reference,
    amount,
    currency,
    status: "success",
    type: "subscription",
    createdAt: nowIso()
  });

  return { success: true, plan: plan.name };
}

function cancelSubscription(db, user) {
  if (user.plan === "free") return { error: "No active subscription" };

  const previousPlan = user.plan;
  const previousPlanName = user.planName;

  user.plan = "free";
  user.planName = "Explorer";
  user.planStatus = SUBSCRIPTION_STATUS.CANCELED;
  user.canceledAt = nowIso();

  db.payments.push({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: previousPlan,
    reference: `cancel-${user.subscriptionReference || crypto.randomUUID()}`,
    amount: 0,
    currency: "KES",
    status: "canceled",
    type: "cancellation",
    createdAt: nowIso()
  });

  return {
    success: true,
    message: `Subscription to ${previousPlanName} canceled. You are now on the free plan.`
  };
}

function changePlan(db, user, newPlanId) {
  const newPlan = PLANS[newPlanId];
  if (!newPlan || newPlan.id === "free") return { error: "Use cancel instead" };

  const oldPlan = PLANS[user.plan] || PLANS.free;

  const isUpgrade = newPlan.monthlyKes > oldPlan.monthlyKes;

  user.plan = newPlan.id;
  user.planName = newPlan.name;
  user.planStatus = SUBSCRIPTION_STATUS.ACTIVE;
  user.planChangedAt = nowIso();
  user.previousPlan = oldPlan.id;

  db.payments.push({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: newPlan.id,
    reference: `change-${oldPlan.id}-to-${newPlan.id}-${Date.now()}`,
    amount: 0,
    currency: "KES",
    status: "changed",
    type: isUpgrade ? "upgrade" : "downgrade",
    createdAt: nowIso()
  });

  return {
    success: true,
    message: `${isUpgrade ? "Upgraded" : "Changed"} to ${newPlan.name}.`,
    isUpgrade
  };
}

// --- Payment History ---

function getPaymentHistory(db, userId) {
  const payments = (db.payments || []).filter((p) => p.userId === userId);
  const subscriptions = payments.filter((p) => p.type === "subscription");
  const totalSpent = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    payments: payments.slice(-20).reverse(), // Last 20
    totalPayments: payments.length,
    totalSpent,
    currency: "KES",
    activeSubscription: subscriptions.filter((p) => p.status === "success").slice(-1)[0] || null
  };
}

// --- Invoice Generation ---

function generateInvoice(db, userId, paymentId) {
  const payment = (db.payments || []).find((p) => p.id === paymentId && p.userId === userId);
  if (!payment) return null;

  const plan = PLANS[payment.planId] || null;

  return {
    invoiceId: `INV-${payment.id.slice(0, 8).toUpperCase()}`,
    date: payment.createdAt,
    reference: payment.reference,
    planName: plan?.name || payment.planId,
    amount: payment.amount,
    currency: payment.currency || "KES",
    status: payment.status,
    type: payment.type,
    dueDate: new Date(new Date(payment.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
}

// --- Dashboard Summary ---

function getBillingSummary(db, userId) {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;

  const plan = PLANS[user.plan] || PLANS.free;
  const history = getPaymentHistory(db, userId);
  const trialDays = trialsDaysLeft(user);
  const isTrial = isTrialActive(user);

  return {
    currentPlan: {
      id: plan.id,
      name: plan.name,
      status: user.planStatus,
      monthlyKes: plan.monthlyKes,
      annualKes: plan.annualKes,
      features: plan.features,
      limits: plan.limits
    },
    trial: isTrial ? {
      active: true,
      daysLeft: trialDays,
      endsAt: user.trialEndsAt,
      message: trialDays <= 3 ? "Your trial ends soon! Subscribe to keep premium features." : `${trialDays} days left in your trial.`
    } : null,
    paymentHistory: {
      totalSpent: history.totalSpent,
      totalPayments: history.totalPayments,
      lastPayment: history.payments[0] || null
    },
    nextBillingDate: user.subscriptionRenewsAt || null,
    allPlans: Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      monthlyKes: p.monthlyKes,
      annualKes: p.annualKes,
      badge: p.badge,
      description: p.description,
      features: p.features,
      isCurrent: p.id === user.plan
    }))
  };
}

// --- Paystack API Integration ---

async function initiatePayment(user, planId, email, amountKes) {
  const reference = `zawadi-${planId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackKey) {
    throw new Error("Payment processing is not configured. Please set PAYSTACK_SECRET_KEY.");
  }

  const body = {
    email,
    amount: String(amountKes * 100), // Paystack uses kobo/cents
    currency: "KES",
    reference,
    callback_url: process.env.PAYSTACK_CALLBACK_URL || "",
    metadata: {
      userId: user.id,
      planId
    }
  };

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok || !payload.status) {
      throw new Error(payload.message || "Paystack initialization failed");
    }
    return {
      authorizationUrl: payload.data.authorization_url,
      reference: payload.data.reference,
      plan: PLANS[planId]
    };
  } catch (error) {
    throw error;
  }
}

function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto.createHmac("sha512", secret).update(payload).digest("hex");
  return signature === expected;
}

function processWebhookEvent(event, db) {
  if (event.event === "charge.success") {
    const metadata = event.data?.metadata || {};
    const userId = metadata.userId;
    const planId = metadata.planId;

    if (!userId || !planId) return { success: false, reason: "Missing userId or planId in metadata" };

    const user = db.users.find((u) => u.id === userId);
    if (!user) return { success: false, reason: "User not found" };

    const plan = PLANS[planId];
    const planName = plan ? plan.name : planId;

    user.plan = planId;
    user.planName = planName;
    user.is_paid = true;
    user.paid_at = nowIso();
    user.planStatus = SUBSCRIPTION_STATUS.ACTIVE;
    user.subscriptionReference = event.data.reference;

    db.payments.push({
      id: crypto.randomUUID(),
      userId,
      planId,
      reference: event.data.reference,
      amount: (event.data.amount || 0) / 100,
      currency: event.data.currency || "KES",
      status: "success",
      type: "subscription",
      createdAt: nowIso()
    });

    return { success: true, userId, planId, planName };
  }

  return { success: false, reason: `Unhandled event: ${event.event}` };
}

async function verifyPayment(reference) {
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    return { status: false, message: "Paystack not configured" };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackKey}`
      }
    });
    const payload = await response.json();

    return {
      status: payload.status,
      message: payload.message,
      data: payload.data ? {
        reference: payload.data.reference,
        amount: payload.data.amount / 100,
        currency: payload.data.currency,
        status: payload.data.status,
        paidAt: payload.data.paid_at,
        metadata: payload.data.metadata
      } : null
    };
  } catch (error) {
    return { status: false, message: error.message };
  }
}

// --- Pricing Plans for Upgrade Modal (KES one-time payment model) ---

const UPGRADE_PLANS = {
  season_pass: {
    id: "season_pass",
    name: "Season Pass",
    priceKes: 2600,  // ~$20
    badge: "Recommended",
    description: "Full access for one application season. Essays, unlimited tracking, all templates.",
    features: [
      "Unlimited AI essay generations",
      "Unlimited application tracking",
      "All document templates",
      "Premium filters and match scoring",
      "Priority application alerts"
    ]
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceKes: 6500,  // ~$50
    badge: "Best Value",
    description: "Everything in Season Pass plus mentoring features and priority support.",
    features: [
      "Everything in Season Pass",
      "Priority document review queue",
      "Interview preparation tools",
      "Mentor feedback on essays",
      "Priority email & chat support"
    ]
  }
};

export {
  PLANS,
  UPGRADE_PLANS,
  SUBSCRIPTION_STATUS,
  TRIAL_DAYS,
  isTrialActive,
  trialsDaysLeft,
  startTrial,
  endTrial,
  getUserUsage,
  trackUsage,
  checkLimits,
  checkLimitWithUsage,
  subscribe,
  cancelSubscription,
  changePlan,
  getPaymentHistory,
  generateInvoice,
  getBillingSummary,
  initiatePayment,
  verifyPayment,
  verifyWebhookSignature,
  processWebhookEvent
};
