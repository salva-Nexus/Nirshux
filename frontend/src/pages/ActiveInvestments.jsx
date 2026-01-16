// frontend/src/pages/ActiveInvestment.jsx
import React from 'react';

const ActiveInvestments = ({ user }) => {
  const groupedInvestments = user?.activeInvestments?.reduce((acc, inv) => {
    if (inv.status !== 'active') return acc;
    
    if (!acc[inv.planName]) {
      acc[inv.planName] = { ...inv }; 
    } else {
      acc[inv.planName].amount += inv.amount;
      acc[inv.planName].accrued = (acc[inv.planName].accrued || 0) + (inv.accrued || 0);
      
      if (new Date(inv.endDate) > new Date(acc[inv.planName].endDate)) {
        acc[inv.planName].endDate = inv.endDate;
      }
    }
    return acc;
  }, {});

  const displayPlans = Object.values(groupedInvestments || {});

  if (displayPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
        <div className="text-5xl mb-4 opacity-20">📊</div>
        <h2 className="text-lg font-bold text-gray-500 uppercase tracking-wide">No Active Protocols</h2>
        <p className="text-gray-600 mt-2 font-mono text-xs">Awaiting capital deployment...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {displayPlans.map((plan, idx) => {
        const start = new Date(plan.startDate).getTime();
        const end = new Date(plan.endDate).getTime();
        const now = Date.now();
        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
        
        const realAccrued = (plan.accrued || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

        return (
          <div key={idx} className="bg-[#161A1E] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-nirshux-accent/30 transition-all">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-nirshux-accent/5 blur-[70px] rounded-full group-hover:bg-nirshux-accent/10 transition-all" />
            
            <div className="flex justify-between items-start mb-5 relative z-10">
              <div>
                <h3 className="text-nirshux-accent font-bold text-base tracking-tight uppercase">{plan.planName}</h3>
                <p className="text-[9px] text-gray-500 font-mono uppercase">Active Protocol</p>
              </div>
              <div className="bg-nirshux-accent/10 text-nirshux-accent px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border border-nirshux-accent/20">
                {plan.dailyRoi}% Daily
              </div>
            </div>

            <div className="space-y-5 relative z-10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-[9px] uppercase font-bold tracking-wide mb-1">Total Staked</p>
                  <p className="text-xl font-bold text-white">${plan.amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[9px] uppercase font-bold tracking-wide mb-1">Accrued</p>
                  <p className="text-xl font-bold text-green-400 font-mono">+${realAccrued}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] mb-2 font-bold uppercase tracking-wide text-gray-500">
                  <span>Progress</span>
                  <span className="text-nirshux-accent">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-nirshux-accent shadow-[0_0_12px_rgba(0,255,153,0.5)] transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[8px] font-mono font-bold text-gray-600 border-t border-white/5">
                <span>START: {new Date(plan.startDate).toLocaleDateString()}</span>
                <span>END: {new Date(plan.endDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActiveInvestments;