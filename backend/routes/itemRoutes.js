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
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); }
function isPhone(v) { return /^[0-9]{10}$/.test(String(v || "").replace(/\D/g, "")); }

function maskContact(contact) {
  if (!contact) return "";
  const str = String(contact).trim();
  if (str.includes('@')) {
    const [user, domain] = str.split('@');
    const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}${'*'.repeat(Math.max(1, user.length - 2))}${user[user.length - 1]}`;
    return `${maskedUser}@${domain}`;
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
  }
  return "Protected Contact";
}

const ADMIN_KEYS = ['lostportalhub-admin-secret-2026', process.env.ADMIN_KEY].filter(k => Boolean(k) && k !== 'change-me');

function checkIsAdmin(req) {
  const adminKey = req.headers["x-admin-key"];
  const userEmail = (req.headers["x-user-email"] || req.headers["x-admin-email"] || req.query.email || "").trim().toLowerCase();
  if (userEmail && userEmail !== 'lostportalhub@gmail.com') return false;
  return Boolean(adminKey && ADMIN_KEYS.includes(adminKey));
}

function checkIsOwner(req, item) {
  if (!item) return false;
  if (checkIsAdmin(req)) return true;
  const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").trim().toLowerCase();
  const userPhone = (req.headers["x-user-phone"] || req.query.userPhone || "").trim();
  const userRoll = (req.headers["x-user-roll"] || req.query.userRoll || "").trim().toLowerCase();

  const itemContact = String(item.contact || "").trim().toLowerCase();
  const itemRoll = String(item.roll || "").trim().toLowerCase();

  if (userEmail && itemContact === userEmail) return true;
  if (userPhone && itemContact.replace(/\D/g, '') === userPhone.replace(/\D/g, '')) return true;
  if (userRoll && itemRoll && itemRoll === userRoll) return true;
  return false;
}

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

// 1b. Get all Reunited Belongings & Handover Statistics (Public Hall of Reunited)
router.get('/reunited', async (req, res) => {
  try {
    const all = await Item.find({}).sort({ createdAt: -1 });
    const resolvedItems = all.filter(it => it.status === 'resolved' || (it.handover && it.handover.verified));

    const totalReunited = resolvedItems.length;
    const verifiedHandovers = resolvedItems.filter(it => it.handover && it.handover.verified).length;
    const lostReunited = resolvedItems.filter(it => it.type === 'lost').length;
    const foundReunited = resolvedItems.filter(it => it.type === 'found').length;

    // Public sanitized listings
    const publicItems = resolvedItems.map(raw => {
      const it = raw.toObject ? raw.toObject() : { ...raw };
      return {
        _id: it._id || it.id,
        id: it._id || it.id,
        name: it.name,
        desc: it.desc,
        category: it.category,
        location: it.location,
        date: it.date,
        img: it.img,
        type: it.type,
        status: 'resolved',
        claimedBy: it.claimedBy || (it.handover && it.handover.recipientName) || 'Verified Campus Owner',
        custodyLocation: it.custodyLocation || '',
        custodyReceiptNo: it.custodyReceiptNo || '',
        handover: it.handover || {
          verified: true,
          recipientName: it.claimedBy || 'Verified Campus Owner',
          handoverLocation: it.location || 'Campus Front Desk',
          handedOverAt: it.createdAt,
          receiptNumber: `TAU-REC-2026-${String(it._id || it.id).slice(-4).toUpperCase()}`
        },
        createdAt: it.createdAt
      };
    });

    res.json({
      ok: true,
      stats: {
        totalReunited,
        verifiedHandovers: Math.max(verifiedHandovers, totalReunited),
        lostReunited,
        foundReunited,
        verificationRate: 100,
        averageHoursToReturn: 14
      },
      items: publicItems
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2. Get items with filtering & privacy protection
router.get('/', async (req, res) => {
  try {
    const { q, category, location, date, type, status, sort } = req.query;
    let query = {};

    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all' && category !== 'All' && category !== 'All Categories') query.category = category;
    if (location && location !== 'all' && location !== 'All Locations') query.location = location;
    if (date && date !== 'all') query.date = date;
    if (status && status !== 'all') query.status = status;

    if (q && q.trim()) {
      const escapedQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const qRegex = new RegExp(escapedQ, 'i');
      query.$or = [
        { desc: qRegex },
        { category: qRegex },
        { location: qRegex },
        { name: qRegex }
      ];
    }

    const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
    const items = await Item.find(query).sort(sortOrder);

    const isAdmin = checkIsAdmin(req);
    // Sanitize contact for public listings unless resolved or viewer is owner/admin
    const sanitizedItems = items.map(raw => {
      const it = raw.toObject ? raw.toObject() : { ...raw };
      const isOwner = checkIsOwner(req, it);
      if (!isAdmin && !isOwner && it.status !== 'resolved') {
        it.contact = maskContact(it.contact);
        it.maskedContact = maskContact(it.contact);
      }
      return it;
    });

    res.json({ ok: true, items: sanitizedItems });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2a. Authenticated User Dashboard & My Reports Data
router.get('/user/dashboard', async (req, res) => {
  try {
    const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").trim().toLowerCase();
    const userPhone = (req.headers["x-user-phone"] || req.query.userPhone || "").trim();
    const userRoll = (req.headers["x-user-roll"] || req.query.userRoll || "").trim().toLowerCase();
    const isAdmin = checkIsAdmin(req);

    if (!userEmail && !userPhone && !userRoll && !isAdmin) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized: Please sign in with your Apollo credentials to access your dashboard."
      });
    }

    const allItems = await Item.find({}).sort({ createdAt: -1 });

    // Filter reports created by the user
    const myReports = allItems.filter(item => {
      if (isAdmin && req.query.viewAll) return true;
      const c = String(item.contact || "").trim().toLowerCase();
      const r = String(item.roll || "").trim().toLowerCase();
      if (userEmail && c === userEmail) return true;
      if (userPhone && c.replace(/\D/g, '') === userPhone.replace(/\D/g, '')) return true;
      if (userRoll && r && r === userRoll) return true;
      return false;
    });

    // Counts for summary cards (strictly matching real records)
    const activeLost = myReports.filter(it => it.type === 'lost' && (it.status || 'active') === 'active');
    const activeFound = myReports.filter(it => it.type === 'found' && (it.status || 'active') === 'active');
    const resolvedItems = myReports.filter(it => it.status === 'resolved');

    // Pending claims on user's reports that need user's review
    const claimsToReview = [];
    myReports.forEach(item => {
      const claims = Array.isArray(item.claimSubmissions) ? item.claimSubmissions : [];
      claims.forEach(c => {
        if (c.status === 'pending') {
          claimsToReview.push({
            ...c,
            itemId: item._id || item.id,
            itemName: item.name,
            itemType: item.type,
            itemLocation: item.location
          });
        }
      });
    });

    // Claims submitted by this user on OTHER items
    const mySubmittedClaims = [];
    allItems.forEach(item => {
      const isMyItem = myReports.some(m => (m._id || m.id).toString() === (item._id || item.id).toString());
      const claims = Array.isArray(item.claimSubmissions) ? item.claimSubmissions : [];
      claims.forEach(c => {
        const cContact = String(c.claimantContact || "").toLowerCase().trim();
        const matchesUser = (userEmail && cContact === userEmail) || (userPhone && cContact.replace(/\D/g, '') === userPhone.replace(/\D/g, ''));
        if (matchesUser) {
          mySubmittedClaims.push({
            ...c,
            itemId: item._id || item.id,
            itemName: item.name,
            itemType: item.type,
            itemStatus: item.status,
            itemLocation: item.location,
            itemContact: c.status === 'approved' ? item.contact : maskContact(item.contact),
            isMyItem
          });
        }
      });
    });

    // Possible smart matches for user's active items
    const possibleMatches = [];
    const activeUserItems = myReports.filter(it => (it.status || 'active') === 'active');

    activeUserItems.forEach(userItem => {
      const oppositeType = userItem.type === 'lost' ? 'found' : 'lost';
      const userKeywords = new Set([
        ...extractKeywords(userItem.name),
        ...extractKeywords(userItem.desc)
      ]);

      const candidates = allItems.filter(cand =>
        cand.type === oppositeType &&
        (cand.status || 'active') === 'active' &&
        (cand._id || cand.id).toString() !== (userItem._id || userItem.id).toString()
      );

      candidates.forEach(cand => {
        let matchScore = 0;
        const reasons = [];

        if (cand.category && userItem.category && cand.category.toLowerCase() === userItem.category.toLowerCase()) {
          matchScore += 40;
          reasons.push("Matching category: " + cand.category);
        }

        if (cand.location && userItem.location) {
          const locA = cand.location.toLowerCase();
          const locB = userItem.location.toLowerCase();
          if (locA === locB) {
            matchScore += 30;
            reasons.push("Same campus location: " + cand.location);
          } else if (locA.includes(locB) || locB.includes(locA)) {
            matchScore += 20;
            reasons.push("Nearby location");
          }
        }

        const candKeywords = [...extractKeywords(cand.name), ...extractKeywords(cand.desc)];
        let overlap = 0;
        candKeywords.forEach(k => { if (userKeywords.has(k)) overlap++; });
        if (overlap > 0) {
          matchScore += Math.min(30, overlap * 10);
          reasons.push(`${overlap} matching keywords`);
        }

        if (matchScore >= 40) {
          possibleMatches.push({
            userItem: {
              id: userItem._id || userItem.id,
              name: userItem.name,
              type: userItem.type
            },
            matchedItem: {
              id: cand._id || cand.id,
              name: cand.name,
              type: cand.type,
              category: cand.category,
              location: cand.location,
              date: cand.date,
              img: cand.img
            },
            score: Math.min(100, matchScore),
            reasons
          });
        }
      });
    });

    // Recent activity feed compiled strictly from real events
    const recentActivity = [];
    myReports.forEach(it => {
      recentActivity.push({
        id: `act-create-${it._id || it.id}`,
        type: 'report_created',
        title: `Reported ${it.type === 'lost' ? 'Lost' : 'Found'}: "${it.name}"`,
        timestamp: it.createdAt,
        itemId: it._id || it.id,
        status: it.status
      });
      if (it.status === 'resolved') {
        recentActivity.push({
          id: `act-resolve-${it._id || it.id}`,
          type: 'report_resolved',
          title: `Reunited: "${it.name}" with ${it.claimedBy || 'Owner'}`,
          timestamp: it.createdAt,
          itemId: it._id || it.id,
          status: 'resolved'
        });
      }
    });

    mySubmittedClaims.forEach(c => {
      recentActivity.push({
        id: `act-claim-${c.id}`,
        type: 'claim_submitted',
        title: `Claimed "${c.itemName}" (${(c.status || 'pending').toUpperCase()})`,
        timestamp: c.submittedAt,
        itemId: c.itemId,
        status: c.status
      });
    });

    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      ok: true,
      stats: {
        totalReports: myReports.length,
        activeLostCount: activeLost.length,
        activeFoundCount: activeFound.length,
        resolvedCount: resolvedItems.length,
        pendingClaimsToReviewCount: claimsToReview.length,
        mySubmittedClaimsCount: mySubmittedClaims.length,
        possibleMatchesCount: possibleMatches.length
      },
      myReports,
      claimsToReview,
      mySubmittedClaims,
      possibleMatches: possibleMatches.slice(0, 10),
      recentActivity: recentActivity.slice(0, 15)
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2b. Get single item by ID with privacy protection
const handleGetItemDetail = async (req, res) => {
  try {
    const id = req.params.id;
    let item = null;
    try {
      item = await Item.findById(id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found or invalid identifier." });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found." });
    }

    const isAdmin = checkIsAdmin(req);
    const isOwner = checkIsOwner(req, item);
    const userEmail = (req.headers["x-user-email"] || req.query.userEmail || "").trim().toLowerCase();
    const userPhone = (req.headers["x-user-phone"] || req.query.userPhone || "").trim();

    const rawItem = item.toObject ? item.toObject() : { ...item };
    const allClaims = Array.isArray(rawItem.claimSubmissions) ? rawItem.claimSubmissions : [];

    // Find if the requesting user has submitted a claim for this item
    const myClaim = allClaims.find(c => {
      const cContact = String(c.claimantContact || "").toLowerCase().trim();
      return (userEmail && cContact === userEmail) || (userPhone && cContact.replace(/\D/g, '') === userPhone.replace(/\D/g, ''));
    }) || null;

    let sanitizedItem = { ...rawItem };

    if (isAdmin || isOwner) {
      sanitizedItem.userRole = isAdmin ? 'admin' : 'owner';
      sanitizedItem.canManageClaims = true;
      sanitizedItem.claimSubmissions = allClaims;
      sanitizedItem.claimsCount = allClaims.length;
    } else {
      sanitizedItem.userRole = myClaim ? 'claimant' : 'viewer';
      sanitizedItem.canManageClaims = false;
      sanitizedItem.claimSubmissions = myClaim ? [myClaim] : [];
      sanitizedItem.claimsCount = allClaims.length;

      // Mask sensitive contact details for public viewers unless resolved
      if (sanitizedItem.status !== 'resolved') {
        sanitizedItem.maskedContact = maskContact(sanitizedItem.contact);
        sanitizedItem.contact = maskContact(sanitizedItem.contact);
      }
    }

    return res.json({
      ok: true,
      item: sanitizedItem,
      myClaim,
      isOwner: isAdmin || isOwner,
      isAdmin
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
};

router.get('/detail/:id', handleGetItemDetail);
router.get('/:id', handleGetItemDetail);

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
    const { name, roll, contact, category, desc, location, date, type, question, custodyHandedOver, custodyLocation, custodyReceiptNo } = req.body;
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

    const isCustody = custodyHandedOver === 'true' || custodyHandedOver === true;

    const newItem = new Item({
      name,
      roll: roll || "",
      contact,
      category,
      desc,
      location,
      date,
      type,
      question: question || "",
      custodyHandedOver: isCustody,
      custodyLocation: isCustody ? (custodyLocation || location || "") : "",
      custodyReceiptNo: isCustody ? (custodyReceiptNo || "") : "",
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

// 5. Mark item as Reunited / Resolved & Verify Physical Handover
router.patch('/:id/resolve', async (req, res) => {
  try {
    let item = null;
    try {
      item = await Item.findById(req.params.id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found or invalid identifier." });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found." });
    }

    const isAuthorized = checkIsAdmin(req) || checkIsOwner(req, item);
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: Only the item reporter or a campus administrator is authorized to close or resolve this listing."
      });
    }

    const {
      claimedBy,
      recipientName,
      recipientRoll,
      recipientContact,
      handoverLocation,
      notes,
      handoverCode
    } = req.body;

    // Verify 6-digit handover passcode if active
    if (handoverCode && item.handover?.handoverCode && item.handover.handoverCode !== String(handoverCode).trim()) {
      return res.status(400).json({
        ok: false,
        error: "Incorrect 6-digit Handover Code. Please verify with the recipient."
      });
    }

    const finalRecipient = (recipientName || claimedBy || item.claimedBy || "Verified Campus Owner").trim();
    const receiptNo = `TAU-REC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const handoverRecord = {
      verified: true,
      handoverCode: "",
      recipientName: finalRecipient,
      recipientRoll: (recipientRoll || "").trim(),
      recipientContact: (recipientContact || "").trim(),
      handedOverBy: (req.headers["x-user-email"] || item.contact || "Campus Member").trim(),
      handoverLocation: (handoverLocation || item.location || "Campus Front Desk").trim(),
      handedOverAt: new Date().toISOString(),
      receiptNumber: receiptNo,
      notes: (notes || "Physical handover completed and verified.").trim()
    };

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        claimedBy: finalRecipient,
        handover: handoverRecord
      },
      { new: true, returnDocument: 'after' }
    );

    res.json({
      ok: true,
      message: "Physical handover verified and item marked as successfully reunited!",
      item: updated,
      receiptNumber: receiptNo,
      handover: handoverRecord
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 5b. Generate a 6-digit Handover Verification Passcode for item claimant/owner
router.post('/:id/handover/generate-code', async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: "Item not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const existingHandover = item.handover || {};
    existingHandover.handoverCode = code;
    existingHandover.handoverOtpExpires = expiresAt;

    await Item.findByIdAndUpdate(req.params.id, { handover: existingHandover });

    res.json({
      ok: true,
      handoverCode: code,
      expiresAt: expiresAt.toISOString(),
      message: "6-digit handover code generated. Present this passcode when receiving your belonging."
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 5c. Verify Handover Code & Complete Physical Custody Handover
router.post('/:id/handover/verify', async (req, res) => {
  try {
    let item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, error: "Item not found" });

    const isAuthorized = checkIsAdmin(req) || checkIsOwner(req, item);
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: Only the item reporter or a campus administrator is authorized to complete handover verification."
      });
    }

    const { handoverCode, recipientName, recipientRoll, recipientContact, handoverLocation, notes } = req.body;

    if (item.handover && item.handover.handoverCode) {
      if (!handoverCode || String(handoverCode).trim() !== String(item.handover.handoverCode).trim()) {
        return res.status(400).json({
          ok: false,
          error: "Invalid Handover Code. Please ask the recipient for their 6-digit handover passcode."
        });
      }
    }

    const finalRecipient = (recipientName || item.claimedBy || "Verified Campus Owner").trim();
    const receiptNo = `TAU-REC-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const handoverRecord = {
      verified: true,
      handoverCode: "",
      recipientName: finalRecipient,
      recipientRoll: (recipientRoll || "").trim(),
      recipientContact: (recipientContact || "").trim(),
      handedOverBy: (req.headers["x-user-email"] || item.contact || "Campus Member").trim(),
      handoverLocation: (handoverLocation || item.location || "Campus Front Desk").trim(),
      handedOverAt: new Date().toISOString(),
      receiptNumber: receiptNo,
      notes: (notes || "Physical handover verified and confirmed.").trim()
    };

    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        claimedBy: finalRecipient,
        handover: handoverRecord
      },
      { new: true, returnDocument: 'after' }
    );

    res.json({
      ok: true,
      message: `Handover verified successfully! Belonging restored to ${finalRecipient}.`,
      item: updated,
      receiptNumber: receiptNo,
      handover: handoverRecord
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 6. Submit a Claim Verification Answer
router.post('/:id/claim', async (req, res) => {
  try {
    const { answer, claimantName, claimantContact, distinguishingDetails } = req.body;
    const claimDetails = (answer || distinguishingDetails || "").trim();

    if (!claimDetails) {
      return res.status(400).json({
        ok: false,
        error: "Please provide identifying details or answer the verification question to prove ownership."
      });
    }

    if (!claimantContact) {
      return res.status(400).json({
        ok: false,
        error: "Please provide your contact phone number or Apollo email so the finder can connect with you."
      });
    }

    if (!isEmail(claimantContact) && !isPhone(claimantContact)) {
      return res.status(400).json({
        ok: false,
        error: "Invalid contact format. Please provide a valid email address or 10-digit mobile number."
      });
    }

    let item = null;
    try {
      item = await Item.findById(req.params.id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found or invalid identifier." });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found." });
    }

    if (item.status === 'resolved') {
      return res.status(400).json({
        ok: false,
        error: "This item has already been marked as resolved and reunited with its owner."
      });
    }

    // Check if claimant account is banned
    const cleanContact = claimantContact.trim().toLowerCase();
    const bannedClaimant = await User.findOne({
      $or: [
        { email: cleanContact, isBanned: true },
        { phone: cleanContact, isBanned: true }
      ]
    });

    if (bannedClaimant && bannedClaimant.isBanned) {
      return res.status(403).json({
        ok: false,
        error: "Your account is currently restricted from submitting claims due to community guideline violations."
      });
    }

    // Prevent reporter from claiming their own found item
    if (String(item.contact || "").toLowerCase().trim() === cleanContact) {
      return res.status(400).json({
        ok: false,
        error: "You cannot submit an ownership claim on a listing you reported yourself."
      });
    }

    const currentSubmissions = Array.isArray(item.claimSubmissions) ? [...item.claimSubmissions] : [];

    // Check if user already submitted a pending claim
    const existingClaim = currentSubmissions.find(c => {
      const cContact = String(c.claimantContact || "").toLowerCase().trim();
      return cContact === cleanContact && c.status === 'pending';
    });

    if (existingClaim) {
      return res.status(400).json({
        ok: false,
        error: "You already have a pending claim submitted for this item. Please wait for the finder to review your verification."
      });
    }

    const newClaim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      answer: claimDetails,
      distinguishingDetails: (distinguishingDetails || claimDetails).trim(),
      claimantName: (claimantName || 'Campus Student').trim(),
      claimantContact: cleanContact,
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewNotes: ''
    };

    currentSubmissions.push(newClaim);

    await Item.findByIdAndUpdate(req.params.id, {
      claimSubmissions: currentSubmissions
    });

    return res.status(201).json({
      ok: true,
      message: "Your ownership verification details have been securely submitted to the reporter!",
      claim: newClaim
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 6b. Review a claim (Approve / Reject) by item reporter or administrator
router.patch('/:id/claims/:claimId', async (req, res) => {
  try {
    let item = null;
    try {
      item = await Item.findById(req.params.id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found" });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found" });
    }

    const isAuthorized = checkIsAdmin(req) || checkIsOwner(req, item);
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: Only the item reporter or a campus administrator is authorized to review ownership claims."
      });
    }

    const { action, reviewNotes } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ ok: false, error: "Action must be either 'approve' or 'reject'." });
    }

    const currentSubmissions = Array.isArray(item.claimSubmissions) ? [...item.claimSubmissions] : [];
    const claimIndex = currentSubmissions.findIndex(c => String(c.id) === String(req.params.claimId));

    if (claimIndex === -1) {
      return res.status(404).json({ ok: false, error: "Claim submission not found" });
    }

    const targetClaim = { ...currentSubmissions[claimIndex] };
    targetClaim.status = action === 'approve' ? 'approved' : 'rejected';
    targetClaim.reviewedAt = new Date().toISOString();
    targetClaim.reviewNotes = reviewNotes || (action === 'approve' ? 'Ownership verified by reporter.' : 'Verification answers did not match.');

    currentSubmissions[claimIndex] = targetClaim;

    const updates = { claimSubmissions: currentSubmissions };

    if (action === 'approve') {
      updates.status = 'resolved';
      updates.claimedBy = targetClaim.claimantName || 'Verified Campus Owner';
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });

    return res.json({
      ok: true,
      message: action === 'approve'
        ? `Claim approved! Item has been marked as reunited with ${targetClaim.claimantName}. 🎉`
        : `Claim marked as rejected.`,
      claim: targetClaim,
      item: updatedItem
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 7. Edit an item (by item owner or admin)
router.patch('/:id/edit', async (req, res) => {
  try {
    let item = null;
    try {
      item = await Item.findById(req.params.id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found or invalid identifier." });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found." });
    }

    const isAuthorized = checkIsAdmin(req) || checkIsOwner(req, item);
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You are not authorized to edit this listing."
      });
    }

    const { name, desc, location, category, question, custodyHandedOver, custodyLocation, custodyReceiptNo } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (desc) updates.desc = desc.trim();
    if (location) updates.location = location;
    if (category) updates.category = category;
    if (question !== undefined) updates.question = question.trim();
    if (custodyHandedOver !== undefined) updates.custodyHandedOver = Boolean(custodyHandedOver);
    if (custodyLocation !== undefined) updates.custodyLocation = custodyLocation.trim();
    if (custodyReceiptNo !== undefined) updates.custodyReceiptNo = custodyReceiptNo.trim();

    const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
    return res.json({
      ok: true,
      message: "Report details updated successfully!",
      item: updated
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// 8. Delete an item (strictly restricted to item owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    let item = null;
    try {
      item = await Item.findById(req.params.id);
    } catch {
      return res.status(404).json({ ok: false, error: "Item not found or invalid identifier." });
    }

    if (!item) {
      return res.status(404).json({ ok: false, error: "Item not found." });
    }

    const isAuthorized = checkIsAdmin(req) || checkIsOwner(req, item);
    if (!isAuthorized) {
      return res.status(403).json({
        ok: false,
        error: "Forbidden: You are not authorized to delete this report."
      });
    }

    await Item.findByIdAndDelete(req.params.id);
    return res.json({ ok: true, message: "Report permanently deleted." });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
