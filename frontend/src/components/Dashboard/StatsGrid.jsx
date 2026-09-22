import React from "react";

const formatAddress = (tx) => {
  const addr =
    tx.type === "deposit"
      ? tx.senderAddress || tx.addressUsed || tx.fromAddress || null
      : tx.addressUsed || tx.toAddress || tx.destinationAddress || null;

  if (!addr || addr.length < 10) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatCoin = (coin) => {
  if (!coin) return "USD";
  return coin.split("(")[0].trim() || "USD";
};

const StatusBadge = ({ status }) => {
  const normalized = String(status || "pending").toLowerCase();
  const map = {
    success: "border-emerald-400/15 bg-emerald-400/10 text-emerald-400",
    completed: "border-emerald-400/15 bg-emerald-400/10 text-emerald-400",
    pending: "border-amber-400/15 bg-amber-400/10 text-amber-400",
    failed: "border-red-400/15 bg-red-400/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-widest ${map[normalized] || map.pending}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {normalized}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const isIn =
    type === "deposit" ||
    type === "referral_bonus" ||
    type === "maturity_release";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.16em] ${isIn ? "text-nirshux-accent" : "text-gray-500"}`}
    >
      <span className="text-[11px]">{isIn ? "↓" : "↑"}</span>
      {isIn ? "Incoming" : "Outgoing"}
    </span>
  );
};

const TransactionTable = ({ transactions = [], limit }) => {
  const displayData = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {["Transaction", "Amount", "Address", "Asset", "Status"].map(
              (heading) => (
                <th
                  key={heading}
                  className="px-3 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 first:pl-1"
                >
                  {heading}
                </th>
              ),
            )}
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
                  className="group border-b border-white/[0.035] transition-colors hover:bg-white/[0.018]"
                >
                  <td className="px-3 py-4 first:pl-1">
                    <TypeBadge type={tx.type} />
                  </td>

                  <td className="px-3 py-4">
                    <span
                      className={`font-mono text-xs font-black ${isIn ? "text-white" : "text-gray-400"}`}
                    >
                      {isIn ? "+" : "-"}$
                      {Number(tx.amount || 0).toLocaleString()}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <span className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[9px] text-gray-500">
                      {formatAddress(tx)}
                    </span>
                  </td>

                  <td className="px-3 py-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md border border-nirshux-accent/10 bg-nirshux-accent/[0.07] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-nirshux-accent">
                        {formatCoin(tx.coin)}
                      </span>
                      {tx.network &&
                        !/protocol|bonus|internal/i.test(tx.network) && (
                          <span className="text-[8px] font-mono text-gray-700">
                            {tx.network}
                          </span>
                        )}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="py-16 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-gray-700">
                  ◷
                </div>
                <p className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
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
