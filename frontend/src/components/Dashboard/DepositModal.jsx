// frontend/src/components/Dashboard/DepositModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../../api';

const DepositModal = ({ isOpen, onClose, refreshData }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState(''); 

  useEffect(() => {
    if (isOpen && step === 2) {
      setLoading(true);
      setError('');
      API.get(`/api/investor/whitelisted-wallets`) 
        .then(res => {
          console.log('Wallets fetched:', res.data);
          setWallets(res.data);
          if (res.data.length === 0) {
            setError('No payment gateways available. Contact admin.');
          }
        })
        .catch(err => {
          console.error("GATEWAY_SYNC_CRITICAL_FAILURE", err);
          setError('Failed to load payment methods. Try again.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, step]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await API.post(`/api/investor/deposit-request`, {
        amount: parseFloat(amount),
        coin: selectedWallet.symbol,
        network: selectedWallet.network,
        addressUsed: selectedWallet.address
      });
      
      setStatus('success');
      refreshData();
      setTimeout(() => {
        onClose();
        setStep(1);
        setStatus('idle');
        setAmount('');
        setSelectedWallet(null);
      }, 2000);
    } catch (err) {
      console.error('Deposit request error:', err);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      {/* SLIDING NOTIFICATION */}
      <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0'}`}>
        <div className="bg-nirshux-accent text-black px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-nirshux-accent/40">
          Copied to Clipboard
        </div>
      </div>

      {/* FIXED WIDTH & PADDING HERE: Reduced max-width and added responsive padding */}
      <div className="relative w-full max-w-lg bg-[#0B0E11] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
        
        {/* STEP 1: DEFINE CAPITAL */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">Deposit <span className="text-nirshux-accent">Funds</span></h2>
            <p className="text-gray-500 text-[9px] md:text-[11px] mb-6 md:mb-10 font-mono tracking-widest uppercase">Registry // Define Capital Input</p>
            
            <div className="relative mb-6">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-nirshux-accent font-bold text-xl">$</span>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0.00" 
                className="w-full bg-[#161A1E] border border-white/5 p-5 md:p-6 pl-12 rounded-2xl outline-none focus:border-nirshux-accent text-xl md:text-2xl font-mono text-white transition-all" 
              />
            </div>

            <div className="grid grid-cols-4 gap-2 md:gap-3 mb-8 md:mb-10">
              {['200', '500', '1000', '5000'].map(val => (
                <button key={val} onClick={() => setAmount(val)} className="py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] md:text-[11px] font-bold text-white hover:bg-nirshux-accent hover:text-black transition-all">${val}</button>
              ))}
            </div>
            
            <button 
              disabled={!amount || amount <= 0} 
              onClick={() => setStep(2)} 
              className="w-full bg-nirshux-accent text-black font-black uppercase py-4 md:py-5 rounded-2xl tracking-[0.2em] shadow-lg shadow-nirshux-accent/20 disabled:opacity-20 transition-all hover:scale-[1.01]"
            >
              Continue to Selection
            </button>
          </div>
        )}

        {/* STEP 2: SELECT GATEWAY */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 text-white">
            <button onClick={() => setStep(1)} className="mb-4 md:mb-6 flex items-center gap-2 text-[10px] text-gray-500 uppercase font-black hover:text-nirshux-accent transition-colors font-mono tracking-widest">
              ← Back to Amount
            </button>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">Select <span className="text-nirshux-accent">Gateway</span></h2>
            
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl">
                <p className="text-red-400 text-xs font-mono">{error}</p>
              </div>
            )}
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="text-center py-16 border border-dashed border-white/5 rounded-3xl bg-white/5">
                  <p className="text-gray-500 font-mono text-[10px] uppercase animate-pulse tracking-[0.3em]">Syncing Secure Nodes...</p>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-red-500/20 rounded-3xl bg-red-500/5">
                  <p className="text-red-400 font-mono text-[10px] uppercase tracking-[0.3em] mb-2">No Gateways Available</p>
                  <p className="text-gray-500 font-mono text-[9px]">Contact Support</p>
                </div>
              ) : (
                wallets.map(w => (
                  <button key={w._id} onClick={() => { setSelectedWallet(w); setStep(3); }} className="w-full flex items-center justify-between p-4 md:p-6 bg-[#161A1E] border border-white/5 rounded-3xl hover:border-nirshux-accent group transition-all">
                    <div className="flex items-center gap-4 md:gap-5 text-left">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-nirshux-accent/10 flex items-center justify-center text-nirshux-accent font-black text-xs md:text-sm">{w.symbol}</div>
                      <div>
                        <p className="font-bold text-base md:text-lg leading-none mb-1 uppercase italic tracking-tight">{w.coinName}</p>
                        <p className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase tracking-widest">{w.network}</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-nirshux-accent group-hover:text-black transition-all text-xs">→</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: FINAL TRANSMISSION */}
        {step === 3 && selectedWallet && (
          <div className="animate-in fade-in zoom-in-95 text-white">
            <button onClick={() => setStep(2)} className="mb-3 text-[10px] text-gray-500 uppercase font-black hover:text-nirshux-accent transition-colors font-mono tracking-widest">
              ← Change Method
            </button>
            <h2 className="text-center text-xl md:text-2xl font-black uppercase tracking-widest mb-1 md:mb-2">Complete Payment</h2>
            <p className="text-center text-gray-500 text-[9px] md:text-[11px] mb-6 md:mb-8 uppercase font-mono tracking-tighter">Transmission Protocol // Send Exactly</p>

            {/* Asset Details */}
            <div className="bg-[#161A1E] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center gap-4 md:gap-5 mb-3 md:mb-4 shadow-inner">
               <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-nirshux-accent flex items-center justify-center text-black font-black text-lg md:text-xl shadow-lg shadow-nirshux-accent/20">
                 {selectedWallet.symbol[0]}
               </div>
               <div>
                 <p className="text-lg md:text-xl font-mono font-black">{amount} {selectedWallet.symbol}</p>
                 <p className="text-xs text-gray-400 font-mono">${parseFloat(amount).toLocaleString()} USD</p>
               </div>
            </div>

            {/* Address Block */}
            <div className="bg-[#161A1E] border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 mb-3 md:mb-4">
              <p className="text-[9px] uppercase font-bold text-gray-400 mb-2 md:mb-3 font-mono tracking-widest">Deposit Address ({selectedWallet.network})</p>
              <div className="flex items-center gap-2 md:gap-3 bg-black/40 p-3 md:p-4 rounded-xl border border-white/5">
                <code className="flex-1 text-[10px] md:text-xs font-mono text-nirshux-accent break-all">{selectedWallet.address}</code>
                <button 
                  onClick={() => handleCopy(selectedWallet.address)} 
                  className="px-3 py-1.5 bg-nirshux-accent/10 rounded-lg hover:bg-nirshux-accent hover:text-black text-[9px] font-black transition-all text-nirshux-accent"
                >
                    COPY
                </button>
              </div>
            </div>

            {/* Warnings/Instructions */}
            <div className="space-y-2 mb-4 md:mb-6">
              <div className="bg-orange-500/5 border border-orange-500/20 p-3 md:p-4 rounded-2xl flex gap-3 md:gap-4">
                <span className="text-orange-500 text-xs">⚠️</span>
                <p className="text-[9px] md:text-[10px] text-orange-200/60 leading-relaxed font-mono">
                  <strong className="text-orange-500 uppercase">Warning:</strong> Send only {selectedWallet.symbol}. Cross-chain errors = loss.
                </p>
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 bg-black/40 p-4 md:p-5 rounded-[1.5rem] md:rounded-3xl border border-white/5 font-mono text-white">
               <div>
                 <p className="text-[8px] md:text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Status</p>
                 <p className="text-[10px] md:text-xs font-black text-nirshux-accent uppercase animate-pulse">Awaiting Payment</p>
               </div>
               <div>
                 <p className="text-[8px] md:text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-1">Confirmations</p>
                 <p className="text-[10px] md:text-xs font-black">0 / 3</p>
               </div>
            </div>

            <button 
              onClick={handleFinalize} 
              disabled={loading} 
              className={`w-full font-black uppercase py-4 md:py-5 rounded-2xl tracking-[0.15em] md:tracking-[0.2em] transition-all shadow-xl text-sm md:text-base ${status === 'success' ? 'bg-green-500 text-white' : status === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-nirshux-accent'}`}
            >
              {loading ? "TRANSMITTING..." : status === 'success' ? "✓ LOGGED" : status === 'error' ? "✗ FAILED" : "CONFIRM DEPOSIT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;