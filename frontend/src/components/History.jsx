import React, { useState, useEffect } from 'react';
import axios from 'axios';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/investor/history', {
          headers: { 'x-auth-token': token }
        });
        // Log this to your console to see the actual keys (date vs createdAt)
        console.log("Transmission Data Received:", res.data);
        setTransactions(res.data);
      } catch (err) {
        console.error("History Fetch Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const groupTransactions = (data) => {
    if (!data || data.length === 0) return {};
    
    const tree = {};
    data.forEach(tx => {
      // FALLBACK: Use tx.date OR tx.createdAt OR tx.timestamp
      const dateValue = tx.date || tx.createdAt || tx.timestamp;
      if (!dateValue) return;

      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return; // Skip invalid dates

      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthName = d.toLocaleString('default', { month: 'long' });
      const semester = monthIdx < 6 ? 'H1 (Jan-Jun)' : 'H2 (Jul-Dec)';
      
      const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
      const weekOfMonth = Math.ceil((d.getDate() + firstDay) / 7);
      const day = d.toLocaleDateString('default', { weekday: 'long', day: 'numeric' });

      if (!tree[year]) tree[year] = {};
      if (!tree[year][semester]) tree[year][semester] = {};
      if (!tree[year][semester][monthName]) tree[year][semester][monthName] = {};
      if (!tree[year][semester][monthName][`Week ${weekOfMonth}`]) tree[year][semester][monthName][`Week ${weekOfMonth}`] = {};
      if (!tree[year][semester][monthName][`Week ${weekOfMonth}`][day]) tree[year][semester][monthName][`Week ${weekOfMonth}`][day] = [];

      tree[year][semester][monthName][`Week ${weekOfMonth}`][day].push(tx);
    });
    return tree;
  };

  const toggle = (path) => {
    const newPaths = new Set(expandedPaths);
    newPaths.has(path) ? newPaths.delete(path) : newPaths.add(path);
    setExpandedPaths(newPaths);
  };

  const groupedData = groupTransactions(transactions);

  const Folder = ({ title, children, path, level }) => {
    const isOpen = expandedPaths.has(path);
    return (
      <div className="mb-2">
        <button 
          onClick={() => toggle(path)}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isOpen ? 'bg-white/5 text-nirshux-accent' : 'text-gray-500 hover:text-white'}`}
          style={{ marginLeft: `${level * 12}px` }}
        >
          <span className="text-[10px]">{isOpen ? '▼' : '▶'}</span>
          <span className="uppercase text-[11px] font-black tracking-widest">{title}</span>
        </button>
        {isOpen && <div className="mt-1 border-l border-white/5 ml-4">{children}</div>}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-nirshux-accent font-mono animate-pulse">DECRYPTING ARCHIVES...</div>;

  return (
    <div className="p-4 xl:p-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Forensic <span className="text-nirshux-accent">History</span></h1>
        <p className="text-gray-500 text-[10px] uppercase font-mono mt-2">Nesting Protocol: Year // Semester // Month // Week // Day</p>
      </div>

      {transactions.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-3xl p-20 text-center">
            <p className="text-gray-600 font-mono text-xs uppercase tracking-[0.3em]">No Transmissions Found in Archives</p>
        </div>
      ) : (
        Object.keys(groupedData).sort().reverse().map(year => (
          <Folder key={year} title={year} path={year} level={0}>
            {Object.keys(groupedData[year]).map(sem => (
              <Folder key={sem} title={sem} path={`${year}-${sem}`} level={1}>
                {Object.keys(groupedData[year][sem]).map(month => (
                  <Folder key={month} title={month} path={`${year}-${sem}-${month}`} level={2}>
                    {Object.keys(groupedData[year][sem][month]).map(week => (
                      <Folder key={week} title={week} path={`${year}-${sem}-${month}-${week}`} level={3}>
                        {Object.keys(groupedData[year][sem][month][week]).map(day => (
                          <Folder key={day} title={day} path={`${year}-${sem}-${month}-${week}-${day}`} level={4}>
                            <div className="space-y-2 p-2">
                              {groupedData[year][sem][month][week][day].map(tx => (
                                <div key={tx._id} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:border-nirshux-accent/30 transition-all">
                                  <div>
                                    <p className="text-white font-bold text-xs uppercase">{tx.type || 'Transaction'}</p>
                                    <p className="text-[9px] text-gray-500 font-mono">{tx.coin || 'N/A'} ({tx.network || 'Network'})</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-white font-black text-sm">${tx.amount?.toLocaleString()}</p>
                                    <p className={`text-[8px] font-bold uppercase ${tx.status === 'success' || tx.status === 'completed' ? 'text-nirshux-accent' : 'text-red-500'}`}>
                                      {tx.status}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Folder>
                        ))}
                      </Folder>
                    ))}
                  </Folder>
                ))}
              </Folder>
            ))}
          </Folder>
        ))
      )}
    </div>
  );
};

export default History;