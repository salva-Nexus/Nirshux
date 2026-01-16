// frontend/src/components/Dashboard/StatsGrid.jsx
import React from 'react';

const StatsGrid = ({ userData }) => {
  const stats = [
    { label: "Total Invested", value: `$${(userData.totalInvested || 0).toLocaleString()}`, icon: "💼", color: "text-blue-400" },
    { label: "Amount Deposited", value: `$${(userData.balance + userData.totalInvested || 0).toLocaleString()}`, icon: "💳", color: "text-green-400" },
    { label: "Total Earned", value: `$${(userData.totalEarned || 0).toLocaleString()}`, icon: "📈", color: "text-nirshux-accent" },
    { label: "Total Withdrawn", value: `$${(userData.withdrawn || 0).toLocaleString()}`, icon: "💸", color: "text-purple-400" },
    { label: "Referral Earnings", value: `$${(userData.referralBalance || 0).toLocaleString()}`, icon: "👥", color: "text-yellow-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl hover:bg-white/[0.07] transition-all text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-lg">{stat.icon}</span>
            <p className="text-white text-[10px] font-bold uppercase tracking-wide">{stat.label}</p>
          </div>
          <p className={`${stat.color} text-xl md:text-2xl font-bold font-mono`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;