import React from "react";

const money = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const StatsGrid = ({ userData }) => {
  const stats = [
    {
      label: "Total Invested",
      value: money(userData.totalInvested),
      icon: "◆",
    },
    { label: "Total Earned", value: money(userData.totalEarned), icon: "↗" },
    { label: "Total Withdrawn", value: money(userData.withdrawn), icon: "↑" },
  ];

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-nirshux-accent/20 bg-gradient-to-br from-nirshux-accent/[0.12] via-[#11161A] to-[#0D1013] p-5 md:p-6 shadow-[0_18px_55px_rgba(0,0,0,0.2)]">
        <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-nirshux-accent/[0.07] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-nirshux-accent/30 to-transparent" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-nirshux-accent shadow-[0_0_10px_rgba(0,242,195,0.8)]" />
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-nirshux-accent">
                Available Balance
              </p>
            </div>
            <p className="text-3xl md:text-4xl font-black tracking-[-0.04em] text-white">
              {money(userData.balance)}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
              Account liquidity
            </p>
            <p className="mt-1 text-[10px] font-bold text-gray-400">
              Ready to deploy
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-[1.5rem] border border-white/[0.06] bg-[#11161A] p-5
              transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.11]
              hover:bg-[#13191D] hover:shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.035] border border-white/[0.06] text-[11px] text-gray-500 group-hover:text-nirshux-accent group-hover:bg-nirshux-accent/10">
                {stat.icon}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-700">
                Portfolio
              </span>
            </div>
            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
              {stat.label}
            </p>
            <p className="mt-1.5 text-xl font-black tracking-tight text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsGrid;
