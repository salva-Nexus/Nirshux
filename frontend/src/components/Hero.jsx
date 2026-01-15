// Hero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation

  return (
    <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-nirshux-accent/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Intelligence for the <br />
          <span className="text-nirshux-accent">Modern Investor.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Nirshux uses advanced AI insights to optimize your portfolio. 
          Trade, invest, and grow your assets with institutional precision.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/signup')} // Redirects to SignUp page
            className="bg-nirshux-accent text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-white transition-all shadow-[0_0_25px_rgba(0,242,195,0.3)]"
          >
            Start Investing Now
          </button>
          
          <button 
            onClick={() => navigate('/signin')} // Redirects to SignIn page
            className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all"
          >
            Sign In →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;