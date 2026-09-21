// frontend/src/components/History.jsx
import React, { useState, useEffect } from "react";
import API from "../api";

const formatCoin = (coin) => {
  if (!coin) return "USD";
  return coin.split("(")[0].trim() || "USD";
};

const StatusBadge = ({ status }) => {
  const map = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${map[status] || map.pending}`}
    >
      {status}
    </span>
  );
};

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/api/investor/history", {
          headers: { "x-auth-token": token },
        });
        setTransactions(res.data);
      } catch (err) {
        console.error("History Fetch Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const sorted = [...transactions].sort((a, b) => {
    const da = new Date(a.date || a.createdAt || a.timestamp || 0);
    const db = new Date(b.date || b.createdAt || b.timestamp || 0);
    return db - da;
  });

  if (loading) {
    return (
      <div className="p-10 text-nirshux-accent font-mono text-xs uppercase tracking-widest animate-pulse">
        Loading history...
      </div>
    );
  }

  return (
    <div className="p-4 xl:p-10 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
          Transaction <span className="text-nirshux-accent">History</span>
        </h1>
        <p className="text-gray-500 text-[10px] uppercase font-mono mt-2">
          {sorted.length} total {sorted.length === 1 ? "record" : "records"}
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-20 text-center">
          <p className="text-gray-600 font-mono text-xs uppercase tracking-[0.3em]">
            No transactions found
          </p>
        </div>
      ) : (
        <div className="bg-[#161A1E] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Date", "Type", "Amount", "Asset", "Status"].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((tx, i) => {
                  const isIn =
                    tx.type === "deposit" ||
                    tx.type === "referral_bonus" ||
                    tx.type === "maturity_release";
                  const dateValue = tx.date || tx.createdAt || tx.timestamp;
                  const d = dateValue ? new Date(dateValue) : null;

                  return (
                    <tr
                      key={tx._id || i}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                        {d && !isNaN(d.getTime()) ? (
                          <>
                            {d.toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                            <span className="block text-[8px] text-gray-700">
                              {d.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider ${isIn ? "text-nirshux-accent" : "text-gray-400"}`}
                        >
                          {isIn ? "↓ Deposit" : "↑ Withdrawal"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-black text-sm whitespace-nowrap ${isIn ? "text-white" : "text-gray-400"}`}
                        >
                          {isIn ? "+" : "-"}$
                          {Number(tx.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[9px] font-black text-nirshux-accent bg-nirshux-accent/10 px-2 py-0.5 rounded uppercase whitespace-nowrap">
                          {formatCoin(tx.coin)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
