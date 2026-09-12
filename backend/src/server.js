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
// Dynamic CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    
    if (allowedOrigins.includes(cleanOrigin) || /\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }
    
    // Fallback: allow request to proceed cleanly
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Root & Health Check
app.get('/', (req, res) => {
  res.json({ message: 'ViperAI API Server is running successfully!', status: 'ok' });
});

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
