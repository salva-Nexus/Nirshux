// frontend/src/pages/Dashboard.jsx
// ── ONLY CHANGE: root div class changed from
//    "bg-[#0B0E11] min-h-screen text-white overflow-x-hidden relative"
//    to
//    "bg-[#0B0E11] min-h-screen text-white relative"
//
// overflow-x-hidden creates a new stacking context that clips position:fixed children
// on Chrome/Safari, breaking the chat widget positioning.
//
// Horizontal overflow is still contained by the inner <main> element.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { TickerTape } from "react-ts-tradingview-widgets";

import StatsGrid from '../components/Dashboard/StatsGrid';
import CoinChart from '../components/Dashboard/CoinChart';
import TransactionTable from '../components/Dashboard/TransactionTable';
import InvestmentModal from '../components/Dashboard/InvestmentModal';
import DepositModal from '../components/Dashboard/DepositModal';
import WithdrawalModal from '../components/WithdrawalModal';
import GrowthCircle from '../components/Dashboard/GrowthCircle';
import Sidebar from '../components/Dashboard/Sidebar';
import ActiveInvestments from './ActiveInvestments';
import History from '../components/History';
import ProfileView from './ProfileView';
import ChatWidget from '../components/ChatWidget';
import AdminChatWidget from '../components/AdminChatWidget';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState('oversight');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [terminalMsg, setTerminalMsg] = useState('');
  const [isCalculatingRoi, setIsCalculatingRoi] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const triggerNotification = (msg) => {
    setTerminalMsg(msg);
    setTimeout(() => setTerminalMsg(''), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/signin';
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    setIsCalculatingRoi(true);

    try {
      const res = await API.get('/api/investor/profile');
      setUserData(res.data);

      const hasVisitedBefore = localStorage.getItem('hasVisited');
      if (!hasVisitedBefore) {
        setIsFirstVisit(true);
        localStorage.setItem('hasVisited', 'true');
      }
    } catch (err) {
      if (err.response?.status === 401) navigate('/signin');
    } finally {
      setIsCalculatingRoi(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isCalculatingRoi || !userData) return (
    <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-nirshux-accent/20 border-t-nirshux-accent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-nirshux-accent/30 border-b-nirshux-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
      </div>
      <p className="text-nirshux-accent font-mono uppercase tracking-wide text-xs font-bold animate-pulse">LOADING...</p>
      <p className="text-gray-600 font-mono text-[10px] uppercase tracking-wider mt-2">Please Wait...</p>
    </div>
  );

  const firstName = userData.fullName?.split(' ')[0] || 'User';

  return (
    // ✅ FIX: removed overflow-x-hidden — it creates a stacking context that clips
    // position:fixed children (chat widget) on Chrome/Safari.
    // Horizontal scroll is still prevented by the inner max-w containers.
    <div className="bg-[#0B0E11] min-h-screen text-white relative">
      <style>{`
        .tradingview-widget-copyright { display: none !important; }
        .ticker-wrapper { height: 35px !important; overflow: hidden; }
      `}</style>

      {terminalMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-nirshux-accent text-black px-5 py-2 font-mono text-[9px] font-bold uppercase tracking-wide animate-in fade-in slide-in-from-top-4 duration-300">
          ⚡ {terminalMsg}
        </div>
      )}

      <div className="fixed top-0 left-0 w-full z-[170] border-b border-white/5 bg-[#0B0E11] ticker-wrapper">
        <TickerTape
          colorTheme="dark"
          symbols={[
            { proName: "BINANCE:BTCUSDT", title: "BTC" },
            { proName: "BINANCE:ETHUSDT", title: "ETH" },
          ]}
        />
      </div>

      <nav className="fixed top-[35px] left-0 w-full flex justify-between items-center px-4 md:px-10 bg-[#0B0E11]/95 backdrop-blur-md z-[165] border-b border-white/5 h-[55px] md:h-[60px]">
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarOpen(!isSidebarOpen);
            }}
            className="xl:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="w-5 h-[1.5px] bg-nirshux-accent mb-1"></div>
            <div className="w-5 h-[1.5px] bg-nirshux-accent mb-1"></div>
            <div className="w-3 h-[1.5px] bg-nirshux-accent"></div>
          </button>
          <div className="text-lg md:text-xl font-bold text-nirshux-accent tracking-tight uppercase">
            Nirshux
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 md:gap-3 bg-white/5 p-1 md:p-1.5 pr-3 md:pr-4 rounded-full border border-white/10 hover:bg-white/10 transition-all"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-nirshux-accent text-black flex items-center justify-center font-bold text-xs">
              {userData.fullName?.charAt(0)}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-[10px] md:text-xs font-bold truncate max-w-[120px]">
                {userData.fullName}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-tight">
                {userData.role}
              </p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-[#161A1E] border border-white/10 rounded-2xl shadow-2xl p-2 z-[170] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-white/5 mb-2">
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                  Available Balance
                </p>
                <p className="text-lg font-mono text-nirshux-accent">
                  ${userData.balance?.toLocaleString() || "0.00"}
                </p>
              </div>
              {userData.role === "admin" && (
                <button
                  onClick={() => navigate("/admin-panel")}
                  className="w-full text-left p-3 text-nirshux-accent bg-nirshux-accent/10 rounded-xl text-xs font-bold mb-2 hover:bg-nirshux-accent/20 transition-all uppercase flex items-center gap-2"
                >
                  ⚡ Admin Terminal
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left p-3 text-red-400 hover:bg-red-400/10 rounded-xl text-xs transition-all font-bold"
              >
                Sign Out
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

        <main className="flex-1 px-4 md:px-8 pt-[100px] md:pt-[120px] xl:ml-64 max-w-[1600px] mx-auto pb-24 transition-all overflow-x-hidden">
          {view === "oversight" && (
            <div className="animate-in fade-in duration-500">
              <header className="mb-6 relative z-10">
                <h1 className="text-sm md:text-base font-medium text-gray-300">
                  {isFirstVisit
                    ? `Welcome, ${firstName}`
                    : `Welcome back, ${firstName}`}
                </h1>
                <p className="text-gray-600 mt-1 text-[10px] uppercase tracking-tight">
                  Here's a look at your performance and analytics.
                </p>
              </header>

              <StatsGrid userData={userData} />

              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
                <div className="lg:col-span-2 xl:col-span-3">
                  <CoinChart />
                </div>
                <div className="space-y-5">
                  <GrowthCircle
                    totalInvested={userData.totalInvested || 0}
                    totalEarned={userData.totalEarned || 0}
                  />

                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl">
                    <h3 className="font-bold mb-3 uppercase text-[9px] tracking-wide text-gray-400">
                      Your Referral Link
                    </h3>
                    <div className="flex items-center gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                      <input
                        readOnly
                        value={`${window.location.origin}/signup?ref=${userData.referralId}`}
                        className="bg-transparent text-[9px] font-mono text-nirshux-accent outline-none w-full"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/signup?ref=${userData.referralId}`,
                          );
                          triggerNotification("LINK COPIED");
                        }}
                        className="text-[9px] font-bold hover:text-nirshux-accent transition-colors uppercase"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-[8px] text-gray-500 mt-2.5 leading-tight uppercase font-mono">
                      Earn commissions on referrals.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl text-center">
                    <h3 className="font-bold mb-3 uppercase text-[10px] tracking-wide text-gray-400 text-left">
                      Action Center
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="w-full py-3.5 bg-nirshux-accent text-black font-bold rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-wide text-xs"
                    >
                      Deploy Capital
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-10 bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 overflow-hidden">
                <h3 className="text-base font-bold mb-5 uppercase">
                  Recent Transactions
                </h3>
                <TransactionTable
                  transactions={userData.transactions || []}
                  limit={5}
                />
              </div>
            </div>
          )}

          {view === "active" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <header className="mb-6 md:mb-8 relative z-10">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase leading-none">
                  ACTIVE <span className="text-nirshux-accent">STAKES</span>
                </h1>
                <p className="text-gray-500 mt-1.5 text-[9px] md:text-[10px] font-mono tracking-wide uppercase">
                  Nirshux Engine // Protocol Live
                </p>
              </header>
              <ActiveInvestments user={userData} />
            </div>
          )}

          {view === "history" && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <History />
            </div>
          )}

          {view === "profile" && (
            <ProfileView
              userData={userData}
              onRefresh={fetchDashboardData}
              triggerNotification={triggerNotification}
            />
          )}

          {view === "referrals" && (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="w-10 h-10 border-2 border-nirshux-accent/20 border-t-nirshux-accent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 font-mono text-[9px] uppercase tracking-wide">
                Referral Module Offline
              </p>
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
          triggerNotification("WITHDRAWAL STAGED");
        }}
      />

      {/* Chat widget — rendered OUTSIDE the flex/main layout to ensure fixed positioning works */}
      {userData.role === "admin" ? <AdminChatWidget /> : <ChatWidget />}
    </div>
  );
};

export default Dashboard;
