// TransactionTable.jsx
import React from 'react';

const TransactionTable = ({ transactions, limit }) => {
  // We slice the data based on the 'limit' prop (3 for dashboard)
  const displayData = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
            <th className="py-4 px-2 font-medium">Name / Plan</th>
            <th className="py-4 px-2 font-medium text-center">Date</th>
            <th className="py-4 px-2 font-medium text-center">Amount</th>
            <th className="py-4 px-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {displayData.length > 0 ? (
            displayData.map((tx, index) => (
              <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-4 px-2 font-medium text-white">{tx.planName || "Deposit"}</td>
                <td className="py-4 px-2 text-center text-gray-400">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="py-4 px-2 text-center text-white font-semibold">
                  ${tx.amount.toLocaleString()}
                </td>
                <td className="py-4 px-2 text-right">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    tx.status === 'completed' ? 'bg-nirshux-accent/20 text-nirshux-accent' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {tx.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-10 text-center text-gray-500 italic">No transactions found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;