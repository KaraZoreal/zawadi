import React, { useState, useEffect } from 'react';
import './AuthScreenProfessional.css';

const COUNTRIES = [
  'Kenya', 'Nigeria', 'South Africa', 'Ghana', 'Uganda', 'Tanzania', 'Senegal', 'Cameroon',
  'Morocco', 'Ethiopia', 'Rwanda', 'Zambia', 'Zimbabwe', 'Malawi', 'Botswana', 'Namibia',
  'Mozambique', 'Angola', 'Côte d\'Ivoire', 'Benin', 'Burkina Faso', 'Burundi', 'Algeria',
  'Egypt', 'Gabon', 'Guinea', 'Mali', 'Niger', 'Togo', 'Liberia', 'Sierra Leone', 'Sudan',
  'Madagascar', 'Mauritius', 'Seychelles', 'Eswatini', 'Lesotho', 'Central African Republic',
  'Chad', 'Congo', 'DR Congo', 'Djibouti', 'Eritrea', 'Gambia', 'Guinea-Bissau', 'Mauritania',
  'Tunisia', 'Equatorial Guinea', 'Cape Verde', 'Sao Tome and Principe', 'Comoros', 'South Sudan'
];

const LANGUAGE_GROUPS = {
  'Anglophone': ['Botswana', 'Ghana', 'Kenya', 'Lesotho', 'Liberia', 'Malawi', 'Mauritius', 'Namibia', 'Nigeria', 'Rwanda', 'Seychelles', 'Sierra Leone', 'South Africa', 'South Sudan', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe'],
  'Francophone': ['Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 'Central African Republic', 'Chad', 'Congo', 'Côte d\'Ivoire', 'DR Congo', 'Equatorial Guinea', 'Gabon', 'Guinea', 'Guinea-Bissau', 'Mali', 'Niger', 'Senegal', 'Togo'],
  'Arabophone': ['Algeria', 'Comoros', 'Djibouti', 'Egypt', 'Eritrea', 'Libya', 'Mauritania', 'Morocco', 'Sudan', 'Tunisia'],
  'Lusophone': ['Angola', 'Cape Verde', 'Mozambique', 'Sao Tome and Principe'],
  'English': ['All other countries']
};

function getLanguageGroup(country) {
  for (const [group, countries] of Object.entries(LANGUAGE_GROUPS)) {
    if (countries.includes(country)) return group;
  }
  return 'English';
}

function getLanguageRecommendation(country) {
  const group = getLanguageGroup(country);
  const recommendations = {
    'Anglophone': 'English',
    'Francophone': 'French, English',
    'Arabophone': 'Arabic, French, English',
    'Lusophone': 'Portuguese, English',
    'English': 'English'
  };
  return recommendations[group] || 'English';
}

export default function AuthScreenProfessional({ initialMode = 'login', onAuthed, onBackToLanding }) {
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const languageRecommendation = getLanguageRecommendation(country);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' 
        ? (isAdmin ? '/api/public/auth/admin-login' : '/api/public/auth/login')
        : '/api/public/auth/signup';

      const payload = mode === 'login'
        ? { email, password }
        : { email, password, name, country, isAdmin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (onAuthed) {
        onAuthed(data.user || data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Back button */}
      <button className="auth-back-btn" onClick={onBackToLanding}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div className="auth-container">
        {/* Left Side: Form */}
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="auth-form-subtitle">
              {mode === 'login'
                ? 'Sign in to continue your scholarship journey'
                : 'Join thousands of African scholars'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="country">Country of Residence</label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="language-recommendation">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span><strong>Recommended for {country}:</strong> {languageRecommendation}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {showPassword ? (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    ) : (
                      <path d="M11.83 9L5.5 2.67c-1.41 1.41-2.58 3.04-3.31 4.84-.72 1.8-1.08 3.75-1.08 5.49 0 1.74.36 3.4 1.08 5.2 1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l-6.24-6.24zM19.97 11.13c.03-.25.06-.5.06-.76 0-1.74-.36-3.4-1.08-5.2-1.73-4.39-6-7.5-11-7.5-1.55 0-3.03.3-4.38.84L5.06 6.5C6.5 6.17 8 6 9.5 6c5 0 9.27 3.11 11 7.5.02.05.03.1.04.16l4.43 4.47v-.01z"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={mode === 'signup'}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      {showConfirmPassword ? (
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      ) : (
                        <path d="M11.83 9L5.5 2.67c-1.41 1.41-2.58 3.04-3.31 4.84-.72 1.8-1.08 3.75-1.08 5.49 0 1.74.36 3.4 1.08 5.2 1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l-6.24-6.24zM19.97 11.13c.03-.25.06-.5.06-.76 0-1.74-.36-3.4-1.08-5.2-1.73-4.39-6-7.5-11-7.5-1.55 0-3.03.3-4.38.84L5.06 6.5C6.5 6.17 8 6 9.5 6c5 0 9.27 3.11 11 7.5.02.05.03.1.04.16l4.43 4.47v-.01z"/>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="admin-checkbox">
                <input
                  id="admin"
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                />
                <label htmlFor="admin">Sign in as Admin</label>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-toggle">
            <span>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </span>
          </div>
        </div>

        {/* Right Side: Benefits Panel */}
        <div className="auth-benefits">
          <div className="benefits-content">
            <h3 className="benefits-title">Why Join Zawadi?</h3>
            
            <div className="benefit-item">
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
              </div>
              <div>
                <h4>Smart Matching</h4>
                <p>AI-powered scholarship matching with 98% precision</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
                </svg>
              </div>
              <div>
                <h4>Application Tracking</h4>
                <p>Track all your applications in one central dashboard</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 3H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9l-6-6z"/>
                </svg>
              </div>
              <div>
                <h4>Automated Documents</h4>
                <p>Secure vault for all your transcripts and certificates</p>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
              <div>
                <h4>One-Click Apply</h4>
                <p>Auto-fill applications and submit to multiple programs</p>
              </div>
            </div>

            {/* Language Recommendation Banner */}
            {mode === 'signup' && (
              <div className="language-banner">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                </svg>
                <div>
                  <p className="banner-title">Recommended Languages</p>
                  <p className="banner-text">{languageRecommendation}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
