const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const kitRoutes = require('./routes/kitRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/payments', paymentRoutes);

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect Database & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Express API] Server listening on port ${PORT} (http://localhost:${PORT})`);
  });
});

module.exports = app;
