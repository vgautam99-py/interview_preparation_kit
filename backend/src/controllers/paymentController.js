const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJDLhHYMIThZhV',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dMOMzvtdhBdOqy8wuU1YjQmX'
});

async function createOrder(req, res) {
  const { plan = 'Pro', amount = 299 } = req.body;

  try {
    const options = {
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: {
        userId: req.user.userId,
        plan
      }
    };

    const order = await instance.orders.create(options);
    logger.info(`[Razorpay] Created order ${order.id} for user ${req.user.userId} (${plan}, ₹${amount})`);

    res.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJDLhHYMIThZhV'
    });
  } catch (err) {
    logger.error(`[Razorpay] Order creation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create payment order: ' + err.message });
  }
}

async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan = 'Pro', amount = 299 } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required Razorpay verification fields.' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dMOMzvtdhBdOqy8wuU1YjQmX';

  try {
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      logger.warn(`[Razorpay] Invalid payment signature for order ${razorpay_order_id}`);
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    const userId = req.user?.userId || req.user?.id || 'demo_user';
    let user = null;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      if (!user && req.user?.email) {
        user = await User.findOne({ email: req.user.email });
      }
    }

    let subscriptionLevel = 'free';
    const pLower = (plan || '').toLowerCase();
    if (pLower.includes('ultra')) subscriptionLevel = 'ultra pro';
    else if (pLower.includes('pro')) subscriptionLevel = 'pro';
    else if (pLower.includes('mid')) subscriptionLevel = 'mid';
    else subscriptionLevel = 'free';

    if (user) {
      user.subscription = subscriptionLevel;
      if (!user.paymentHistory) user.paymentHistory = [];
      user.paymentHistory.unshift({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: Number(amount),
        currency: 'INR',
        plan,
        status: 'captured',
        date: new Date()
      });
      await user.save();
    }

    logger.info(`[Razorpay] Payment verified for user ${userId}. Plan upgraded to ${subscriptionLevel.toUpperCase()}.`);

    res.json({
      success: true,
      message: `Payment verified and subscription upgraded to ${subscriptionLevel.toUpperCase()}!`,
      user: user ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture || '',
        avatar: user.avatar || 'avatar1',
        gender: user.gender || 'unspecified',
        dob: user.dob || '',
        subscription: user.subscription,
        paymentHistory: user.paymentHistory
      } : {
        id: userId,
        name: req.user?.name || 'User',
        email: req.user?.email || 'user@example.com',
        isVerified: true,
        profilePicture: '',
        avatar: 'avatar1',
        gender: 'unspecified',
        dob: '',
        subscription: subscriptionLevel,
        paymentHistory: [{
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: Number(amount),
          currency: 'INR',
          plan,
          status: 'captured',
          date: new Date()
        }]
      }
    });

  } catch (err) {
    logger.error(`[Razorpay] Verification error: ${err.message}`);
    res.status(500).json({ error: 'Payment verification failed: ' + err.message });
  }
}

async function switchPlan(req, res) {
  const { plan } = req.body;
  const validPlans = ['free', 'mid', 'pro', 'ultra', 'ultra pro'];
  const targetPlan = (plan || '').toLowerCase();
  if (!validPlans.includes(targetPlan)) {
    return res.status(400).json({ error: 'Invalid plan selected.' });
  }

  try {
    const userId = req.user?.userId || req.user?.id || 'demo_user';
    let user = null;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }
      if (!user && req.user?.email) {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (user) {
      user.subscription = targetPlan;
      await user.save();
    }

    logger.info(`[Plan Switch] User ${userId} switched plan to ${targetPlan.toUpperCase()}`);

    res.json({
      success: true,
      message: `Successfully switched plan to ${targetPlan.toUpperCase()}!`,
      user: user ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture || '',
        avatar: user.avatar || 'avatar1',
        gender: user.gender || 'unspecified',
        dob: user.dob || '',
        subscription: user.subscription,
        paymentHistory: user.paymentHistory || []
      } : {
        id: userId,
        name: req.user?.name || 'User',
        email: req.user?.email || 'user@example.com',
        isVerified: true,
        profilePicture: '',
        avatar: 'avatar1',
        gender: 'unspecified',
        dob: '',
        subscription: targetPlan,
        paymentHistory: []
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to switch plan: ' + err.message });
  }
}

async function getPaymentHistory(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).select('subscription paymentHistory');
      }
      if (!user && req.user?.email) {
        user = await User.findOne({ email: req.user.email }).select('subscription paymentHistory');
      }
    }
    res.json({
      subscription: user?.subscription || 'free',
      history: user?.paymentHistory || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createOrder, verifyPayment, switchPlan, getPaymentHistory };
