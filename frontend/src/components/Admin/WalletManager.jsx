// frontend/src/components/Admin/WalletManager.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';

const WalletManager = () => {
  const [wallets, setWallets] = useState([]);
  const [formData, setFormData] = useState({
    coinName: '',
    symbol: '',
    network: '',
    address: ''
  });

  const fetchWallets = async () => {
    try {
      const res = await API.get('/api/investor/whitelisted-wallets');
      setWallets(res.data);
    } catch (err) {
      console.error("Error fetching wallets");
    }
  };

  useEffect(() => { fetchWallets(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/admin/whitelist-wallet', formData, {
        headers: { 'x-auth-token': token }
      });
      alert("Wallet Whitelisted!");
      setFormData({ coinName: '', symbol: '', network: '', address: '' });
      fetchWallets();
    } catch (err) {
      alert("Failed to add wallet. Ensure you are logged in as Admin.");
    }
  };

  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Side */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl h-fit">
        <h3 className="text-xl font-black italic uppercase mb-6 text-nirshux-accent">Whitelist New Asset</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Coin Name</label>
            <input 
              className="w-full bg-black/20 border border-white/10 p-3 rounded-xl mt-1 text-sm outline-none focus:border-nirshux-accent"
              placeholder="e.g. Bitcoin"
              value={formData.coinName}
              onChange={(e) => setFormData({...formData, coinName: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Symbol</label>
              <input 
                className="w-full bg-black/20 border border-white/10 p-3 rounded-xl mt-1 text-sm outline-none focus:border-nirshux-accent"
                placeholder="BTC"
                value={formData.symbol}
                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Network</label>
              <input 
                className="w-full bg-black/20 border border-white/10 p-3 rounded-xl mt-1 text-sm outline-none focus:border-nirshux-accent"
                placeholder="ERC20"
                value={formData.network}
                onChange={(e) => setFormData({...formData, network: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Wallet Address</label>
            <input 
              className="w-full bg-black/20 border border-white/10 p-3 rounded-xl mt-1 text-sm outline-none focus:border-nirshux-accent font-mono"
              placeholder="0x..."
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-nirshux-accent transition-all uppercase text-xs italic">
            Authorize Asset
          </button>
        </form>
      </div>

      {/* List Side */}
      <div className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl">
        <h3 className="text-xl font-black italic uppercase mb-6">Active Receivers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wallets.map(w => (
            <div key={w._id} className="p-4 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-nirshux-accent/10 text-nirshux-accent text-[10px] font-black px-2 py-1 rounded-md uppercase">
                  {w.symbol}
                </span>
                <span className="text-[10px] text-gray-500 font-mono italic">{w.network}</span>
              </div>
              <p className="font-bold text-sm mb-1">{w.coinName}</p>
              <p className="text-[10px] text-gray-500 font-mono break-all bg-black/20 p-2 rounded-lg border border-white/5">
                {w.address}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletManager;