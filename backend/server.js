const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

dotenv.config();

const PORT = process.env.PORT || 5000;
const isVercel = !!process.env.VERCEL;
const UPLOAD_DIR = isVercel
  ? path.join(require('os').tmpdir(), 'uploads')
  : path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Notice: UPLOAD_DIR initialization:", e.message);
}

const app = express();

// Ensure database connection is ready for incoming requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    // continue (fallback handled by models)
  }
  next();
});

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(UPLOAD_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() }));
app.get("/api", (_, res) => res.json({ ok: true, name: "The Apollo University Lost & Found API", status: "operational" }));
app.get("/", (_, res) => res.json({ ok: true, name: "The Apollo University Lost & Found API", status: "operational" }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
