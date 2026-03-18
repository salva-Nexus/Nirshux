// frontend/src/components/Dashboard/InvestmentModal.jsx
import React, { useState } from 'react';
import API from '../../api';

const InvestmentModal = ({ isOpen, onClose, refreshData }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  if (!isOpen) return null;

  const plans = [
    { name: "STANDARD PLAN", min: 200, max: 499, roi: "2%", dailyValue: 2, duration: "7 Days", days: 7, icon: "📊" },
    { name: "PROMO PLAN", min: 500, max: 999, roi: "4.5%", dailyValue: 4.5, duration: "12 Days", days: 12, icon: "🚀", popular: true },
    { name: "PREMIUM PLAN", min: 1000, max: 4999, roi: "6.4%", dailyValue: 6.4, duration: "20 Days", days: 20, icon: "💎" },
    { name: "GOLD-MINING-PLAN", min: 5000, max: 9999, roi: "9%", dailyValue: 9, duration: "30 Days", days: 30, icon: "⚡" },
    { name: "NIRSHUX API PLAN", min: 10000, max: 1000000, roi: "17%", dailyValue: 17, duration: "Unlimited", days: "Unlimited", icon: "🔥" },
  ];

  const handleClose = () => {
    setSelectedPlan(null);
    setAmount('');
    setStatus({ type: '', msg: '' });
    onClose();
  };

  const handleInvest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    if (Number(amount) < selectedPlan.min) {
      setStatus({ type: 'error', msg: `Minimum investment is $${selectedPlan.min.toLocaleString()}` });
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/api/investor/invest', {
        amount: Number(amount),
        planName: selectedPlan.name,
        dailyRoi: selectedPlan.dailyValue,
        durationDays: selectedPlan.days 
      }, {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });

      setStatus({ type: 'success', msg: response.data.msg });
      setTimeout(() => {
        refreshData();
        handleClose();
      }, 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || "Transaction failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl overflow-y-auto outline-none">
      {/* FIX: Changed flex-center to flex-col + p-4/py-20. 
         This allows the modal to scroll naturally from the top rather than being 
         "stuck" behind the header ticker on mobile.
      */}
      <div className="min-h-screen flex flex-col items-center justify-start py-20 px-4">
        
        {/* FIX: Reduced max-w-5xl to max-w-4xl to prevent wide-screen stretching */}
        <div className="bg-[#161A1E] border border-white/10 w-full max-w-4xl rounded-[2rem] p-6 md:p-10 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">
                {selectedPlan ? 'Confirm Protocol' : 'Select Capital Plan'}
              </h2>
              <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
                {selectedPlan ? `Deploying to: ${selectedPlan.name}` : 'Institutional-grade returns powered by Nirshux Engine.'}
              </p>
            </div>
            <button 
              onClick={handleClose} 
              className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full text-white text-2xl transition-all"
            >
              &times;
            </button>
          </div>

          {status.msg && (
            <div className={`mb-6 p-4 rounded-xl text-xs font-black border uppercase tracking-widest ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-nirshux-accent/10 border-nirshux-accent/20 text-nirshux-accent'}`}>
              {status.msg}
            </div>
          )}

          {!selectedPlan ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {plans.map((plan, index) => (
                <div key={index} 
                  className={`relative bg-white/[0.02] border ${plan.popular ? 'border-nirshux-accent/40 shadow-[0_0_30px_rgba(0,255,163,0.05)]' : 'border-white/5'} p-6 rounded-[1.5rem] flex flex-col hover:border-nirshux-accent/40 transition-all group cursor-pointer`}
                  onClick={() => setSelectedPlan(plan)}>
                  
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-nirshux-accent text-black text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-tighter">
                      High Yield
                    </span>
                  )}
                  
                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className="text-gray-500 font-black text-[10px] uppercase tracking-widest mb-1">{plan.name}</h3>
                  <p className="text-white text-3xl font-black mb-4 italic">{plan.roi} <span className="text-[10px] text-gray-500 font-normal not-italic tracking-normal">DAILY</span></p>
                  
                  <div className="space-y-2 border-t border-white/5 pt-4 mb-6 text-[11px] font-bold">
                     <div className="flex justify-between"><span className="text-gray-600 uppercase">Min Stake</span><span className="text-white font-mono">${plan.min.toLocaleString()}</span></div>
                     <div className="flex justify-between"><span className="text-gray-600 uppercase">Lock Term</span><span className="text-white uppercase">{plan.duration}</span></div>
                  </div>
                  
                  <button className="w-full bg-white/5 text-white font-black py-3 rounded-xl group-hover:bg-nirshux-accent group-hover:text-black transition-all uppercase text-[10px] tracking-widest">
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto py-4">
              <form onSubmit={handleInvest} className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] text-center">
                  <label className="block text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6">Capital Allocation (USD)</label>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-black text-gray-600">$</span>
                    <input 
                      type="number" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`${selectedPlan.min}`}
                      className="bg-transparent text-5xl font-black text-nirshux-accent outline-none placeholder:text-white/20 placeholder:text-lg placeholder:uppercase placeholder:tracking-widest w-full max-w-[300px]"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    disabled={loading}
                    type="submit"
                    className="w-full bg-nirshux-accent text-black font-black py-5 rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,163,0.3)] transition-all uppercase tracking-widest text-sm disabled:opacity-50"
                  >
                    {loading ? 'Initializing...' : `Execute $${Number(amount || 0).toLocaleString()} Stake`}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="w-full bg-transparent text-gray-600 font-black py-3 text-[10px] uppercase tracking-widest hover:text-white transition-all"
                  >
                    Return to Plans
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
