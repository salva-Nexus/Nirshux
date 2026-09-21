// frontend/src/pages/AdminUserView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { PLAN_NAMES as ALL_PLANS } from "../constants/plans";

// ── Inline spinner (matches AdminPanel's Spinner) ──────────────────────────────
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

// ── Confirmation card for balance mutation ─────────────────────────────────────
// Shown before ANY balance change on this page. Direction (deposit/withdrawal)
// is computed automatically from newBalance vs oldBalance — the admin is just
// confirming what will get written into the user's transaction history.
const BalanceConfirmModal = ({
  oldBalance,
  newBalance,
  recordInHistory,
  onToggleRecordInHistory,
  sendEmail,
  onToggleSendEmail,
  onConfirm,
  onCancel,
  loading,
}) => {
  const delta = newBalance - oldBalance;
  const isDeposit = delta > 0;
  const isNoop = delta === 0;
  const diffAbs = Math.abs(delta);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-gradient-to-b from-[#12171C] to-[#0F1318] border border-white/10 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200"
      >
        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Confirm Balance Mutation
        </p>
        <h3 className="text-base font-black uppercase tracking-tight text-white mb-5">
          Set balance to{" "}
          <span className="text-nirshux-accent">
            $
            {newBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </h3>

        {isNoop ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6">
            <p className="text-[10px] text-gray-400 font-mono uppercase">
              No change — new balance matches current balance. Nothing will be
              recorded.
            </p>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-2 mb-3 px-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordInHistory}
                onChange={(e) => onToggleRecordInHistory(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-nirshux-accent cursor-pointer"
              />
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Record as {isDeposit ? "deposit" : "withdrawal"} in history
              </span>
            </label>

            {recordInHistory ? (
              <div
                className={`rounded-2xl p-4 mb-4 border ${
                  isDeposit
                    ? "bg-emerald-500/[0.06] border-emerald-500/20"
                    : "bg-red-500/[0.06] border-red-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      isDeposit
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {isDeposit ? "↑ Deposit" : "↓ Withdrawal"}
                  </span>
                  <span
                    className={`font-mono font-black text-lg ${isDeposit ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {isDeposit ? "+" : "-"}$
                    {diffAbs.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  This will be written into the user's transaction history as a{" "}
                  <strong className="text-gray-200">
                    {isDeposit ? "deposit" : "withdrawal"}
                  </strong>{" "}
                  of the difference above. Current balance: $
                  {oldBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  .
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Balance will change from $
                  {oldBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  to{" "}
                  <strong className="text-gray-200">
                    $
                    {newBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>{" "}
                  silently — no transaction will be added to the user's history,
                  and deposited/withdrawn totals won't change.
                </p>
              </div>
            )}

            {recordInHistory && (
              <label className="flex items-center gap-2 mb-6 px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => onToggleSendEmail(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-nirshux-accent cursor-pointer"
                />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                  Notify user by email
                </span>
              </label>
            )}
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || isNoop}
            className="flex-1 py-3 bg-gradient-to-r from-nirshux-accent to-emerald-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,242,195,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Spinner dark /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminUserView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "", type: "info" });
  const [activeTab, setActiveTab] = useState("overview");
  const [adjusting, setAdjusting] = useState(null); // { field, value }
  const [loadingIds, setLoadingIds] = useState(new Set());

  // Balance-specific confirm-card state
  const [balanceConfirm, setBalanceConfirm] = useState(null); // { newBalance } | null
  const [confirmRecordInHistory, setConfirmRecordInHistory] = useState(true);
  const [confirmSendEmail, setConfirmSendEmail] = useState(false);

  const startLoading = (id) => setLoadingIds((prev) => new Set(prev).add(id));
  const stopLoading = (id) =>
    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const showToast = (msg, type = "info") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "info" }), 3500);
  };

  const fetchUser = useCallback(async () => {
    try {
      const res = await API.get(`/api/admin/user/${userId}`);
      setUser(res.data);
    } catch {
      showToast("FAILED TO LOAD USER DATA", "error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Generic "set exact value" handler for non-balance stat fields
  const handleSet = async (field, endpoint, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || value === "")
      return showToast("ENTER A VALID AMOUNT", "error");
    if (num < 0) return showToast("AMOUNT CANNOT BE NEGATIVE", "error");
    startLoading(endpoint);
    try {
      await API.put(`/api/admin/user/${endpoint}/${userId}`, { amount: num });
      showToast(`${field.toUpperCase()} UPDATED`, "success");
      setAdjusting(null);
      fetchUser();
    } catch {
      showToast(`FAILED TO UPDATE ${field.toUpperCase()}`, "error");
    } finally {
      stopLoading(endpoint);
    }
  };

  // Balance goes through the confirm card first
  const requestBalanceChange = (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || value === "")
      return showToast("ENTER A VALID AMOUNT", "error");
    if (num < 0) return showToast("AMOUNT CANNOT BE NEGATIVE", "error");
    setConfirmRecordInHistory(true);
    setConfirmSendEmail(false);
    setBalanceConfirm({ newBalance: num });
  };

  const confirmBalanceChange = async () => {
    if (!balanceConfirm) return;
    startLoading("set-balance");
    try {
      const res = await API.put(`/api/admin/user/set-balance/${userId}`, {
        amount: balanceConfirm.newBalance,
        recordInHistory: confirmRecordInHistory,
        sendEmail: confirmRecordInHistory && confirmSendEmail,
      });
      const { recordedAs } = res.data || {};
      showToast(
        recordedAs
          ? `BALANCE UPDATED · RECORDED AS ${recordedAs.toUpperCase()}`
          : "BALANCE UPDATED · NOT RECORDED IN HISTORY",
        "success",
      );
      setAdjusting(null);
      setBalanceConfirm(null);
      setConfirmRecordInHistory(true);
      setConfirmSendEmail(false);
      fetchUser();
    } catch {
      showToast("FAILED TO UPDATE BALANCE", "error");
    } finally {
      stopLoading("set-balance");
    }
  };

  const handleInvestmentAction = async (investmentId, action) => {
    const loadKey = `inv-${investmentId}`;
    startLoading(loadKey);
    try {
      await API.put(
        `/api/admin/user/${userId}/investment/${investmentId}/${action}`,
      );
      showToast(
        `INVESTMENT ${action === "pause" ? "PAUSED" : "RESUMED"}`,
        "success",
      );
      fetchUser();
    } catch (err) {
      showToast(err.response?.data?.msg || "ACTION FAILED", "error");
    } finally {
      stopLoading(loadKey);
    }
  };

  const handleTogglePlan = async (planName) => {
    startLoading(`plan-${planName}`);
    try {
      await API.put(`/api/admin/user/${userId}/toggle-plan`, { planName });
      showToast("PLAN VISIBILITY TOGGLED", "success");
      fetchUser();
    } catch {
      showToast("TOGGLE FAILED", "error");
    } finally {
      stopLoading(`plan-${planName}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080A0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-nirshux-accent/20 border-t-nirshux-accent rounded-full animate-spin" />
          <p className="text-nirshux-accent font-mono text-[10px] uppercase tracking-widest animate-pulse">
            Loading Subject File...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080A0D] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
          User not found.
        </p>
        <button
          onClick={() => navigate("/admin-panel")}
          className="text-nirshux-accent text-[10px] font-bold uppercase tracking-widest hover:underline"
        >
          ← Back to Admin Panel
        </button>
      </div>
    );
  }

  const statFields = [
    {
      label: "Available Balance",
      key: "balance",
      endpoint: "set-balance",
      color: "accent",
    },
    {
      label: "Total Invested",
      key: "totalInvested",
      endpoint: "set-total-invested",
      color: "blue",
    },
    {
      label: "Total Earned",
      key: "totalEarned",
      endpoint: "set-total-earned",
      color: "accent",
    },
    {
      label: "Total Withdrawn",
      key: "withdrawn",
      endpoint: "set-withdrawn",
      color: "orange",
    },
  ];

  const txTypeColor = (type) => {
    if (type === "deposit")
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (type === "withdrawal")
      return "text-red-400 bg-red-500/10 border-red-500/20";
    if (type === "investment")
      return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    if (type === "referral_bonus")
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (type === "maturity_release")
      return "text-nirshux-accent bg-nirshux-accent/10 border-nirshux-accent/20";
    return "text-gray-400 bg-white/5 border-white/10";
  };

  const txStatusColor = (status) => {
    if (status === "success")
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (status === "pending")
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (status === "failed")
      return "text-red-400 bg-red-500/10 border-red-500/20";
    return "text-gray-400 bg-white/5 border-white/10";
  };

  const activeInvestments = (user.activeInvestments || []).filter(
    (inv) => inv.status !== "completed",
  );

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

      {/* Balance confirm card */}
      {balanceConfirm && (
        <BalanceConfirmModal
          oldBalance={user.balance || 0}
          newBalance={balanceConfirm.newBalance}
          recordInHistory={confirmRecordInHistory}
          onToggleRecordInHistory={setConfirmRecordInHistory}
          sendEmail={confirmSendEmail}
          onToggleSendEmail={setConfirmSendEmail}
          loading={loadingIds.has("set-balance")}
          onCancel={() => setBalanceConfirm(null)}
          onConfirm={confirmBalanceChange}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-gradient-to-b from-[#0A0D10]/95 to-[#080A0D]/95 backdrop-blur-xl shadow-[0_2px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={() => navigate("/admin-panel")}
              className="shrink-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              ← Back
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-nirshux-accent to-emerald-500 text-black flex items-center justify-center font-black text-sm shrink-0 shadow-[0_0_15px_rgba(0,242,195,0.35)]">
              {user.fullName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-tight text-white truncate">
                {user.fullName}
              </p>
              <p className="text-[9px] font-mono text-gray-500 truncate lowercase">
                {user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[8px] px-2.5 py-1 rounded-md bg-nirshux-accent/10 border border-nirshux-accent/25 text-nirshux-accent font-black uppercase tracking-widest">
              {user.role}
            </span>
            {user.plainPassword && (
              <span className="hidden sm:inline-block text-[8px] font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-500">
                pw: {user.plainPassword}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {statFields.map(({ label, key, endpoint, color }) => (
            <div
              key={key}
              className={`p-4 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border relative transition-all ${
                key === "balance"
                  ? "border-nirshux-accent/30 shadow-[0_0_25px_rgba(0,242,195,0.08)]"
                  : "border-white/10"
              }`}
            >
              <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-2">
                {label}
              </p>

              {adjusting?.field === key ? (
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    placeholder="Exact amount"
                    value={adjusting.value}
                    onChange={(e) =>
                      setAdjusting({ ...adjusting, value: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        key === "balance"
                          ? requestBalanceChange(adjusting.value)
                          : handleSet(label, endpoint, adjusting.value);
                      }
                      if (e.key === "Escape") setAdjusting(null);
                    }}
                    className="w-full bg-black/50 border border-nirshux-accent/30 focus:border-nirshux-accent rounded-lg px-2.5 py-2 text-[11px] font-mono text-nirshux-accent outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      disabled={
                        loadingIds.has(endpoint) ||
                        loadingIds.has("set-balance")
                      }
                      onClick={() =>
                        key === "balance"
                          ? requestBalanceChange(adjusting.value)
                          : handleSet(label, endpoint, adjusting.value)
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 bg-nirshux-accent/15 hover:bg-nirshux-accent/25 text-nirshux-accent text-[9px] font-black py-2 rounded-lg uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingIds.has(endpoint) ? <Spinner size="xs" /> : "Set"}
                    </button>
                    <button
                      onClick={() => setAdjusting(null)}
                      className="px-2.5 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-lg text-sm font-bold transition-all"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className={`text-base md:text-lg font-mono font-black mb-2 ${
                      color === "accent"
                        ? "text-nirshux-accent"
                        : color === "green"
                          ? "text-emerald-400"
                          : color === "blue"
                            ? "text-blue-400"
                            : "text-orange-400"
                    }`}
                  >
                    $
                    {(user[key] || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <button
                    onClick={() => setAdjusting({ field: key, value: "" })}
                    className="w-full py-2 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Active Investments" },
            { id: "plans", label: "Plan Visibility" },
            { id: "history", label: "Transaction History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-t-xl whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-nirshux-accent bg-gradient-to-b from-[#12171C] to-[#0F1318] shadow-[0_-2px_15px_rgba(0,242,195,0.08)]"
                  : "text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-nirshux-accent rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Active Investments */}
        {activeTab === "overview" && (
          <div>
            {activeInvestments.length === 0 ? (
              <EmptyState icon="📊" label="No active investment positions" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {activeInvestments.map((inv) => {
                  const start = new Date(inv.startDate).getTime();
                  const end = new Date(inv.endDate).getTime();
                  const progress = Math.min(
                    100,
                    Math.max(0, ((Date.now() - start) / (end - start)) * 100),
                  );
                  const isPaused = inv.status === "paused";

                  return (
                    <div
                      key={inv._id}
                      className={`p-4 rounded-2xl border ${
                        isPaused
                          ? "bg-amber-500/[0.04] border-amber-500/25"
                          : "bg-gradient-to-b from-white/[0.05] to-white/[0.02] border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs font-bold text-white mb-0.5">
                            {inv.planName}
                          </p>
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide">
                            {inv.dailyRoi}% daily
                          </p>
                        </div>
                        <span
                          className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                            isPaused
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {isPaused ? "Paused" : "Active"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase tracking-wide mb-0.5">
                            Staked
                          </p>
                          <p className="text-sm font-mono font-black text-white">
                            ${inv.amount?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase tracking-wide mb-0.5">
                            Accrued
                          </p>
                          <p className="text-sm font-mono font-black text-emerald-400">
                            +$
                            {(inv.accrued || 0).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                          <span>Progress</span>
                          <span className="text-nirshux-accent">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPaused
                                ? "bg-gradient-to-r from-amber-500 to-amber-300"
                                : "bg-gradient-to-r from-nirshux-accent to-emerald-400"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-[8px] text-gray-600 pb-3 mb-3 border-b border-white/5 font-mono">
                        <span>
                          {new Date(inv.startDate).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(inv.endDate).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        disabled={loadingIds.has(`inv-${inv._id}`)}
                        onClick={() =>
                          handleInvestmentAction(
                            inv._id,
                            isPaused ? "resume" : "pause",
                          )
                        }
                        className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border disabled:opacity-50 disabled:cursor-not-allowed ${
                          isPaused
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20"
                        }`}
                      >
                        {loadingIds.has(`inv-${inv._id}`) && (
                          <Spinner size="xs" />
                        )}
                        {isPaused ? "▶ Resume Accrual" : "⏸ Pause Accrual"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Plan Visibility */}
        {activeTab === "plans" && (
          <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl divide-y divide-white/[0.05]">
            <div className="px-5 py-3">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                Toggle which investment plans this user can see
              </p>
            </div>
            {ALL_PLANS.map((planName) => {
              const isDisabled = (user.disabledPlans || []).includes(planName);
              return (
                <div
                  key={planName}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isDisabled
                          ? "bg-red-500/50"
                          : "bg-emerald-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]"
                      }`}
                    />
                    <div>
                      <p
                        className={`text-xs font-bold mb-0.5 ${isDisabled ? "text-gray-600 line-through" : "text-white"}`}
                      >
                        {planName}
                      </p>
                      <p
                        className={`text-[8px] uppercase tracking-wide ${isDisabled ? "text-gray-700" : "text-gray-500"}`}
                      >
                        {isDisabled ? "Hidden from user" : "Visible to user"}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={loadingIds.has(`plan-${planName}`)}
                    onClick={() => handleTogglePlan(planName)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDisabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                    }`}
                  >
                    {loadingIds.has(`plan-${planName}`) && (
                      <Spinner size="xs" />
                    )}
                    {isDisabled ? "Enable" : "Disable"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Transaction History */}
        {activeTab === "history" && (
          <div className="bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl overflow-hidden">
            {!user.transactions || user.transactions.length === 0 ? (
              <EmptyState icon="🧾" label="No transactions found" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                      {[
                        "Date",
                        "Type",
                        "Amount",
                        "Asset",
                        "Address",
                        "Network",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[8px] font-bold text-gray-500 uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {user.transactions.map((tx, i) => (
                      <tr
                        key={tx._id || i}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          })}
                          <span className="block text-[8px] text-gray-700">
                            {new Date(tx.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md border ${txTypeColor(tx.type)}`}
                          >
                            {tx.type?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono font-black text-white whitespace-nowrap">
                          $
                          {(tx.amount || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono text-nirshux-accent">
                          {tx.coin || "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-[10px] font-mono text-gray-500 max-w-[160px] truncate"
                          title={tx.addressUsed || ""}
                        >
                          {tx.addressUsed || "—"}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-gray-400">
                          {tx.network || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${txStatusColor(tx.status)}`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};;;

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

export default AdminUserView;
