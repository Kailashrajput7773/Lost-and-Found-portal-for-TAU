const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5001;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(UPLOAD_DIR));

app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (_, res) => res.json({ ok: true, name: "MERN Lost & Found API" }));

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another application.`);
    console.error(`💡 Tip: On macOS, disable AirPlay Receiver under System Settings > General > AirDrop & AirPlay.\n`);
  } else {
    console.error('Server error:', err);
  }
});
