// FeatureGrid.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FiCpu, FiShield, FiTrendingUp, FiGlobe } from 'react-icons/fi';

const features = [
  {
    title: "AI-Driven Insights",
    desc: "Advanced algorithms analyze market trends to provide real-time investment precision.",
    icon: <FiCpu className="text-3xl" />,
  },
  {
    title: "Institutional Security",
    desc: "Multi-layer encryption and cold storage protocols keep your assets safe 24/7.",
    icon: <FiShield className="text-3xl" />,
  },
  {
    title: "Yield Optimization",
    desc: "Maximize your daily ROI with automated rebalancing and liquidity farming.",
    icon: <FiTrendingUp className="text-3xl" />,
  },
  {
    title: "Global Accessibility",
    desc: "Access Nirshux from anywhere in the world with zero-border restrictions.",
    icon: <FiGlobe className="text-3xl" />,
  },
];

const FeatureGrid = () => {
  return (
    <section className="bg-nirshux-dark py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Intelligence & Precision</h2>
          <p className="text-gray-400">The core engine of the Nirshux ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg overflow-hidden transition-all hover:border-nirshux-accent/50"
            >
              {/* Hover Glow Effect - Updated to Cyan */}
              <div className="absolute inset-0 bg-gradient-to-br from-nirshux-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-nirshux-accent/20 flex items-center justify-center text-nirshux-accent mb-6 group-hover:bg-nirshux-accent group-hover:text-black transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;