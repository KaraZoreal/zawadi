// UpgradeModal Component
// Modal that shows when free users hit limits
// Shows all 3 tiers, highlights recommended (Season Pass), Paystack checkout, handles loading/error states

import React from "react";
import {
  X, Sparkles, Zap, Crown, Loader2, CircleDollarSign,
  CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight
} from "lucide-react";

const TIER_ICONS = { free: Sparkles, season_pass: Zap, premium: Crown };

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
            const isRecommended = plan.badge === "Recommended";
            const isCurrent = user?.plan === plan.id;
            const Icon = TIER_ICONS[plan.id] || Sparkles;
            const isLoading = loadingPlan === plan.id;

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
                  {plan.priceKes === 0 ? (
                    <strong className="price-free">Free</strong>
                  ) : (
                    <>
                      <strong>KES {plan.priceKes.toLocaleString()}</strong>
                      <span className="price-note">one-time payment</span>
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
                    : `Pay KES ${plan.priceKes.toLocaleString()}`}
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
