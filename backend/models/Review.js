const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const os = require('os');

const isVercel = !!process.env.VERCEL;
const SEED_FILE = path.join(__dirname, '..', 'data', 'reviews.json');
const DATA_FILE = isVercel
  ? path.join(os.tmpdir(), 'reviews.json')
  : SEED_FILE;

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, default: "" },
  email: { type: String, default: "" },
  role: { type: String, enum: ['student', 'faculty', 'staff', 'owner', 'finder'], default: 'student' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, default: "Overall Experience" },
  comment: { type: String, required: true },
  verifiedCampus: { type: Boolean, default: true },
  itemName: { type: String, default: "" },
  itemId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const MongoReview = mongoose.model('Review', reviewSchema);

function readLocalReviews() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      let seedData = '[]';
      if (fs.existsSync(SEED_FILE)) {
        try {
          seedData = fs.readFileSync(SEED_FILE, 'utf8') || '[]';
        } catch (readErr) {
          console.warn("Notice: could not read review SEED_FILE:", readErr.message);
        }
      }
      fs.writeFileSync(DATA_FILE, seedData, 'utf8');
      return JSON.parse(seedData || '[]');
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading local reviews.json:', e.message);
    return [];
  }
}

function writeLocalReviews(reviews) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing local reviews.json:', e.message);
  }
}

class ReviewWrapper {
  constructor(data = {}) {
    if (mongoose.connection.readyState === 1) {
      return new MongoReview(data);
    }
    this._id = data._id || data.id || `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.id = this._id;
    this.name = data.name || "Campus Member";
    this.roll = data.roll || "";
    this.email = data.email || "";
    this.role = data.role || "student";
    this.rating = Math.min(5, Math.max(1, Number(data.rating || 5)));
    this.category = data.category || "Overall Experience";
    this.comment = data.comment || "";
    this.verifiedCampus = typeof data.verifiedCampus === 'boolean' ? data.verifiedCampus : true;
    this.itemName = data.itemName || "";
    this.itemId = data.itemId || "";
    this.createdAt = data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString();
  }

  async save() {
    if (mongoose.connection.readyState === 1) {
      const doc = new MongoReview(this);
      return doc.save();
    }
    const reviews = readLocalReviews();
    const existingIndex = reviews.findIndex(r => (r._id || r.id) === this._id);
    if (existingIndex >= 0) {
      reviews[existingIndex] = { ...this };
    } else {
      reviews.unshift({ ...this });
    }
    writeLocalReviews(reviews);
    return this;
  }

  static find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongoReview.find(query);
    }
    let reviews = readLocalReviews();
    if (query.role) {
      reviews = reviews.filter(r => r.role === query.role);
    }
    if (query.rating) {
      reviews = reviews.filter(r => Number(r.rating) === Number(query.rating));
    }
    const result = reviews.map(r => ({ ...r, _id: r._id || r.id, id: r._id || r.id }));

    return {
      sort(sortOpt) {
        if (sortOpt && sortOpt.createdAt === -1) {
          result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return Promise.resolve(result);
      },
      then(resolve, reject) {
        return Promise.resolve(result).then(resolve, reject);
      }
    };
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongoReview.findByIdAndDelete(id);
    }
    const reviews = readLocalReviews();
    const index = reviews.findIndex(r => (r._id || r.id) === id);
    if (index === -1) return null;
    const deleted = reviews.splice(index, 1)[0];
    writeLocalReviews(reviews);
    return deleted;
  }
}

module.exports = ReviewWrapper;
