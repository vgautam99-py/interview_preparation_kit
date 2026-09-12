const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  plan: { type: String, default: 'Pro' },
  status: { type: String, default: 'captured' },
  date: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  profilePicture: { type: String, default: '' },
  avatar: { type: String, default: 'avatar1' },
  gender: { type: String, enum: ['male', 'female', 'other', 'unspecified'], default: 'unspecified' },
  dob: { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  subscription: {
    type: String,
    enum: ['free', 'mid', 'pro', 'ultra', 'ultra pro'],
    default: 'free'
  },
  paymentHistory: [paymentHistorySchema],
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
