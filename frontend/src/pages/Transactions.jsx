// Transactions.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/investor/profile', {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        // We use the populated transactions from the profile route we updated earlier
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const StatusBadge = ({ status }) => {
    const styles = {
      success: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20"
    };
    return (
      <span className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-12 bg-[#0B0E11] min-h-screen text-white font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <header className="mb-12 border-l-4 border-nirshux-accent pl-6">
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
            Operation <span className="text-nirshux-accent">Ledger</span>
          </h1>
          <p className="text-gray-500 font-mono text-[9px] uppercase tracking-[0.3em] mt-2">
            Complete Protocol History // SEC_AUTH_LOADED
          </p>
        </header>

        {/* LOG LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <div className="w-8 h-8 border-2 border-nirshux-accent border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-[10px] uppercase tracking-widest">Synchronizing Records...</p>
            </div>
          ) : transactions.length > 0 ? (
            transactions.map((trx) => (
              <div 
                key={trx._id} 
                className="bg-[#161A1E] border border-white/5 p-5 md:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${
                    trx.type === 'deposit' ? 'bg-nirshux-accent/10 text-nirshux-accent' : 'bg-white/5 text-gray-400'
                  }`}>
                    {trx.type === 'deposit' ? 'IN' : 'OUT'}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold uppercase tracking-tight text-sm">
                        {trx.type} <span className="text-gray-600 mx-1">/</span> {trx.coin}
                      </h3>
                      <StatusBadge status={trx.status} />
                    </div>
                    <p className="text-[10px] font-mono text-gray-500">
                      {new Date(trx.date).toLocaleDateString()} — {trx.network} Network
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:text-right border-t md:border-none border-white/5 pt-4 md:pt-0">
                  <div className="md:hidden">
                    <p className="text-[8px] text-gray-600 uppercase font-black">Value</p>
                  </div>
                  <div>
                    <p className={`text-lg font-mono font-black ${trx.type === 'deposit' ? 'text-white' : 'text-gray-400'}`}>
                      {trx.type === 'deposit' ? '+' : '-'}${trx.amount.toLocaleString()}
                    </p>
                    <p className="text-[8px] text-gray-600 font-mono uppercase tracking-tighter truncate max-w-[120px]">
                      ID: {trx._id.slice(-12)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <p className="text-gray-600 font-mono text-[10px] uppercase tracking-widest">No transmissions found in current sector.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;