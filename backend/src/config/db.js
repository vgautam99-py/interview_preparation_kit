const mongoose = require('mongoose');

let connectPromise = null;
let lastFailTime = 0;
const FAIL_COOLDOWN_MS = 15000; // 15s cooldown if DB connection fails

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection attempt failed recently, don't hang requests with repetitive timeouts
  if (Date.now() - lastFailTime < FAIL_COOLDOWN_MS) {
    return null;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewkit';
      
      const conn = await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 3000,
        socketTimeoutMS: 45000,
      });
      
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
      connectPromise = null;
      return conn;
    } catch (error) {
      connectPromise = null;
      lastFailTime = Date.now();
      console.warn(`[MongoDB] Connection warning: ${error.message}. Running in fast fallback mode.`);
      return null;
    }
  })();

  return connectPromise;
};

module.exports = connectDB;

