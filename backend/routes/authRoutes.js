const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Allegation = require('../models/Allegation');
const { sendOtpEmail, verifyEmailConfig } = require('../utils/mailer');

const ADMIN_EMAIL = 'lostportalhub@gmail.com';
const ADMIN_PASSWORD = 'kailash07bolt@';
const ADMIN_KEY = process.env.ADMIN_KEY || 'lostportalhub-admin-secret-2026';

// In-memory OTP Store: email -> { otp, expiresAt, purpose, ... }
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email Diagnostic Endpoint
router.get('/email-status', async (req, res) => {
  try {
    const status = await verifyEmailConfig();
    res.json({
      ok: true,
      sender: process.env.EMAIL_USER || 'lostportalhub@gmail.com',
      ...status
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Test Email Dispatch Endpoint
router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: "Destination email address is required." });
    }
    const testOtp = generateOtp();
    const result = await sendOtpEmail({
      to: to.trim().toLowerCase(),
      otp: testOtp,
      purpose: 'verification',
      name: 'Portal Test User'
    });
    res.json({ ok: result.success, ...result, testOtp });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Request / Resend OTP endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required to dispatch OTP." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, { otp, expiresAt, purpose: purpose || 'verification' });

    // Send actual real-time email to recipient
    const mailResult = await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: purpose || 'verification'
    });

    if (!mailResult.success) {
      return res.status(500).json({
        ok: false,
        error: `Failed to deliver real-time email to ${cleanEmail}: ${mailResult.error || 'SMTP delivery failure'}. Check EMAIL_PASS in backend/.env.`
      });
    }

    res.json({
      ok: true,
      message: `Real-time OTP dispatched successfully to ${cleanEmail}`,
      simulated: mailResult.simulated || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route (Real-time OTP verification for all logins)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, otp } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Please enter your email/username and password." });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // 1. Dedicated Admin Authentication: STRICTLY restricted to lostportalhub@gmail.com with password kailash07bolt@
    if (cleanId === ADMIN_EMAIL.toLowerCase()) {
      if (cleanPass !== ADMIN_PASSWORD) {
        return res.status(401).json({
          error: "Invalid administrator credentials. Access to the Admin Console is strictly denied."
        });
      }

      // Password matches kailash07bolt@! Grant full admin authorization
      return res.json({
        ok: true,
        user: {
          name: "Portal Administrator",
          email: ADMIN_EMAIL,
          role: "admin",
          adminKey: ADMIN_KEY,
          isAdmin: true
        }
      });
    }

    // 3. Regular Campus User Authentication (Real-time OTP for every login)
    let user = await User.findOne({ email: cleanId });
    if (!user) {
      user = await User.findOne({ roll: cleanId });
    }

    // If identifier is not found and does not look like an email address
    if (!user && !cleanId.includes('@')) {
      return res.status(404).json({
        error: "No account found with this Roll Number. Please sign up in the Register tab first."
      });
    }

    // Determine target email for dispatching real-time OTP
    const userEmail = (user?.email || cleanId).toLowerCase();
    const userName = user?.name || cleanId.split('@')[0];
    const isNewUser = !user;

    // Validate password if existing user
    if (user) {
      if (user.password !== cleanPass) {
        return res.status(401).json({ error: "Incorrect password. Please verify your credentials." });
      }

      if (user.isBanned) {
        return res.status(403).json({
          error: "Account Suspended: Your access has been restricted by campus administration due to community rule violations.",
          isBanned: true,
          banReason: user.banReason || "Terms of service violation"
        });
      }
    } else {
      if (cleanPass.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters long." });
      }
    }

    // STEP A: If no OTP supplied yet, generate and send real-time OTP to user's respective email
    if (!otp) {
      const loginOtp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      otpStore.set(userEmail, {
        otp: loginOtp,
        expiresAt,
        purpose: 'user_login',
        password: cleanPass,
        name: userName,
        roll: user?.roll || '',
        isNewUser
      });

      // Dispatch real email via Nodemailer
      const mailResult = await sendOtpEmail({
        to: userEmail,
        otp: loginOtp,
        purpose: 'user_login',
        name: userName
      });

      if (!mailResult.success) {
        return res.status(500).json({
          ok: false,
          error: `Failed to send real-time OTP to ${userEmail}: ${mailResult.error || 'SMTP delivery failure'}. Check EMAIL_PASS in backend/.env.`
        });
      }

      return res.json({
        ok: true,
        requiresOtp: true,
        email: userEmail,
        purpose: 'user_login',
        simulated: mailResult.simulated || false,
        message: `Real-time OTP dispatched to ${userEmail}. Please verify your passcode to sign in.`
      });
    }

    // STEP B: Verify submitted OTP
    const targetEmail = req.body.email ? String(req.body.email).trim().toLowerCase() : userEmail;
    const record = otpStore.get(targetEmail) || otpStore.get(userEmail);

    if (!record || record.otp !== String(otp).trim() || Date.now() > record.expiresAt) {
      return res.status(400).json({
        error: "Invalid or expired OTP. Please check your inbox or click Resend."
      });
    }

    // OTP Verified: consume OTP
    otpStore.delete(userEmail);
    if (targetEmail !== userEmail) otpStore.delete(targetEmail);

    // If new user logging in for the first time, persist account
    if (isNewUser) {
      const newUser = new User({
        name: userName,
        email: userEmail,
        roll: record.roll || '',
        password: cleanPass,
        role: 'student',
        lastActive: new Date(),
        isBanned: false,
        reportsReceived: 0
      });
      await newUser.save();

      return res.json({
        ok: true,
        user: {
          id: newUser._id || newUser.id,
          name: newUser.name,
          email: newUser.email,
          roll: newUser.roll,
          phone: newUser.phone,
          role: newUser.role,
          isBanned: false
        }
      });
    }

    // Existing user: update lastActive heartbeat
    await User.findByIdAndUpdate(user._id || user.id, { lastActive: new Date() });

    const safeRole = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
      ? 'admin'
      : (user.role === 'staff' ? 'staff' : 'student');

    return res.json({
      ok: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        roll: user.roll,
        phone: user.phone,
        role: safeRole,
        isAdmin: safeRole === 'admin',
        adminKey: safeRole === 'admin' ? ADMIN_KEY : undefined,
        isBanned: false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register route (Real-time OTP for new campus registrations)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, roll, phone, role, password, otp } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields (Name, Email, Password)" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        error: "Registration restricted: lostportalhub@gmail.com is exclusively reserved for the campus administrator."
      });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
    }

    // Step A: If no OTP submitted yet, generate and send verification OTP to the user's respective email!
    if (!otp) {
      const regOtp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(cleanEmail, {
        otp: regOtp,
        expiresAt,
        purpose: 'user_register'
      });

      // Dispatch real email to user's registered inbox
      const mailResult = await sendOtpEmail({
        to: cleanEmail,
        otp: regOtp,
        purpose: 'user_register',
        name: fullName
      });

      if (!mailResult.success) {
        return res.status(500).json({
          ok: false,
          error: `Failed to dispatch real-time OTP to ${cleanEmail}: ${mailResult.error || 'SMTP delivery failure'}. Check EMAIL_PASS in backend/.env.`
        });
      }

      return res.json({
        ok: true,
        requiresOtp: true,
        email: cleanEmail,
        purpose: 'user_register',
        simulated: mailResult.simulated || false,
        message: `Verification OTP dispatched to ${cleanEmail}. Please check your inbox to complete registration.`
      });
    }

    // Step B: Verify the registration OTP
    const record = otpStore.get(cleanEmail);
    if (!record || record.otp !== String(otp).trim() || Date.now() > record.expiresAt) {
      return res.status(400).json({
        error: "Invalid or expired registration OTP. Please check the code in your email or click Resend."
      });
    }

    // Consume OTP
    otpStore.delete(cleanEmail);

    const newUser = new User({
      name: fullName,
      email: cleanEmail,
      roll: roll || "",
      phone: phone || "",
      role: role || "student",
      password: password,
      lastActive: new Date(),
      isBanned: false,
      reportsReceived: 0
    });

    await newUser.save();
    res.status(201).json({
      ok: true,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        roll: newUser.roll,
        phone: newUser.phone,
        role: newUser.role,
        isBanned: false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Heartbeat to update online status
router.post('/heartbeat', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ ok: false });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      await User.findByIdAndUpdate(user._id || user.id, { lastActive: new Date() });
    }
    res.json({ ok: true, isBanned: user?.isBanned || false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report a user/allegation
router.post('/report-user', async (req, res) => {
  try {
    const { reportedUserEmail, reportedUserName, reportedByEmail, reportedByName, reason, details, itemId, itemName } = req.body;
    if (!reportedUserEmail || !reason) {
      return res.status(400).json({ error: "Reported user email and reason are required." });
    }

    const allegation = new Allegation({
      reportedUserEmail,
      reportedUserName: reportedUserName || reportedUserEmail,
      reportedByEmail: reportedByEmail || "anonymous",
      reportedByName: reportedByName || "Student Reporter",
      reason,
      details: details || "",
      itemId: itemId || "",
      itemName: itemName || "",
      status: "pending"
    });
    await allegation.save();

    // Increment user reports
    const targetUser = await User.findOne({ email: reportedUserEmail.toLowerCase() });
    if (targetUser) {
      await User.findByIdAndUpdate(targetUser._id || targetUser.id, {
        reportsReceived: (targetUser.reportsReceived || 0) + 1
      });
    }

    res.json({ ok: true, message: "Report submitted to campus administration for investigation." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// FORGOT & RESET PASSWORD FLOW
// ==========================================

// Step 1: Request Password Reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Please provide your campus email address or roll number." });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanIdNoSpaces = cleanId.replace(/\s+/g, '');

    // Prevent overriding admin password via forgot password flow
    if (cleanId === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({
        error: "Administrator credentials must be configured securely via server environment settings."
      });
    }

    // Comprehensive lookup: exact email, roll, roll prefix before @ in email, or name
    let user = await User.findOne({ email: cleanId });
    if (!user && cleanIdNoSpaces !== cleanId) {
      user = await User.findOne({ email: cleanIdNoSpaces });
    }
    if (!user) {
      user = await User.findOne({ roll: cleanId });
    }
    if (!user && cleanIdNoSpaces !== cleanId) {
      user = await User.findOne({ roll: cleanIdNoSpaces });
    }
    if (!user) {
      const escaped = cleanIdNoSpaces.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ email: new RegExp(`^${escaped}@`, 'i') });
    }
    if (!user) {
      user = await User.findOne({ name: cleanId });
    }

    if (!user) {
      return res.status(404).json({
        error: `No registered account found matching "${identifier}". Please check your email or roll number, or click Register to create a new account.`
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: "This account has been suspended by campus administration.",
        isBanned: true
      });
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    const otp = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(userEmail, {
      otp,
      expiresAt,
      purpose: 'reset_password',
      userId: user._id || user.id,
      email: userEmail,
      verified: false
    });

    // Persist in DB for serverless multi-container reliability on Vercel
    try {
      await User.findByIdAndUpdate(user._id || user.id, {
        resetOtp: otp,
        resetOtpExpires: new Date(expiresAt)
      });
    } catch (e) {
      console.warn("Notice: could not persist resetOtp to DB:", e.message);
    }

    const mailResult = await sendOtpEmail({
      to: userEmail,
      otp,
      purpose: 'reset_password',
      name: user.name || 'Campus Member'
    });

    if (!mailResult.success) {
      return res.status(500).json({
        ok: false,
        error: `Failed to deliver password reset OTP to ${userEmail}: ${mailResult.error || 'SMTP delivery failure'}.`
      });
    }

    res.json({
      ok: true,
      email: userEmail,
      message: `A 6-digit password reset code has been sent to ${userEmail}.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Verify Password Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and 6-digit OTP code are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const record = otpStore.get(cleanEmail);

    let isValid = false;
    let isExpired = false;

    if (record && record.purpose === 'reset_password') {
      if (Date.now() > record.expiresAt) {
        isExpired = true;
      } else if (record.otp === cleanOtp) {
        isValid = true;
        record.verified = true;
        otpStore.set(cleanEmail, record);
      }
    }

    if (!isValid) {
      // Fallback check against DB for Vercel serverless multi-instance support
      const dbUser = await User.findOne({ email: cleanEmail });
      if (dbUser && dbUser.resetOtp) {
        if (dbUser.resetOtpExpires && new Date(dbUser.resetOtpExpires).getTime() < Date.now()) {
          isExpired = true;
        } else if (dbUser.resetOtp === cleanOtp) {
          isValid = true;
        }
      }
    }

    if (isExpired) {
      return res.status(400).json({
        error: "Your verification code has expired. Please request a new password reset code."
      });
    }

    if (!isValid) {
      return res.status(400).json({
        error: "Incorrect verification code. Please check your email inbox and enter the 6-digit OTP."
      });
    }

    res.json({
      ok: true,
      email: cleanEmail,
      message: "Verification code confirmed. You may now enter your new password."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Step 3: Complete Password Reset
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP verification code, and new password are required." });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();
    const cleanNewPass = String(newPassword).trim();

    if (cleanNewPass.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }

    const record = otpStore.get(cleanEmail);
    const dbUser = await User.findOne({ email: cleanEmail });

    let isValid = false;
    let isExpired = false;

    if (record && record.purpose === 'reset_password') {
      if (Date.now() > record.expiresAt) {
        isExpired = true;
      } else if (record.otp === cleanOtp) {
        isValid = true;
      }
    }

    if (!isValid && dbUser && dbUser.resetOtp) {
      if (dbUser.resetOtpExpires && new Date(dbUser.resetOtpExpires).getTime() < Date.now()) {
        isExpired = true;
      } else if (dbUser.resetOtp === cleanOtp) {
        isValid = true;
      }
    }

    if (isExpired) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({
        error: "Your password reset session has expired. Please request a new code."
      });
    }

    if (!isValid) {
      return res.status(400).json({
        error: "Invalid verification code. Please verify the code sent to your email."
      });
    }

    if (!dbUser) {
      return res.status(404).json({ error: "User account not found." });
    }

    // Update password in database and clear reset OTP
    await User.findByIdAndUpdate(dbUser._id || dbUser.id, {
      password: cleanNewPass,
      resetOtp: "",
      resetOtpExpires: null
    });

    if (typeof dbUser.save === 'function') {
      try {
        dbUser.password = cleanNewPass;
        dbUser.resetOtp = "";
        dbUser.resetOtpExpires = null;
        await dbUser.save();
      } catch (e) {}
    }

    // Clear in-memory OTP session
    otpStore.delete(cleanEmail);

    res.json({
      ok: true,
      message: "Your password has been successfully reset! You can now log in with your new password."
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
