import React from "react";
import {
  GraduationCap,
  Check,
  Sparkles,
  Search,
  FileCheck,
  ShieldCheck,
  Star,
  Zap,
  ArrowRight,
  CircleDollarSign,
  BookOpen,
  FileText,
  Clock3,
} from "lucide-react";

const tiers = [
  {
    id: "free",
    name: "Explorer",
    price: "Free",
    period: "forever",
    badge: "Free",
    description: "Scholarship discovery and basic application tracking.",
    features: [
      "Open scholarship database",
      "Basic country, level and field filters",
      "Unlimited application tracking",
      "3 document records",
      "3 AI essays per day",
      "Weekly in-app updates",
    ],
    cta: "Start Free",
    accent: false,
  },
  {
    id: "plus",
    name: "Scholar Plus",
    price: "$5",
    period: "per month",
    badge: "Best value",
    description: "Premium matching and deadline control for active applicants.",
    features: [
      "Unlimited application tracking",
      "Premium filters",
      "Smart match score",
      "Document gap analysis",
      "15 AI essays/day",
      "20 auto-applies/day",
      "Document intelligence analysis",
    ],
    cta: "Get Scholar Plus",
    accent: true,
  },
  {
    id: "pro",
    name: "Application Pro",
    price: "$12",
    period: "per month",
    badge: "Power user",
    description: "For applicants managing many countries, schools and deadlines.",
    features: [
      "Everything in Scholar Plus",
      "50 AI essays/day",
      "100 auto-applies/day",
      "Priority urgency feed",
      "Advanced school filters",
      "CSV exports and intake tools",
    ],
    cta: "Go Pro",
    accent: false,
  },
];

const steps = [
  {
    icon: <Search size={24} />,
    step: "01",
    title: "Sign Up in Seconds",
    description:
      "Create your free profile — tell us your country, degree, and field of study. We use that to find scholarships you're actually eligible for.",
  },
  {
    icon: <Sparkles size={24} />,
    step: "02",
    title: "Match with Scholarships",
    description:
      "Our AI scans hundreds of opportunities and shows you the ones that fit your profile, with match scores so you know which ones to prioritize.",
  },
  {
    icon: <FileCheck size={24} />,
    step: "03",
    title: "Apply with Confidence",
    description:
      "Track deadlines, generate essays, upload documents, and manage every application from one dashboard. No more spreadsheets, no more missed deadlines.",
  },
];

const testimonials = [
  {
    quote:
      "I applied to 14 scholarships in one season and won 3. Techsari's tracker and essay generator saved me dozens of hours.",
    name: "Amina W.",
    role: "MSc Data Science · University of Cape Town",
    country: "Kenya",
  },
  {
    quote:
      "Before Zawadi I was overwhelmed trying to track deadlines across different websites. Now I have one dashboard for everything. Game changer.",
    name: "Kwame A.",
    role: "BSc Computer Science · Ashesi University",
    country: "Ghana",
  },
  {
    quote:
      "The AI essay generator helped me craft a statement of purpose that got me a fully-funded Masters. Worth every cent of Scholar Plus.",
    name: "Fatima O.",
    role: "MSc Public Health · University of Toronto",
    country: "Nigeria",
  },
];

