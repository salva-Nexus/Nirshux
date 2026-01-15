// ForgotPassword.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Email, 2 = 6-digit Code
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      if (step === 1) {
        // STEP 1: Request OTP via Supabase/Gmail SMTP
        await API.post('/api/auth/forgot-password', { 
          email: email.trim().toLowerCase() 
        });
        setStatus({ type: 'success', msg: 'Reset protocol initiated. Code sent to terminal.' });
        setStep(2); 
      } else {
        // STEP 2: Verify the OTP with Supabase
        await API.post('/api/auth/verify-otp', { 
          email: email.trim().toLowerCase(),
          code: code.trim()
        });
        setStatus({ type: 'success', msg: 'Security Clear. Accessing override...' });
        
        // Pass email to ResetPassword page via state
        setTimeout(() => navigate('/reset-password', { state: { email: email.trim().toLowerCase() } }), 1500);
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        msg: err.response?.data?.msg || 'Terminal error: Authorization failed.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B0E11] justify-center items-center px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Link to="/signin" className="text-nirshux-accent text-xs font-black uppercase mb-8 inline-block hover:underline italic">
          ← Back to Terminal
        </Link>
        <h2 className="text-3xl font-black text-white mb-2 uppercase italic">
          {step === 1 ? 'Reset ' : 'Verify '} <span className="text-nirshux-accent">Access</span>
        </h2>
        <p className="text-gray-500 mb-8 font-mono text-xs uppercase tracking-widest">
          {step === 1 ? 'Enter your registered email to receive reset instructions.' : `Enter the security code sent to ${email}`}
        </p>
        <AnimatePresence mode="wait">
          {status.msg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest border font-mono ${
                status.type === 'success' ? 'bg-nirshux-accent/10 border-nirshux-accent text-nirshux-accent' : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}
            >
              {status.type === 'success' ? '⚡ ' : '⚠️ '} {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
        <form className="space-y-6" onSubmit={onSubmit}>
          {step === 1 ? (
            <div>
              <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest font-mono">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none font-mono text-sm"
                placeholder="name@example.com" required />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest font-mono text-center">Security Code</label>
              <input type="text" maxLength="6" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000" autoFocus required />
            </motion.div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-nirshux-accent text-black font-black py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50 flex items-center justify-center gap-3">
            {loading ? 'Processing...' : step === 1 ? 'Send Reset Link' : 'Verify Code'}
          </button>
          {step === 2 && (
            <button type="button" onClick={() => { setStep(1); setStatus({type:'', msg:''}); }}
              className="w-full text-[9px] text-gray-600 uppercase font-black hover:text-white transition-all italic"
            >
              Wrong email? Restart Protocol
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;