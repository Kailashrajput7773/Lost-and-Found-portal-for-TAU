const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lostfound';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB not available at ${uri} (${error.message})`);
    console.log(`🚀 Standalone Mode Active: Running with persistent local storage (backend/data/items.json)`);
  }
};

module.exports = connectDB;
