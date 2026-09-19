const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
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
const upload = multer({ storage });
const itemUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); }
function isPhone(v) { return /^[0-9]{10}$/.test(String(v || "").replace(/\D/g, "")); }

function escapeRegex(string) {
  return String(string || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeItem(item, requester = {}) {
  const plain = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  const claimsCount = Array.isArray(plain.claims) ? plain.claims.length : 0;
  const pendingClaimsCount = Array.isArray(plain.claims) ? plain.claims.filter(c => c.status === 'pending').length : 0;
  const hasActiveOtp = Boolean(plain.handoverOtp);
  const hasApprovedClaim = Array.isArray(plain.claims) && plain.claims.some(c => c.status === 'approved');

  // Founder profile details
  const founderName = plain.founderName || (plain.userRoll === '122311520136' ? 'Macha Kailash' : 'Item Founder');
  const founderRoll = plain.userRoll || plain.roll || '122311520136';
  const founderContact = plain.contact || '9078563412';
  const handoverStation = plain.handoverStation || 'University Central Library Helpdesk';

  // Safe claimant identifiers (without private verification answers or secret OTPs)
  const claimants = Array.isArray(plain.claims)
    ? plain.claims.map(c => ({
        roll: (c.claimantRoll || '').toLowerCase(),
        email: (c.claimantEmail || '').toLowerCase(),
        contact: (c.claimantContact || '').replace(/\D/g, ''),
        name: (c.claimantName || '').toLowerCase(),
        status: c.status || 'pending'
      }))
    : [];

  // Check if current requesting user is the approved claimant
  const reqRoll = (requester.userRoll || requester.roll || '').toLowerCase();
  const reqEmail = (requester.userEmail || requester.email || '').toLowerCase();
  const reqName = (requester.username || '').toLowerCase();
  const isClaimerDemo = reqName === 'claimer' || reqName === 'item claimer';

  let myHandoverOtp = '';
  if (Array.isArray(plain.claims)) {
    const isApprovedClaimant = plain.claims.some(c => {
      if (c.status !== 'approved') return false;
      const cRoll = (c.claimantRoll || '').toLowerCase();
      const cEmail = (c.claimantEmail || '').toLowerCase();
      const cName = (c.claimantName || '').toLowerCase();
      return (
        (reqRoll && cRoll === reqRoll) ||
        (reqEmail && cEmail === reqEmail) ||
        (reqName && cName === reqName) ||
        (isClaimerDemo && (cRoll === '12223222123' || cEmail === 'claimer@apollo.edu.in'))
      );
    });
    if (isApprovedClaimant) {
      myHandoverOtp = plain.handoverOtp || '';
    }
  }

  delete plain.handoverOtp;
  delete plain.claims;
  delete plain.userEmail;
  return {
    ...plain,
    _id: plain._id || plain.id,
    id: plain._id || plain.id,
    claimsCount,
    pendingClaimsCount,
    hasActiveOtp,
    hasApprovedClaim,
    claimants,
    founderName,
    founderRoll,
    founderContact,
    handoverStation,
    myHandoverOtp
  };
}

// Get approved items (with filters)
router.get('/', async (req, res) => {
  try {
    const { q, category, location, date, type } = req.query;
    let query = { approved: true };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (location) query.location = location;
    if (date) query.date = date;
    
    if (q && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const qRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: qRegex },
        { desc: qRegex },
        { category: qRegex },
        { location: qRegex }
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

// Submit new item
router.post('/', itemUpload, async (req, res) => {
  try {
    const { name, roll, userRoll, userEmail, contact, category, desc, location, date, type, verificationQuestion, handoverStation, audio: bodyAudio } = req.body;
    if (!name || !contact || !category || !desc || !location || !date || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (type === 'lost' && !roll && !userRoll) {
      return res.status(400).json({ error: "Missing required field: roll" });
    }
    if (!isEmail(contact) && !isPhone(contact)) {
      return res.status(400).json({ error: "Invalid contact" });
    }

    const imgFile = req.files && req.files['image'] && req.files['image'][0] ? `/uploads/${req.files['image'][0].filename}` : "";
    const audioFile = req.files && req.files['audio'] && req.files['audio'][0] ? `/uploads/${req.files['audio'][0].filename}` : (bodyAudio || "");
    
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
      status: "active",
      verificationQuestion: verificationQuestion || "",
      handoverStation: handoverStation || "University Central Library Helpdesk",
      claims: [],
      img: imgFile,
      audio: audioFile,
      approved: false
    });
    
    await newItem.save();
    res.status(201).json({ ok: true, item: newItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
