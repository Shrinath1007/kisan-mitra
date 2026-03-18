// src/pages/Auth/Register.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Agriculture,
  Person,
  Engineering,
  Email,
  Phone,
  Lock,
  PersonAdd,
  Visibility,
  VisibilityOff,
  Send,
  VerifiedUser,
} from "@mui/icons-material";
import "./Register.css";
import { useAuth } from "../../context/AuthContext";
import { registerWithVerification, sendOTP, verifyOTP } from "../../services/authAPI";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  
  // OTP related states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Resend timer effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Send OTP function
  const handleSendOTP = async () => {
    if (!form.email) {
      setError("Please enter email address first");
      return;
    }

    setOtpLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await sendOTP({ email: form.email });
      
      if (response.data.success) {
        setOtpSent(true);
        setResendTimer(60); // 60 seconds timer
        setSuccess("OTP sent successfully to your email!");
        setError("");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      const msg = err?.response?.data?.message || "Failed to send OTP";
      setError(msg);
      setSuccess("");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP function
  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    setOtpLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyOTP({ email: form.email, otp });
      
      if (response.data.success) {
        setOtpVerified(true);
        setSuccess("Email verified successfully!");
        setError("");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      const msg = err?.response?.data?.message || "Invalid OTP";
      setError(msg);
      setSuccess("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otpVerified) {
      setError("Please verify your email with OTP first");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!form.role) {
      setError("Please select a role");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        password: form.password,
      };

      const resp = await registerWithVerification(payload);
      const data = resp.data;

      if (!data || !data.user || !data.token) {
        setError("Invalid server response.");
        setLoading(false);
        return;
      }

      login(data.user, data.token);

      // Role-based redirection after login
      switch (data.user.role) {
        case "farmer":
          navigate("/farmer/dashboard");
          break;
        case "labour":
          navigate("/labour/dashboard");
          break;
        case "owner":
          navigate("/owner/dashboard");
          break;
        default:
          navigate("/");
          break;
      }
    } catch (err) {
      console.error("Registration error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      value: "farmer",
      label: "Farmer",
      icon: Agriculture,
      description: "Post jobs and manage your farm operations",
    },
    {
      value: "labour",
      label: "Agricultural Worker",
      icon: Person,
      description: "Find work opportunities and build your career",
    },
    {
      value: "owner",
      label: "Machinery Owner",
      icon: Engineering,
      description: "Rent out your equipment and machinery",
    },
  ];

  const getRoleIcon = (role) => {
    const option = roleOptions.find((opt) => opt.value === role);
    return option ? option.icon : Person;
  };

  // Reset OTP states when email changes
  const handleEmailChange = (e) => {
    setForm({ ...form, email: e.target.value });
    if (otpSent || otpVerified) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp("");
      setResendTimer(0);
      setError("");
      setSuccess("");
    }
  };

  return (
    <div className="register-container">
      {/* Background with Parallax */}
      <div className="register-background">
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

        {/* Animated Elements */}
        <div
          className="animated-tractor"
          style={{ transform: `translateX(${scrollY * 0.1}px)` }}
        >
          <div className="tractor-body">
            <div className="tractor-cabin"></div>
            <div className="tractor-wheels">
              <div className="wheel front"></div>
              <div className="wheel back"></div>
            </div>
          </div>
        </div>

        {/* Floating Icons */}
        <div
          className="floating-icon icon-1"
          style={{
            transform: `translateY(${scrollY * 0.2}px) rotate(${
              scrollY * 0.02
            }deg)`,
          }}
        >
          <Agriculture />
        </div>
        <div
          className="floating-icon icon-2"
          style={{
            transform: `translateY(${scrollY * 0.3}px) rotate(${
              -scrollY * 0.015
            }deg)`,
          }}
        >
          <Person />
        </div>
        <div
          className="floating-icon icon-3"
          style={{
            transform: `translateY(${scrollY * 0.25}px) rotate(${
              scrollY * 0.025
            }deg)`,
          }}
        >
          <Engineering />
        </div>
      </div>

      <div className="register-content">
        {/* Left Side - Branding */}
        <div className="register-branding">
          <div className="brand-header">
            <div className="brand-logo">
              <Agriculture className="logo-icon" />
              <h1>KisanMitra</h1>
            </div>
            <div className="brand-tagline">
              <h2>Join Our Agricultural Community</h2>
              <p>
                Start your journey with India's most trusted farming platform
              </p>
            </div>
          </div>

          <div className="benefits-section">
            <h3>Why Join KisanMitra?</h3>
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-icon">🚜</div>
                <div className="benefit-text">
                  <h4>Smart Matching</h4>
                  <p>AI-powered connections between farmers and workers</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-text">
                  <h4>Fair Opportunities</h4>
                  <p>Transparent pricing and regular work opportunities</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🌱</div>
                <div className="benefit-text">
                  <h4>Growth Support</h4>
                  <p>Resources and tools to grow your agricultural business</p>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <div className="stat">
              <div className="stat-number">5000+</div>
              <div className="stat-label">Active Members</div>
            </div>
            <div className="stat">
              <div className="stat-number">12000+</div>
              <div className="stat-label">Jobs Completed</div>
            </div>
            <div className="stat">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
        <div className="register-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <div className="header-icon">
                <PersonAdd />
              </div>
              <h2>Create Your Account</h2>
              <p>Join thousands of agricultural professionals</p>
            </div>

            {error && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <div className="success-icon">✅</div>
                <span>{success}</span>
              </div>
            )}

            <form className="register-form" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div
                className={`form-group ${
                  activeField === "name" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Person className="input-icon" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setActiveField("name")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div
                className={`form-group ${
                  activeField === "email" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Email className="input-icon" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleEmailChange}
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                    disabled={otpVerified}
                  />
                  {otpVerified && (
                    <VerifiedUser className="verified-icon" style={{ color: '#4CAF50' }} />
                  )}
                </div>
              </div>

              {/* OTP Section */}
              {form.email && (
                <div className="otp-section">
                  {!otpSent ? (
                    <button
                      type="button"
                      className="send-otp-button"
                      onClick={handleSendOTP}
                      disabled={otpLoading || otpVerified}
                    >
                      {otpLoading ? (
                        <>
                          <div className="button-spinner"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send />
                          Send OTP
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="otp-verification">
                      <div className="otp-input-group">
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength="6"
                          className="otp-input"
                          disabled={otpVerified}
                        />
                        {!otpVerified && (
                          <button
                            type="button"
                            className="verify-otp-button"
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otp.length !== 6}
                          >
                            {otpLoading ? (
                              <div className="button-spinner"></div>
                            ) : (
                              <VerifiedUser />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {otpVerified && (
                        <div className="verification-success">
                          <VerifiedUser style={{ color: '#4CAF50' }} />
                          <span>Email Verified Successfully!</span>
                        </div>
                      )}
                      
                      {!otpVerified && (
                        <div className="otp-actions">
                          <p className="otp-info">
                            OTP sent to {form.email}
                          </p>
                          {resendTimer > 0 ? (
                            <p className="resend-timer">
                              Resend OTP in {resendTimer}s
                            </p>
                          ) : (
                            <button
                              type="button"
                              className="resend-otp-button"
                              onClick={handleSendOTP}
                              disabled={otpLoading}
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Phone Field */}
              <div
                className={`form-group ${
                  activeField === "phone" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Phone className="input-icon" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    onFocus={() => setActiveField("phone")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="role-selection">
                <label className="section-label">Select Your Role</label>
                <div className="role-options">
                  {roleOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div
                        key={option.value}
                        className={`role-option ${
                          form.role === option.value ? "selected" : ""
                        }`}
                        onClick={() => setForm({ ...form, role: option.value })}
                      >
                        <div className="role-icon">
                          <IconComponent />
                        </div>
                        <div className="role-content">
                          <h4>{option.label}</h4>
                          <p>{option.description}</p>
                        </div>
                        <div className="selection-indicator"></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Password Field */}
              <div
                className={`form-group ${
                  activeField === "password" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    onFocus={() => setActiveField("password")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div
                className={`form-group ${
                  activeField === "confirmPassword" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    onFocus={() => setActiveField("confirmPassword")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="terms-agreement">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>I agree to the{" "}
                  <Link to="/terms">Terms of Service</Link> and{" "}
                  <Link to="/privacy">Privacy Policy</Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`register-button ${loading ? "loading" : ""} ${!otpVerified ? "disabled" : ""}`}
                disabled={loading || !otpVerified}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <PersonAdd />
                    Create Account
                  </>
                )}
              </button>

              {/* Login Redirect */}
              <div className="auth-redirect">
                <p>
                  Already have an account?{" "}
                  <Link to="/login" className="redirect-link">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="background-decorations">
        <div className="decoration leaf-1"></div>
        <div className="decoration leaf-2"></div>
        <div className="decoration leaf-3"></div>
        <div className="decoration grain-1"></div>
        <div className="decoration grain-2"></div>
      </div>
    </div>
  );
};

export default Register;
