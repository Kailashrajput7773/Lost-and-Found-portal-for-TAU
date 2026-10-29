const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

const ADMIN_KEYS = ['lostportalhub-admin-secret-2026', process.env.ADMIN_KEY].filter(k => Boolean(k) && k !== 'change-me');

function checkIsAdmin(req) {
  const adminKey = req.headers["x-admin-key"];
  const userEmail = (req.headers["x-user-email"] || req.headers["x-admin-email"] || req.query.email || "").trim().toLowerCase();
  if (userEmail && userEmail !== 'lostportalhub@gmail.com') return false;
  return Boolean(adminKey && ADMIN_KEYS.includes(adminKey));
}

// 1. Get all reviews and aggregated rating statistics
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });

    const total = reviews.length;
    let sum = 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      breakdown[star] = (breakdown[star] || 0) + 1;
      sum += Number(r.rating || 5);
    });

    const average = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;

    res.json({
      ok: true,
      stats: {
        total,
        average,
        breakdown,
        satisfactionRate: total > 0 ? Math.round(((breakdown[5] + breakdown[4]) / total) * 100) : 100
      },
      reviews
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 2. Submit a new campus review
router.post('/', async (req, res) => {
  try {
    const { name, roll, email, role, rating, category, comment, itemName, itemId } = req.body;

    if (!comment || comment.trim().length < 5) {
      return res.status(400).json({
        ok: false,
        error: "Please write a brief feedback comment (at least 5 characters)."
      });
    }

    const star = Math.min(5, Math.max(1, parseInt(rating || 5, 10)));
    const cleanName = (name || "TAU Campus Member").trim();
    const cleanComment = comment.trim();
    const cleanRoll = (roll || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();

    const newReview = new Review({
      name: cleanName,
      roll: cleanRoll,
      email: cleanEmail,
      role: ['student', 'faculty', 'staff', 'owner', 'finder'].includes(role) ? role : 'student',
      rating: star,
      category: category ? category.trim() : "Overall Experience",
      comment: cleanComment,
      verifiedCampus: true,
      itemName: itemName ? itemName.trim() : "",
      itemId: itemId || "",
      createdAt: new Date()
    });

    await newReview.save();

    res.status(201).json({
      ok: true,
      message: "Thank you for sharing your experience! Your review has been published.",
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// 3. Delete / Moderate a review (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (!checkIsAdmin(req)) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Admin access required." });
    }

    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Review not found." });
    }

    res.json({
      ok: true,
      message: "Review removed successfully by administrator."
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
