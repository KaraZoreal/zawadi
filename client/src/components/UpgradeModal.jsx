// UpgradeModal Component
// Modal that shows when free users hit limits
// Shows all 3 tiers, highlights recommended (Season Pass), Paystack checkout, handles loading/error states

import React from "react";
import {
  X, Sparkles, Zap, Crown, Loader2, CircleDollarSign,
  CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight
} from "lucide-react";

const TIER_ICONS = { free: Sparkles, plus: Zap, pro: Crown, mentor: Crown };
const countryCurrency = {
  Kenya: "KES",
  Nigeria: "NGN",
  Ghana: "GHS",
  "South Africa": "ZAR",
  Uganda: "UGX",
  Tanzania: "TZS",
  Rwanda: "RWF",
  Ethiopia: "ETB",
  Egypt: "EGP",
  Morocco: "MAD",
  "United States": "USD",
  USA: "USD"
};
const usdRates = { USD: 1, KES: 130, NGN: 1500, GHS: 15, ZAR: 18, UGX: 3800, TZS: 2600, RWF: 1300, ETB: 57, EGP: 48, MAD: 10 };

function currencyForCountry(country = "") {
  return countryCurrency[country] || "USD";
}

function priceForPlan(plan, country = "") {
  const usd = Number(plan.monthlyUsd || plan.displayPrice?.usd || 0);
  if (!usd) return { primary: "Free", note: "forever" };
  const currency = currencyForCountry(country);
  const local = Math.round(usd * (usdRates[currency] || 1));
  return {
    primary: `$${usd.toLocaleString()}`,
    note: currency === "USD" ? "per month" : `~${currency} ${local.toLocaleString()} per month`
  };
}

export default function UpgradeModal({ plans, user, onClose, onUpgrade, onToast }) {
  const [loadingPlan, setLoadingPlan] = React.useState(null);
  const [error, setError] = React.useState("");

  async function handleUpgrade(planId) {
    if (planId === "free") return;
    setLoadingPlan(planId);
    setError("");

    try {
      const data = await onUpgrade(planId);

      if (data.alreadyPaid) {
        onToast("You already have access to this plan!");
        onClose();
        return;
      }

      if (data.demo) {
        onToast(data.message || `Upgraded to ${data.plan?.name || planId} in demo mode ✓`);
        onClose();
        return;
      }

      if (data.authorizationUrl) {
        // Redirect to Paystack
        window.location.href = data.authorizationUrl;
      } else {
        setError("Could not create payment link. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Payment initiation failed");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>
              <ShieldCheck size={20} color="var(--green)" />
              Upgrade Your Plan
            </h3>
            <p className="modal-subtitle">
              You've hit the limit on your free plan. Unlock full features to maximize your scholarship applications.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Current plan indicator */}
        {user && (
          <div className="current-plan-bar">
            <span>Current plan:</span>
            <strong className="plan-pill">{user.planName || "Explorer"}</strong>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="form-error upgrade-error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Pricing tiers */}
        <div className="upgrade-tiers">
          {(plans || []).map((plan) => {
            const isRecommended = plan.badge === "Best value" || plan.badge === "Recommended";
            const isCurrent = user?.plan === plan.id;
            const Icon = TIER_ICONS[plan.id] || Sparkles;
            const isLoading = loadingPlan === plan.id;
            const price = priceForPlan(plan, user?.country);

            return (
              <article
                key={plan.id}
                className={`upgrade-tier-card ${isRecommended ? "recommended" : ""} ${isCurrent ? "current" : ""}`}
              >
                {isRecommended && <span className="tier-recommended-badge">★ Recommended</span>}
                {isCurrent && <span className="tier-current-badge">✓ Current</span>}

                <div className="tier-header">
                  <div className="tier-icon">
                    <Icon size={22} color={isRecommended ? "var(--gold)" : "var(--green)"} />
                  </div>
                  <div>
                    <h4>{plan.name}</h4>
                    <span className="tier-badge">{plan.badge}</span>
                  </div>
                </div>

                <p className="tier-description">{plan.description}</p>

                <div className="tier-price">
                  {plan.id === "free" ? (
                    <strong className="price-free">Free</strong>
                  ) : (
                    <>
                      <strong>{price.primary}</strong>
                      <span className="price-note">{price.note}</span>
                    </>
                  )}
                </div>

                <ul className="tier-features">
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <CheckCircle2 size={14} color="var(--green)" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={plan.id === "free" ? "ghost-btn full" : isRecommended ? "primary-btn full" : "secondary-btn full"}
                  type="button"
                  disabled={isCurrent || plan.id === "free" || isLoading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading ? (
                    <Loader2 className="spin" size={16} />
                  ) : plan.id === "free" ? (
                    <Sparkles size={16} />
                  ) : (
                    <CircleDollarSign size={16} />
                  )}
                  {isCurrent
                    ? "Current Plan"
                    : plan.id === "free"
                    ? "Your Plan"
                    : isLoading
                    ? "Creating Payment..."
                    : `Pay ${price.primary}`}
                </button>

                {plan.id !== "free" && (
                  <p className="tier-payment-note">
                    <ShieldCheck size={12} />
                    Secure payment via Paystack
                  </p>
                )}
              </article>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="ghost-btn" onClick={onClose}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
