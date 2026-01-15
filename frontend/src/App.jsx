import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel'; 
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';
import TermsOfUse from './pages/TermsOfUse';
import PrivacyPolicy from './pages/PrivacyPolicy';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const AppContent = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  const isAppRoute = location.pathname === '/dashboard' || 
                     location.pathname === '/admin-panel' || 
                     location.pathname === '/reset-password' ||
                     location.pathname === '/profile'; // Added Profile path

  const checkAuth = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await axios.get('http://localhost:5000/api/investor/profile', {
        headers: { 'x-auth-token': token }
      });
      setUserData(res.data);
    } catch (err) {
      localStorage.removeItem('token'); // Clean up bad tokens
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-nirshux-dark text-white flex flex-col">
      {!isAppRoute && <Navbar />}
      
      <main className="flex-grow">
        <Routes>
          {/* AUTO-PILOT: Redirect authenticated users away from auth pages */}
          <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/signup" element={token ? <Navigate to="/dashboard" /> : <SignUp />} />
          <Route path="/signin" element={token ? <Navigate to="/dashboard" /> : <SignIn />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQ />} /> 
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route 
            path="/admin-panel" 
            element={userData?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} 
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAppRoute && <Footer />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;