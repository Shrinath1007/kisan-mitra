// src/pages/Auth/Login.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  Agriculture,
  Person,
  Lock,
  Email,
  Login as LoginIcon,
  Google,
  Facebook,
  Send,
  VerifiedUser,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import "./Login.css";
import { useAuth } from "../../context/AuthContext";
import { loginUser, forgotPassword, verifyResetOTP, resetPassword } from "../../services/authAPI";
import adminService from "../../services/adminService";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeField, setActiveField] = useState(null);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Admin Login Modal States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });
  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and Password are required.");
      return;
    }

    setLoading(true);

    try {
      const resp = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      const data = resp.data;

      if (!data || !data.user || !data.token) {
        setError("Unexpected server response.");
        setLoading(false);
        return;
      }

      login(data.user, data.token);
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`${provider} login clicked`);
  };

  // Forgot Password Functions
  const openForgotModal = () => {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
    setResendTimer(0);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
    setForgotSuccess("");
    setResendTimer(0);
  };

  // Step 1: Send OTP to email
  const handleSendForgotOTP = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotEmail) {
      setForgotError("Please enter your email address");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await forgotPassword({ email: forgotEmail });
      
      if (response.data.success) {
        setForgotSuccess("OTP sent successfully to your email");
        setForgotStep(2);
        setResendTimer(60);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const msg = err?.response?.data?.message || "Failed to send OTP";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyForgotOTP = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotOtp) {
      setForgotError("Please enter the OTP");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await verifyResetOTP({ email: forgotEmail, otp: forgotOtp });
      
      if (response.data.success) {
        setForgotSuccess("OTP verified successfully");
        setForgotStep(3);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      const msg = err?.response?.data?.message || "Invalid OTP";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!newPassword || !confirmPassword) {
      setForgotError("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters long");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await resetPassword({ 
        email: forgotEmail, 
        otp: forgotOtp, 
        newPassword 
      });
      
      if (response.data.success) {
        setForgotSuccess("Password reset successfully!");
        setTimeout(() => {
          closeForgotModal();
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const msg = err?.response?.data?.message || "Failed to reset password";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  // Admin Login Functions
  const openAdminModal = () => {
    setShowAdminModal(true);
    setAdminForm({ email: "", password: "" });
    setAdminError("");
  };

  const closeAdminModal = () => {
    setShowAdminModal(false);
    setAdminForm({ email: "", password: "" });
    setAdminError("");
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError("");

    if (!adminForm.email.trim() || !adminForm.password.trim()) {
      setAdminError("Email and Password are required.");
      return;
    }

    setAdminLoading(true);

    try {
      const data = await adminService.login({
        email: adminForm.email.trim(),
        password: adminForm.password,
      });

      if (!data || !data.admin || !data.token) {
        setAdminError("Unexpected server response.");
        setAdminLoading(false);
        return;
      }

      // Login with admin user data
      login(data.admin, data.token);
      closeAdminModal();
      
      // Navigate to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("Admin login error:", err);
      const message =
        err.response?.data?.message ||
        err.message ||
        "Admin login failed. Please check your credentials.";
      setAdminError(message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Resend OTP
  const handleResendForgotOTP = async () => {
    setForgotError("");
    setForgotLoading(true);

    try {
      const response = await forgotPassword({ email: forgotEmail });
      
      if (response.data.success) {
        setForgotSuccess("OTP resent successfully");
        setResendTimer(60);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background with Parallax */}
      <div className="login-background">
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

        <div
          className="animated-character farmer"
          style={{ transform: `translateX(${scrollY * 0.1}px)` }}
        >
          <div className="character-body">
            <div className="head"></div>
            <div className="body"></div>
            <div className="arm left"></div>
            <div className="arm right"></div>
            <div className="tool"></div>
          </div>
        </div>

        <div
          className="floating-element element-1"
          style={{
            transform: `translateY(${scrollY * 0.2}px) rotate(${
              scrollY * 0.02
            }deg)`,
          }}
        >
          <Agriculture />
        </div>
        <div
          className="floating-element element-2"
          style={{
            transform: `translateY(${scrollY * 0.3}px) rotate(${
              -scrollY * 0.015
            }deg)`,
          }}
        >
          <Person />
        </div>
        <div
          className="floating-element element-3"
          style={{
            transform: `translateY(${scrollY * 0.25}px) rotate(${
              scrollY * 0.025
            }deg)`,
          }}
        >
          <Lock />
        </div>
      </div>

      <div className="login-content">
        {/* Left Side Branding */}
        <div className="login-branding">
          <div className="brand-logo">
            <Agriculture className="logo-icon" />
            <h1>KisanMitra</h1>
          </div>

          <div className="brand-tagline">
            <h2>Welcome Back to Your Farming Community</h2>
            <p>
              Connect, collaborate, and cultivate success with India's most
              trusted agricultural platform
            </p>
          </div>

          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">🌾</div>
              <div className="feature-text">
                <h4>Smart Job Matching</h4>
                <p>AI-powered connections between farmers and workers</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">
                <h4>Secure Platform</h4>
                <p>Verified users and safe transactions</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <div className="feature-text">
                <h4>Growth Opportunities</h4>
                <p>Regular work and fair wages for everyone</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Welcome Back!</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="auth-error-message">
                <div className="error-icon">⚠️</div>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div
                className={`form-group ${
                  activeField === "email" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Email className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    onFocus={() => setActiveField("email")}
                    onBlur={() => setActiveField(null)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div
                className={`form-group ${
                  activeField === "password" ? "active" : ""
                }`}
              >
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>Remember me
                </label>
                <button
                  type="button"
                  className="forgot-password"
                  onClick={openForgotModal}
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`login-button ${loading ? "loading" : ""}`}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>Signing In...
                  </>
                ) : (
                  <>
                    <LoginIcon /> Sign In
                  </>
                )}
              </button>

              {/* Admin Login Button */}
              <button
                type="button"
                className="login-button admin-button"
                onClick={openAdminModal}
              >
                🔐 Admin Login
              </button>

              <div className="divider">
                <span>or continue with</span>
              </div>

              <div className="social-login">
                <button
                  type="button"
                  className="social-button google"
                  onClick={() => handleSocialLogin("google")}
                >
                  <Google /> Google
                </button>
                <button
                  type="button"
                  className="social-button facebook"
                  onClick={() => handleSocialLogin("facebook")}
                >
                  <Facebook /> Facebook
                </button>
              </div>

              <div className="auth-footer">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="auth-link">
                    Sign up here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="background-decorations">
        <div className="decoration leaf-1"></div>
        <div className="decoration leaf-2"></div>
        <div className="decoration leaf-3"></div>
        <div className="decoration grain-1"></div>
        <div className="decoration grain-2"></div>
        <div className="decoration bird-1"></div>
        <div className="decoration bird-2"></div>
        <div className="decoration cloud-1"></div>
        <div className="decoration cloud-2"></div>
        <div className="decoration wheat-1"></div>
        <div className="decoration wheat-2"></div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={closeForgotModal}>
          <div className="forgot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="close-button" onClick={closeForgotModal}>
                <Close />
              </button>
            </div>

            <div className="step-indicator">
              <div className={`step ${forgotStep >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step ${forgotStep >= 2 ? 'active' : ''}`}>2</div>
              <div className={`step ${forgotStep >= 3 ? 'active' : ''}`}>3</div>
            </div>

            {forgotError && (
              <div className="modal-error">
                <span>⚠️ {forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="modal-success">
                <span>✅ {forgotSuccess}</span>
              </div>
            )}

            {/* Step 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendForgotOTP} className="modal-form">
                <div className="modal-step-content">
                  <h4>Enter Your Email</h4>
                  <p>We'll send you an OTP to reset your password</p>
                  
                  <div className="modal-form-group">
                    <div className="modal-input-container">
                      <Email className="modal-input-icon" />
                      <input
                        type="email"
                        placeholder="Enter your email address"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        className="modal-form-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`modal-submit-button ${forgotLoading ? "loading" : ""}`}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <div className="button-spinner"></div>
                        Sending OTP...
                      </>
                    ) : (
                      <>
                        <Send />
                        Send OTP
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyForgotOTP} className="modal-form">
                <div className="modal-step-content">
                  <h4>Verify OTP</h4>
                  <p>Enter the 6-digit code sent to {forgotEmail}</p>
                  
                  <div className="modal-form-group">
                    <div className="modal-input-container">
                      <VerifiedUser className="modal-input-icon" />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        maxLength="6"
                        required
                        className="modal-form-input otp-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`modal-submit-button ${forgotLoading ? "loading" : ""}`}
                    disabled={forgotLoading || forgotOtp.length !== 6}
                  >
                    {forgotLoading ? (
                      <>
                        <div className="button-spinner"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <VerifiedUser />
                        Verify OTP
                      </>
                    )}
                  </button>

                  <div className="modal-resend-section">
                    {resendTimer > 0 ? (
                      <p className="resend-timer">Resend OTP in {resendTimer}s</p>
                    ) : (
                      <button
                        type="button"
                        className="resend-button"
                        onClick={handleResendForgotOTP}
                        disabled={forgotLoading}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="modal-form">
                <div className="modal-step-content">
                  <h4>Set New Password</h4>
                  <p>Create a strong password for your account</p>
                  
                  <div className="modal-form-group">
                    <div className="modal-input-container">
                      <Lock className="modal-input-icon" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="modal-form-input"
                      />
                      <button
                        type="button"
                        className="modal-password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </button>
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <div className="modal-input-container">
                      <Lock className="modal-input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="modal-form-input"
                      />
                      <button
                        type="button"
                        className="modal-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`modal-submit-button ${forgotLoading ? "loading" : ""}`}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <div className="button-spinner"></div>
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="modal-overlay" onClick={closeAdminModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Admin Login</h3>
              <button className="close-button" onClick={closeAdminModal}>
                <Close />
              </button>
            </div>

            {adminError && (
              <div className="modal-error">
                <span>⚠️ {adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="modal-form">
              <div className="modal-step-content">
                <h4>Administrator Access</h4>
                <p>Enter your admin credentials to access the dashboard</p>
                
                <div className="modal-form-group">
                  <div className="modal-input-container">
                    <Email className="modal-input-icon" />
                    <input
                      type="email"
                      placeholder="Admin email address"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      required
                      className="modal-form-input"
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <div className="modal-input-container">
                    <Lock className="modal-input-icon" />
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="Admin password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      required
                      className="modal-form-input"
                    />
                    <button
                      type="button"
                      className="modal-password-toggle"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                    >
                      {showAdminPassword ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`modal-submit-button admin-submit ${adminLoading ? "loading" : ""}`}
                  disabled={adminLoading}
                >
                  {adminLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LoginIcon />
                      Login as Admin
                    </>
                  )}
                </button>

                <div className="admin-info">
                  <p>⚠️ This area is restricted to authorized administrators only.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
