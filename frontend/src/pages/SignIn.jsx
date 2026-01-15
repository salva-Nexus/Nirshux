// SignIn.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', msg: '' }); // Inline feedback state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    try {
      // 1. Send to Backend
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });

      // 2. Save JWT & User info
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // 3. Success UI Feedback
      setStatus({ type: 'success', msg: 'Authentication successful! Entering terminal...' });

      // 4. Smooth transition to Dashboard
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.msg || 'Invalid Credentials' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-nirshux-dark pt-28 lg:pt-0">
      {/* Left Side: Branding */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-nirshux-accent/20 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1640341719917-0a557c68296d?auto=format&fit=crop&q=80&w=2832" 
          alt="Trading Terminal" 
          className="h-full w-full object-cover grayscale brightness-50"
        />
        <div className="absolute top-32 left-12 z-20">
          <h3 className="text-4xl font-bold text-white mb-4">Welcome Back.</h3>
          <p className="text-gray-300 max-w-sm">Log in to manage your portfolio and access real-time market insights.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-24 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full mx-auto"
        >
          <Link to="/" className="text-2xl font-bold text-white mb-8 block">
            NIR<span className="text-nirshux-accent">SHUX</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
          <p className="text-gray-400 mb-8">Enter your credentials to access your account.</p>

          {/* Inline Status Messages (Replaces Alerts) */}
          <AnimatePresence mode="wait">
            {status.msg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl mb-6 text-sm font-medium border ${
                  status.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}
              >
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
              <input 
                type="email" 
                name="email"
                value={email}
                onChange={onChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none transition-all placeholder:text-gray-600"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-nirshux-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input 
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-nirshux-accent outline-none transition-all placeholder:text-gray-600"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-nirshux-accent text-black font-bold py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,195,0.2)] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            New to Nirshux? <Link to="/signup" className="text-nirshux-accent hover:underline font-medium">Create an account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;