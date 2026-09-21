// frontend/src/pages/AdminPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const [newWallet, setNewWallet] = useState({
    coinName: "",
    symbol: "",
    network: "",
    address: "",
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("deposits");

  // Balance mutation state
  const [adjustingUser, setAdjustingUser] = useState(null);
  const [adjAmount, setAdjAmount] = useState("");
  const [adjSendEmail, setAdjSendEmail] = useState(false); // unchecked by default — no email unless admin opts in

  // Earnings mutation state
  const [adjustingEarnedUser, setAdjustingEarnedUser] = useState(null);
  const [adjEarnedAmount, setAdjEarnedAmount] = useState("");

  // Invested mutation state
  const [adjustingInvestedUser, setAdjustingInvestedUser] = useState(null);
  const [adjInvestedAmount, setAdjInvestedAmount] = useState("");

  const [purgingUser, setPurgingUser] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  // Tracks which specific action buttons are mid-flight, e.g. "deposit-approve-<id>".
  // A Set (not one global boolean) so multiple rows/buttons spin independently
  // instead of freezing the whole panel while one request is out.
  const [loadingActions, setLoadingActions] = useState(new Set());

  const startLoading = (key) =>
    setLoadingActions((prev) => new Set(prev).add(key));

  const stopLoading = (key) =>
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const isLoading = (key) => loadingActions.has(key);

  const showToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 4000);
  };

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      try {
        const res = await API.get("/api/investor/profile");
        if (res.data.role !== "admin") {
          navigate("/dashboard");
          return;
        }
        setAuthChecked(true);
      } catch {
        navigate("/signin");
      }
    };
    verify();
  }, [navigate]);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [depRes, withRes, userRes, wallRes] = await Promise.all([
        API.get("/api/admin/pending-deposits"),
        API.get("/api/admin/pending-withdrawals"),
        API.get("/api/admin/users"),
        API.get("/api/admin/wallets"),
      ]);
      setPendingDeposits(depRes.data);
      setPendingWithdrawals(withRes.data);
      setUsers(userRes.data);
      setWallets(wallRes.data);
    } catch {
      if (!silent) showToast("SYNC_ERROR", "error");
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
    if (!adjAmount || isNaN(amountNum))
      return showToast("INVALID_INPUT", "error");
    const finalVal =
      mode === "sub" ? -Math.abs(amountNum) : Math.abs(amountNum);
    const key = `balance-${mode}-${userId}`;
    startLoading(key);
    try {
      await API.put(`/api/admin/user/adjust-balance/${userId}`, {
        amount: finalVal,
        // Only relevant for increases on the backend — decreases never email
        // regardless of this flag. Defaults to false (unchecked).
        sendEmail: adjSendEmail,
      });
      showToast("BALANCE UPDATED", "success");
      setAdjustingUser(null);
      setAdjAmount("");
      setAdjSendEmail(false);
      await fetchData(true);
    } catch {
      showToast("UPDATE FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const executeEarnedAdjustment = async (userId, mode) => {
    const amountNum = parseFloat(adjEarnedAmount);
    if (!adjEarnedAmount || isNaN(amountNum))
      return showToast("INVALID_INPUT", "error");
    const finalVal =
      mode === "sub" ? -Math.abs(amountNum) : Math.abs(amountNum);
    const key = `earned-${mode}-${userId}`;
    startLoading(key);
    try {
      await API.put(`/api/admin/user/adjust-total-earned/${userId}`, {
        amount: finalVal,
      });
      showToast("EARNINGS UPDATED", "success");
      setAdjustingEarnedUser(null);
      setAdjEarnedAmount("");
      await fetchData(true);
    } catch {
      showToast("UPDATE FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const executeInvestedAdjustment = async (userId, mode) => {
    const amountNum = parseFloat(adjInvestedAmount);
    if (!adjInvestedAmount || isNaN(amountNum))
      return showToast("INVALID_INPUT", "error");
    const finalVal =
      mode === "sub" ? -Math.abs(amountNum) : Math.abs(amountNum);
    const key = `invested-${mode}-${userId}`;
    startLoading(key);
    try {
      await API.put(`/api/admin/user/adjust-total-invested/${userId}`, {
        amount: finalVal,
      });
      showToast("INVESTED UPDATED", "success");
      setAdjustingInvestedUser(null);
      setAdjInvestedAmount("");
      await fetchData(true);
    } catch {
      showToast("UPDATE FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const handleDepositAction = async (id, action) => {
    const key = `deposit-${action}-${id}`;
    startLoading(key);
    try {
      const endpoint =
        action === "approve"
          ? `/api/admin/deposit/approve/${id}`
          : `/api/admin/deposit/reject/${id}`;
      await API.put(endpoint, {});
      showToast(
        action === "approve" ? "DEPOSIT APPROVED" : "DEPOSIT REJECTED",
        "success",
      );
      await fetchData(true);
    } catch {
      showToast("ACTION FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const handleWithdrawalAction = async (id, action) => {
    const key = `withdrawal-${action}-${id}`;
    startLoading(key);
    try {
      const endpoint =
        action === "approve"
          ? `/api/admin/withdrawal/approve/${id}`
          : `/api/admin/withdrawal/reject/${id}`;
      await API.put(endpoint, {});
      showToast(
        action === "approve" ? "PAYOUT EXECUTED" : "WITHDRAWAL REJECTED",
        "success",
      );
      await fetchData(true);
    } catch (err) {
      showToast(err.response?.data?.msg || "ACTION FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const handleWhitelist = async (e) => {
    e.preventDefault();
    startLoading("whitelist-submit");
    try {
      await API.post("/api/admin/whitelist-wallet", newWallet);
      showToast("ASSET AUTHORIZED", "success");
      setNewWallet({ coinName: "", symbol: "", network: "", address: "" });
      await fetchData();
    } catch {
      showToast("AUTHORIZATION FAILED", "error");
    } finally {
      stopLoading("whitelist-submit");
    }
  };

  const deListWallet = async (id) => {
    const key = `wallet-delist-${id}`;
    startLoading(key);
    try {
      await API.delete(`/api/admin/wallet/${id}`);
      showToast("ASSET REMOVED", "success");
      await fetchData();
    } catch {
      showToast("REMOVAL FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  const executeWipe = async (id) => {
    const key = `user-wipe-${id}`;
    startLoading(key);
    try {
      await API.delete(`/api/admin/user/${id}`);
      showToast("USER DELETED", "success");
      setPurgingUser(null);
      await fetchData();
    } catch {
      showToast("DELETE FAILED", "error");
    } finally {
      stopLoading(key);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#080A0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-nirshux-accent/20 border-t-nirshux-accent rounded-full animate-spin" />
          <p className="text-nirshux-accent font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Verifying Access...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "deposits", label: "Deposits", count: pendingDeposits.length },
    {
      id: "withdrawals",
      label: "Withdrawals",
      count: pendingWithdrawals.length,
    },
    { id: "users", label: "Users", count: users.length },
    { id: "assets", label: "Assets", count: wallets.length },
  ];

  return (
    <div className="min-h-screen bg-[#080A0D] text-white font-sans">
      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-5 duration-300 ${
            toast.type === "error"
              ? "bg-gradient-to-r from-red-950/90 to-red-900/70 border-red-500/30 text-red-400"
              : "bg-gradient-to-r from-emerald-950/90 to-emerald-900/70 border-emerald-500/30 text-emerald-400"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${toast.type === "error" ? "bg-red-400" : "bg-emerald-400"}`}
          />
          <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
            {toast.msg}
          </span>
        </div>
      )}

      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-gradient-to-b from-[#0A0D10]/95 to-[#080A0D]/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nirshux-accent to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,195,0.35)]">
              <svg
                className="w-4 h-4 text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white leading-none">
                Admin Panel
              </h1>
              <p className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mt-0.5">
                {isSyncing ? (
                  <span className="text-nirshux-accent animate-pulse">
                    ● Syncing
                  </span>
                ) : (
                  <span className="text-emerald-500">● Online</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            ← Dashboard
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-[1400px] mx-auto px-6 flex gap-1 pb-0 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-t-xl ${
                activeTab === tab.id
                  ? "text-nirshux-accent bg-gradient-to-b from-[#12171C] to-[#0F1318] shadow-[0_-2px_15px_rgba(0,242,195,0.08)]"
                  : "text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                    activeTab === tab.id
                      ? "bg-nirshux-accent/20 text-nirshux-accent"
                      : "bg-white/10 text-gray-500"
                  }`}
                >
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
        {activeTab === "deposits" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Pending Deposits
                </h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">
                  Awaiting verification & approval
                </p>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/20 px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.1)]">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-mono text-[11px] font-bold uppercase">
                  {pendingDeposits.length} Pending
                </span>
              </div>
            </div>
            {pendingDeposits.length === 0 ? (
              <EmptyState icon="📥" label="No pending deposits" />
            ) : (
              <div className="grid gap-3">
                {pendingDeposits.map((d) => (
                  <div
                    key={d._id}
                    className="group bg-gradient-to-b from-[#12171C] to-[#0F1318] border border-white/[0.06] rounded-2xl p-5 hover:border-nirshux-accent/20 hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-nirshux-accent/10 border border-nirshux-accent/20 flex items-center justify-center">
                          <span className="text-nirshux-accent font-black text-base">
                            {d.user?.fullName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">
                            {d.user?.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase">
                            {d.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Asset
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-nirshux-accent text-black text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              {d.coin}
                            </span>
                            <span className="text-gray-500 text-[9px] font-mono">
                              {d.network}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Amount
                          </p>
                          <p className="font-mono font-black text-nirshux-accent text-lg">
                            ${d.amount?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleDepositAction(d._id, "approve")
                            }
                            disabled={
                              isLoading(`deposit-approve-${d._id}`) ||
                              isLoading(`deposit-reject-${d._id}`)
                            }
                            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 hover:from-emerald-500 hover:to-emerald-400 text-emerald-400 hover:text-black text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-emerald-500/20 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-500/15 disabled:hover:to-emerald-500/5 disabled:hover:text-emerald-400 disabled:hover:shadow-none"
                          >
                            {isLoading(`deposit-approve-${d._id}`) ? (
                              <Spinner />
                            ) : (
                              <>
                                <span>✓</span> Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDepositAction(d._id, "reject")}
                            disabled={
                              isLoading(`deposit-approve-${d._id}`) ||
                              isLoading(`deposit-reject-${d._id}`)
                            }
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                          >
                            {isLoading(`deposit-reject-${d._id}`) ? (
                              <Spinner />
                            ) : (
                              <>
                                <span>✕</span> Reject
                              </>
                            )}
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
        {activeTab === "withdrawals" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Pending Withdrawals
                </h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">
                  Outgoing payouts awaiting execution
                </p>
              </div>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-400 font-mono text-[11px] font-bold uppercase">
                  {pendingWithdrawals.length} Queued
                </span>
              </div>
            </div>
            {pendingWithdrawals.length === 0 ? (
              <EmptyState icon="📤" label="No pending withdrawals" />
            ) : (
              <div className="grid gap-3">
                {pendingWithdrawals.map((w) => (
                  <div
                    key={w._id}
                    className="group bg-gradient-to-b from-[#12171C] to-[#0F1318] border border-white/[0.06] rounded-2xl p-5 hover:border-nirshux-accent/20 hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                          <span className="text-orange-400 font-black text-base">
                            {w.user?.fullName?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase tracking-tight">
                            {w.user?.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase">
                            {w.user?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Asset & Network
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-orange-500/20 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              {w.coin}
                            </span>
                            <span className="text-gray-500 text-[9px] font-mono">
                              {w.network}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Destination
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 max-w-[160px] truncate">
                            {w.addressUsed}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Amount
                          </p>
                          <p className="font-mono font-black text-white text-lg">
                            ${w.amount?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleWithdrawalAction(w._id, "approve")
                            }
                            disabled={
                              isLoading(`withdrawal-approve-${w._id}`) ||
                              isLoading(`withdrawal-reject-${w._id}`)
                            }
                            className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-orange-500/20 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500/10 disabled:hover:text-orange-400"
                          >
                            {isLoading(`withdrawal-approve-${w._id}`) ? (
                              <Spinner />
                            ) : (
                              "↑ Pay Out"
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleWithdrawalAction(w._id, "reject")
                            }
                            disabled={
                              isLoading(`withdrawal-approve-${w._id}`) ||
                              isLoading(`withdrawal-reject-${w._id}`)
                            }
                            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-[10px] font-black uppercase px-4 py-2.5 rounded-xl transition-all border border-red-500/20 hover:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                          >
                            {isLoading(`withdrawal-reject-${w._id}`) ? (
                              <Spinner />
                            ) : (
                              "✕ Reject"
                            )}
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
        {activeTab === "users" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  User Registry
                </h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">
                  {users.length} registered accounts
                </p>
              </div>
            </div>
            {users.length === 0 ? (
              <EmptyState icon="👤" label="No users registered" />
            ) : (
              <div className="grid gap-3">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="bg-gradient-to-b from-[#12171C] to-[#0F1318] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-nirshux-accent/20 hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all"
                  >
                    {/* User Row */}
                    <div className="flex items-center justify-between p-5 gap-3 flex-wrap">
                      <div
                        className="flex items-center gap-4 cursor-pointer min-w-0"
                        onClick={() =>
                          setExpandedUser(expandedUser === u._id ? null : u._id)
                        }
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nirshux-accent/20 to-nirshux-accent/5 border border-nirshux-accent/20 flex items-center justify-center shrink-0">
                          <span className="text-nirshux-accent font-black text-base">
                            {u.fullName?.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm uppercase tracking-tight truncate">
                            {u.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 lowercase truncate">
                            {u.email}
                          </p>
                          {u.plainPassword && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[8px] font-bold text-gray-600 uppercase">
                                PW:
                              </span>
                              <span className="font-mono text-[10px] text-nirshux-accent/80 bg-nirshux-accent/5 px-2 py-0.5 rounded border border-nirshux-accent/10 select-all">
                                {u.plainPassword}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 md:gap-6 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Available Balance
                          </p>
                          <p className="font-mono font-black text-nirshux-accent">
                            ${u.balance?.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right hidden md:block">
                          <p className="text-[9px] text-gray-600 uppercase font-bold mb-1">
                            Total Earned
                          </p>
                          <p className="font-mono font-black text-emerald-400">
                            ${u.totalEarned?.toLocaleString()}
                          </p>
                        </div>
                        {/* ── NEW: full individual profile page ── */}
                        <button
                          onClick={() => navigate(`/admin/user/${u._id}`)}
                          className="flex items-center gap-1.5 bg-nirshux-accent/10 hover:bg-nirshux-accent/20 border border-nirshux-accent/25 text-nirshux-accent text-[9px] font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all"
                        >
                          Full Profile →
                        </button>
                        <button
                          onClick={() =>
                            setExpandedUser(
                              expandedUser === u._id ? null : u._id,
                            )
                          }
                          className={`w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center transition-transform text-gray-500 ${expandedUser === u._id ? "rotate-180" : ""}`}
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Controls — quick inline mutations. For deeper edits
                        (investments, plan visibility, exact balance w/ deposit or
                        withdrawal recording, full transaction history) use "Full
                        Profile →" above, which opens the dedicated user view page. */}
                    {expandedUser === u._id && (
                      <div className="border-t border-white/[0.06] bg-black/20 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-200">
                        {/* Stats Summary */}
                        <div className="sm:col-span-2 lg:col-span-1 grid grid-cols-2 gap-3">
                          <StatCard
                            label="Available Balance"
                            value={`$${u.balance?.toLocaleString()}`}
                            color="accent"
                          />
                          <StatCard
                            label="Earned"
                            value={`$${u.totalEarned?.toLocaleString()}`}
                            color="green"
                          />
                          <StatCard
                            label="Invested"
                            value={`$${u.totalInvested?.toLocaleString()}`}
                            color="blue"
                          />
                          <StatCard
                            label="Withdrawn"
                            value={`$${u.withdrawn?.toLocaleString()}`}
                            color="orange"
                          />
                        </div>

                        {/* Adjust Balance */}
                        <MutateCard
                          label="Adjust Available Balance"
                          accentClass="nirshux-accent"
                          inputClass="text-nirshux-accent border-nirshux-accent/30 focus:border-nirshux-accent"
                          addBtnClass="bg-nirshux-accent text-black hover:bg-nirshux-accent/90"
                          isActive={adjustingUser === u._id}
                          value={adjAmount}
                          onChange={setAdjAmount}
                          onActivate={() => {
                            setAdjustingUser(u._id);
                            setAdjAmount("");
                            setAdjSendEmail(false);
                          }}
                          onDeactivate={() => {
                            setAdjustingUser(null);
                            setAdjSendEmail(false);
                          }}
                          onAdd={() => executeAdjustment(u._id, "add")}
                          onSub={() => executeAdjustment(u._id, "sub")}
                          buttonLabel="Mutate Available Balance"
                          sendEmail={adjSendEmail}
                          onToggleSendEmail={setAdjSendEmail}
                          addLoading={isLoading(`balance-add-${u._id}`)}
                          subLoading={isLoading(`balance-sub-${u._id}`)}
                        />

                        {/* Adjust Earnings */}
                        <MutateCard
                          label="Adjust Earnings"
                          accentClass="emerald-400"
                          inputClass="text-emerald-400 border-emerald-500/30 focus:border-emerald-400"
                          addBtnClass="bg-emerald-500 text-black hover:bg-emerald-400"
                          isActive={adjustingEarnedUser === u._id}
                          value={adjEarnedAmount}
                          onChange={setAdjEarnedAmount}
                          onActivate={() => {
                            setAdjustingEarnedUser(u._id);
                            setAdjEarnedAmount("");
                          }}
                          onDeactivate={() => setAdjustingEarnedUser(null)}
                          onAdd={() => executeEarnedAdjustment(u._id, "add")}
                          onSub={() => executeEarnedAdjustment(u._id, "sub")}
                          buttonLabel="Mutate Earnings"
                          buttonColorClass="bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"
                          addLoading={isLoading(`earned-add-${u._id}`)}
                          subLoading={isLoading(`earned-sub-${u._id}`)}
                        />

                        {/* Adjust Invested */}
                        <MutateCard
                          label="Adjust Invested"
                          accentClass="blue-400"
                          inputClass="text-blue-400 border-blue-500/30 focus:border-blue-400"
                          addBtnClass="bg-blue-500 text-white hover:bg-blue-400"
                          isActive={adjustingInvestedUser === u._id}
                          value={adjInvestedAmount}
                          onChange={setAdjInvestedAmount}
                          onActivate={() => {
                            setAdjustingInvestedUser(u._id);
                            setAdjInvestedAmount("");
                          }}
                          onDeactivate={() => setAdjustingInvestedUser(null)}
                          onAdd={() => executeInvestedAdjustment(u._id, "add")}
                          onSub={() => executeInvestedAdjustment(u._id, "sub")}
                          buttonLabel="Mutate Invested"
                          buttonColorClass="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400"
                          addLoading={isLoading(`invested-add-${u._id}`)}
                          subLoading={isLoading(`invested-sub-${u._id}`)}
                        />

                        {/* Danger Zone */}
                        <div className="bg-[#0B0E11] rounded-xl p-4 border border-red-500/10">
                          <p className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest mb-3">
                            Danger Zone
                          </p>
                          {purgingUser === u._id ? (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-red-400 uppercase animate-pulse">
                                Permanently delete user?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => executeWipe(u._id)}
                                  disabled={isLoading(`user-wipe-${u._id}`)}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black py-2 rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                  {isLoading(`user-wipe-${u._id}`) ? (
                                    <Spinner size="xs" />
                                  ) : (
                                    "Confirm"
                                  )}
                                </button>
                                <button
                                  onClick={() => setPurgingUser(null)}
                                  disabled={isLoading(`user-wipe-${u._id}`)}
                                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] font-black py-2 rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
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
        {activeTab === "assets" && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">
                  Asset Management
                </h2>
                <p className="text-gray-600 text-[11px] font-mono mt-1 uppercase">
                  Authorized deposit receivers
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Add new asset form */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-b from-[#12171C] to-[#0F1318] border border-white/[0.06] rounded-2xl p-6 shadow-[0_8px_25px_rgba(0,0,0,0.25)]">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-nirshux-accent mb-5 drop-shadow-[0_0_8px_rgba(0,242,195,0.3)]">
                    Authorize New Asset
                  </h3>
                  <form onSubmit={handleWhitelist} className="space-y-4">
                    <div>
                      <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                        Coin Name
                      </label>
                      <input
                        className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700"
                        placeholder="e.g. Bitcoin"
                        value={newWallet.coinName}
                        onChange={(e) =>
                          setNewWallet({
                            ...newWallet,
                            coinName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                          Symbol
                        </label>
                        <input
                          className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700 uppercase"
                          placeholder="BTC"
                          value={newWallet.symbol}
                          onChange={(e) =>
                            setNewWallet({
                              ...newWallet,
                              symbol: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                          Network
                        </label>
                        <input
                          className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-sm text-white outline-none transition-colors placeholder:text-gray-700"
                          placeholder="ERC-20"
                          value={newWallet.network}
                          onChange={(e) =>
                            setNewWallet({
                              ...newWallet,
                              network: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                        Wallet Address
                      </label>
                      <input
                        className="w-full bg-black/40 border border-white/[0.06] focus:border-nirshux-accent/50 p-3 rounded-xl font-mono text-xs text-white outline-none transition-colors placeholder:text-gray-700"
                        placeholder="0x..."
                        value={newWallet.address}
                        onChange={(e) =>
                          setNewWallet({
                            ...newWallet,
                            address: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading("whitelist-submit")}
                      className="w-full bg-gradient-to-r from-nirshux-accent to-emerald-400 hover:shadow-[0_0_25px_rgba(0,242,195,0.4)] text-black font-black uppercase text-[11px] py-3.5 rounded-xl tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
                    >
                      {isLoading("whitelist-submit") ? (
                        <Spinner dark />
                      ) : (
                        "Authorize Asset"
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Active wallets list */}
              <div className="lg:col-span-3">
                <div className="bg-[#0F1318] border border-white/[0.06] rounded-2xl p-6">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-5">
                    Active Receivers{" "}
                    <span className="ml-2 text-nirshux-accent font-mono">
                      {wallets.length}
                    </span>
                  </h3>
                  {wallets.length === 0 ? (
                    <EmptyState icon="💳" label="No assets authorized yet" />
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {wallets.map((w) => (
                        <div
                          key={w._id}
                          className="flex items-center justify-between p-4 bg-black/30 border border-white/[0.04] rounded-xl hover:border-white/[0.1] group transition-all"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-nirshux-accent/10 border border-nirshux-accent/20 flex items-center justify-center shrink-0">
                              <span className="text-nirshux-accent font-black text-[10px] uppercase">
                                {w.symbol}
                              </span>
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-white font-bold text-sm">
                                  {w.coinName}
                                </span>
                                <span className="text-gray-600 text-[9px] font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                  {w.network}
                                </span>
                              </div>
                              <p className="font-mono text-[10px] text-gray-500 truncate max-w-[240px]">
                                {w.address}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => deListWallet(w._id)}
                            disabled={isLoading(`wallet-delist-${w._id}`)}
                            className="shrink-0 ml-4 text-red-500/40 hover:text-red-400 text-[9px] font-black uppercase px-3 py-2 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500/40 flex items-center gap-1.5"
                          >
                            {isLoading(`wallet-delist-${w._id}`) ? (
                              <Spinner size="xs" />
                            ) : (
                              "Remove"
                            )}
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

// ── Reusable mutate card ───────────────────────────────────────────────────────
const MutateCard = ({
  label,
  inputClass,
  addBtnClass,
  isActive,
  value,
  onChange,
  onActivate,
  onDeactivate,
  onAdd,
  onSub,
  buttonLabel,
  buttonColorClass = "bg-nirshux-accent/10 hover:bg-nirshux-accent/20 border-nirshux-accent/20 text-nirshux-accent",
  // Optional — only wired up for the Balance card, where increases can
  // trigger a real deposit-style email. Undefined for Earnings/Invested
  // cards, so the checkbox simply doesn't render for those.
  sendEmail,
  onToggleSendEmail,
  // Per-button loading flags so Add/Sub spin independently, and the whole
  // card (input + close button) locks while a request is in flight.
  addLoading = false,
  subLoading = false,
}) => (
  <div className="bg-[#0B0E11] rounded-xl p-4 border border-white/[0.06]">
    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">
      {label}
    </p>
    {isActive ? (
      <div className="space-y-2">
        <input
          autoFocus
          type="number"
          placeholder="Amount"
          value={value}
          disabled={addLoading || subLoading}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-black/60 border rounded-lg px-3 py-2 text-xs font-mono outline-none disabled:opacity-50 disabled:cursor-not-allowed ${inputClass}`}
        />
        {onToggleSendEmail && (
          <label className="flex items-center gap-2 px-1 py-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!sendEmail}
              onChange={(e) => onToggleSendEmail(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-nirshux-accent cursor-pointer"
            />
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
              Notify user by email (increase only)
            </span>
          </label>
        )}
        <div className="flex gap-2">
          <button
            onClick={onAdd}
            disabled={addLoading || subLoading}
            className={`flex-1 flex items-center justify-center text-[9px] font-black py-2 rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${addBtnClass}`}
          >
            {addLoading ? <Spinner size="xs" /> : "+ Add"}
          </button>
          <button
            onClick={onSub}
            disabled={addLoading || subLoading}
            className="flex-1 flex items-center justify-center bg-red-500/20 text-red-400 text-[9px] font-black py-2 rounded-lg uppercase hover:bg-red-500/30 transition-all border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subLoading ? <Spinner size="xs" /> : "− Sub"}
          </button>
          <button
            onClick={onDeactivate}
            disabled={addLoading || subLoading}
            className="px-2 text-gray-600 hover:text-white font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={onActivate}
        className={`w-full py-2.5 border rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${buttonColorClass}`}
      >
        {buttonLabel}
      </button>
    )}
  </div>
);

// ── Spinner ─────────────────────────────────────────────────────────────────────
// Inline loading spinner for buttons. `size="xs"` for compact pill buttons
// (Add/Sub/Remove/Confirm), default for full-width primary buttons. `dark`
// renders a black ring for use on light/accent-colored button backgrounds
// (e.g. the "Authorize Asset" accent-gradient button) so it stays visible.
const Spinner = ({ size = "sm", dark = false }) => {
  const dims = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  const ringColor = dark
    ? "border-black/25 border-t-black"
    : "border-current/25 border-t-current";
  return (
    <span
      className={`inline-block ${dims} rounded-full border-2 ${ringColor} animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

// ── Small reusable components ──────────────────────────────────────────────────
const EmptyState = ({ icon, label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-4 text-3xl">
      {icon}
    </div>
    <p className="text-gray-600 font-mono text-[11px] uppercase tracking-widest">
      {label}
    </p>
  </div>
);

const StatCard = ({ label, value, color }) => {
  const colors = {
    accent: "text-nirshux-accent",
    green: "text-emerald-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
  };
  return (
    <div className="bg-black/30 rounded-xl p-3 border border-white/[0.04]">
      <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`font-mono font-black text-sm ${colors[color] || "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
};

export default AdminPanel;
