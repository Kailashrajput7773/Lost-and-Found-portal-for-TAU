const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER || process.env.ADMIN_EMAIL || 'lostportalhub@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || '';

let transporter = null;

function getTransporter() {
  if (EMAIL_USER && EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }
  return null;
}

/**
 * Send OTP to the recipient email
 * @param {Object} opts { to, otp, purpose, name }
 */
async function sendOtpEmail({ to, otp, purpose = 'verification', name = '' }) {
  const isAdmin = purpose === 'admin_login';
  const subject = isAdmin
    ? '🔒 Admin 2FA Security Passcode - The Apollo University'
    : '🎓 Registration Verification OTP - The Apollo University Lost & Found';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #042f2e 0%, #0d9488 100%); padding: 24px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">The Apollo University</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Campus Lost &amp; Found Portal Hub</p>
      </div>
      <div style="padding: 28px 24px; color: #1e293b;">
        <p style="font-size: 15px; margin-top: 0;">Hello <strong>${name || (isAdmin ? 'Portal Administrator' : 'Student / Staff')}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569;">
          ${isAdmin
            ? 'A sign-in attempt was initiated for your Administrator account. Please enter the one-time security passcode below to access the Admin Control Center:'
            : 'Thank you for registering on The Apollo University Lost & Found Portal. Please enter the verification OTP below to verify your email and activate your account:'}
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; padding: 14px 32px; background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 10px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #15803d; font-family: monospace;">${otp}</span>
          </div>
        </div>
        <p style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
          ⏱️ This code is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone for campus security.
        </p>
        <p style="font-size: 12.5px; color: #64748b; margin-bottom: 0;">
          If you did not request this OTP, please ignore this email or notify campus security at <em>support@apollo.edu.in</em>.
        </p>
      </div>
      <div style="background: #f8fafc; padding: 14px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8;">
        The Apollo University • Lost &amp; Found Portal Hub • Chittoor Main Campus
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"The Apollo University Lost & Found" <${EMAIL_USER}>`,
    to: to,
    subject: subject,
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
    html: htmlContent
  };

  try {
    const transport = getTransporter();
    if (transport) {
      const info = await transport.sendMail(mailOptions);
      console.log(`✅ [EMAIL DISPATCHED] OTP successfully sent to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } else {
      console.warn(`⚠️ [EMAIL NOTICE] EMAIL_PASS is not set in .env. Falling back to console delivery.`);
      console.log(`📧 >>> EMAIL TO: ${to} | OTP: ${otp} | SUBJECT: ${subject} <<<`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(`❌ [EMAIL SEND ERROR] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOtpEmail
};
