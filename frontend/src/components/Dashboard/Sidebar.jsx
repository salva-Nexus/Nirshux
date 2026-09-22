import React from "react";

const Sidebar = ({
  isOpen,
  setIsOpen,
  openDeposit,
  openInvest,
  openWithdraw,
  setView,
}) => {
  const menuItems = [
    {
      id: "oversight",
      label: "Overview",
      icon: "◈",
      action: () => setView("oversight"),
    },
    { id: "deposit", label: "Deposit", icon: "↓", action: openDeposit },
    { id: "withdraw", label: "Withdraw", icon: "↑", action: openWithdraw },
    { id: "invest", label: "Invest", icon: "◆", action: openInvest },
    {
      id: "active",
      label: "Active Plans",
      icon: "◉",
      action: () => setView("active"),
    },
    {
      id: "history",
      label: "History",
      icon: "◷",
      action: () => setView("history"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: "○",
      action: () => setView("profile"),
    },
    {
      id: "referrals",
      label: "Referrals",
      icon: "◎",
      action: () => setView("referrals"),
    },
  ];

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 bg-black/70 backdrop-blur-[3px] z-[145] xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 h-screen w-[272px] z-[148]",
          "bg-[#0B0E11]/95 backdrop-blur-2xl border-r border-white/[0.07]",
          "px-4 pt-[112px] pb-6 transition-transform duration-300 ease-out",
          "shadow-[20px_0_60px_rgba(0,0,0,0.25)]",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "xl:translate-x-0",
        ].join(" ")}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nirshux-accent/60 to-transparent" />

        <div className="px-3 mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gray-600">
            Workspace
          </p>
          <p className="mt-1 text-[11px] font-bold text-gray-400">
            Capital terminal
          </p>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className="group relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-left
                text-gray-500 hover:text-white hover:bg-white/[0.045]
                border border-transparent hover:border-white/[0.06] transition-all duration-200"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                bg-white/[0.035] border border-white/[0.06] text-sm text-gray-500
                group-hover:bg-nirshux-accent/10 group-hover:border-nirshux-accent/20
                group-hover:text-nirshux-accent transition-all"
              >
                {item.icon}
              </span>

              <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                {item.label}
              </span>

              <span className="ml-auto text-gray-700 group-hover:text-nirshux-accent transition-colors">
                →
              </span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 rounded-2xl border border-nirshux-accent/10 bg-nirshux-accent/[0.035] p-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-nirshux-accent shadow-[0_0_12px_rgba(0,242,195,0.8)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-nirshux-accent">
              Engine online
            </span>
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-gray-600">
            Secure portfolio workspace
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
