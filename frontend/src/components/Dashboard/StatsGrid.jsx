// frontend/src/components/Dashboard/StatsGrid.jsx
import React from 'react';

const StatsGrid = ({ userData }) => {
  const stats = [
    { label: "Total Invested", value: `$${(userData.totalInvested || 0).toLocaleString()}` },
    { label: "Amount Deposited", value: `$${(userData.balance + userData.totalInvested || 0).toLocaleString()}` },
    { label: "Total Earned", value: `$${(userData.totalEarned || 0).toLocaleString()}` },
    { label: "Total Withdrawn", value: `$${(userData.withdrawn || 0).toLocaleString()}` },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-[#161A1E] border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm"
        >
          <p className="text-gray-400 text-[11px] font-medium uppercase tracking-wider mb-2">
            {stat.label}
          </p>
          <p className="text-white text-xl font-bold">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;