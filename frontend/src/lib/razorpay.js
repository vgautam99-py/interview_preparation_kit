import api from './api';

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function handleRazorpayCheckout({ plan = 'Pro', amount = 499, userDetails = {}, onSuccess, onError }) {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    if (onError) onError('Razorpay SDK failed to load. Check internet connection.');
    return;
  }

  try {
    const res = await api.post('/payments/create-order', { plan, amount });
    const { orderId, currency, keyId } = res.data;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || keyId || 'rzp_test_TJDLhHYMIThZhV',
      amount: Math.round(amount * 100),
      currency: currency || 'INR',
      name: 'ViperAI Interview Prep Kit',
      description: `Upgrade to ${plan} Plan — Unlimited AI Prep Kits & Practice Loops`,
      order_id: orderId,
      handler: async function (response) {
        try {
          const verifyRes = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
            amount
          });

          if (verifyRes.data.success) {
            if (onSuccess) onSuccess(verifyRes.data);
          } else {
            if (onError) onError('Payment signature verification failed.');
          }
        } catch (err) {
          if (onError) onError(err.response?.data?.error || 'Verification error.');
        }
      },
      prefill: {
        name: userDetails.name || 'Candidate',
        email: userDetails.email || ''
      },
      theme: {
        color: '#4f46e5'
      }
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  } catch (err) {
    if (onError) onError(err.response?.data?.error || 'Failed to create payment order.');
  }
}
