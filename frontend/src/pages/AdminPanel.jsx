// frontend/src/pages/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
  const [newWallet, setNewWallet] = useState({ coinName: '', symbol: '', network: '', address: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('deposits');

  const [adjustingUser, setAdjustingUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjustingEarnedUser, setAdjustingEarnedUser] = useState(null);
  const [adjEarnedAmount, setAdjEarnedAmount] = useState('');
  const [purgingUser, setPurgingUser] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 4000);
  };

  // ── Auth check: fetch /api/investor/profile to confirm role, don't rely on
  //    stale localStorage. This fixes the "redirected back to dashboard on fresh
  //    login" race-condition where the parent ProtectedRoute reads localStorage
  //    before the auth context has hydrated.
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/signin'); return; }
      try {
        const res = await API.get('/api/investor/profile');
        if (res.data.role !== 'admin') { navigate('/dashboard'); return; }
        setAuthChecked(true);
      } catch {
        navigate('/signin');
      }
    };
    verify();
  }, [navigate]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [depRes, withRes, userRes, wallRes] = await Promise.all([
        API.get('/api/admin/pending-deposits'),
        API.get('/api/admin/pending-withdrawals'),
        API.get('/api/admin/users'),
        API.get('/api/admin/wallets'),
      ]);
      setPendingDeposits(depRes.data);
      setPendingWithdrawals(withRes.data);
      setUsers(userRes.data);
      setWallets(wallRes.data);
    } catch {
      if (!silent) showToast('SYNC_ERROR', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [authChecked, fetchData]);

  const executeAdjustment = async (userId, mode) => {
    const amountNum = parseFloat(adjAmount);
    if (!adjAmount || isNaN(amountNum)) return showToast('INVALID_INPUT', 'error');
    const finalVal = mode === 'sub' ? -Math.abs(amountNum) : Math.abs(amountNum);
    try {
      await API.put(`/api/admin/user/adjust-balance/${userId}`, { amount: finalVal });
      showToast('BALANCE UPDATED', 'success');
      setAdjustingUser(null);
      setAdjAmount('');
      fetchData(true);
    } catch { showToast('UPDATE FAILED', 'error'); }
  };

  const executeEarnedAdjustment = async (userId, mode) => {
    const amountNum = parseFloat(adjEarnedAmount);
    if (!adjEarnedAmount || isNaN(amountNum)) return showToast('INVALID_INPUT', 'error');
    const finalVal = mode === 'sub' ? -Math.abs(amountNum) : Math.abs(amountNum);
    try {
      await API.put(`/api/admin/user/adjust-total-earned/${userId}`, { amount: finalVal });
      showToast('EARNINGS UPDATED', 'success');
      setAdjustingEarnedUser(null);
      setAdjEarnedAmount('');
      fetchData(true);
    } catch { showToast('UPDATE FAILED', 'error'); }
  };

  const handleDepositAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/api/admin/deposit/approve/${id}` : `/api/admin/deposit/reject/${id}`;
      await API.put(endpoint, {});
      showToast(action === 'approve' ? 'DEPOSIT APPROVED' : 'DEPOSIT REJECTED', 'success');
      fetchData(true);
    } catch { showToast('ACTION FAILED', 'error'); }
  };

  const handleWithdrawalAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/api/admin/withdrawal/approve/${id}` : `/api/admin/withdrawal/reject/${id}`;
      await API.put(endpoint, {});
      showToast(action === 'approve' ? 'PAYOUT EXECUTED' : 'WITHDRAWAL REJECTED', 'success');
      fetchData(true);
    } catch (err) { showToast(err.response?.data?.msg || 'ACTION FAILED', 'error'); }
  };

  const handleWhitelist = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/whitelist-wallet', newWallet);
      showToast('ASSET AUTHORIZED', 'success');
      setNewWallet({ coinName: '', symbol: '', network: '', address: '' });
      fetchData();
    } catch { showToast('AUTHORIZATION FAILED', 'error'); }
  };

  const deListWallet = async (id) => {
    try {
      await API.delete(`/api/admin/wallet/${id}`);
      showToast('ASSET REMOVED', 'success');
      fetchData();
    } catch { showToast('REMOVAL FAILED', 'error'); }
  };

  const executeWipe = async (id) => {
    try {
      await API.delete(`/api/admin/user/${id}`);
      showToast('USER DELETED', 'success');
      setPurgingUser(null);
      fetchData();
    } catch { showToast('DELETE FAILED', 'error'); }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#080A0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-nirshux-accent/20 border-t-nirshux-accent rounded-full animate-spin" />
          <p className="text-nirshux-accent font-mono text-[10px] uppercase tracking-widest animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'deposits', label: 'Deposits', count: pendingDeposits.length },
    { id: 'withdrawals', label: 'Withdrawals', count: pendingWithdrawals.length },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'assets', label: 'Assets', count: wallets.length },
  ];

  return (
    <div className="min-h-screen bg-[#080A0D] text-white font-sans">

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-5 duration-300 ${
          toast.type === 'error'
            ? 'bg-red-950/80 border-red-500/30 text-red-400'
            : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}

      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080A0D]/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-nirshux-accent flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-none">Admin Panel</h1>
              <p className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mt-0.5">
                {isSyncing ? (
                  <span className="text-nirshux-accent animate-pulse">● Syncing</span>
                ) : (
                  <span className="text-emerald-500">● Online</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1 pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-t-xl ${
                activeTab === tab.id
                  ? 'text-nirshux-accent bg-[#0F1318]'
                  : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                  activeTab === tab.id
                    ? 'bg-nirshux-accent/20 text-nirshux-accent'
                    : 'bg-white/10 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-nirshux-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">

        {/* ── DEPOSITS TAB ── */}
        {activeTab === 'deposits' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Pending Deposits</h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">Awaiting verification & approval</p>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-mono text-[11px] font-bold uppercase">{pendingDeposits.length} Pending</span>
              </div>
            </div>

            {pendingDeposits.length === 0 ? (
              <EmptyState icon="📥" label="No pending deposits" />
            ) : (
              <div className="grid gap-3">
                {pendingDeposits.map(d => (
                  <div key={d._id} className="group bg-[#0F1318] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-nirshux-accent/10 border border-nirshux-accent/20 flex items-center justify-center">
                          <span className="text-nirshux-accent font-black text-base">{d.user?.fullName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">{d.user?.fullName}</p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase">{d.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Asset</p>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-nirshux-accent text-black text-[9px] font-black px-2 py-0.5 rounded uppercase">{d.coin}</span>
                            <span className="text-gray-500 text-[9px] font-mono">{d.network}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Amount</p>
                          <p className="font-mono font-black text-nirshux-accent text-lg">${d.amount?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDepositAction(d._id, 'approve')}
                            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-emerald-500/20 hover:border-emerald-500"
                          >
                            <span>✓</span> Approve
                          </button>
                          <button
                            onClick={() => handleDepositAction(d._id, 'reject')}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-500"
                          >
                            <span>✕</span> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── WITHDRAWALS TAB ── */}
        {activeTab === 'withdrawals' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Pending Withdrawals</h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">Outgoing payouts awaiting execution</p>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 font-mono text-[11px] font-bold uppercase">{pendingWithdrawals.length} Queued</span>
              </div>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <EmptyState icon="📤" label="No pending withdrawals" />
            ) : (
              <div className="grid gap-3">
                {pendingWithdrawals.map(w => (
                  <div key={w._id} className="group bg-[#0F1318] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <span className="text-orange-400 font-black text-base">{w.user?.fullName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">{w.user?.fullName}</p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase">{w.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Asset & Network</p>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-orange-500/20 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">{w.coin}</span>
                            <span className="text-gray-500 text-[9px] font-mono">{w.network}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Destination</p>
                          <p className="text-[10px] font-mono text-gray-400 max-w-[160px] truncate">{w.addressUsed}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Amount</p>
                          <p className="font-mono font-black text-white text-lg">${w.amount?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleWithdrawalAction(w._id, 'approve')}
                            className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-orange-500/20 hover:border-orange-500"
                          >
                            ↑ Pay Out
                          </button>
                          <button
                            onClick={() => handleWithdrawalAction(w._id, 'reject')}
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-500"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">User Registry</h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">{users.length} registered accounts</p>
              </div>
            </div>

            {users.length === 0 ? (
              <EmptyState icon="👤" label="No users registered" />
            ) : (
              <div className="grid gap-3">
                {users.map(u => (
                  <div key={u._id} className="bg-[#0F1318] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all">

                    {/* User Row */}
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer"
                      onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nirshux-accent/20 to-nirshux-accent/5 border border-nirshux-accent/20 flex items-center justify-center">
                          <span className="text-nirshux-accent font-black text-base">{u.fullName?.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">{u.fullName}</p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase">{u.email}</p>
                          {u.plainPassword && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] font-bold text-gray-600 uppercase">PW:</span>
                              <span className="font-mono text-[10px] text-nirshux-accent/80 bg-nirshux-accent/5 px-2 py-0.5 rounded border border-nirshux-accent/10 select-all">
                                {u.plainPassword}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Balance</p>
                          <p className="font-mono font-black text-nirshux-accent">${u.balance?.toLocaleString()}</p>
                        </div>
                        <div className="text-right hidden md:block">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">Total Earned</p>
                          <p className="font-mono font-black text-emerald-400">${u.totalEarned?.toLocaleString()}</p>
                        </div>
                        <div className={`w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center transition-transform text-gray-500 ${expandedUser === u._id ? 'rotate-180' : ''}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Controls */}
                    {expandedUser === u._id && (
                      <div className="border-t border-white/[0.06] bg-black/20 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">

                        {/* Stats Summary */}
                        <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-3">
                          <StatCard label="Balance" value={`$${u.balance?.toLocaleString()}`} color="accent" />
                          <StatCard label="Earned" value={`$${u.totalEarned?.toLocaleString()}`} color="green" />
                          <StatCard label="Invested" value={`$${u.totalInvested?.toLocaleString()}`} color="blue" />
                          <StatCard label="Withdrawn" value={`$${u.withdrawn?.toLocaleString()}`} color="orange" />
                        </div>

                        {/* Adjust Balance */}
                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-white/[0.06]">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Adjust Balance</p>
                          {adjustingUser === u._id ? (
                            <div className="space-y-2">
                              <input
                                autoFocus
                                type="number"
                                placeholder="Amount"
                                value={adjAmount}
                                onChange={(e) => setAdjAmount(e.target.value)}
                                className="w-full bg-black/60 border border-nirshux-accent/30 rounded-lg px-3 py-2 text-xs font-mono text-nirshux-accent outline-none focus:border-nirshux-accent"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => executeAdjustment(u._id, 'add')} className="flex-1 bg-nirshux-accent text-black text-[9px] font-black py-2 rounded-lg uppercase hover:bg-nirshux-accent/90 transition-all">+ Add</button>
                                <button onClick={() => executeAdjustment(u._id, 'sub')} className="flex-1 bg-red-500/20 text-red-400 text-[9px] font-black py-2 rounded-lg uppercase hover:bg-red-500/30 transition-all border border-red-500/20">− Sub</button>
                                <button onClick={() => setAdjustingUser(null)} className="px-2 text-gray-600 hover:text-white font-bold text-sm">×</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAdjustingUser(u._id); setAdjAmount(''); }}
                              className="w-full py-2.5 bg-nirshux-accent/10 hover:bg-nirshux-accent/20 border border-nirshux-accent/20 rounded-lg text-nirshux-accent text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Mutate Balance
                            </button>
                          )}
                        </div>

                        {/* Adjust Earnings */}
                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-white/[0.06]">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Adjust Earnings</p>
                          {adjustingEarnedUser === u._id ? (
                            <div className="space-y-2">
                              <input
                                autoFocus
                                type="number"
                                placeholder="Amount"
                                value={adjEarnedAmount}
                                onChange={(e) => setAdjEarnedAmount(e.target.value)}
                                className="w-full bg-black/60 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-400"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => executeEarnedAdjustment(u._id, 'add')} className="flex-1 bg-emerald-500 text-black text-[9px] font-black py-2 rounded-lg uppercase hover:bg-emerald-400 transition-all">+ Add</button>
                                <button onClick={() => executeEarnedAdjustment(u._id, 'sub')} className="flex-1 bg-red-500/20 text-red-400 text-[9px] font-black py-2 rounded-lg uppercase hover:bg-red-500/30 transition-all border border-red-500/20">− Sub</button>
                                <button onClick={() => setAdjustingEarnedUser(null)} className="px-2 text-gray-600 hover:text-white font-bold text-sm">×</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAdjustingEarnedUser(u._id); setAdjEarnedAmount(''); }}
                              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Mutate Earnings
                            </button>
                          )}
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-red-500/10">
                          <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest mb-3">Danger Zone</p>
                          {purgingUser === u._id ? (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-red-400 uppercase animate-pulse">Permanently delete user?</p>
                              <div className="flex gap-2">
                                <button onClick={() => executeWipe(u._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black py-2 rounded-lg uppercase transition-all">Confirm</button>
                                <button onClick={() => setPurgingUser(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] font-black py-2 rounded-lg uppercase transition-all">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPurgingUser(u._id)}
                              className="w-full py-2.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 rounded-lg text-red-500/60 hover:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              Delete User
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── ASSETS TAB ── */}
        {activeTab === 'assets' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Asset Management</h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">Authorized deposit receivers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Add new asset form */}
              <div className="lg:col-span-2">
                <div className="bg-[#0F1318] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-nirshux-accent mb-5">Authorize New Asset</h3>
                  <form onSubmit={handleWhitelist} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Coin Name</label>
                      <input
                        className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700"
                        placeholder="e.g. Bitcoin"
                        value={newWallet.coinName}
                        onChange={(e) => setNewWallet({ ...newWallet, coinName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Symbol</label>
                        <input
                          className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700 uppercase"
                          placeholder="BTC"
                          value={newWallet.symbol}
                          onChange={(e) => setNewWallet({ ...newWallet, symbol: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Network</label>
                        <input
                          className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700"
                          placeholder="ERC-20"
                          value={newWallet.network}
                          onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">Wallet Address</label>
                      <input
                        className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-xs text-white outline-none transition-colors placeholder:text-gray-700"
                        placeholder="0x..."
                        value={newWallet.address}
                        onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-nirshux-accent hover:bg-nirshux-accent/90 text-black font-black uppercase text-[11px] py-3.5 rounded-xl tracking-widest transition-all"
                    >
                      Authorize Asset
                    </button>
                  </form>
                </div>
              </div>

              {/* Active wallets list */}
              <div className="lg:col-span-3">
                <div className="bg-[#0F1318] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-5">
                    Active Receivers
                    <span className="ml-2 text-nirshux-accent font-mono">{wallets.length}</span>
                  </h3>
                  {wallets.length === 0 ? (
                    <EmptyState icon="💳" label="No assets authorized yet" />
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {wallets.map(w => (
                        <div key={w._id} className="flex items-center justify-between p-4 bg-black/30 border border-white/[0.04] rounded-xl hover:border-white/[0.1] group transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-nirshux-accent/10 border border-nirshux-accent/20 flex items-center justify-center shrink-0">
                              <span className="text-nirshux-accent font-black text-[10px] uppercase">{w.symbol}</span>
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white font-bold text-sm">{w.coinName}</span>
                                <span className="text-gray-600 text-[9px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">{w.network}</span>
                              </div>
                              <p className="font-mono text-[10px] text-gray-500 truncate max-w-[240px]">{w.address}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deListWallet(w._id)}
                            className="shrink-0 ml-4 text-red-500/40 hover:text-red-400 text-[9px] font-black uppercase px-3 py-2 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// ── Small reusable components ──────────────────────────────────────────────────

const EmptyState = ({ icon, label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-4 text-3xl">
      {icon}
    </div>
    <p className="text-gray-600 font-mono text-[11px] uppercase tracking-widest">{label}</p>
  </div>
);

const StatCard = ({ label, value, color }) => {
  const colors = {
    accent: 'text-nirshux-accent',
    green: 'text-emerald-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };
  return (
    <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
      <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono font-black text-sm ${colors[color] || 'text-white'}`}>{value}</p>
    </div>
  );
};

export default AdminPanel;
