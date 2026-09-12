const mongoose = require('mongoose');
const dns = require('dns');

// Fix Windows Node.js DNS SRV resolution for mongodb+srv:// Atlas connection
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/interviewkit';
    
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.warn(`[MongoDB Atlas] Connection warning: ${error.message}. Running in fallback mode.`);
  }
};

module.exports = connectDB;
