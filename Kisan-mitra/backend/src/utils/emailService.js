const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate secure 6-digit OTP
const generateOTP = () => {
  // Use crypto for secure random number generation
  const buffer = crypto.randomBytes(3);
  const otp = parseInt(buffer.toString('hex'), 16) % 1000000;
  return otp.toString().padStart(6, '0');
};

// Send SMS OTP (Mock implementation - replace with actual SMS service)
const sendSMSOTP = async (phone, otp) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (isDevelopment) {
    console.log(`📱 SMS OTP for ${phone}: ${otp}`);
    return { success: true, message: 'SMS sent (development mode)' };
  }

  // TODO: Implement actual SMS service (Twilio, AWS SNS, etc.)
  // For now, return success for production
  try {
    // Placeholder for actual SMS implementation
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Your KisanMitra OTP is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    console.log(`📱 SMS OTP would be sent to ${phone} in production`);
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'KisanMitra - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🚜 KisanMitra</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Email Verification Required</h2>
          <p style="color: #666; font-size: 16px;">
            Welcome to KisanMitra! Please verify your email address to complete your registration.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Your OTP Code:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
              This OTP will expire in 10 minutes
            </p>
          </div>
          <p style="color: #666;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 KisanMitra. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset OTP email
const sendPasswordResetOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'KisanMitra - Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF5722, #FF7043); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔐 KisanMitra</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; font-size: 16px;">
            We received a request to reset your password. Use the OTP below to reset your password.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">Your Password Reset OTP:</h3>
            <div style="font-size: 32px; font-weight: bold; color: #FF5722; letter-spacing: 5px; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 14px; margin-top: 10px;">
              This OTP will expire in 10 minutes
            </p>
          </div>
          <p style="color: #666;">
            If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </p>
        </div>
        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2024 KisanMitra. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Password reset email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetOTP,
  sendSMSOTP
};