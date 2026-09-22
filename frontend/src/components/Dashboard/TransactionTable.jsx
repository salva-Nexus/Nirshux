// frontend/src/components/Dashboard/TransactionTable.jsx
import React from "react";

const formatAddress = (tx) => {
  const addr =
    tx.type === "deposit"
      ? tx.senderAddress || tx.addressUsed || tx.fromAddress || null
      : tx.addressUsed || tx.toAddress || tx.destinationAddress || null;

  if (!addr || addr.length < 10) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

// Internal transaction types (maturity_release, referral_bonus, investment)
// carry bookkeeping labels the user shouldn't need to parse. Coin fields for
// these are also stuffed with notes like "USD (PREMIUM PLAN Matured)" —
// strip that down to just the asset.
const formatCoin = (coin) => {
  if (!coin) return "USD";
  return coin.split("(")[0].trim() || "USD";
};

const StatusBadge = ({ status }) => {
  const map = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/10  text-yellow-400  border-yellow-500/20",
    failed: "bg-red-500/10     text-red-400     border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${map[status] || map.pending}`}
    >
      {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const isIn =
    type === "deposit" ||
    type === "referral_bonus" ||
    type === "maturity_release";
  // User only ever needs to know: did money come in, or go out.
  // "maturity release" / "referral bonus" are internal ledger labels.
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-wider ${isIn ? "text-nirshux-accent" : "text-gray-400"}`}
    >
      {isIn ? "↓ Deposit" : "↑ Withdrawal"}
    </span>
  );
};

const TransactionTable = ({ transactions, limit }) => {
  const displayData = limit ? transactions.slice(0, limit) : transactions;

  // ── FIX: Type, then Amount, then the rest (Address, Asset, Status) ──
  const columns = ["Type", "Amount", "Address", "Asset", "Status"];

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-left border-collapse min-w-[420px] sm:min-w-[540px]">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {columns.map((h) => (
              <th
                key={h}
                className="py-2 px-1.5 sm:py-3 sm:px-3 text-[8px] sm:text-[9px] font-black text-gray-600 uppercase tracking-widest whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.length > 0 ? (
            displayData.map((tx, i) => {
              const isIn =
                tx.type === "deposit" ||
                tx.type === "referral_bonus" ||
                tx.type === "maturity_release";

              return (
                <tr
                  key={tx._id || i}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                >
                  {/* Type */}
                  <td className="py-2.5 px-1.5 sm:py-3.5 sm:px-3">
                    <TypeBadge type={tx.type} />
                  </td>

                  {/* Amount */}
                  <td className="py-2.5 px-1.5 sm:py-3.5 sm:px-3">
                    <span
                      className={`font-mono font-black text-xs sm:text-sm whitespace-nowrap ${isIn ? "text-white" : "text-gray-400"}`}
                    >
                      {isIn ? "+" : "-"}$
                      {Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Address */}
                  <td className="py-2.5 px-1.5 sm:py-3.5 sm:px-3">
                    <span className="font-mono text-[9px] sm:text-[10px] text-gray-400 bg-white/[0.03] px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md border border-white/[0.06] group-hover:border-white/10 transition-colors whitespace-nowrap">
                      {formatAddress(tx)}
                    </span>
                  </td>

                  {/* Asset / Coin */}
                  <td className="py-2.5 px-1.5 sm:py-3.5 sm:px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] sm:text-[9px] font-black text-nirshux-accent bg-nirshux-accent/10 px-1.5 sm:px-2 py-0.5 rounded uppercase whitespace-nowrap">
                        {formatCoin(tx.coin)}
                      </span>
                      {tx.network &&
                        !/protocol|bonus|internal/i.test(tx.network) && (
                          <span className="hidden sm:inline text-[9px] text-gray-600 font-mono">
                            {tx.network}
                          </span>
                        )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-1.5 sm:py-3.5 sm:px-3">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <p className="text-gray-600 font-mono text-[10px] uppercase tracking-widest">
                  No transmissions on record
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
