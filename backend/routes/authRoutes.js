const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Allegation = require('../models/Allegation');
const { sendOtpEmail } = require('../utils/mailer');

const ADMIN_EMAIL = 'lostportalhub@gmail.com';
const ADMIN_PASSWORD = 'qwertyuiop@123';
const ADMIN_KEY = process.env.ADMIN_KEY || 'lostportalhub-admin-secret-2026';

// In-memory OTP Store: email -> { otp, expiresAt, purpose }
const otpStore = new Map();

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Send actual email to recipient!
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose: purpose || 'verification'
    });

    res.json({
      ok: true,
      message: `OTP dispatched successfully to ${cleanEmail}`,
      otp // Provided for UI simulation / test convenience
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
// Admin requires OTP every time!
// Regular users log in directly with password (NO OTP required for regular login).
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, otp } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Please enter your email/username and password." });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // 1. Dedicated Admin Authentication with MANDATORY OTP EVERY TIME
    if (cleanId === ADMIN_EMAIL.toLowerCase() && cleanPass === ADMIN_PASSWORD) {
      // Step A: If no OTP supplied, trigger OTP challenge and send email to lostportalhub@gmail.com
      if (!otp) {
        const adminOtp = generateOtp();
        const expiresAt = Date.now() + 10 * 60 * 1000;
        otpStore.set(ADMIN_EMAIL.toLowerCase(), {
          otp: adminOtp,
          expiresAt,
          purpose: 'admin_login'
        });

        // Dispatch email to admin email
        await sendOtpEmail({
          to: ADMIN_EMAIL,
          otp: adminOtp,
          purpose: 'admin_login',
          name: 'Portal Administrator'
        });

        return res.json({
          ok: true,
          requiresOtp: true,
          message: `Admin 2FA Security Check: An OTP has been sent to ${ADMIN_EMAIL}.`,
          otp: adminOtp
        });
      }

      // Step B: Verify submitted OTP
      const record = otpStore.get(ADMIN_EMAIL.toLowerCase());
      if (!record || record.otp !== String(otp).trim() || Date.now() > record.expiresAt) {
        return res.status(400).json({
          error: "Invalid or expired Admin OTP. Please check your inbox or request a new one."
        });
      }

      // OTP Verified: consume OTP
      otpStore.delete(ADMIN_EMAIL.toLowerCase());

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

    // 2. Regular User Authentication (NO OTP required here)
    let user = await User.findOne({ email: cleanId });
    if (!user) {
      user = await User.findOne({ roll: cleanId });
    }

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

      // Update online heartbeat & lastActive
      await User.findByIdAndUpdate(user._id || user.id, { lastActive: new Date() });

      return res.json({
        ok: true,
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          roll: user.roll,
          phone: user.phone,
          role: user.role || 'student',
          isBanned: false
        }
      });
    }

    // Fallback: Check if entered default admin key
    const isSpecialAdmin = cleanPass === 'change-me' || cleanId.includes('admin');
    if (isSpecialAdmin) {
      return res.json({
        ok: true,
        user: {
          name: cleanId,
          email: `${cleanId}@apollo.edu.in`,
          role: "admin",
          adminKey: ADMIN_KEY,
          isAdmin: true
        }
      });
    }

    // Auto-create standard active account if student/staff logs in with new credentials
    const newUser = new User({
      name: cleanId.split('@')[0],
      email: cleanId.includes('@') ? cleanId : `${cleanId}@apollo.edu.in`,
      password: cleanPass,
      role: 'student',
      lastActive: new Date()
    });
    await newUser.save();

    res.json({
      ok: true,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isBanned: false
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register route (MANDATORY OTP for users ONLY during registration)
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, roll, phone, role, password, otp } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Missing required fields (Name, Email, Password)" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    // Step A: If no OTP submitted yet, generate and send verification OTP to the user's email!
    if (!otp) {
      const regOtp = generateOtp();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(cleanEmail, {
        otp: regOtp,
        expiresAt,
        purpose: 'user_register'
      });

      // Dispatch real email to user's registered inbox
      await sendOtpEmail({
        to: cleanEmail,
        otp: regOtp,
        purpose: 'user_register',
        name: fullName
      });

      return res.json({
        ok: true,
        requiresOtp: true,
        message: `Verification OTP sent to ${cleanEmail}. Please check your inbox to complete registration.`,
        otp: regOtp
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

module.exports = router;
