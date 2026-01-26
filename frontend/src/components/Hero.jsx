// frontend/src/components/Hero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-nirshux-accent/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto relative z-10">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Intelligence for the <br />
          <span className="text-nirshux-accent">Modern Investor.</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Nirshux helps you track and manage your crypto portfolio with AI-powered insights. 
          Explore, analyze, and stay informed about your digital assets.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button 
            onClick={() => navigate('/signup')}
            className="bg-nirshux-accent text-black px-6 py-3 rounded-lg font-bold text-sm hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,195,0.3)]"
          >
            Get Started
          </button>
          
          <button 
            onClick={() => navigate('/signin')}
            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-white/10 transition-all"
          >
            Sign In →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;