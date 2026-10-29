const nodemailer = require('nodemailer');

function getTransporter() {
  const user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'lostportalhub@gmail.com').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '').trim();
  // Remove any whitespace or surrounding quotes that might be copied with Google App Passwords
  const pass = rawPass.replace(/\s+/g, '').replace(/^["']|["']$/g, '');

  if (!user || !pass) {
    return null;
  }

  // Custom SMTP Configuration (if provided)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || user,
        pass: process.env.SMTP_PASS || pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Standard Gmail Service Configuration (uses port 587 STARTTLS, bypassing port 465 blocks)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Test and verify SMTP configuration
 */
async function verifyEmailConfig() {
  const user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'lostportalhub@gmail.com').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '').replace(/^["']|["']$/g, '');

  if (!user || !pass) {
    return {
      configured: false,
      error: 'EMAIL_PASS is empty in backend/.env. Please configure your 16-character Gmail App Password.'
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { configured: true, user };
  } catch (err) {
    return {
      configured: false,
      error: `SMTP authentication failed: ${err.message}`
    };
  }
}

/**
 * Send OTP to the recipient email
 * @param {Object} opts { to, otp, purpose, name }
 */
async function sendOtpEmail({ to, otp, purpose = 'verification', name = '' }) {
  const cleanTo = String(to || '').trim().toLowerCase();
  if (!cleanTo) {
    return { success: false, error: 'Recipient email address is required.' };
  }

  const user = (process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'lostportalhub@gmail.com').trim();
  const rawPass = (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, '').replace(/^["']|["']$/g, '');

  const isAdmin = purpose === 'admin_login';
  const isLogin = purpose === 'user_login' || purpose === 'login';
  const isRegister = purpose === 'user_register' || purpose === 'register';
  const isReset = purpose === 'reset_password' || purpose === 'forgot_password';

  let subject = '🎓 Verification OTP - The Apollo University Lost & Found';
  let headingTitle = 'Campus Account Verification';
  let bodyCopy = 'Thank you for using The Apollo University Lost & Found Portal. Please enter the verification OTP below to verify your email and activate your account:';

  if (isAdmin) {
    subject = '🔒 Admin 2FA Security Passcode - The Apollo University';
    headingTitle = 'Administrator Security Verification';
    bodyCopy = 'A sign-in attempt was initiated for your Administrator account. Please enter the one-time security passcode below to access the Admin Control Center:';
  } else if (isReset) {
    subject = '🔑 Password Reset OTP - The Apollo University Lost & Found';
    headingTitle = 'Password Reset Security Verification';
    bodyCopy = 'A password reset request was initiated for your campus account. Please enter the one-time security code (OTP) below to verify your identity and reset your password:';
  } else if (isLogin) {
    subject = '🔐 Login Verification OTP - The Apollo University Lost & Found';
    headingTitle = 'Real-Time Sign-In Security Verification';
    bodyCopy = 'A sign-in attempt was detected for your campus account. Please enter the one-time passcode (OTP) below to authenticate and enter your session:';
  } else if (isRegister) {
    subject = '🎓 Verify Your Email - The Apollo University Lost & Found';
    headingTitle = 'New Campus Account Registration';
    bodyCopy = 'Thank you for registering on The Apollo University Lost & Found Portal. Please enter the one-time verification passcode below to complete your registration:';
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #042f2e 0%, #0d9488 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">The Apollo University</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; font-weight: 500;">Campus Lost &amp; Found Portal • Security Dispatch</p>
      </div>
      <div style="padding: 30px 26px; color: #1e293b;">
        <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 700;">${headingTitle}</h2>
        <p style="font-size: 14.5px; margin: 0 0 10px 0; line-height: 1.5;">Hello <strong>${name || (isAdmin ? 'Portal Administrator' : 'Campus Member')}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          ${bodyCopy}
        </p>
        <div style="margin: 26px 0; text-align: center;">
          <div style="display: inline-block; padding: 16px 36px; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 4px;">One-Time Passcode (OTP)</div>
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: 'SF Mono', Consolas, Monaco, monospace; display: block;">${otp}</span>
          </div>
        </div>
        <div style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
          <p style="font-size: 12.5px; color: #475569; margin: 0; line-height: 1.5;">
            ⏱️ <strong>Valid for 10 minutes.</strong> Never share this code with anyone, including campus personnel.
          </p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          If you did not initiate this request on the TAU Lost &amp; Found Portal, please disregard this email or report to campus security at <a href="mailto:lostportalhub@gmail.com" style="color: #0d9488; text-decoration: none;">lostportalhub@gmail.com</a>.
        </p>
      </div>
      <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #64748b;">
        <strong>The Apollo University</strong> • Sarvepalli Radhakrishnan Block, Chittoor Main Campus, AP
      </div>
    </div>
  `;

  // Fallback if EMAIL_PASS is not configured
  if (!user || !pass) {
    console.warn(`⚠️ [EMAIL NOTICE] EMAIL_PASS is not configured in backend/.env!`);
    console.log(`📧 >>> [SIMULATED EMAIL DELIVERY] To: ${cleanTo} | OTP: ${otp} | Purpose: ${purpose} <<<`);
    return {
      success: true,
      simulated: true,
      message: 'Email credentials not set in backend/.env. Simulated OTP generated.'
    };
  }

  const mailOptions = {
    from: `"The Apollo University Lost & Found" <${user}>`,
    to: cleanTo,
    subject: subject,
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    html: htmlContent
  };

  try {
    const transport = getTransporter();
    if (!transport) {
      throw new Error("Failed to initialize mail transporter.");
    }
    const info = await transport.sendMail(mailOptions);
    console.log(`✅ [REAL-TIME EMAIL DISPATCHED] OTP successfully sent to ${cleanTo} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId, simulated: false };
  } catch (error) {
    console.error(`❌ [EMAIL SEND ERROR] Failed to send real-time email to ${cleanTo}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOtpEmail,
  verifyEmailConfig,
  getTransporter
};

