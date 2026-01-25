import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const supportEmail = "Nirshuxcom@gmail.com";
  const emailSubject = encodeURIComponent("Nirshux Terminal - Support Request");

  return (
    <footer className="bg-nirshux-dark border-t border-white/5 pt-16 pb-8">
      {/* Increased max-width for a wider layout */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img 
              src="/Nirshus-Logo.png" 
              alt="Nirshux Logo" 
              className="h-8 w-auto" // Increased logo size
            />
            <h2 className="text-2xl font-bold">NIR<span className="text-[#00FFCC]">SHUX</span></h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            The next generation of crypto investment. Precision. Intelligence. Efficiency.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 text-white">Company</h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/about" className="hover:text-[#00FFCC] transition-colors">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-white">Support</h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/faq" className="hover:text-[#00FFCC] transition-colors">FAQ</Link></li>
            <li>
              <a 
                href={`mailto:${supportEmail}?subject=${emailSubject}`} 
                className="hover:text-[#00FFCC] transition-colors"
              >
                Contact Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-white">Policy</h4>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/terms" className="hover:text-[#00FFCC] transition-colors">Terms of use</Link></li>
            <li><Link to="/privacy" className="hover:text-[#00FFCC] transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center mt-16 text-gray-600 text-xs italic border-t border-white/5 pt-8">
        © 2026 Nirshux Platform. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;