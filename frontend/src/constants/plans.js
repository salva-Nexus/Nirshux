// Single source of truth for investment plan data. Anything that needs a
// plan's name, min/max stake, ROI, duration, or display styling imports
// from here — never redeclare plan data locally, or it will drift out of
// sync with what admin's plan-visibility toggle and the actual invest flow
// are checking against (this happened once already: "GARDEN API PLAN" vs
// "NIRSHUX API PLAN").
export const INVESTMENT_PLANS = [
  {
    name: "STANDARD PLAN",
    min: 200,
    max: 499,
    roi: "2%",
    dailyValue: 2,
    duration: "7 Days",
    days: 7,
    icon: "📊",
    minProfit: "2%",
    maxProfit: "14.00%",
    color: "border-blue-500/20",
    iconBg: "bg-blue-600/20",
  },
  {
    name: "PROMO PLAN",
    min: 500,
    max: 999,
    roi: "4.5%",
    dailyValue: 4.5,
    duration: "12 Days",
    days: 12,
    icon: "🚀",
    popular: true,
    minProfit: "4.5%",
    maxProfit: "54.00%",
    color: "border-nirshux-accent",
    iconBg: "bg-nirshux-accent/20",
  },
  {
    name: "PREMIUM PLAN",
    min: 1000,
    max: 4999,
    roi: "6.4%",
    dailyValue: 6.4,
    duration: "20 Days",
    days: 20,
    icon: "💎",
    minProfit: "6.4%",
    maxProfit: "128.00%",
    color: "border-yellow-500/20",
    iconBg: "bg-yellow-600/20",
  },
  {
    name: "GOLD-MINING-PLAN",
    min: 5000,
    max: 9999,
    roi: "9%",
    dailyValue: 9,
    duration: "30 Days",
    days: 30,
    icon: "⚡",
    minProfit: "9%",
    maxProfit: "270.00%",
    color: "border-red-500/20",
    iconBg: "bg-red-600/20",
  },
  {
    name: "NIRSHUX API PLAN",
    min: 10000,
    max: 1000000,
    roi: "17%",
    dailyValue: 17,
    duration: "Unlimited",
    days: "Unlimited",
    icon: "🔥",
    minProfit: "17%",
    maxProfit: "510.00%",
    color: "border-purple-500/20",
    iconBg: "bg-purple-600/20",
  },
];

// Just the names — used anywhere only the name/toggle matters (admin's
// plan-visibility list, disabledPlans checks, etc).
export const PLAN_NAMES = INVESTMENT_PLANS.map((p) => p.name);
