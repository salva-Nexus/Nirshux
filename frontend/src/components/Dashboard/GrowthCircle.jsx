import React from "react";

const GrowthCircle = ({ totalInvested, totalEarned }) => {
  const percentage =
    totalInvested > 0 ? Math.round((totalEarned / totalInvested) * 100) : 0;

  const displayPercentage = Math.max(0, percentage);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(displayPercentage, 100) / 100) * circumference;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#11161A] p-6 md:p-7">
      <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-nirshux-accent/[0.05] blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-gray-600">
              Performance
            </p>
            <h4 className="mt-1 text-sm font-bold uppercase tracking-tight text-white">
              Network Growth
            </h4>
          </div>
          <span className="rounded-full border border-nirshux-accent/15 bg-nirshux-accent/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-nirshux-accent">
            Live
          </span>
        </div>

        <div className="relative mx-auto mt-6 flex h-44 w-44 items-center justify-center">
          <div className="absolute inset-3 rounded-full border border-nirshux-accent/5" />
          <svg className="h-44 w-44 -rotate-90">
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-white/[0.045]"
            />
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="text-nirshux-accent"
              style={{
                transition:
                  "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                filter: "drop-shadow(0 0 7px rgba(0,242,195,0.35))",
              }}
            />
          </svg>

          <div className="absolute text-center">
            <span className="block text-4xl font-black tracking-[-0.05em] text-white">
              {displayPercentage}%
            </span>
            <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
              Yield ratio
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/15 px-3.5 py-3">
          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-600">
            Total yielded
          </span>
          <span className="text-[10px] font-black text-nirshux-accent">
            +${Number(totalEarned || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GrowthCircle;
