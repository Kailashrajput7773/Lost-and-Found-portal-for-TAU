const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Item = require('../models/Item');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); }
function isPhone(v) { return /^[0-9]{10}$/.test(String(v || "").replace(/\D/g, "")); }

// Get approved items (with filters)
router.get('/', async (req, res) => {
  try {
    const { q, category, location, date, type } = req.query;
    let query = { approved: true };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (location) query.location = location;
    if (date) query.date = date;
    
    if (q) {
      const qRegex = new RegExp(q, 'i');
      query.$or = [
        { desc: qRegex },
        { category: qRegex },
        { location: qRegex }
      ];
    }
    
    const items = await Item.find(query).sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit new item
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, roll, contact, category, desc, location, date, type } = req.body;
    if (!name || !contact || !category || !desc || !location || !date || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (type === 'lost' && !roll) {
      return res.status(400).json({ error: "Missing required field: roll" });
    }
    if (!isEmail(contact) && !isPhone(contact)) {
      return res.status(400).json({ error: "Invalid contact" });
    }
    
    const newItem = new Item({
      name,
      roll: roll || "",
      contact,
      category,
      desc,
      location,
      date,
      type,
      img: req.file ? `/uploads/${req.file.filename}` : "",
      approved: false
    });
    
    await newItem.save();
    res.status(201).json({ ok: true, item: newItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
