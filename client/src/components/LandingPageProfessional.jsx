import React, { useState, useEffect } from 'react';
import './LandingPageProfessional.css';

export default function LandingPageProfessional({ onGetStarted }) {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className={`navbar ${navScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-logo">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6m0 6v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="logo-text">Techsari Zawadi</span>
          </div>

          <nav className="navbar-nav">
            <a href="#how-it-works" onClick={() => scrollToSection('how-it-works')}>How it Works</a>
            <a href="#scholarships" onClick={() => scrollToSection('scholarships')}>Scholarships</a>
            <a href="#success-stories" onClick={() => scrollToSection('success-stories')}>Success Stories</a>
            <a href="#resources" onClick={() => scrollToSection('resources')}>Resources</a>
          </nav>

          <button className="navbar-cta" onClick={onGetStarted}>
            <span>Get Started</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26H21.77L16.84 12.45L19.93 18.74L12 14.55L4.07 18.74L7.16 12.45L2.23 8.26H8.91L12 2Z"/>
                </svg>
                <span>AI-Powered Scholarship Matching</span>
              </div>

              <h1 className="hero-title">
                Unlock Your Academic Future with <span className="text-primary">Techsari Zawadi</span>
              </h1>

              <p className="hero-description">
                Discover, track, and apply to global scholarships with intelligent matching and automated document tools designed specifically for African excellence.
              </p>

              <div className="hero-buttons">
                <button className="btn btn-primary" onClick={onGetStarted}>
                  <span>Start Your Journey</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <button className="btn btn-secondary" onClick={() => scrollToSection('how-it-works')}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>See How it Works</span>
                </button>
              </div>

              <div className="hero-trust">
                <p className="trust-label">TRUSTED BY STUDENTS AT TOP INSTITUTIONS</p>
                <div className="trust-logos">
                  <span className="logo-text-large">OXFORD</span>
                  <span className="logo-text-serif">Harvard</span>
                  <span className="logo-text-bold">MIT</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-image-container">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop"
                  alt="African female student"
                  className="hero-image"
                />
                <div className="floating-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="card-title">Rhodes Scholarship</h4>
                      <p className="card-match">98% Match</p>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '98%' }}></div>
                  </div>
                  <p className="card-status">
                    <span>Application Ready</span>
                    <span className="status-action">Auto-fill →</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section" id="how-it-works">
          <div className="features-container">
            <div className="features-header">
              <h2 className="section-title">
                Intelligent Tools for <span className="text-primary">Global Excellence</span>
              </h2>
              <p className="section-description">
                Our AI-driven platform streamlines the complex application process, giving you the competitive edge needed to secure top-tier global scholarships.
              </p>
            </div>

            <div className="features-grid">
              {/* Feature 1: Smart Matching (Featured) */}
              <div className="feature-card feature-featured">
                <div className="feature-content">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </div>
                  <h3 className="feature-title">Smart Scholarship Matching</h3>
                  <p className="feature-description">
                    Advanced profile-based matching with 0-100% precision scores. Find your perfect fit based on country, degree, and field.
                  </p>
                  <div className="feature-tags">
                    <span className="tag">98% Precision</span>
                    <span className="tag">African Context</span>
                  </div>
                </div>
                <div className="feature-mockup">
                  <div className="mockup-content">
                    <div className="mockup-line"></div>
                    <div className="mockup-line short"></div>
                    <div className="mockup-highlight">Match Found: 98%</div>
                    <div className="mockup-line medium"></div>
                  </div>
                </div>
              </div>

              {/* Feature 2: Track Applications */}
              <div className="feature-card">
                <div className="feature-icon secondary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
                <h3 className="feature-title">Track Every Application</h3>
                <p className="feature-description">
                  8-stage pipeline from "Not Started" to "Awarded." Manage priorities seamlessly.
                </p>
              </div>

              {/* Feature 3: AI Essays */}
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                </div>
                <h3 className="feature-title">AI-Powered Essays</h3>
                <p className="feature-description">
                  Craft winning personal statements with our Draft, Critique, and Polish scout.
                </p>
              </div>

              {/* Feature 4: Documents */}
              <div className="feature-card">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                  </svg>
                </div>
                <h3 className="feature-title">Centralized Documents</h3>
                <p className="feature-description">
                  Secure vault for transcripts and certificates with built-in gap analysis.
                </p>
              </div>

              {/* Feature 5: Auto-Apply */}
              <div className="feature-card">
                <div className="feature-icons-dual">
                  <div className="icon-small">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 3H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V9l-6-6z"/>
                    </svg>
                  </div>
                  <div className="icon-small secondary">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="feature-title">Auto-Apply & Daily Bot</h3>
                <p className="feature-description">
                  One-click batch applications and an AI bot that verifies African eligibility daily.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section" id="success-stories">
          <div className="testimonials-container">
            <div className="testimonials-header">
              <h2 className="section-title">
                Success Stories from <span className="text-primary">African Scholars</span>
              </h2>
            </div>

            <div className="testimonials-grid">
              {[
                {
                  name: 'Amara K., Kenya',
                  role: 'Chevening Scholar',
                  text: 'Zawadi\'s AI matching found a scholarship I didn\'t even know existed. The essay scout helped me structure my thoughts perfectly, and now I\'m studying at my dream university!',
                  initials: 'AK',
                  color: 'primary'
                },
                {
                  name: 'David M., Nigeria',
                  role: 'Mastercard Foundation',
                  text: 'The document vault and auto-fill saved me countless hours. I applied to ten different programs in the time it used to take me to do one. It\'s a game-changer.',
                  initials: 'DM',
                  color: 'secondary'
                },
                {
                  name: 'Sarah T., South Africa',
                  role: 'Rhodes Trust Scholar',
                  text: 'I struggled with SOPs until I used the AI essay scout. It didn\'t write it for me, but it guided me to tell my story in a way that resonated with the selection committee.',
                  initials: 'ST',
                  color: 'tertiary'
                }
              ].map((testimonial, index) => (
                <div key={index} className="testimonial-card">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <div className={`author-avatar avatar-${testimonial.color}`}>
                      {testimonial.initials}
                    </div>
                    <div>
                      <h4 className="author-name">{testimonial.name}</h4>
                      <p className="author-role">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer" id="resources">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg className="logo-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="logo-text">Techsari Zawadi</span>
              </div>
              <p className="footer-mission">
                Empowering African excellence through AI-driven scholarship matching and application tools.
              </p>
              <div className="footer-socials">
                <a href="#" title="Website">🌐</a>
                <a href="#" title="Share">📤</a>
                <a href="#" title="Instagram">📷</a>
              </div>
            </div>

            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><a href="#scholarships">Scholarships</a></li>
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#">Application Tracker</a></li>
                <li><a href="#success-stories">Success Stories</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Scholarship Guide</a></li>
                <li><a href="#">University Partners</a></li>
                <li><a href="#">Help Center</a></li>
              </ul>
            </div>

            <div className="footer-newsletter">
              <h4>Stay Updated</h4>
              <p>Get notified of new scholarships daily.</p>
              <form className="newsletter-form">
                <input type="email" placeholder="Enter email" required />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2024 Techsari Zawadi. Empowering African Excellence.</p>
            <nav className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Contact Us</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
