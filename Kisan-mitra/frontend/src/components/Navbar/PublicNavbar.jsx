// src/components/Navbar/PublicNavbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./PublicNavbar.css";

const PublicNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActiveLink = (path) => {
    return location.pathname === path ? "nav-link active" : "nav-link";
  };

  return (
    <>
      <nav className={`public-navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="brand">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
              </div>
              KisanMitra
            </Link>
          </div>

          <ul className={`nav-links ${isMobileMenuOpen ? "mobile-open" : ""}`}>
            <li>
              <Link to="/" className={isActiveLink("/")}>
                <span className="link-icon">🏠</span>
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" className={isActiveLink("/login")}>
                <span className="link-icon">🔑</span>
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="signup-btn">
                <span className="link-icon">👨‍🌾</span>
                Register
              </Link>
            </li>
          </ul>

          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Background Decorations */}
      <div className="nav-background-decoration">
        <div className="floating-leaf leaf-1"></div>
        <div className="floating-leaf leaf-2"></div>
        <div className="floating-leaf leaf-3"></div>
      </div>
    </>
  );
};

export default PublicNavbar;
