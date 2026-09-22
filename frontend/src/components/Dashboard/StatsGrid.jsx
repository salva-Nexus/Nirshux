// frontend/src/components/Dashboard/StatsGrid.jsx
import React from "react";

const StatsGrid = ({ userData }) => {
  // "Amount Deposited" removed — it was computed as balance + totalInvested,
  // which isn't actually total deposited (and silently broke to $0 whenever
  // either field was undefined, since `undefined + n` is NaN and `NaN || 0`
  // masks it). Available Balance is now the headline stat instead, per the
  // single-source-of-truth balance model.
  const secondaryStats = [
    {
      label: "Total Invested",
      value: `$${(userData.totalInvested || 0).toLocaleString()}`,
    },
    {
      label: "Total Earned",
      value: `$${(userData.totalEarned || 0).toLocaleString()}`,
    },
    {
      label: "Total Withdrawn",
      value: `$${(userData.withdrawn || 0).toLocaleString()}`,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Available Balance — headline card, full width, accented */}
      <div className="bg-gradient-to-br from-nirshux-accent/10 to-[#161A1E] border border-nirshux-accent/30 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-[0_0_25px_rgba(0,242,195,0.08)]">
        <p className="text-nirshux-accent text-[11px] font-bold uppercase tracking-widest mb-2">
          Available Balance
        </p>
        <p className="text-white text-xl font-bold">
          ${(userData.balance || 0).toLocaleString()}
        </p>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {secondaryStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#161A1E] border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm"
          >
            <p className="text-white text-[11px] font-medium uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className="text-white text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}; //

export default StatsGrid;
