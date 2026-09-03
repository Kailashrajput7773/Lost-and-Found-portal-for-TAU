const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";

// Middleware to check admin key
const checkAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

// Admin: list all items (approved and unapproved)
router.get('/items', checkAdmin, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: approve/revoke/delete
router.patch('/moderate/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    if (typeof approved === 'boolean') {
      const item = await Item.findByIdAndUpdate(id, { approved }, { new: true });
      if (!item) return res.status(404).json({ error: "Not found" });
      return res.json({ ok: true, item });
    }
    
    res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/delete/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const item = await Item.findByIdAndDelete(id);
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json({ ok: true, message: "Deleted successfully" });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
