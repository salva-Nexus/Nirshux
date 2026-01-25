import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');  
    window.location.href = '/signin'; 
  };

  return (
    <nav className="fixed w-full z-50 bg-[#0B0E11]/80 backdrop-blur-md border-b border-white/5 py-4">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/Nirshus-Logo.png" 
            alt="Nirshux Logo" 
            className="h-8 w-auto" 
          />
          <span className="text-2xl font-bold text-white tracking-tighter">
            NIR<span className="text-nirshux-accent">SHUX</span>
          </span>
        </Link>
        
        <div className="flex gap-4 items-center">
          {token ? (
            <button 
              onClick={handleLogout}
              className="text-white text-sm font-medium hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/signin" className="text-white text-sm font-medium">
                Sign In
              </Link>
              <Link to="/signup">
                <button className="bg-nirshux-accent text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(0,242,195,0.2)]">
                  Start Investing
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;