// frontend/src/pages/FAQ.jsx
import React, { useState } from 'react';

const FAQ = () => {
  const [activeTab, setActiveTab] = useState('General');
  
  const faqs = {
    General: [
      { q: "What is Nirshux?", a: "Nirshux is a next-generation quantitative investment terminal that combines AI-driven DeFi yield aggregation with institutional-grade CeFi liquidity strategies." },
      { q: "Is Nirshux regulated?", a: "Nirshux operates under international digital asset guidelines, utilizing smart contract audits and cold-storage custody solutions to ensure regulatory compliance and user safety." }
    ],
    Investment: [
      { q: "How are returns generated?", a: "We utilize a hybrid strategy: 60% is deployed into automated DeFi liquidity pools for yield farming, while 40% is managed by HFT algorithms capturing CeFi market inefficiencies." },
      { q: "What is the minimum investment?", a: "To maintain the integrity of our liquidity pools, the minimum entry protocol starts at $200 USD." }
    ],
    Security: [
      { q: "How is my data protected?", a: "All data transmissions are encrypted via military-grade AES-256 protocols, and withdrawals require multi-signature authentication." }
    ]
  };

  return (
    <div className="bg-[#0A0A0A] min-h-screen py-20 text-white">
      <div className="container mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold mb-4">You Have <span className="text-nirshux-accent">Questions</span></h1>
        <p className="text-2xl text-gray-400 mb-12">We Have Answers.</p>
        
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {Object.keys(faqs).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-full border transition-all ${activeTab === tab ? 'bg-nirshux-accent text-black border-nirshux-accent' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs[activeTab].map((item, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-6 text-left hover:border-white/10 transition-all">
              <h4 className="text-lg font-bold flex items-center gap-3">
                <span className="text-nirshux-accent">●</span> {item.q}
              </h4>
              <p className="mt-4 text-gray-500 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;