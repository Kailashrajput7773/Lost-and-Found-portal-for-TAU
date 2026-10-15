const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const User = require('../models/User');

// Optional Cloudinary Configuration
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log("☁️  Cloudinary Cloud Storage initialized for file uploads");
  } catch (err) {
    console.warn("⚠️  Could not initialize Cloudinary, falling back to local uploads:", err.message);
  }
}

const os = require('os');
const isVercel = !!process.env.VERCEL;
const UPLOAD_DIR = isVercel
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '..', 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Notice: itemRoutes UPLOAD_DIR initialization:", e.message);
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    let ext = path.extname(file.originalname || '');
    if (!ext) {
      if (file.mimetype.includes('audio') || file.fieldname === 'audio') {
        ext = '.webm';
      } else {
        ext = '.jpg';
      }
    }
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); }
function isPhone(v) { return /^[0-9]{10}$/.test(String(v || "").replace(/\D/g, "")); }

// Tokenize text for smart keyword matching
function extractKeywords(text) {
  if (!text) return [];
  const stopWords = new Set(['the', 'and', 'with', 'for', 'was', 'this', 'that', 'from', 'near', 'near-by', 'has', 'have', 'lost', 'found', 'please', 'help', 'item', 'campus']);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// 1. Get Portal Statistics (Active, Reunited, Total)
router.get('/stats', async (req, res) => {
  try {
    const all = await Item.find({});
    const total = all.length;
    const active = all.filter(it => (it.status || 'active') === 'active').length;
    const reunited = all.filter(it => it.status === 'resolved').length;
    const lost = all.filter(it => it.type === 'lost').length;
    const found = all.filter(it => it.type === 'found').length;

    res.json({
      ok: true,
      stats: {
        total,
        active,
        reunited,
        lost,
        found
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get items with filtering
router.get('/', async (req, res) => {
  try {
    const { q, category, location, date, type, status } = req.query;
    let query = {};

    if (type) query.type = type;
    if (category) query.category = category;
    if (location) query.location = location;
    if (date) query.date = date;
    if (status) query.status = status;

    if (q) {
      const qRegex = new RegExp(q, 'i');
      query.$or = [
        { name: qRegex },
        { desc: qRegex },
        { category: qRegex },
        { location: qRegex },
        { name: qRegex }
      ];
    }

    const items = await Item.find(query).sort({ createdAt: -1 });
    const sanitizedItems = items.map(it => sanitizeItem(it, req.query));
    res.json({ ok: true, items: sanitizedItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const crypto = require('crypto');

// Smart similarity matching
router.get('/match', async (req, res) => {
  try {
    const { name = '', category = '', location = '', type = '' } = req.query;
    // Look for items of opposite type (e.g. if reporting 'found', search 'lost' items, and vice versa)
    const targetType = type === 'found' ? 'lost' : type === 'lost' ? 'found' : null;
    const query = { approved: true };
    if (targetType) query.type = targetType;

    const items = await Item.find(query);
    const searchTerms = `${name} ${category} ${location}`
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2);

    const scored = items.map(it => {
      const plainItem = typeof it.toObject === 'function' ? it.toObject() : { ...it };
      let score = 0;
      const itText = `${plainItem.name || ''} ${plainItem.desc || ''} ${plainItem.category || ''} ${plainItem.location || ''}`.toLowerCase();
      
      if (category && plainItem.category && plainItem.category.toLowerCase() === category.toLowerCase()) {
        score += 40;
      }
      if (location && plainItem.location && plainItem.location.toLowerCase() === location.toLowerCase()) {
        score += 25;
      }
      searchTerms.forEach(term => {
        if (itText.includes(term)) score += 15;
      });

      return { item: sanitizeItem(plainItem), score };
    })
    .filter(res => res.score >= 25)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(res => ({ ...res.item, matchScore: Math.min(100, res.score) }));

    res.json({ ok: true, matches: scored });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Student Activity (reports and claims for logged-in user)
router.get('/my-activity', async (req, res) => {
  try {
    const { roll = '', email = '', contact = '', username = '' } = req.query;
    const allItems = await Item.find({});

    const isFounder = username && (username.toLowerCase() === 'founder' || username.toLowerCase() === 'item founder');
    const isClaimer = username && (username.toLowerCase() === 'claimer' || username.toLowerCase() === 'item claimer');

    const myReports = allItems.filter(it => {
      const itRoll = (it.userRoll || it.roll || "").toLowerCase();
      const itEmail = (it.userEmail || "").toLowerCase();
      const itContact = (it.contact || "").replace(/\D/g, "");
      const cleanContact = contact.replace(/\D/g, "");

      return (
        (roll && itRoll === roll.toLowerCase()) ||
        (email && itEmail === email.toLowerCase()) ||
        (cleanContact && itContact && itContact === cleanContact) ||
        (isFounder && (itRoll === '122311520136' || itEmail === 'founder@apollo.edu.in'))
      );
    });

    const myClaims = allItems.filter(it => {
      if (!Array.isArray(it.claims)) return false;
      return it.claims.some(c => {
        const cRoll = (c.claimantRoll || "").toLowerCase();
        const cEmail = (c.claimantEmail || "").toLowerCase();
        const cContact = (c.claimantContact || "").replace(/\D/g, "");
        const cleanContact = contact.replace(/\D/g, "");

        return (
          (roll && cRoll === roll.toLowerCase()) ||
          (email && cEmail === email.toLowerCase()) ||
          (cleanContact && cContact && cContact === cleanContact) ||
          (isClaimer && (cRoll === '12223222123' || cEmail === 'claimer@apollo.edu.in'))
        );
      });
    });

    // Sanitize myReports so founder never receives the claimant's secret OTP
    const safeReports = myReports.map(it => {
      const plain = typeof it.toObject === 'function' ? it.toObject() : { ...it };
      delete plain.handoverOtp;
      if (Array.isArray(plain.claims)) {
        plain.claims = plain.claims.map(c => {
          const cp = { ...c };
          delete cp.otp;
          return cp;
        });
      }
      return plain;
    });

    res.json({ ok: true, myReports: safeReports, myClaims });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single item details (with claims for owner review, OTP withheld)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const plain = typeof item.toObject === 'function' ? item.toObject() : { ...item };
    delete plain.handoverOtp;
    if (Array.isArray(plain.claims)) {
      plain.claims = plain.claims.map(c => {
        const cp = { ...c };
        delete cp.otp;
        return cp;
      });
    }
    res.json({ ok: true, item: plain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit verification claim for an item
router.post('/:id/claim', async (req, res) => {
  try {
    const { id } = req.params;
    const { claimantName, claimantRoll, claimantEmail, claimantContact, answer, station, audio } = req.body;

    if (!claimantName || !claimantContact || !answer) {
      return res.status(400).json({ error: "Missing required claim details (Name, Contact, Verification Answer)." });
    }

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const newClaim = {
      id: crypto.randomUUID(),
      claimantName,
      claimantRoll: claimantRoll || "",
      claimantEmail: claimantEmail || "",
      claimantContact,
      answer,
      audio: audio || "",
      station: station || item.handoverStation || "University Central Library Helpdesk",
      status: "pending",
      createdAt: new Date()
    };

    const claims = Array.isArray(item.claims) ? [...item.claims, newClaim] : [newClaim];
    item.claims = claims;
    item.status = item.status === 'reunited' ? 'reunited' : 'claim_pending';
    if (station && !item.handoverStation) item.handoverStation = station;

    await item.save();
    res.status(201).json({ ok: true, message: "Claim submitted successfully for verification!", claim: newClaim });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a claim (Generates 6-digit Handover OTP upon approval)
router.patch('/:id/claim/:claimId', async (req, res) => {
  try {
    const { id, claimId } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const claims = Array.isArray(item.claims) ? [...item.claims] : [];
    const claimIndex = claims.findIndex(c => {
      const cId = c.id || c._id;
      return String(cId) === String(claimId) || (c._id && c._id.toString() === String(claimId));
    });
    if (claimIndex === -1) return res.status(404).json({ error: "Claim not found" });

    if (action === 'approve') {
      claims[claimIndex].status = 'approved';
      // Generate secure 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      item.handoverOtp = otp;
      item.handoverStation = claims[claimIndex].station || item.handoverStation || "University Central Library Helpdesk";
      item.status = 'claim_pending';
      item.claims = claims;
      await item.save();
      return res.json({ ok: true, message: "Claim approved! Secure Handover OTP generated.", otp, item });
    } else if (action === 'reject') {
      claims[claimIndex].status = 'rejected';
      const hasOtherApproved = claims.some(c => c.status === 'approved');
      if (!hasOtherApproved) {
        item.status = 'active';
        item.handoverOtp = '';
      }
      item.claims = claims;
      await item.save();
      return res.json({ ok: true, message: "Claim rejected.", item });
    }

    res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Handover OTP to finalize return
router.post('/:id/verify-handover', async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (!item.handoverOtp) {
      return res.status(400).json({ error: "No active handover OTP is pending for this item." });
    }

    if (String(item.handoverOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: "Incorrect Handover OTP. Please verify with the claimant." });
    }

    item.status = 'reunited';
    item.handoverOtp = ''; // Clear OTP once successfully completed
    await item.save();

    res.json({ ok: true, message: "Handover verified successfully! Item marked as Reunited 🎉", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Smart Matching: Find potential matches for an item
router.get('/:id/matches', async (req, res) => {
  try {
    const targetItem = await Item.findById(req.params.id);
    if (!targetItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Look for items of the OPPOSITE type (lost <-> found)
    const oppositeType = targetItem.type === 'lost' ? 'found' : 'lost';
    const candidateItems = await Item.find({
      type: oppositeType,
      status: 'active'
    });

    const targetKeywords = new Set([
      ...extractKeywords(targetItem.name),
      ...extractKeywords(targetItem.desc)
    ]);

    const scoredMatches = candidateItems.map(item => {
      let score = 0;
      const reasons = [];

      // Category match (+40)
      if (item.category && targetItem.category && item.category.toLowerCase() === targetItem.category.toLowerCase()) {
        score += 40;
        reasons.push("Matching category: " + item.category);
      }

      // Location match (+30)
      if (item.location && targetItem.location) {
        const locA = item.location.toLowerCase();
        const locB = targetItem.location.toLowerCase();
        if (locA === locB) {
          score += 30;
          reasons.push("Exact location match: " + item.location);
        } else if (locA.includes(locB) || locB.includes(locA)) {
          score += 20;
          reasons.push("Near location: " + item.location);
        }
      }

      // Keyword overlap in name & description (+up to 30)
      const candKeywords = [
        ...extractKeywords(item.name),
        ...extractKeywords(item.desc)
      ];
      let overlapCount = 0;
      candKeywords.forEach(k => {
        if (targetKeywords.has(k)) overlapCount++;
      });

      if (overlapCount > 0) {
        const kwScore = Math.min(30, overlapCount * 10);
        score += kwScore;
        reasons.push(`${overlapCount} common keywords found`);
      }

      return {
        item,
        score: Math.min(100, score),
        reasons
      };
    })
    .filter(m => m.score >= 30) // Minimum 30% relevance
    .sort((a, b) => b.score - a.score);

    res.json({
      ok: true,
      targetItem,
      matches: scoredMatches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Submit new item (with Cloudinary or local upload + verification question support)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, roll, contact, category, desc, location, date, type, question } = req.body;
    if (!name || !contact || !category || !desc || !location || !date || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (type === 'lost' && !roll) {
      return res.status(400).json({ error: "Missing required field: Roll Number is required for lost items." });
    }
    if (!isEmail(contact) && !isPhone(contact)) {
      return res.status(400).json({ error: "Invalid contact format (must be valid email or 10-digit phone)." });
    }

    // Check if submitting user is banned
    const contactStr = String(contact).toLowerCase().trim();
    const rollStr = String(roll || "").toLowerCase().trim();

    const bannedUser = await User.findOne({
      $or: [
        { email: contactStr, isBanned: true },
        { roll: rollStr, isBanned: true }
      ]
    });

    if (bannedUser && bannedUser.isBanned) {
      return res.status(403).json({
        error: "Your account is currently banned from submitting listings due to violation of campus safety guidelines."
      });
    }

    // Determine final image URL (Cloudinary or local)
    let imgUrl = "";
    if (req.file) {
      if (cloudinary) {
        try {
          const uploadRes = await cloudinary.uploader.upload(req.file.path, {
            folder: 'tau_lost_and_found'
          });
          imgUrl = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error("Cloudinary upload failed, falling back to local file:", uploadErr.message);
          imgUrl = `/uploads/${req.file.filename}`;
        }
      } else {
        imgUrl = `/uploads/${req.file.filename}`;
      }
    }

    const newItem = new Item({
      name,
      roll: roll || userRoll || "",
      userRoll: userRoll || roll || "",
      userEmail: userEmail || "",
      contact,
      category,
      desc,
      location,
      date,
      type,
      question: question || "",
      img: imgUrl,
      status: 'active',
      approved: true
    });

    await newItem.save();
    res.status(201).json({
      ok: true,
      item: newItem,
      message: "Listing published live successfully!"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Mark item as Reunited / Resolved 🎉
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { claimedBy } = req.body;
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        claimedBy: claimedBy || 'Reunited with Owner'
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json({
      ok: true,
      message: "Item marked as successfully reunited! 🎉",
      item: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Submit a Claim Verification Answer
router.post('/:id/claim', async (req, res) => {
  try {
    const { answer, claimantName, claimantContact } = req.body;
    if (!answer || !claimantContact) {
      return res.status(400).json({ error: "Please provide your answer and contact information." });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    const newClaim = {
      id: Date.now().toString(),
      answer,
      claimantName: claimantName || 'Anonymous Campus Member',
      claimantContact,
      submittedAt: new Date().toISOString()
    };

    const currentSubmissions = item.claimSubmissions || [];
    currentSubmissions.push(newClaim);

    await Item.findByIdAndUpdate(req.params.id, {
      claimSubmissions: currentSubmissions
    });

    res.json({
      ok: true,
      message: "Your ownership verification details have been sent to the finder!",
      claim: newClaim
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Delete an item (by item owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ ok: true, message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
