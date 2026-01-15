// LandingPage.jsx
import React from 'react';
import Hero from "../components/Hero";
import PriceTicker from "../components/PriceTicker";
import FeatureGrid from "../components/FeatureGrid";
import StatsSection from "../components/StatsSection";
import InvestmentPlans from "../components/InvestmentPlans"; // Added this
import Testimonials from "../components/Testimonials";
import CallToAction from "../components/CallToAction";

const LandingPage = () => {
  return (
    <main className="pt-20">
      <Hero />
      <PriceTicker />
      <FeatureGrid />
      <StatsSection />
      
      {/* 🚀 New Section added from your Portfolio Plans screenshot */}
      <InvestmentPlans /> 
      
      <Testimonials />
      <CallToAction />
    </main>
  );
};

export default LandingPage;