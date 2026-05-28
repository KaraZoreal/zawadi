import React from "react";
import { ChevronRight, ArrowRight, Check, Star } from "lucide-react";
import "./LandingPageNew.css";

const COUNTRIES_BY_LANGUAGE = {
  "Anglophone": [
    "Botswana", "Eswatini", "Gambia", "Ghana", "Kenya", "Lesotho", 
    "Liberia", "Malawi", "Mauritius", "Namibia", "Nigeria", "Rwanda", 
    "Seychelles", "Sierra Leone", "South Africa", "South Sudan", "Tanzania", 
    "Uganda", "Zambia", "Zimbabwe"
  ],
  "Francophone": [
    "Benin", "Burkina Faso", "Burundi", "Cameroon", "Central African Republic",
    "Chad", "Congo", "Côte d'Ivoire", "DR Congo", "Equatorial Guinea", "Gabon",
    "Guinea", "Guinea-Bissau", "Mali", "Niger", "Senegal", "Togo"
  ],
  "Arabophone": [
    "Algeria", "Comoros", "Djibouti", "Egypt", "Eritrea", "Libya", "Mauritania", "Morocco", "Sudan", "Tunisia"
  ],
  "Lusophone": [
    "Angola", "Cape Verde", "Mozambique", "Sao Tome and Principe"
  ],
  "Bilingual": [
    "Somali Region", "Berber & Arabic regions"
  ]
};

