// ResetPassword.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import API from '../api';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setStatus({ type: 'error', msg: 'Passwords do not match.' });
    }

    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      // Updates the password in your MongoDB via the unified backend route
      await API.post('/api/auth/reset-password', { email, password });
      setStatus({ type: 'success', msg: 'Password updated. Protocol complete. Redirecting...' });
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Terminal Update failed.' });
    } finally {
      setLoading(false);
    }
  };

  if (!email) return (
    <div className="min-h-screen bg-[#0B0E11] flex flex-col items-center justify-center font-mono text-red-500 gap-4 uppercase text-xs">
      <span>Session Expired: Re-authenticate Required</span>
      <Link to="/forgot-password" className="text-nirshux-accent border border-nirshux-accent px-4 py-2 hover:bg-nirshux-accent hover:text-black">Restart Protocol</Link>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#0B0E11] justify-center items-center px-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full">
        <h2 className="text-3xl font-black text-white mb-2 uppercase italic">New <span className="text-nirshux-accent">Credentials</span></h2>
        <p className="text-gray-500 mb-8 font-mono text-xs uppercase tracking-widest">Update your terminal access key.</p>
        <AnimatePresence mode="wait">
          {status.msg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className={`p-4 rounded-xl mb-6 text-[10px] font-black uppercase tracking-widest border font-mono ${
                status.type === 'success' ? 'bg-nirshux-accent/10 border-nirshux-accent text-nirshux-accent' : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}
            >
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest font-mono">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none font-mono text-sm"
              placeholder="••••••••" required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest font-mono">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none font-mono text-sm"
              placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-nirshux-accent text-black font-black py-4 rounded-xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50">
            {loading ? 'Updating Protocol...' : 'Save New Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;