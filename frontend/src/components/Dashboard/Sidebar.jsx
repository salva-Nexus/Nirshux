// Sidebar.jsx
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
      label: "Oversight",
      icon: "📊",
      action: () => setView("oversight"),
    },
    { id: "deposit", label: "Deposit", icon: "📥", action: openDeposit },
    { id: "withdraw", label: "Withdraw", icon: "📤", action: openWithdraw },
    { id: "invest", label: "Invest", icon: "💰", action: openInvest },
    {
      id: "active",
      label: "Active Plans",
      icon: "⚡",
      action: () => setView("active"),
    },
    {
      id: "history",
      label: "History",
      icon: "📜",
      action: () => setView("history"),
    },
    {
      id: "profile",
      label: "View Profile",
      icon: "👤",
      action: () => setView("profile"),
    },
    {
      id: "referrals",
      label: "Referrals",
      icon: "👥",
      action: () => setView("referrals"),
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[145] xl:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FIX: top-0 instead of top-[110px] makes the sidebar reach the very top.
         pt-[120px] ensures the buttons start below the Ticker and Nav.
      */}
      <aside
        className={`
        fixed left-0 top-0 h-screen w-64 bg-[#0B0E11] border-r border-white/5 
        px-6 pt-[130px] z-[148] transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        xl:translate-x-0
      `}
      >
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-white/5 text-gray-400 hover:text-nirshux-accent font-bold text-xs uppercase tracking-widest group transition-all"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
