import React from "react";

const GrowthCircle = ({ totalInvested, totalEarned }) => {
  // Logic: How much have we earned relative to what we put in?
  const percentage =
    totalInvested > 0 ? Math.round((totalEarned / totalInvested) * 100) : 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/5 border border-white/10 rounded-3xl relative">
      <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">
        Network Growth
      </h4>

      <div className="relative flex items-center justify-center">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            strokeLinecap="round"
            fill="transparent"
            className="text-nirshux-accent shadow-[0_0_15px_rgba(0,242,195,0.5)]"
          />
        </svg>

        <div className="absolute text-center">
          <span className="text-3xl font-black text-white italic">
            {percentage}%
          </span>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
            Efficiency
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="inline-block px-3 py-1 bg-nirshux-accent/10 rounded-full border border-nirshux-accent/20">
          <p className="text-[10px] font-black text-nirshux-accent uppercase italic">
            + ${totalEarned.toLocaleString()} Yielded
          </p>
        </div>
      </div>
    </div>
  );
};

export default GrowthCircle;
