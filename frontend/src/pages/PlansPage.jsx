import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { handleRazorpayCheckout } from '../lib/razorpay';
import api from '../lib/api';
import { plansData } from '../data/plans';
import { CreditCard, CheckCircle2, Zap, ShieldCheck, Sparkles, Check, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlansPage() {
  const { user, setUser, refreshUserData } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [paymentMsg, setPaymentMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPlan = (user?.subscription || 'free').toLowerCase();

  const handleSelectPlanDirect = async (planId, planName) => {
    setLoadingPlan(planId);
    const loadId = toast.loading(`Switching your subscription to ${planName}...`);
    try {
      const res = await api.post('/payments/switch-plan', { plan: planId });
      if (res.data.user && setUser) {
        setUser(res.data.user);
      }
      await refreshUserData();
      toast.success(`Plan updated to ${planName}!`, { id: loadId });
      setPaymentMsg(`Active plan changed to ${planName} successfully!`);
    } catch (err) {
      toast.error('Failed to switch plan: ' + (err.response?.data?.error || err.message), { id: loadId });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleRazorpayUpgrade = (planId, planName, amountNum) => {
    if (amountNum === 0) {
      handleSelectPlanDirect(planId, planName);
      return;
    }

    setPaymentMsg(`Opening Razorpay Payment Modal for ${planName}...`);
    handleRazorpayCheckout({
      plan: planName,
      amount: amountNum,
      userDetails: { name: user?.name, email: user?.email },
      onSuccess: async (data) => {
        toast.success(`Payment verified! Upgraded to ${planName}.`);
        setPaymentMsg(`Payment successful! Upgraded to ${planName}.`);
        if (data?.user && setUser) {
          setUser(data.user);
        }
        await refreshUserData();
      },
      onError: (err) => {
        toast.error('Payment error: ' + err);
        setPaymentMsg('Payment error: ' + err);
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 ml-0 transition-all duration-300">
        <Navbar title="Subscription Plans & Kit Limits" onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 box-border">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Select Your Preparation Plan
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">Choose Any Plan Based On Your Needs</h2>
            <p className="text-xs text-slate-500">
              Select a plan to increase your AI prep kit generation limit. Razorpay checkout and instant upgrade options available below.
            </p>
          </div>

          {paymentMsg && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold text-center">
              {paymentMsg}
            </div>
          )}

          {/* 4 Subscription Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plansData.map((plan) => {
              const isActive = currentPlan === plan.id || (plan.id === 'ultra pro' && (currentPlan === 'ultra' || currentPlan === 'ultra pro'));
              const amountVal = Number(plan.price.replace('₹', ''));

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl p-6 border space-y-6 flex flex-col justify-between relative shadow-sm transition hover:shadow-md ${plan.borderStyle}`}
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      {plan.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${plan.badgeStyle}`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="text-3xl font-extrabold text-slate-900">
                      {plan.price} <span className="text-xs font-normal text-slate-400">{plan.period}</span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        ⚡ {plan.kits} Preparation Kits
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="space-y-2.5 pt-2 text-xs text-slate-700 font-medium">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {isActive ? (
                      <div className="w-full bg-emerald-50 text-emerald-700 font-bold py-3 rounded-xl text-xs text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 font-bold" /> Active Current Plan
                      </div>
                    ) : amountVal > 0 ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleRazorpayUpgrade(plan.id, plan.name, amountVal)}
                          className={`w-full font-extrabold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-md ${plan.buttonColor}`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Pay {plan.price} via Razorpay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleSelectPlanDirect(plan.id, plan.name)}
                          disabled={loadingPlan === plan.id}
                          className="w-full text-slate-500 hover:text-slate-800 font-bold py-1 text-[11px] transition text-center"
                        >
                          {loadingPlan === plan.id ? 'Switching...' : `Instant Demo Switch →`}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlanDirect(plan.id, plan.name)}
                        disabled={loadingPlan === plan.id}
                        className={`w-full font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-1.5 ${plan.buttonColor}`}
                      >
                        {loadingPlan === plan.id ? 'Switching...' : `Select ${plan.name}`}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
