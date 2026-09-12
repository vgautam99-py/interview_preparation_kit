const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, switchPlan, getPaymentHistory } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/create-order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);
router.post('/switch-plan', authMiddleware, switchPlan);
router.get('/history', authMiddleware, getPaymentHistory);

module.exports = router;
