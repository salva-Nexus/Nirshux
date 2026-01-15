import React, { useState, useEffect, useCallback } from 'react';
import API from '../api'; // Import your custom axios instance

const AdminPanel = () => {
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]); 
  const [users, setUsers] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });
  const [newWallet, setNewWallet] = useState({ coinName: '', symbol: '', network: '', address: '' });
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [adjustingUser, setAdjustingUser] = useState(null); 
  const [adjAmount, setAdjAmount] = useState('');

  // ✅ NO LONGER NEEDED: API_BASE and getHeader
  // The token is now handled automatically by the interceptor in api.js

  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 4000);
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      // ✅ CHANGED: Using API instead of axios and shortening URLs
      const [depRes, withRes, userRes, wallRes] = await Promise.all([
        API.get('/api/admin/pending-deposits'),
        API.get('/api/admin/pending-withdrawals'),
        API.get('/api/admin/users'), 
        API.get('/api/admin/wallets')
      ]);
      setPendingDeposits(depRes.data);
      setPendingWithdrawals(withRes.data);
      setUsers(userRes.data);
      setWallets(wallRes.data);
    } catch (err) { 
      if (!silent) showToast("SYNC_ERROR", "error"); 
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); 
    return () => clearInterval(interval);
  }, [fetchData]);

  const executeAdjustment = async (userId, mode) => {
    const amountNum = parseFloat(adjAmount);
    if (!adjAmount || isNaN(amountNum)) return showToast("INVALID_INPUT", "error");
    const finalVal = mode === 'sub' ? -Math.abs(amountNum) : Math.abs(amountNum);
    try {
      // ✅ CHANGED: axios.put -> API.put
      await API.put(`/api/admin/user/adjust-balance/${userId}`, { amount: finalVal });
      showToast("LIQUIDITY_MUTATED", "success");
      setAdjustingUser(null);
      setAdjAmount('');
      fetchData(true);
    } catch (err) { showToast("MUTATION_FAILED", "error"); }
  };

  const handleDepositAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/api/admin/deposit/approve/${id}` : `/api/admin/deposit/reject/${id}`;
      await API.put(endpoint, {});
      showToast(action === 'approve' ? "FUNDS_AUTHORIZED" : "DEPOSIT_REJECTED", "success");
      fetchData(true);
    } catch (err) { showToast("ACTION_FAILED", "error"); }
  };

  const handleWithdrawalAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? `/api/admin/withdrawal/approve/${id}` : `/api/admin/withdrawal/reject/${id}`;
      await API.put(endpoint, {});
      showToast(action === 'approve' ? "PAYOUT_EXECUTED" : "WITHDRAWAL_REJECTED", "success");
      fetchData(true);
    } catch (err) { showToast(err.response?.data?.msg || "ACTION_FAILED", "error"); }
  };

  const handleWhitelist = async (e) => {
    e.preventDefault();
    try {
      await API.post('/api/admin/whitelist-wallet', newWallet);
      showToast("ASSET_AUTHORIZED", "success");
      setNewWallet({ coinName: '', symbol: '', network: '', address: '' });
      fetchData();
    } catch (err) { showToast("AUTHORIZATION_FAILED", "error"); }
  };

  const deListWallet = async (id) => {
    try {
      await API.delete(`/api/admin/wallet/${id}`);
      showToast("ASSET_REVOKED", "success");
      fetchData();
    } catch (err) { showToast("REVOCATION_FAILED", "error"); }
  };

  const wipeUser = async (id) => {
    if(!window.confirm("PERMANENTLY PURGE SUBJECT?")) return;
    try {
      await API.delete(`/api/admin/user/${id}`);
      showToast("USER_PURGED", "success");
      fetchData();
    } catch (err) { showToast("PURGE_FAILED", "error"); }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white p-4 md:p-8 font-sans selection:bg-nirshux-accent selection:text-black">
      {toast.show && (
        <div className={`fixed bottom-5 right-5 left-5 md:left-auto md:bottom-10 md:right-10 z-[100] px-6 py-4 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl flex items-center gap-3 transition-all animate-in slide-in-from-right-10 ${toast.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-nirshux-accent/10 text-nirshux-accent'}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.msg}</span>
        </div>
      )}

      <header className="mb-12 border-l-4 border-nirshux-accent pl-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Command <span className="text-nirshux-accent">Center</span></h1>
          <p className="text-gray-500 font-mono text-[9px] uppercase tracking-[0.3em] mt-3">Node: <span className="text-nirshux-accent">{isSyncing ? "SYNCING..." : "ONLINE"}</span> // SEC_LVL_4</p>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} className="bg-white/5 hover:bg-nirshux-accent group transition-all px-4 py-2 rounded-xl border border-white/10 text-nirshux-accent hover:text-black text-[10px] font-black uppercase tracking-widest">← Return to Oversight</button>
      </header>

      {/* SECTION: DEPOSIT TRANSMISSIONS */}
      <section className="mb-12">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-nirshux-accent mb-4 ml-2 italic">Incoming Deposits</h3>
        <div className="bg-[#161A1E] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-white/[0.02] text-[9px] uppercase tracking-widest font-bold text-gray-500">
                <tr><th className="p-6">Sender</th><th className="p-6">Asset Info</th><th className="p-6 text-center">Amount</th><th className="p-6 text-right">Verification</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingDeposits.map(d => (
                  <tr key={d._id} className="group hover:bg-white/[0.01]">
                    <td className="p-6">
                      <p className="font-bold text-sm uppercase">{d.user?.fullName}</p>
                      <p className="text-[9px] font-mono text-gray-500 lowercase">{d.user?.email}</p>
                    </td>
                    <td className="p-6 text-[10px]">
                      <span className="text-white font-black uppercase">{d.coin}</span>
                      <span className="ml-2 bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono">{d.network}</span>
                    </td>
                    <td className="p-6 text-center font-mono font-black text-nirshux-accent">${d.amount?.toLocaleString()}</td>
                    <td className="p-6 text-right space-x-2">
                      <button onClick={() => handleDepositAction(d._id, 'approve')} className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-green-500/20">Approve</button>
                      <button onClick={() => handleDepositAction(d._id, 'reject')} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-red-500/20">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </section>

      {/* NEW SECTION: WITHDRAWAL REQUESTS */}
      <section className="mb-12">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-4 ml-2 italic underline underline-offset-4">Outgoing Payouts</h3>
        <div className="bg-[#161A1E] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-white/[0.02] text-[9px] uppercase tracking-widest font-bold text-gray-500">
                <tr><th className="p-6">Recipient</th><th className="p-6">Asset & Destination</th><th className="p-6 text-center">Amount</th><th className="p-6 text-right">Execution</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingWithdrawals.map(w => (
                  <tr key={w._id} className="group hover:bg-white/[0.01]">
                    <td className="p-6">
                      <p className="font-bold text-sm uppercase">{w.user?.fullName}</p>
                      <p className="text-[9px] font-mono text-gray-500 lowercase">{w.user?.email}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-black text-[10px] uppercase">{w.coin}</span>
                        <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">{w.network}</span>
                      </div>
                      <p className="text-[9px] font-mono text-gray-500 break-all max-w-[200px]">{w.addressUsed}</p>
                    </td>
                    <td className="p-6 text-center font-mono font-black text-white">${w.amount?.toLocaleString()}</td>
                    <td className="p-6 text-right space-x-2">
                      <button onClick={() => handleWithdrawalAction(w._id, 'approve')} className="bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-orange-500/20">Authorize Payout</button>
                      <button onClick={() => handleWithdrawalAction(w._id, 'reject')} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black text-[9px] font-black uppercase px-4 py-2 rounded-lg transition-all border border-red-500/20">Reject</button>
                    </td>
                  </tr>
                ))}
                {pendingWithdrawals.length === 0 && (
                   <tr><td colSpan="4" className="p-10 text-center text-gray-600 font-mono text-[10px] uppercase">No Outgoing Protocols Pending</td></tr>
                )}
              </tbody>
            </table>
        </div>
      </section>

      <section className="mb-12">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 ml-2">Human Resources Registry</h3>
        <div className="bg-[#161A1E] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-white/[0.02] text-[9px] uppercase tracking-widest font-bold text-gray-500">
                <tr><th className="p-6">Subject</th><th className="p-6 text-center">Liquidity Status</th><th className="p-6 text-right">Clearance</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u._id} className="group hover:bg-white/[0.01]">
                    <td className="p-6">
                      <p className="font-bold text-sm uppercase">{u.fullName}</p>
                      <p className="text-[9px] font-mono text-gray-500 lowercase">{u.email}</p>
                    </td>
                    <td className="p-6 text-center">
                       {adjustingUser === u._id ? (
                         <div className="flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                            <input autoFocus type="number" placeholder="0.00" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} className="w-24 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-nirshux-accent outline-none focus:border-nirshux-accent" />
                            <button onClick={() => executeAdjustment(u._id, 'add')} className="bg-nirshux-accent text-black text-[8px] font-black px-2 py-1 rounded uppercase">Add</button>
                            <button onClick={() => executeAdjustment(u._id, 'sub')} className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded uppercase">Sub</button>
                            <button onClick={() => setAdjustingUser(null)} className="text-gray-500 hover:text-white ml-1 font-bold">×</button>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                            <span className="text-nirshux-accent text-sm font-bold block font-mono">${u.balance?.toLocaleString()}</span>
                            <button onClick={() => { setAdjustingUser(u._id); setAdjAmount(''); }} className="text-[8px] font-black text-gray-600 hover:text-white uppercase tracking-tighter mt-1 underline decoration-nirshux-accent/20"> [ Initiate_Mutation ] </button>
                         </div>
                       )}
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => wipeUser(u._id)} className="text-red-500/40 hover:text-red-500 text-[10px] font-black uppercase tracking-tighter">Wipe_Subject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#161A1E] p-8 rounded-3xl border border-white/5">
          <h3 className="text-nirshux-accent text-[10px] font-black uppercase tracking-[0.3em] mb-8">Authorize New Asset</h3>
          <form onSubmit={handleWhitelist} className="space-y-6">
            <input className="w-full bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-white outline-none focus:border-nirshux-accent" placeholder="COIN NAME" value={newWallet.coinName} onChange={(e) => setNewWallet({...newWallet, coinName: e.target.value})} required />
            <div className="flex gap-4">
               <input className="flex-1 bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-white outline-none focus:border-nirshux-accent" placeholder="SYMBOL" value={newWallet.symbol} onChange={(e) => setNewWallet({...newWallet, symbol: e.target.value})} required />
               <input className="flex-1 bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-white outline-none focus:border-nirshux-accent" placeholder="NETWORK" value={newWallet.network} onChange={(e) => setNewWallet({...newWallet, network: e.target.value})} required />
            </div>
            <input className="w-full bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-xs text-white outline-none focus:border-nirshux-accent" placeholder="WALLET ADDRESS" value={newWallet.address} onChange={(e) => setNewWallet({...newWallet, address: e.target.value})} required />
            <button type="submit" className="w-full bg-white text-black font-black uppercase text-[10px] py-4 rounded-xl tracking-widest hover:bg-nirshux-accent transition-all">Authorize Asset</button>
          </form>
        </section>

        <section className="bg-[#161A1E] p-8 rounded-3xl border border-white/5">
          <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Active Receivers</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {wallets.length > 0 ? wallets.map(w => (
              <div key={w._id} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex justify-between items-center group hover:border-nirshux-accent/30 transition-all">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-nirshux-accent text-black text-[8px] font-black px-2 py-0.5 rounded uppercase">{w.symbol}</span>
                    <span className="text-gray-500 text-[9px] uppercase font-bold">{w.network}</span>
                  </div>
                  <p className="font-mono text-[9px] text-gray-300 truncate">{w.address}</p>
                </div>
                <button onClick={() => deListWallet(w._id)} className="text-red-500/50 hover:text-red-500 text-[8px] font-black uppercase tracking-widest px-3 py-2 hover:bg-red-500/10 rounded-lg transition-all">De-List</button>
              </div>
            )) : (
              <p className="text-center text-gray-600 font-mono text-[10px] pt-10 uppercase tracking-tighter">No active receivers authorized.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;