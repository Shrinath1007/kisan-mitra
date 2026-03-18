// src/pages/Auth/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Email,
  Send,
  VerifiedUser,
  Lock,
  Visibility,
  VisibilityOff,
  ArrowBack,
  CheckCircle,
} from "@mui/icons-material";
import "./ForgotPassword.css";
import { forgotPassword, verifyResetOTP, resetPassword } from "../../services/authAPI";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

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

  // Step 1: Send OTP to email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await forgotPassword({ email });
      
      if (response.data.success) {
        setSuccess("OTP sent successfully to your email");
        setStep(2);
        setResendTimer(60);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const msg = err?.response?.data?.message || "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyResetOTP({ email, otp });
      
      if (response.data.success) {
        setSuccess("OTP verified successfully");
        setStep(3);
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      const msg = err?.response?.data?.message || "Invalid OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({ email, otp, newPassword });
      
      if (response.data.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      const msg = err?.response?.data?.message || "Failed to reset password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await forgotPassword({ email });
      
      if (response.data.success) {
        setSuccess("OTP resent successfully");
        setResendTimer(60);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="card-header">
          <button 
            className="back-button"
            onClick={() => navigate("/login")}
          >
            <ArrowBack />
          </button>
          <h2>Reset Password</h2>
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {success && (
          <div className="success-message">
            <span>✅ {success}</span>
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="forgot-form">
            <div className="step-content">
              <h3>Enter Your Email</h3>
              <p>We'll send you an OTP to reset your password</p>
              
              <div className="form-group">
                <div className="input-container">
                  <Email className="input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`submit-button ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
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
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="forgot-form">
            <div className="step-content">
              <h3>Verify OTP</h3>
              <p>Enter the 6-digit code sent to {email}</p>
              
              <div className="form-group">
                <div className="input-container">
                  <VerifiedUser className="input-icon" />
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength="6"
                    required
                    className="form-input otp-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`submit-button ${loading ? "loading" : ""}`}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
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

              <div className="resend-section">
                {resendTimer > 0 ? (
                  <p className="resend-timer">Resend OTP in {resendTimer}s</p>
                ) : (
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Step 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <div className="step-content">
              <h3>Set New Password</h3>
              <p>Create a strong password for your account</p>
              
              <div className="form-group">
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div className="form-group">
                <div className="input-container">
                  <Lock className="input-icon" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

              <button
                type="submit"
                className={`submit-button ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
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

        <div className="card-footer">
          <p>
            Remember your password?{" "}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;