export default function LandingPage({ onGetStarted, onLogin }) {
  return (
    <div className="landing-root" id="top">
      {/* ── NAV ─────────────────────────────────────────────── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <a href="#top" className="landing-logo" aria-label="Techsari Zawadi home">
            <div className="brand-mark" aria-hidden="true">
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>Techsari — Zawadi</strong>
              <span>Scholarship Portal</span>
            </div>
          </a>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="landing-nav-actions">
            <button className="ghost-btn" type="button" onClick={onLogin}>
              Sign in
            </button>
            <button className="primary-btn" type="button" onClick={onGetStarted}>
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <span className="eyebrow">For African Students</span>
            <h1>
              Find scholarships you're
              <em> actually eligible for</em>
            </h1>
            <p>
              Zawadi scans hundreds of funding opportunities, matches them to your
              profile, and helps you apply — all from one dashboard. Stop chasing
              dead ends. Start winning scholarships.
            </p>
            <div className="landing-hero-actions">
              <button className="primary-btn large" type="button" onClick={onGetStarted}>
                Start finding scholarships
                <ArrowRight size={18} />
              </button>
              <button className="ghost-btn" type="button" onClick={onLogin}>
                I already have an account
              </button>
            </div>
            <div className="landing-hero-stats">
              <div>
                <strong>500+</strong>
                <span>Scholarships tracked</span>
              </div>
              <div>
                <strong>89%</strong>
                <span>Match accuracy</span>
              </div>
              <div>
                <strong>30+</strong>
                <span>African countries</span>
              </div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <div className="glass-panel hero-card">
              <div className="mini-top">
                <Sparkles size={18} />
                <span>Top match for you</span>
              </div>
              <strong>94%</strong>
              <p>Masters in Data Science — fully funded, open to African applicants.</p>
              <div className="tag-row">
                <em>Africa eligible</em>
                <em>Full funding</em>
                <em>No GRE</em>
              </div>
            </div>
            <div className="hero-stats-panel">
              {[
                ["Scholarships", "512"],
                ["Matches today", "27"],
                ["Essays generated", "1,840"],
                ["Deadlines tracked", "806"],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="landing-section" id="features">
        <div className="landing-section-intro">
          <span className="eyebrow">Why Zawadi</span>
          <h2>Built for African scholarship applicants</h2>
          <p>
            Traditional scholarship search engines don't filter for African
            eligibility. Zawadi does — so every match is a real opportunity.
          </p>
        </div>
        <div className="landing-features-grid">
          {[
            {
              icon: <Search size={20} />,
              title: "Africa-first matching",
              desc: "We only show scholarships that accept applicants from your country. No more wasting time on ineligible listings.",
            },
            {
              icon: <Sparkles size={20} />,
              title: "AI essay generator",
              desc: "Get a solid first draft of your statement of purpose or motivation letter in seconds, tailored to each scholarship.",
            },
            {
              icon: <Clock3 size={20} />,
              title: "Deadline intelligence",
              desc: "Color-coded urgency, push notifications, and countdowns so you never submit late.",
            },
            {
              icon: <FileText size={20} />,
              title: "Document vault",
              desc: "Upload once, reuse everywhere. Track which documents each application needs and what's missing.",
            },
            {
              icon: <BookOpen size={20} />,
              title: "Application tracker",
              desc: "Move each application through stages: Not started → Drafting → Ready → Applied → Awarded.",
            },
            {
              icon: <ShieldCheck size={20} />,
              title: "Document intelligence",
              desc: "AI reviews your CV and transcripts, flags gaps, and suggests improvements before you apply.",
            },
          ].map((f) => (
            <article key={f.title} className="landing-feature-card">
              <div className="metric-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="landing-section landing-alt" id="how-it-works">
        <div className="landing-section-intro">
          <span className="eyebrow">How it works</span>
          <h2>Three steps from profile to application</h2>
          <p>No complicated setup. Create your profile, get matches, and apply.</p>
        </div>
        <div className="landing-steps-grid">
          {steps.map((s) => (
            <div key={s.step} className="landing-step">
              <div className="landing-step-icon">
                {s.icon}
                <span className="landing-step-num">{s.step}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
        <div className="landing-cta-center">
          <button className="primary-btn large" type="button" onClick={onGetStarted}>
            Create your free profile
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section className="landing-section" id="pricing">
        <div className="landing-section-intro">
          <span className="eyebrow">Pricing</span>
          <h2>Start free. Upgrade when you're ready.</h2>
          <p>
            Keep discovery free, then upgrade monthly when you need more AI,
            filters, and application automation.
          </p>
        </div>
        <div className="landing-pricing-grid">
          {tiers.map((tier) => (
            <article
              key={tier.id}
              className={`price-card landing-price-card ${tier.accent ? "featured" : ""}`}
            >
              <span className="plan-badge">{tier.badge}</span>
              <h3>{tier.name}</h3>
              <p>{tier.description}</p>
              <div className="landing-price-row">
                <strong className="price">{tier.price}</strong>
                <span className="price-note">{tier.period}</span>
              </div>
              <ul>
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                className={tier.accent ? "primary-btn full" : tier.id === "free" ? "ghost-btn full" : "secondary-btn full"}
                type="button"
                onClick={onGetStarted}
              >
                {tier.id === "free" ? (
                  <>
                    <Check size={16} />
                    {tier.cta}
                  </>
                ) : (
                  <>
                    <CircleDollarSign size={16} />
                    {tier.cta}
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section className="landing-section landing-alt">
        <div className="landing-section-intro">
          <span className="eyebrow">Testimonials</span>
          <h2>Trusted by students across Africa</h2>
          <p>
            Hear from students who used Zawadi to find and win scholarships.
          </p>
        </div>
        <div className="landing-testimonials-grid">
          {testimonials.map((t) => (
            <blockquote key={t.name} className="landing-testimonial glass-panel">
              <div className="landing-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="var(--gold)" color="var(--gold)" />
                ))}
              </div>
              <p>"{t.quote}"</p>
              <footer>
                <div className="landing-testimonial-author">
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                  <span className="landing-country">{t.country}</span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="glass-panel landing-cta-panel">
          <Zap size={28} />
          <h2>Ready to find your scholarship?</h2>
          <p>
            Join thousands of African students using Techsari's Zawadi portal to
            discover, track, and apply for scholarships that match their profile.
          </p>
          <div className="landing-hero-actions">
            <button className="primary-btn large" type="button" onClick={onGetStarted}>
              Get started for free
              <ArrowRight size={18} />
            </button>
            <button className="ghost-btn" type="button" onClick={onLogin}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <a href="#top" className="landing-logo" aria-label="Techsari Zawadi">
              <div className="brand-mark" aria-hidden="true">
                <GraduationCap size={20} />
              </div>
              <div>
                <strong>Techsari — Zawadi</strong>
                <span>Scholarship Portal</span>
              </div>
            </a>
            <p>
              An AI-powered scholarship matching and application management
              platform built for African students. Your scholarship journey — from
              discovery to acceptance, all in one place.
            </p>
          </div>
          <div className="landing-footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="landing-footer-col">
            <h4>Resources</h4>
            <a href="#how-it-works">Scholarship guide</a>
            <a href="#features">Essay tools</a>
            <a href="#pricing">FAQ</a>
          </div>
          <div className="landing-footer-col">
            <h4>Company</h4>
            <a href="#features">About Techsari</a>
            <a href="mailto:hello@techsari.africa">Contact</a>
            <a href="#pricing">Plans and privacy</a>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Techsari. All rights reserved.</span>
          <span>Built for African students everywhere.</span>
        </div>
      </footer>
    </div>
  );
}
