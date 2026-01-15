// StatsGrid.jsx
import React from 'react';

const StatsGrid = ({ userData }) => {
  // We add default values (0) so the app doesn't crash if data is loading
  const stats = [
    { label: "TOTAL INVESTED", value: userData?.totalInvested || 0, color: "text-white" },
    { label: "AMOUNT DEPOSITED", value: userData?.balance || 0, color: "text-white" },
    { label: "TOTAL EARNED", value: userData?.totalEarned || 0, color: "text-white" },
    { label: "TOTAL WITHDRAWN", value: userData?.withdrawn || 0, color: "text-white" },
    { label: "TOTAL REFERRAL EARNINGS", value: userData?.referralBalance || 0, color: "text-nirshux-accent" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-nirshux-accent/50 transition-colors">
          <p className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">{stat.label}</p>
          <h3 className={`text-2xl font-bold ${stat.color}`}>
            ${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;