// src/pages/Home/Home.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../../components/Navbar/PublicNavbar";
import {
  ArrowDownward as ArrowDownwardIcon,
  PlayArrow as PlayArrowIcon,
  Star as StarIcon,
  Group as GroupIcon,
  Agriculture as AgricultureIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import "./Home.css";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { number: "5000+", label: "Farmers Registered", icon: GroupIcon },
    { number: "12000+", label: "Jobs Completed", icon: AgricultureIcon },
    { number: "95%", label: "Success Rate", icon: TrendingUpIcon },
    { number: "4.8/5", label: "User Rating", icon: StarIcon },
  ];

  const features = [
    {
      icon: AgricultureIcon,
      title: "Smart Job Matching",
      description:
        "AI-powered matching connects farmers with skilled labourers based on location, skills, and requirements.",
    },
    {
      icon: SecurityIcon,
      title: "Verified Workers",
      description:
        "All labourers are verified with background checks and skill assessments for your peace of mind.",
    },
    {
      icon: TrendingUpIcon,
      title: "Demand Predictions",
      description:
        "Advanced analytics predict farming demand and help workers plan their schedules effectively.",
    },
    {
      icon: SpeedIcon,
      title: "Quick Hiring",
      description:
        "Post jobs and hire qualified workers in minutes with our streamlined process.",
    },
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "Farmer from Punjab",
      text: "KisanMitra transformed how I manage my farm labour. Found reliable workers within hours!",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Agricultural Worker",
      text: "Regular work opportunities and fair wages. This platform changed my life completely.",
      rating: 5,
    },
    {
      name: "Dr. Amit Patel",
      role: "Farm Owner",
      text: "The demand prediction feature helps me plan my harvest season perfectly. Highly recommended!",
      rating: 4,
    },
  ];

  return (
    <div className="home-container">
      <PublicNavbar />
      {/* Hero Section with Parallax */}
      <section
        className="hero-section"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <div className="hero-background">
          <div
            className="parallax-layer layer-1"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          ></div>
          <div
            className="parallax-layer layer-2"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          ></div>
          <div
            className="parallax-layer layer-3"
            style={{ transform: `translateY(${scrollY * 0.7}px)` }}
          ></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span>🌾 Transforming Agriculture</span>
          </div>
          <h1 className="hero-title">
            Welcome to
            <span className="gradient-text"> KisanMitra</span>
          </h1>
          <p className="hero-subtitle">
            Your Smart Farm Management Partner - Bridging Farmers with Skilled
            Agricultural Workers
          </p>
          <p className="hero-description">
            Revolutionizing agricultural employment through technology. Connect,
            collaborate, and cultivate success with India's most trusted farming
            platform.
          </p>

          <div className="hero-actions">
            <Link to="/register/farmer" className="cta-button primary">
              <AgricultureIcon />
              I'm a Farmer
            </Link>
            <Link to="/register/labour" className="cta-button secondary">
              <GroupIcon />
              I'm a Worker
            </Link>
            <button className="cta-button outline">
              <PlayArrowIcon />
              Watch Demo
            </button>
          </div>

          <div className="scroll-indicator">
            <ArrowDownwardIcon className="bounce" />
            <span>Discover More</span>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="floating-elements">
          <div
            className="floating-card card-1"
            style={{
              transform: `translateY(${scrollY * 0.2}px) rotate(${
                scrollY * 0.02
              }deg)`,
            }}
          >
            <AgricultureIcon />
            <span>Smart Farming</span>
          </div>
          <div
            className="floating-card card-2"
            style={{
              transform: `translateY(${scrollY * 0.3}px) rotate(${
                -scrollY * 0.015
              }deg)`,
            }}
          >
            <TrendingUpIcon />
            <span>Growth</span>
          </div>
          <div
            className="floating-card card-3"
            style={{
              transform: `translateY(${scrollY * 0.25}px) rotate(${
                scrollY * 0.025
              }deg)`,
            }}
          >
            <SecurityIcon />
            <span>Secure</span>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <stat.icon />
                </div>
                <div className="stat-content">
                  <h3 className="stat-number">{stat.number}</h3>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose KisanMitra?</h2>
            <p>
              Experience the future of agricultural employment with our
              innovative platform
            </p>
          </div>

          <div className="features-container">
            <div className="features-display">
              <div className="feature-visual">
                <div className="visual-container">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={`feature-visual-item ${
                        activeFeature === index ? "active" : ""
                      }`}
                    >
                      <feature.icon className="visual-icon" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="features-list">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-item ${
                    activeFeature === index ? "active" : ""
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="feature-icon">
                    <feature.icon />
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2>How KisanMitra Works</h2>
            <p>Simple steps to transform your agricultural operations</p>
          </div>

          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Register Your Profile</h3>
                <p>
                  Create your account as a farmer or agricultural worker with
                  detailed information
                </p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Connect & Match</h3>
                <p>
                  Our AI matches farmers with skilled workers based on location
                  and requirements
                </p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Manage Operations</h3>
                <p>
                  Post jobs, apply for work, and manage all your farming
                  activities in one place
                </p>
              </div>
            </div>
            <div className="process-step">
              <div className="step-number">04</div>
              <div className="step-content">
                <h3>Grow Together</h3>
                <p>
                  Build lasting relationships and watch your agricultural
                  business flourish
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Community Says</h2>
            <p>Join thousands of satisfied farmers and workers across India</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.role}</span>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={
                          i < testimonial.rating ? "star filled" : "star"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Farming Experience?</h2>
            <p>
              Join KisanMitra today and become part of India's fastest-growing
              agricultural community
            </p>
            <div className="cta-actions">
              <Link to="/register" className="cta-button primary large">
                Get Started Free
              </Link>
              <Link to="/about" className="cta-button outline large">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      {/* <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="brand-logo">
                <AgricultureIcon />
                <span>KisanMitra</span>
              </div>
              <p>
                Empowering farmers, enabling workers, transforming agriculture.
              </p>
            </div>
            <div className="footer-links">
              <div className="link-group">
                <h4>Platform</h4>
                <Link to="/farmer">For Farmers</Link>
                <Link to="/labour">For Workers</Link>
                <Link to="/features">Features</Link>
              </div>
              <div className="link-group">
                <h4>Company</h4>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/blog">Blog</Link>
              </div>
              <div className="link-group">
                <h4>Support</h4>
                <Link to="/help">Help Center</Link>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              &copy; 2024 KisanMitra. All rights reserved. Made with ❤️ for
              Indian Agriculture
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Home;
