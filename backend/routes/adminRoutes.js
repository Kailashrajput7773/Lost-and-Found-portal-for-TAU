const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const Allegation = require('../models/Allegation');

const ADMIN_KEYS = ['lostportalhub-admin-secret-2026', 'change-me', process.env.ADMIN_KEY].filter(Boolean);

// Middleware to check admin key
const checkAdmin = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || !ADMIN_KEYS.includes(adminKey)) {
    return res.status(403).json({ error: "Forbidden: Administrator access required" });
  }
  next();
};

// Admin Analytics Overview (Total Users, Active/Online, Allegation Users, Found Users)
router.get('/analytics', checkAdmin, async (req, res) => {
  try {
    const allUsers = await User.find({});
    const allItems = await Item.find({});
    const allAllegations = await Allegation.find({});

    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    // Calculate Online Users
    const activeUsersCount = allUsers.filter(u => {
      if (!u.lastActive) return false;
      return (now - new Date(u.lastActive).getTime()) <= ONLINE_THRESHOLD_MS;
    }).length;

    // Users who have allegations / reports against them
    const allegationUsersCount = allUsers.filter(u => (u.reportsReceived || 0) > 0 || u.isBanned).length;

    // Distinct users who submitted found items
    const foundUserEmails = new Set(
      allItems
        .filter(it => it.type === 'found')
        .map(it => String(it.contact || it.name).toLowerCase())
    );

    const lostItemsCount = allItems.filter(it => it.type === 'lost').length;
    const foundItemsCount = allItems.filter(it => it.type === 'found').length;
    const bannedUsersCount = allUsers.filter(u => u.isBanned).length;

    res.json({
      ok: true,
      stats: {
        totalUsers: allUsers.length,
        activeUsers: activeUsersCount,
        allegationUsers: allegationUsersCount,
        foundUsers: foundUserEmails.size,
        bannedUsers: bannedUsersCount,
        totalItems: allItems.length,
        lostItems: lostItemsCount,
        foundItems: foundItemsCount,
        totalAllegations: allAllegations.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Users List with Online status, item counts, and allegation info
router.get('/users', checkAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const items = await Item.find({});
    const allegations = await Allegation.find({});

    const now = Date.now();
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

    const enrichedUsers = users.map(user => {
      const email = (user.email || "").toLowerCase();
      const name = (user.name || "").toLowerCase();
      const roll = (user.roll || "").toLowerCase();

      // Find user's items
      const userItems = items.filter(it => {
        const c = String(it.contact || "").toLowerCase();
        const r = String(it.roll || "").toLowerCase();
        const n = String(it.name || "").toLowerCase();
        return (email && c === email) || (roll && r === roll) || (name && n === name);
      });

      const userAllegations = allegations.filter(al => {
        const alEmail = (al.reportedUserEmail || "").toLowerCase();
        return alEmail === email;
      });

      const isOnline = user.lastActive ? (now - new Date(user.lastActive).getTime()) <= ONLINE_THRESHOLD_MS : false;

      return {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        roll: user.roll,
        phone: user.phone,
        role: user.role,
        isBanned: user.isBanned || false,
        banReason: user.banReason || "",
        reportsReceived: Math.max(user.reportsReceived || 0, userAllegations.length),
        isOnline,
        lastActive: user.lastActive,
        createdAt: user.createdAt,
        totalItems: userItems.length,
        foundItems: userItems.filter(i => i.type === 'found').length,
        lostItems: userItems.filter(i => i.type === 'lost').length,
        allegations: userAllegations
      };
    });

    res.json({ ok: true, users: enrichedUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Ban / Unban User
router.patch('/users/:id/ban', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, banReason } = req.body;

    const user = await User.findByIdAndUpdate(id, {
      isBanned: typeof isBanned === 'boolean' ? isBanned : true,
      banReason: banReason || (isBanned ? "Banned by Administrator for community policy violations." : "")
    }, { new: true });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      ok: true,
      message: user.isBanned ? `User ${user.email} has been banned.` : `User ${user.email} has been unbanned.`,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Allegations list
router.get('/allegations', checkAdmin, async (req, res) => {
  try {
    const allegations = await Allegation.find({}).sort({ createdAt: -1 });
    res.json({ ok: true, allegations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Allegation status
router.patch('/allegations/:id/status', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await Allegation.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Allegation not found" });
    res.json({ ok: true, allegation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: list all items
router.get('/items', checkAdmin, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json({ ok: true, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: moderate item
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

// Admin: delete item
router.delete('/delete/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
