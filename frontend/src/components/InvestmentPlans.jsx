// frontend/src/components/InvestmentPlans.jsx
import React from 'react';
import { motion } from 'framer-motion';

const plans = [
  {
    name: "STANDARD PLAN",
    minProfit: "2%",
    maxProfit: "14.00%",
    color: "border-blue-500/20",
    icon: "📊",
    iconBg: "bg-blue-600/20"
  },
  {
    name: "PROMO PLAN",
    minProfit: "4.5%",
    maxProfit: "54.00%",
    color: "border-nirshux-accent",
    icon: "🚀",
    iconBg: "bg-nirshux-accent/20",
    popular: true
  },
  {
    name: "PREMIUM PLAN",
    minProfit: "6.4%",
    maxProfit: "128.00%",
    color: "border-yellow-500/20",
    icon: "💎",
    iconBg: "bg-yellow-600/20"
  },
  {
    name: "GOLD-MINING-PLAN",
    minProfit: "9%",
    maxProfit: "270.00%",
    color: "border-red-500/20",
    icon: "⚡",
    iconBg: "bg-red-600/20"
  },
  {
    name: "NIRSHUX API PLAN",
    minProfit: "17%",
    maxProfit: "510.00%",
    color: "border-purple-500/20",
    icon: "🔥",
    iconBg: "bg-purple-600/20"
  }
];

const InvestmentPlans = () => {
  return (
    <section id="plans" className="py-16 px-6 bg-nirshux-dark">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="text-nirshux-accent text-xs font-bold tracking-wider uppercase bg-nirshux-accent/10 px-3 py-1.5 rounded-full border border-nirshux-accent/20">
            🔥 Our Investment Offer
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mt-4 mb-3">
            Investment <span className="text-nirshux-accent">Portfolio Plans</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Your total income directly depends on the amount you invest. After your dashboard has been properly loaded, click the deposit link at the side navigation and select your plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className={`relative bg-[#15191E] border ${plan.color} p-6 rounded-2xl transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-nirshux-accent text-black text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
                  Most Popular
                </div>
              )}
              
              <div className={`w-10 h-10 ${plan.iconBg} rounded-xl flex items-center justify-center text-xl mb-4 shadow-inner`}>
                {plan.icon}
              </div>

              <h3 className="text-xs font-bold text-gray-300 tracking-wide mb-6">{plan.name}</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-gray-500">Minimum Daily Profit</span>
                  <span className="text-nirshux-accent font-bold text-sm">{plan.minProfit}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] text-gray-500">Maximum Profit</span>
                  <span className="text-indigo-400 font-bold text-sm">{plan.maxProfit}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Referral Program Section */}
        <div className="mt-10 bg-[#15191E] border border-nirshux-accent/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-nirshux-accent/20 rounded-xl flex items-center justify-center text-nirshux-accent text-xl border border-nirshux-accent/30">
              👥
            </div>
            <div>
              <h4 className="text-base font-bold">Referral Program</h4>
              <p className="text-gray-400 text-xs mt-1">Earn rewards for every successful referral.</p>
            </div>
          </div>
          <p className="text-gray-400 text-xs">Receive commission for each user you refer who makes their first investment</p>
          <div className="bg-nirshux-accent/10 border border-nirshux-accent/30 px-5 py-3 rounded-xl text-center min-w-[120px]">
            <span className="block text-xl font-bold text-nirshux-accent">2.5%</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-500">Commission</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentPlans;