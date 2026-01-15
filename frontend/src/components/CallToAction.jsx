// CallToAction.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-nirshux-dark py-32 px-6 border-t border-white/5">
      <div className="container mx-auto text-center max-w-3xl">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Ready to start investing?
        </h2>
        <p className="text-gray-400 text-lg mb-12">
          Join thousands of investors who have already discovered the power of our automated platform.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => navigate('/signup')}
            className="bg-nirshux-accent text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(0,242,195,0.3)]"
          >
            Create Account →
          </button>
          <button 
            onClick={() => navigate('/signin')}
            className="border border-white/20 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/5 transition-all"
          >
            Sign In →
          </button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;