export default function LandingPageNew({ onGetStarted, onLogin }) {
  const [activeTab, setActiveTab] = React.useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Amara K.",
      country: "Kenya",
      quote: "Zawadi's AI matching found a scholarship I didn't even know existed. The essay scout helped me structure my thoughts perfectly, and now I'm studying at my dream university!",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      badge: "3.8 GPA Student"
    },
    {
      id: 2,
      name: "Amir B.",
      country: "Egypt",
      quote: "As an engineering student, finding scholarships that matched my specific interests seemed impossible. Zawadi understood my profile and saved me weeks of research.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      badge: "Engineering Major"
    },
    {
      id: 3,
      name: "Sarah J.",
      country: "Nigeria",
      quote: "The AI essay analysis is incredible. It gave me specific feedback that helped me improve my writing. I've gotten three scholarship offers already!",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      badge: "Medical Student"
    }
  ];

  const faqs = [
    {
      question: "Is Zawadi really free?",
      answer: "Yes! Zawadi's core scholarship matching is completely free. We offer premium plans with additional features like AI essay generation and advanced filtering."
    },
    {
      question: "How do you find scholarships?",
      answer: "We continuously scan global scholarship databases, university websites, and funding organizations. Our AI then matches them to your profile using your country, field, and academic level."
    },
    {
      question: "Which countries do you cover?",
      answer: "We cover all 54 African countries with region-specific scholarships. Our recommendation system understands language groups, educational systems, and local opportunities."
    },
    {
      question: "How do I pay?",
      answer: "We accept international payment methods including Paystack, cards, and bank transfers. Premium plans start from just $5/month for serious applicants."
    },
    {
      question: "Is my data safe?",
      answer: "Absolutely. We use enterprise-grade encryption with Supabase and never share your data with third parties. Your documents stay private and secure."
    }
  ];

  const stats = [
    { number: "70%", label: "of scholars save 15+ hours applying" },
    { number: "40%", label: "of students have disabilities but can get funding" },
    { number: "👁️", label: "Most scholars submit generic essays (they can't win yet)" },
    { number: "500+", label: "websites where scholarship information is scattered" }
  ];

  const features = [
    {
      icon: "🎯",
      title: "Smart Scholarship Matching",
      description: "Advanced AI profile matching with 50+ precision indicators. Understands different African educational systems and regional opportunities."
    },
    {
      icon: "📊",
      title: "Track Every Application",
      description: "Centralized dashboard to manage all scholarship applications. Track progress, manage documents, and stay organized end-to-end."
    },
    {
      icon: "✍️",
      title: "AI-Powered Essays",
      description: "Get essay scout assistance with structured outlines and personalized suggestions. Language support for English, French, Arabic and more."
    },
    {
      icon: "📄",
      title: "Centralized Documents",
      description: "Secure cloud storage for all your documents. Auto-fill applications with your CVs, transcripts, and certificates."
    },
    {
      icon: "🤖",
      title: "Auto-Apply & Daily Bot",
      description: "Automated application submission for matching scholarships. Daily updates on new opportunities tailored to your profile."
    },
    {
      icon: "💡",
      title: "Document Intelligence",
      description: "AI analysis of transcripts and documents. Get insights on how to improve your academic profile and eligibility."
    }
  ];

  return (
    <div className="landing-page-new">
      {/* Navigation Header */}
      <header className="nav-header">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo-section">
              <div className="logo-mark">T</div>
              <span className="logo-text">Techsari Zawadi</span>
            </div>
          </div>
          <nav className="nav-links">
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#faq" className="nav-link">Resources</a>
          </nav>
          <div className="nav-right">
            <button 
              className="nav-btn secondary-btn"
              onClick={onLogin}
            >
              Log in
            </button>
            <button 
              className="nav-btn primary-btn"
              onClick={onGetStarted}
            >
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>✨</span> AI-Powered Scholarship Matching
            </div>
            <h1 className="hero-title">
              Unlock Your Academic<br />Future with Techsari<br />Zawadi
            </h1>
            <p className="hero-subtitle">
              Discover, apply to, and win scholarships across African universities and beyond. Our AI understands your profile and matches you with opportunities designed specifically for you.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={onGetStarted}>
                Start Your Journey
                <ArrowRight size={20} />
              </button>
              <button className="btn btn-secondary">
                <span>▶</span> See it in action
              </button>
            </div>
            <div className="hero-logos">
              <span className="logo-label">Trusted by scholars from</span>
              <div className="logos">
                <div className="logo-item">Oxford</div>
                <div className="logo-item">Harvard</div>
                <div className="logo-item">MIT</div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-card">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop" 
                alt="Student success story"
              />
              <div className="card-overlay">
                <div className="card-badge">🎓 Awarded Scholar</div>
                <p className="card-text">Just received full scholarship to study STEM</p>
                <p className="card-time">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Your Journey */}
      <section className="journey-section">
        <div className="section-container">
          <div className="section-header">
            <h2>The System Isn't Built For Us.<br />We Understand Your Journey.</h2>
            <p>Applying for scholarships as an African student comes with unique challenges. We built Zawadi to understand these obstacles and help you win the opportunities you deserve.</p>
          </div>
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Intelligent Tools for Global Excellence</h2>
            <p>Our AI-driven ecosystem simplifies the complex application process, giving you competitive edge from discovery to acceptance.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Success Stories from African Scholars</h2>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-header">
                  <img src={testimonial.image} alt={testimonial.name} />
                  <div className="testimonial-meta">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.country} · {testimonial.badge}</p>
                  </div>
                </div>
                <blockquote className="testimonial-quote">
                  "{testimonial.quote}"
                </blockquote>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="star-filled" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Simple Pricing for Every Scholar</h2>
            <p>Choose the plan that matches your scholarship goals</p>
          </div>
          <div className="pricing-grid">
            {[
              {
                name: "Explorer",
                price: "Free",
                description: "Perfect for discovering scholarships",
                features: ["Open scholarship database", "Basic filters", "Profile matching", "Email alerts"]
              },
              {
                name: "Scholar Plus",
                price: "$5/mo",
                description: "For serious applicants",
                features: ["Everything in Explorer", "AI essay assistance", "Document analysis", "Priority support", "15 AI essays/month"],
                highlighted: true
              },
              {
                name: "Pro",
                price: "$15/mo",
                description: "Full competitive suite",
                features: ["Everything in Plus", "Unlimited AI essays", "Auto-apply feature", "50+ documents", "Strategy insights"]
              },
              {
                name: "Mentor",
                price: "$50/mo",
                description: "1-on-1 mentorship",
                features: ["Everything in Pro", "Personal mentor", "Interview prep", "Custom strategy", "Unlimited everything"]
              }
            ].map((plan, idx) => (
              <div key={idx} className={`pricing-card ${plan.highlighted ? "highlighted" : ""}`}>
                {plan.highlighted && <div className="badge-top">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="price">{plan.price}</div>
                <p className="plan-description">{plan.description}</p>
                <button className={plan.highlighted ? "btn btn-primary" : "btn btn-secondary"}>
                  Get Started
                </button>
                <ul className="features-list">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx}>
                      <Check size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="faq-grid">
            {faqs.map((faq, idx) => (
              <div key={idx} className="faq-item">
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <ChevronRight size={20} />
                </div>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <h2>Ready to Find Your Perfect Scholarship?</h2>
          <p>Join thousands of African scholars already discovering opportunities with Zawadi</p>
          <button className="btn btn-primary btn-large" onClick={onGetStarted}>
            Get Started for Free
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="logo-mark">T</div>
                <span>Techsari Zawadi</span>
              </div>
              <p>Empowering African scholars to access global opportunities through intelligent scholarship matching and application tools.</p>
            </div>
            <div className="footer-section">
              <h5>Platform</h5>
              <ul>
                <li><a href="#features">Scholarships</a></li>
                <li><a href="#features">How it Works</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">FAQ</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>Resources</h5>
              <ul>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#guides">Guides</a></li>
                <li><a href="#community">Community</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>Legal</h5>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Techsari Zawadi. All rights reserved. Empowering African excellence globally.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
