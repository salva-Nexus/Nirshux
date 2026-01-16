// SignUp.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import API from '../api';

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const referralCode = searchParams.get('ref');

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
  const [status, setStatus] = useState({ type: '', msg: '' }); // Replacement for alerts
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    
    try {
      const response = await API.post('/api/auth/register', {
        ...formData,
        ref: referralCode
      });
      
      setStatus({ type: 'success', msg: response.data.msg + " Redirecting..." });
      
      // Delay redirect so they can actually see the success message
      setTimeout(() => navigate('/signin'), 2000);

    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-nirshux-dark pt-24 lg:pt-0">
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12 relative z-10">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-md w-full mx-auto">
          <Link to="/" className="text-2xl font-bold text-white mb-8 block">
            NIR<span className="text-nirshux-accent">SHUX</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <div className="mb-6">
            {referralCode ? (
              <p className="text-nirshux-accent font-medium italic animate-pulse">✨ Invited by a friend!</p>
            ) : (
              <p className="text-gray-400">Start your intelligence-driven investment journey.</p>
            )}
          </div>

          {/* 🚫 NO ALERTS: Modern Status Messages */}
          <AnimatePresence>
            {status.msg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl mb-6 text-sm font-medium ${
                  status.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'
                }`}
              >
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
              <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none transition-all" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none transition-all" placeholder="name@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-nirshux-accent outline-none transition-all" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-nirshux-accent transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-nirshux-accent text-black font-bold py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,195,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : "Create Account"}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Already have an account? <Link to="/signin" className="text-nirshux-accent hover:underline font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-nirshux-accent/20 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832" className="h-full w-full object-cover grayscale brightness-50" alt="Crypto" />
      </div>
    </div>
  );
};

export default SignUp;