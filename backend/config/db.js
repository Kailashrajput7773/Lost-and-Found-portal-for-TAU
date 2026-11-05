const mongoose = require('mongoose');

let lastConnectionAttempt = 0;
let connectionAttemptPromise = null;
const RETRY_INTERVAL_MS = 30000; // Wait at least 30s before retrying failed connection

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  // If a connection attempt is already in flight, reuse the promise
  if (connectionAttemptPromise) {
    return connectionAttemptPromise;
  }

  // If recently attempted and failed, do not block incoming request threads
  const now = Date.now();
  if (now - lastConnectionAttempt < RETRY_INTERVAL_MS) {
    return;
  }

  lastConnectionAttempt = now;
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lostfound';

  connectionAttemptPromise = (async () => {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.warn(`⚠️  MongoDB not available at ${uri} (${error.message})`);
      console.log(`🚀 Standalone Mode Active: Running with persistent local storage (backend/data/items.json)`);
    } finally {
      connectionAttemptPromise = null;
    }
  })();

  return connectionAttemptPromise;
};

module.exports = connectDB;
