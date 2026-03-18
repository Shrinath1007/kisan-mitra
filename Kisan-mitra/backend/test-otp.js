// Simple test script to verify OTP functionality
require('dotenv').config();
const { generateOTP, sendOTPEmail } = require('./src/utils/emailService');

async function testOTP() {
  console.log('🧪 Testing OTP functionality...\n');
  
  // Test OTP generation
  console.log('1. Testing OTP generation:');
  for (let i = 0; i < 5; i++) {
    const otp = generateOTP();
    console.log(`   Generated OTP ${i + 1}: ${otp} (length: ${otp.length})`);
  }
  
  // Test email configuration
  console.log('\n2. Testing email configuration:');
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  // Test email sending (optional - uncomment to test actual email)
  /*
  console.log('\n3. Testing email sending:');
  const testEmail = 'test@example.com'; // Replace with your test email
  const testOTP = generateOTP();
  
  try {
    const result = await sendOTPEmail(testEmail, testOTP);
    console.log(`   Email send result: ${result.success ? '✅ Success' : '❌ Failed'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.log(`   Email send error: ❌ ${error.message}`);
  }
  */
  
  console.log('\n✅ OTP test completed!');
}

testOTP().catch(console.error);