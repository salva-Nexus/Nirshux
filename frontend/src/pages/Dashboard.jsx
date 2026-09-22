import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { TickerTape } from "react-ts-tradingview-widgets";

import StatsGrid from "../components/Dashboard/StatsGrid";
import CoinChart from "../components/Dashboard/CoinChart";
import TransactionTable from "../components/Dashboard/TransactionTable";
import InvestmentModal from "../components/Dashboard/InvestmentModal";
import DepositModal from "../components/Dashboard/DepositModal";
import WithdrawalModal from "../components/WithdrawalModal";
import GrowthCircle from "../components/Dashboard/GrowthCircle";
import Sidebar from "../components/Dashboard/Sidebar";
import ActiveInvestments from "./ActiveInvestments";
import History from "../components/History";
import ProfileView from "./ProfileView";
import ChatWidget from "../components/ChatWidget";
import AdminChatWidget from "../components/AdminChatWidget";

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState("oversight");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [terminalMsg, setTerminalMsg] = useState("");
  const [isCalculatingRoi, setIsCalculatingRoi] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const triggerNotification = (msg) => {
    setTerminalMsg(msg);
    setTimeout(() => setTerminalMsg(""), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/signin";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/signin");
      return;
    }

    setIsCalculatingRoi(true);

    try {
      const res = await API.get("/api/investor/profile");
      setUserData(res.data);

      const hasVisitedBefore = localStorage.getItem("hasVisited");
      if (!hasVisitedBefore) {
        setIsFirstVisit(true);
        localStorage.setItem("hasVisited", "true");
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/signin");
    } finally {
      setIsCalculatingRoi(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isCalculatingRoi || !userData) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center text-white">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-nirshux-accent/10" />
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/[0.06] border-t-nirshux-accent" />
          <div className="absolute h-3 w-3 rounded-full bg-nirshux-accent shadow-[0_0_18px_rgba(0,242,195,0.8)]" />
        </div>
        <p className="mt-6 text-[9px] font-black uppercase tracking-[0.28em] text-nirshux-accent">
          Initializing terminal
        </p>
        <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-gray-700">
          Secure workspace loading
        </p>
      </div>
    );
  }

  const firstName = userData.fullName?.split(" ")[0] || "User";
  const referralLink = `${window.location.origin}/signup?ref=${userData.referralId}`;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white relative selection:bg-nirshux-accent selection:text-black">
      <style>{`
        .tradingview-widget-copyright { display: none !important; }
        .ticker-wrapper { height: 35px !important; overflow: hidden; }
      `}</style>

      {terminalMsg && (
        <div className="fixed left-1/2 top-20 z-[250] -translate-x-1/2 animate-in fade-in slide-in-from-top-3">
          <div className="rounded-full border border-nirshux-accent/20 bg-[#11161A] px-5 py-2.5 text-[8px] font-black uppercase tracking-[0.2em] text-nirshux-accent shadow-[0_15px_40px_rgba(0,0,0,0.4)]">
            ✓ {terminalMsg}
          </div>
        </div>
      )}

      <div className="fixed left-0 top-0 z-[170] h-[35px] w-full border-b border-white/[0.06] bg-[#0B0E11] ticker-wrapper">
        <TickerTape
          colorTheme="dark"
          symbols={[
            { proName: "BINANCE:BTCUSDT", title: "BTC" },
            { proName: "BINANCE:ETHUSDT", title: "ETH" },
          ]}
        />
      </div>

      <nav className="fixed left-0 top-[35px] z-[165] flex h-[62px] w-full items-center justify-between border-b border-white/[0.06] bg-[#0B0E11]/85 px-4 backdrop-blur-2xl md:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="xl:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]"
            aria-label="Toggle navigation"
          >
            <span className="text-nirshux-accent">☰</span>
          </button>

          <div>
            <div className="text-base font-black uppercase tracking-[-0.04em] text-nirshux-accent md:text-lg">
              Nirshux
            </div>
            <div className="hidden text-[7px] font-black uppercase tracking-[0.25em] text-gray-700 sm:block">
              Capital terminal
            </div>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.035] p-1.5 pr-3 transition hover:border-white/[0.12] hover:bg-white/[0.06]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nirshux-accent text-xs font-black text-black">
              {userData.fullName?.charAt(0)}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="max-w-[130px] truncate text-[9px] font-black uppercase text-white">
                {userData.fullName}
              </p>
              <p className="mt-0.5 text-[7px] font-black uppercase tracking-widest text-gray-600">
                {userData.role}
              </p>
            </div>
            <span className="text-[10px] text-gray-600">⌄</span>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-64 animate-in fade-in slide-in-from-top-2 rounded-2xl border border-white/[0.08] bg-[#11161A] p-2 shadow-[0_25px_70px_rgba(0,0,0,0.45)]">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">Available balance</p>
                <p className="mt-1.5 font-mono text-xl font-black text-nirshux-accent">
                  ${(userData.balance || 0).toLocaleString()}
                </p>
              </div>

              {userData.role === "admin" && (
                <button
                  onClick={() => navigate("/admin-panel")}
                  className="mt-2 w-full rounded-xl border border-nirshux-accent/10 bg-nirshux-accent/[0.06] p-3 text-left text-[8px] font-black uppercase tracking-widest text-nirshux-accent hover:bg-nirshux-accent/10"
                >
                  ⚡ Admin terminal
                </button>
              )}

              <button
                onClick={handleLogout}
                className="mt-1 w-full rounded-xl p-3 text-left text-[8px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/[0.06]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          openDeposit={() => setIsDepositOpen(true)}
          openInvest={() => setIsModalOpen(true)}
          openWithdraw={() => setIsWithdrawOpen(true)}
          setView={setView}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pb-24 pt-[118px] md:px-8 md:pt-[125px] xl:ml-[272px]">
          {view === "oversight" && (
            <div className="mx-auto max-w-[1500px] animate-in fade-in duration-500">
              <header className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-nirshux-accent shadow-[0_0_10px_rgba(0,242,195,0.8)]" />
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-nirshux-accent">
                      Portfolio overview
                    </span>
                  </div>
                  <h1 className="text-2xl font-black tracking-[-0.04em] text-white md:text-3xl">
                    {isFirstVisit ? `Welcome, ${firstName}` : `Welcome back, ${firstName}`}
                  </h1>
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-gray-600">
                    Your capital, performance and activity at a glance.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.18em] text-gray-600">
                    Network status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-nirshux-accent shadow-[0_0_9px_rgba(0,242,195,0.8)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-nirshux-accent">
                      Operational
                    </span>
                  </div>
                </div>
              </header>

              <StatsGrid userData={userData} />

              <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4">
                <div className="lg:col-span-2 xl:col-span-3">
                  <CoinChart />
                </div>

                <div className="space-y-5">
                  <GrowthCircle
                    totalInvested={userData.totalInvested || 0}
                    totalEarned={userData.totalEarned || 0}
                  />

                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#11161A] p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                          Referral network
                        </p>
                        <h3 className="mt-1 text-sm font-black uppercase text-white">Your link</h3>
                      </div>
                      <span className="text-nirshux-accent">◎</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-2.5">
                      <input
                        readOnly
                        value={referralLink}
                        className="min-w-0 flex-1 bg-transparent text-[8px] font-mono text-gray-500 outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(referralLink);
                          triggerNotification("Link copied");
                        }}
                        className="rounded-lg border border-nirshux-accent/10 bg-nirshux-accent/10 px-2.5 py-1.5 text-[7px] font-black uppercase text-nirshux-accent hover:bg-nirshux-accent hover:text-black"
                      >
                        Copy
                      </button>
                    </div>

                    <p className="mt-2 text-[8px] leading-relaxed text-gray-700">
                      Share your referral link to participate in the referral program.
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/[0.07] bg-[#11161A] p-5">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                      Quick action
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-3 flex w-full items-center justify-between rounded-xl bg-nirshux-accent px-4 py-3.5 text-left text-[9px] font-black uppercase tracking-[0.16em] text-black transition hover:shadow-[0_0_28px_rgba(0,242,195,0.18)]"
                    >
                      Deploy capital
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>

              <section className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#11161A] p-4 md:p-6">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Ledger</p>
                    <h3 className="mt-1 text-base font-black uppercase tracking-tight text-white">
                      Recent transactions
                    </h3>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Last 5</span>
                </div>
                <TransactionTable transactions={userData.transactions || []} limit={5} />
              </section>
            </div>
          )}

          {view === "active" && (
            <div className="mx-auto max-w-[1500px] animate-in slide-in-from-bottom-3 duration-500">
              <header className="mb-7">
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-nirshux-accent">Portfolio</p>
                <h1 className="mt-1 text-2xl font-black uppercase tracking-[-0.04em]">
                  Active <span className="text-nirshux-accent">stakes</span>
                </h1>
                <p className="mt-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-600">
                  Nirshux engine · protocol live
                </p>
              </header>
              <ActiveInvestments user={userData} />
            </div>
          )}

          {view === "history" && (
            <div className="mx-auto max-w-[1500px] animate-in slide-in-from-bottom-3 duration-500">
              <History />
            </div>
          )}

          {view === "profile" && (
            <div className="mx-auto max-w-[1500px] animate-in slide-in-from-bottom-3 duration-500">
              <ProfileView
                userData={userData}
                onRefresh={fetchDashboardData}
                triggerNotification={triggerNotification}
              />
            </div>
          )}

          {view === "referrals" && (
            <div className="flex min-h-[55vh] items-center justify-center">
              <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] px-10 py-12 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-nirshux-accent" />
                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Referral module offline
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <InvestmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refreshData={fetchDashboardData}
        disabledPlans={userData.disabledPlans || []}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        refreshData={fetchDashboardData}
      />

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        user={userData}
        onRefresh={() => {
          fetchDashboardData();
          triggerNotification("Withdrawal staged");
        }}
      />

      {userData.role === "admin" ? <AdminChatWidget /> : <ChatWidget />}
    </div>
  );
};

export default Dashboard;
