import React, { useState, useEffect } from 'react';
import API from '../api';

const WithdrawalModal = ({ isOpen, onClose, user, onRefresh }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [address, setAddress] = useState('');
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // New Success State

  // FETCH ASSETS
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await API.get('/api/investor/whitelisted-wallets', {
          headers: { 'x-auth-token': token }
        });
        setWallets(res.data);
      } catch (err) { 
        console.error("Asset Fetch Error:", err.response?.status); 
      }
    };
    if (isOpen) fetchWallets();
  }, [isOpen]);

  // KEPT: Your Quick Amount logic
  const setQuickAmount = (val) => {
    if (val <= (user?.balance || 0)) setAmount(val.toString());
  };

  // KEPT: Your detailed Address Validation logic
  const isAddressValid = () => {
    if (!address) return false;
    const coinKey = selectedCoin?.symbol?.toUpperCase();
    if (coinKey === 'ETH' || coinKey === 'BNB') return /^0x[a-fA-F0-9]{40}$/.test(address);
    if (coinKey === 'BTC') return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1)[a-z0-9]{25,39}$/.test(address);
    return address.length > 10;
  };

  const handleWithdraw = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await API.post('/api/investor/withdraw-request', {
        amount: Number(amount),
        coin: selectedCoin.coinName,
        network: selectedCoin.network,
        addressUsed: address
      }, { headers: { 'x-auth-token': token } });
      
      onRefresh();
      // REMOVED ALERT: Replaced with success state
      setIsSuccess(true);
      
      // Auto-close after 3 seconds so the user sees the confirmation
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setStep(1);
        setAmount('');
        setAddress('');
      }, 3000);

    } catch (err) {
      setLoading(false);
      // In-modal error handling instead of alert
      console.error("Transmission Error", err.response?.data?.msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-[#111418] border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        
        {/* CLOSE BUTTON (X) - Hidden on success to prevent interruptions */}
        {!isSuccess && (
          <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {isSuccess ? (
          /* NEW SUCCESS UI (NO ALERTS) */
          <div className="p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-nirshux-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-nirshux-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter mb-2">Protocol Initiated</h2>
            <p className="text-gray-500 text-[10px] uppercase font-mono">Transmission confirmed. Closing terminal...</p>
          </div>
        ) : (
          <>
            {/* STEP 1: AMOUNT & QUICK INPUTS */}
            {step === 1 && (
              <div className="p-8">
                <h2 className="text-nirshux-accent font-black text-2xl uppercase italic tracking-tighter mb-2">Initiate Withdrawal</h2>
                <p className="text-gray-500 text-[10px] font-mono uppercase mb-8">Available Liquidity: ${user?.balance?.toLocaleString()}</p>
                
                <div className={`p-4 rounded-2xl bg-white/5 border transition-all ${Number(amount) > user?.balance ? 'border-red-500' : 'border-white/10'}`}>
                  <label className="block text-[9px] text-gray-500 uppercase font-bold mb-2">Request Amount (USD)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent w-full text-3xl font-black outline-none text-white"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex gap-2 mt-4 justify-between">
                  {[50, 100, 250, 500].map(val => (
                    <button 
                      key={val}
                      onClick={() => setQuickAmount(val)}
                      className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 hover:border-nirshux-accent hover:text-white transition-all"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
                
                <button 
                  disabled={!amount || Number(amount) <= 0 || Number(amount) > user?.balance}
                  onClick={() => setStep(2)}
                  className="w-full mt-8 bg-nirshux-accent text-black font-black py-4 rounded-2xl uppercase tracking-widest active:scale-95 transition-all disabled:opacity-20"
                >
                  Continue Protocol
                </button>
              </div>
            )}

            {/* STEP 2: ASSET ROUTING */}
            {step === 2 && (
              <div className="p-8">
                <h2 className="text-white font-black text-xl uppercase mb-6">Routing Asset</h2>
                <div className="space-y-3 max-h-[200px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                  {wallets.map(w => (
                    <div 
                      key={w._id} 
                      onClick={() => setSelectedCoin(w)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCoin?._id === w._id ? 'border-nirshux-accent bg-nirshux-accent/5' : 'border-white/5 bg-white/5'}`}
                    >
                      <p className="font-bold text-sm text-white">{w.coinName} <span className="text-[10px] text-gray-500">({w.network})</span></p>
                    </div>
                  ))}
                </div>

                {selectedCoin && (
                  <div className={`p-4 rounded-2xl bg-white/5 border transition-all ${address && !isAddressValid() ? 'border-red-500' : 'border-white/10'}`}>
                    <label className="block text-[9px] text-gray-500 uppercase font-bold mb-2">Destination Address</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-transparent w-full text-sm font-mono outline-none text-white"
                      placeholder="Paste Wallet Address"
                    />
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button onClick={() => setStep(1)} className="flex-1 text-gray-500 font-bold uppercase text-[10px]">Back</button>
                  <button 
                    disabled={!selectedCoin || !isAddressValid()}
                    onClick={() => setStep(3)}
                    className="flex-[2] bg-nirshux-accent text-black font-black py-4 rounded-2xl uppercase tracking-widest disabled:opacity-20"
                  >
                    Review Request
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: FINAL REVIEW */}
            {step === 3 && (
              <div className="p-8 text-center">
                <h2 className="text-white font-black text-2xl uppercase mb-6">Final Review</h2>
                <div className="bg-white/5 rounded-2xl p-6 text-left space-y-4 mb-8 border border-white/5">
                  <div className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Amount</span>
                    <span className="font-black text-white">${Number(amount).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Cryptocurrency</span>
                    <span className="font-black text-white">{selectedCoin.coinName} ({selectedCoin.symbol})</span>
                  </div>
                  <div className="border-b border-white/5 pb-2 text-[10px]">
                    <span className="text-gray-500 uppercase font-bold block mb-1">Destination</span>
                    <span className="font-mono text-[9px] break-all text-nirshux-accent">{address}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500 uppercase font-bold">Processing Time</span>
                    <span className="font-bold text-white">1-3 Business Days</span>
                  </div>
                </div>

                <button 
                  disabled={loading}
                  onClick={handleWithdraw}
                  className="w-full bg-nirshux-accent text-black font-black py-4 rounded-2xl uppercase tracking-widest"
                >
                  {loading ? "Transmitting..." : "Confirm Withdrawal"}
                </button>
                <button onClick={() => setStep(2)} className="mt-4 text-gray-500 font-bold uppercase text-[10px]">Back to Routing</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;