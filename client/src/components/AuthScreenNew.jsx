import React from "react";
import { ArrowLeft, Loader2, Mail, Lock, User, Globe, Eye, EyeOff, Check } from "lucide-react";
import "./AuthScreenNew.css";

// Country to language group mapping
const LANGUAGE_GROUPS = {
  "Anglophone": ["Botswana", "Eswatini", "Gambia", "Ghana", "Kenya", "Lesotho", "Liberia", "Malawi", "Mauritius", "Namibia", "Nigeria", "Rwanda", "Seychelles", "Sierra Leone", "South Africa", "South Sudan", "Tanzania", "Uganda", "Zambia", "Zimbabwe"],
  "Francophone": ["Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic", "Chad", "Congo", "Côte d'Ivoire", "DR Congo", "Equatorial Guinea", "Gabon", "Guinea", "Guinea-Bissau", "Mali", "Niger", "Senegal", "Togo"],
  "Arabophone": ["Algeria", "Comoros", "Djibouti", "Egypt", "Eritrea", "Libya", "Mauritania", "Morocco", "Sudan", "Tunisia"],
  "Lusophone": ["Angola", "Cape Verde", "Mozambique", "Sao Tome and Principe"]
};

function getLanguageGroup(country) {
  for (const [group, countries] of Object.entries(LANGUAGE_GROUPS)) {
    if (countries.includes(country)) return group;
  }
  return "English";
}

export default function AuthScreenNew({ config, initialMode = "login", onAuthed, onBackToLanding }) {
  const [mode, setMode] = React.useState(initialMode);
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    country: "Kenya",
    resetToken: "",
    newPassword: "",
    confirmPassword: "",
    isAdmin: false
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [detectingCountry, setDetectingCountry] = React.useState(true);
  const [countries] = React.useState((config?.countries || ["Kenya", "Nigeria", "Ghana", "South Africa", "Ethiopia", "Tanzania", "Uganda", "Rwanda", "Egypt", "Senegal", "Cameroon", "Zimbabwe", "Zambia", "Malawi", "Botswana", "Namibia", "Mauritius", "Morocco", "Algeria", "Tunisia", "Sudan", "Angola", "Mozambique", "DR Congo", "Congo", "Ivory Coast", "Mali", "Burkina Faso", "Niger", "Chad", "Somalia", "Liberia", "Sierra Leone", "Gambia", "Guinea", "Benin", "Togo", "Gabon", "Equatorial Guinea", "Burundi", "Djibouti", "Eritrea", "Eswatini", "Lesotho", "Madagascar", "Mauritania", "Seychelles", "South Sudan", "Cape Verde", "Comoros", "Sao Tome and Principe", "Central African Republic", "Guinea-Bissau"]).sort());

  const languageGroup = getLanguageGroup(form.country);
  const recommendedLanguages = languageGroup === "Anglophone" ? ["English", "Pidgin English"] : languageGroup === "Francophone" ? ["French", "English"] : languageGroup === "Arabophone" ? ["Arabic", "French", "English"] : ["Portuguese", "English"];

  React.useEffect(() => {
    detectCountry();
  }, []);

  async function detectCountry() {
    try {
      const locData = await fetch("/api/location").then(r => r.json());
      if (locData.country && locData.detected) {
        setForm((prev) => ({ ...prev, country: locData.country }));
        setDetectingCountry(false);
        return;
      }
    } catch {
      // Server unavailable
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzCountry = tz.split("/")[0] === "Africa" ? tz.split("/")[1]?.replace(/_/g, " ") : null;
      if (tzCountry && countries.includes(tzCountry)) {
        setForm((prev) => ({ ...prev, country: tzCountry }));
      }
    } catch {
      // Keep default
    }
    setDetectingCountry(false);
  }

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      setForm((prev) => ({ ...prev, resetToken: token }));
      setMode("reset");
    } else {
      setMode(initialMode);
    }
  }, [initialMode]);

  function resetForm() {
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to send reset email");
        setSuccess("Check your email for reset instructions");
        return;
      }

      if (mode === "reset") {
        if (form.newPassword !== form.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: form.resetToken,
            newPassword: form.newPassword
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to reset password");
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          setMode("login");
          setSuccess("");
        }, 2000);
        return;
      }

      // Auth action
      const endpoint = mode === "register" ? "/api/auth/signup" : form.isAdmin ? "/api/auth/admin-login" : "/api/auth/login";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          ...(mode === "register" && {
            name: form.name,
            country: form.country,
            languageGroup: languageGroup
          })
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Authentication failed. Please try again.");
      }

      if (mode === "register") {
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setLoading(false);
        return;
      }

      // User authenticated
      if (data.user) {
        onAuthed({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || form.name || "",
          country: data.user.country || form.country || "Kenya",
          plan: data.user.plan || "free",
          planName: data.user.plan_name || "Explorer",
          is_paid: !!(data.user.plan && data.user.plan !== "free"),
          role: data.user.role || "user",
          is_admin: form.isAdmin,
          profile: {
            country: data.user.country || form.country || "Kenya",
            languageGroup: getLanguageGroup(data.user.country || form.country || "Kenya"),
            targetLevel: data.user.target_level || "Masters",
            fieldInterests: data.user.field_interests || [],
            studyCountries: data.user.study_countries || []
          }
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    resetForm();
  };

  const navRight = (
    <div className="auth-nav-actions">
      <button
        className="ghost-btn"
        type="button"
        onClick={onBackToLanding}
        disabled={loading}
      >
        <ArrowLeft size={16} />
        Back
      </button>
    </div>
  );

  return (
    <div className="auth-screen-new">
      <header className="auth-header">
        <div className="auth-header-inner">
          <a href="/" className="auth-logo" onClick={(e) => { e.preventDefault(); onBackToLanding(); }}>
            <div className="brand-mark">T</div>
            <span>Techsari Zawadi</span>
          </a>
          {navRight}
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card-container">
          <form className="auth-card" onSubmit={handleSubmit}>
            {/* Form Header */}
            <div className="auth-card-header">
              {mode === "login" && (
                <>
                  <h2>Welcome Back</h2>
                  <p>Sign in to your Zawadi account to continue your scholarship journey</p>
                </>
              )}
              {mode === "register" && (
                <>
                  <h2>Join Zawadi</h2>
                  <p>Create your account and start discovering scholarships</p>
                </>
              )}
              {mode === "forgot" && (
                <>
                  <h2>Reset Password</h2>
                  <p>Enter your email to receive password reset instructions</p>
                </>
              )}
              {mode === "reset" && (
                <>
                  <h2>Create New Password</h2>
                  <p>Please enter a strong new password</p>
                </>
              )}
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="alert alert-error">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <Check size={18} /> {success}
              </div>
            )}

            {/* Admin Login Toggle */}
            {(mode === "login" || mode === "register") && (
              <div className="admin-toggle">
                <input
                  type="checkbox"
                  id="isAdmin"
                  name="isAdmin"
                  checked={form.isAdmin}
                  onChange={handleInputChange}
                />
                <label htmlFor="isAdmin">I'm an admin</label>
              </div>
            )}

            {/* Form Fields */}
            {(mode === "register" || mode === "reset") && mode !== "forgot" && mode !== "reset" ? null : null}

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleInputChange}
                    required={mode === "register"}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "register" || mode === "forgot") && (
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {(mode === "login" || mode === "register") && (
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <div className="input-wrapper">
                  <Globe size={18} />
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleInputChange}
                    disabled={loading || detectingCountry}
                  >
                    {countries.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="language-suggestion">
                  <strong>Recommended for {form.country}:</strong>
                  <div className="language-tags">
                    {recommendedLanguages.map((lang, idx) => (
                      <span key={idx} className="language-tag">{lang}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {mode === "reset" && (
              <>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="••••••••"
                      value={form.newPassword}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading && <Loader2 size={18} className="spin" />}
              {loading ? "Processing..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : mode === "forgot" ? "Send Reset Link" : "Reset Password"}
            </button>

            {/* Footer Links */}
            <div className="auth-footer">
              {mode === "login" && (
                <>
                  <p>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => { setMode("register"); resetForm(); }}
                    >
                      Sign up
                    </button>
                  </p>
                  <p>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => { setMode("forgot"); resetForm(); }}
                    >
                      Forgot password?
                    </button>
                  </p>
                </>
              )}
              {mode === "register" && (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setMode("login"); resetForm(); }}
                  >
                    Sign in
                  </button>
                </p>
              )}
              {(mode === "forgot" || mode === "reset") && (
                <p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setMode("login"); resetForm(); }}
                  >
                    Back to sign in
                  </button>
                </p>
              )}
            </div>
          </form>

          {/* Right Panel */}
          <div className="auth-panel">
            <div className="auth-panel-content">
              <h3>Why Choose Zawadi?</h3>
              <ul className="benefits-list">
                <li>
                  <span className="benefit-icon">🎯</span>
                  <div>
                    <strong>AI-Powered Matching</strong>
                    <p>Get scholarships that match your profile perfectly</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">🌍</span>
                  <div>
                    <strong>54 Countries Covered</strong>
                    <p>Access opportunities from across Africa</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">📚</span>
                  <div>
                    <strong>Smart Essays</strong>
                    <p>Get AI assistance with structured essay support</p>
                  </div>
                </li>
                <li>
                  <span className="benefit-icon">🔒</span>
                  <div>
                    <strong>Your Data is Safe</strong>
                    <p>Enterprise-grade encryption & privacy</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
