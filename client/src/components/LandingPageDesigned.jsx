import React from "react";
import { ArrowRight, Sparkles, CheckCircle, Search, FileText, BookOpen, Clock, Shield, Star, Zap } from "lucide-react";

export default function LandingPageDesigned({ onGetStarted, onLogin }) {
  return (
    <div style={{ background: "#f8f9ff", minHeight: "100vh" }}>
      {/* Top Navigation */}
      <header style={{
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 50,
        background: "rgba(248, 249, 255, 0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(191, 201, 195, 0.3)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2.5rem",
          maxWidth: "1280px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          {/* Logo */}
          <a href="#" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{
              width: "32px",
              height: "32px",
              background: "#064e3b",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white"
            }}>
              <Sparkles size={20} />
            </div>
            <span style={{ fontSize: "20px", fontWeight: "600", color: "#003527" }}>Techsari Zawadi</span>
          </a>

          {/* Desktop Nav */}
          <nav style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            <a href="#how-it-works" style={{ fontSize: "14px", color: "#404944", textDecoration: "none", cursor: "pointer", transition: "color 0.3s" }}>How it Works</a>
            <a href="#scholarships" style={{ fontSize: "14px", color: "#404944", textDecoration: "none", cursor: "pointer", transition: "color 0.3s" }}>Scholarships</a>
            <a href="#success-stories" style={{ fontSize: "14px", color: "#404944", textDecoration: "none", cursor: "pointer", transition: "color 0.3s" }}>Success Stories</a>
            <a href="#resources" style={{ fontSize: "14px", color: "#404944", textDecoration: "none", cursor: "pointer", transition: "color 0.3s" }}>Resources</a>
          </nav>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <button onClick={onLogin} style={{
              background: "none",
              border: "none",
              padding: "10px 24px",
              fontSize: "14px",
              cursor: "pointer",
              color: "#064e3b",
              transition: "opacity 0.3s"
            }}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main style={{ paddingTop: "88px" }}>
        {/* Hero Section */}
        <section style={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 40px",
          backgroundImage: `radial-gradient(at 100% 0%, rgba(6, 78, 59, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(217, 119, 6, 0.1) 0px, transparent 50%)`
        }}>
          <div style={{ maxWidth: "1280px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
            {/* Left: Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "560px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "white",
                border: "1px solid rgba(191, 201, 195, 0.5)",
                borderRadius: "99px",
                padding: "12px 16px",
                width: "fit-content"
              }}>
                <Sparkles size={16} style={{ color: "#fe932c" }} />
                <span style={{ fontSize: "12px", letterSpacing: "0.01em", fontWeight: "500", color: "#404944" }}>AI-Powered Scholarship Matching</span>
              </div>

              <h1 style={{
                fontSize: "48px",
                fontWeight: "800",
                lineHeight: "1.1",
                letterSpacing: "-0.02em",
                color: "#0b1c30",
                maxWidth: "500px"
              }}>
                Unlock Your Academic Future with <span style={{ color: "#003527" }}>Techsari Zawadi</span>
              </h1>

              <p style={{
                fontSize: "18px",
                fontWeight: "400",
                lineHeight: "28px",
                color: "#404944",
                maxWidth: "90%"
              }}>
                Discover, track, and apply to global scholarships with intelligent matching and automated document tools designed specifically for African excellence.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px", width: "100%" }}>
                <button onClick={onGetStarted} style={{
                  background: "#fe932c",
                  color: "#2f1500",
                  border: "none",
                  padding: "14px 32px",
                  borderRadius: "99px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 12px rgba(254, 147, 44, 0.3)",
                  transition: "all 0.3s"
                }}>
                  Start Your Journey
                  <ArrowRight size={20} />
                </button>
                <button onClick={onLogin} style={{
                  background: "white",
                  color: "#0b1c30",
                  border: "1px solid #707974",
                  padding: "14px 32px",
                  borderRadius: "99px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.3s"
                }}>
                  See How it Works
                </button>
              </div>

              {/* Trust Indicators */}
              <div style={{
                marginTop: "32px",
                paddingTop: "32px",
                borderTop: "1px solid rgba(191, 201, 195, 0.3)",
                width: "100%"
              }}>
                <p style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "0.05em", color: "#707974", marginBottom: "16px" }}>
                  TRUSTED BY STUDENTS AT TOP INSTITUTIONS
                </p>
                <div style={{ display: "flex", gap: "24px", opacity: "0.6", filter: "grayscale(100%)" }}>
                  <span style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.02em" }}>OXFORD</span>
                  <span style={{ fontSize: "24px", fontFamily: "serif", fontStyle: "italic" }}>Harvard</span>
                  <span style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "0.1em" }}>MIT</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(191, 201, 195, 0.2)",
              boxShadow: "0 20px 60px -10px rgba(0, 53, 39, 0.15)",
              background: "linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(254, 147, 44, 0.2) 100%)"
            }}>
              <img
                alt="African student smiling with tablet on campus"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkIv7oiOIaZROIhbGQxPNzKsO33zI0Z0g593OxZJ16LOzWD9zDTE-lEgEMPubRFPwko3TYd65Qyi4AOLc_PrcvOJOU_-pLkWCr173-QyBrvnMoPXcjcwMrnKNvrms8U4KUAI5KVt9JHEmauXm-NVrjWGfT-pZ8vUMQx21cs0z6G5pwCf_bSjav83HhgFY8gGOzE8mwvIvH_dPWBeszTbo8GPozGGadF_Kx4lbAwAyO1hFUjNBmligwUzSBQVhKEoIYIDJN6RiVTeSL"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {/* Floating Glass UI Card */}
              <div style={{
                position: "absolute",
                bottom: "24px",
                left: "24px",
                right: "24px",
                background: "rgba(248, 249, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(191, 201, 195, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#064e3b",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#0b1c30", margin: "0 0 4px 0" }}>Rhodes Scholarship</h4>
                    <p style={{ fontSize: "12px", color: "#fe932c", fontWeight: "600", margin: 0 }}>98% Match</p>
                  </div>
                </div>
                <div style={{
                  width: "100%",
                  height: "6px",
                  background: "#d3e4fe",
                  borderRadius: "3px",
                  marginBottom: "8px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: "98%",
                    height: "100%",
                    background: "#fe932c",
                    borderRadius: "3px"
                  }} />
                </div>
                <p style={{ fontSize: "12px", color: "#404944", display: "flex", justifyContent: "space-between", margin: 0 }}>
                  <span>Application Ready</span>
                  <span style={{ color: "#003527", fontWeight: "600" }}>Auto-fill →</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section style={{
          padding: "64px 40px",
          background: "white"
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "64px", maxWidth: "768px", margin: "0 auto 64px" }}>
              <h2 style={{
                fontSize: "32px",
                fontWeight: "700",
                lineHeight: "40px",
                letterSpacing: "-0.01em",
                color: "#0b1c30",
                marginBottom: "24px"
              }}>
                The System Isn't Built for Us. <span style={{ color: "#003527" }}>We Understand Your Journey.</span>
              </h2>
              <p style={{
                fontSize: "18px",
                fontWeight: "400",
                lineHeight: "28px",
                color: "#404944"
              }}>
                Applying for global scholarships as an African student comes with unique roadblocks. We built Zawadi because we've been there.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px"
            }}>
              {[
                { percent: "70%", text: "of scholarship search results are irrelevant to African students" },
                { percent: "40%", text: "of students miss deadlines because of poor tracking" },
                { icon: FileText, text: "Most students submit generic essays because they can't write unique ones for every application" },
                { percent: "500+", text: "websites where scholarship information is scattered and hard to verify" }
              ].map((item, i) => (
                <div key={i} style={{
                  background: "white",
                  border: "1px solid rgba(6, 78, 59, 0.2)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{
                    position: "absolute",
                    right: "-16px",
                    top: "-16px",
                    width: "96px",
                    height: "96px",
                    background: "rgba(6, 78, 59, 0.05)",
                    borderRadius: "50%",
                    filter: "blur(40px)"
                  }} />
                  {item.percent && (
                    <div style={{
                      fontSize: "48px",
                      fontWeight: "800",
                      lineHeight: "1.1",
                      letterSpacing: "-0.02em",
                      color: "#003527",
                      marginBottom: "16px"
                    }}>
                      {item.percent}
                    </div>
                  )}
                  <p style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    lineHeight: "24px",
                    color: "#404944"
                  }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{
          padding: "64px 40px",
          background: "#eff4ff"
        }} id="how-it-works">
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "64px", maxWidth: "768px", margin: "0 auto 64px" }}>
              <h2 style={{
                fontSize: "32px",
                fontWeight: "700",
                lineHeight: "40px",
                letterSpacing: "-0.01em",
                color: "#0b1c30",
                marginBottom: "16px"
              }}>
                Intelligent Tools for <span style={{ color: "#003527" }}>Global Excellence</span>
              </h2>
              <p style={{
                fontSize: "16px",
                fontWeight: "400",
                lineHeight: "24px",
                color: "#404944"
              }}>
                Our AI-driven platform streamlines the complex application process, giving you the competitive edge needed to secure top-tier global scholarships.
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px"
            }}>
              {[
                { icon: Search, title: "Africa-first matching", desc: "We only show scholarships that accept applicants from your country. No more wasting time on ineligible listings." },
                { icon: Sparkles, title: "AI essay generator", desc: "Get a solid first draft of your statement of purpose or motivation letter in seconds, tailored to each scholarship." },
                { icon: Clock, title: "Deadline intelligence", desc: "Color-coded urgency, push notifications, and countdowns so you never submit late." },
                { icon: FileText, title: "Document vault", desc: "Upload once, reuse everywhere. Track which documents each application needs and what's missing." },
                { icon: BookOpen, title: "Application tracker", desc: "Move each application through stages: Not started → Drafting → Ready → Applied → Awarded." },
                { icon: Shield, title: "Document intelligence", desc: "AI reviews your CV and transcripts, flags gaps, and suggests improvements before you apply." }
              ].map((feature, i) => (
                <div key={i} style={{
                  background: "white",
                  border: "1px solid rgba(191, 201, 195, 0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#064e3b",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px"
                  }}>
                    <feature.icon size={24} />
                  </div>
                  <h3 style={{ fontSize: "24px", fontWeight: "600", lineHeight: "32px", color: "#0b1c30", marginBottom: "12px" }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: "16px", fontWeight: "400", lineHeight: "24px", color: "#404944" }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section style={{
          padding: "64px 40px",
          background: "white",
          textAlign: "center"
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(6, 78, 59, 0.15) 0%, rgba(254, 147, 44, 0.1) 100%)",
            border: "1px solid rgba(191, 201, 195, 0.2)",
            borderRadius: "16px",
            padding: "48px 40px",
            maxWidth: "700px",
            margin: "0 auto"
          }}>
            <Zap size={28} style={{ margin: "0 auto 16px", color: "#003527" }} />
            <h2 style={{
              fontSize: "32px",
              fontWeight: "700",
              lineHeight: "40px",
              color: "#0b1c30",
              marginBottom: "16px"
            }}>
              Ready to find your scholarship?
            </h2>
            <p style={{
              fontSize: "18px",
              fontWeight: "400",
              lineHeight: "28px",
              color: "#404944",
              marginBottom: "24px"
            }}>
              Join thousands of African students using Techsari's Zawadi portal to discover, track, and apply for scholarships that match their profile.
            </p>
            <button onClick={onGetStarted} style={{
              background: "#fe932c",
              color: "#2f1500",
              border: "none",
              padding: "14px 32px",
              borderRadius: "99px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(254, 147, 44, 0.3)",
              transition: "all 0.3s"
            }}>
              Get started for free
              <ArrowRight size={18} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          background: "#0b1c30",
          color: "white",
          padding: "64px 40px 32px",
          borderTop: "1px solid rgba(191, 201, 195, 0.1)"
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "48px",
              marginBottom: "32px"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: "#003527",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white"
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <strong>Techsari — Zawadi</strong>
                    <div style={{ fontSize: "12px", opacity: "0.8" }}>Scholarship Portal</div>
                  </div>
                </div>
                <p style={{ fontSize: "14px", lineHeight: "1.6", opacity: "0.8" }}>
                  An AI-powered scholarship matching and application management platform built for African students. Your scholarship journey from discovery to acceptance.
                </p>
              </div>
              <div>
                <h4 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>Product</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>Features</a></li>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>Pricing</a></li>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>How it works</a></li>
                </ul>
              </div>
              <div>
                <h4 style={{ marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>Resources</h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>Scholarship guide</a></li>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>Essay tools</a></li>
                  <li><a href="#" style={{ color: "inherit", textDecoration: "none", opacity: "0.8", fontSize: "14px", display: "block", marginBottom: "8px" }}>FAQ</a></li>
                </ul>
              </div>
            </div>
            <div style={{
              paddingTop: "32px",
              borderTop: "1px solid rgba(191, 201, 195, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "14px",
              opacity: "0.7"
            }}>
              <span>© 2026 Techsari. All rights reserved.</span>
              <span>Built for African students everywhere.</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
