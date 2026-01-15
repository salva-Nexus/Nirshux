import React from 'react';

const TermsOfUse = () => {
  return (
    <div className="bg-[#0A0A0A] text-gray-300 min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of <span className="text-nirshux-accent">Service</span></h1>
        <p className="text-sm text-gray-500 mb-12">Last Updated: January 2026</p>

        <div className="space-y-8 leading-relaxed text-sm">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. ACCEPTANCE OF TERMS</h2>
            <p>
              By accessing the Nirshux Terminal (the "Platform"), you agree to be bound by these Terms of Service, all applicable laws, and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. INVESTMENT RISK DISCLOSURE</h2>
            <p>
              The digital asset market is characterized by high volatility. Investing through the Nirshux Terminal involves significant risk of loss. Nirshux utilizes a hybrid execution model combining Decentralized Finance (DeFi) and Centralized Finance (CeFi) yield strategies; however, past performance is not a guarantee of future results. You acknowledge that you are investing capital that you can afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. USER ELIGIBILITY</h2>
            <p>
              You must be at least 18 years of age to use this Platform. By creating an account, you represent and warrant that you are not on any trade embargo or economic sanctions lists, such as the UN Security Council Sanctions List or OFAC.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. ACCOUNT SECURITY</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their account credentials, including Two-Factor Authentication (2FA) codes and email access. Nirshux shall not be liable for any loss or damage arising from your failure to protect your account information. Any unauthorized access must be reported to Nirshux Terminal Support immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. PROHIBITED ACTIVITIES</h2>
            <p>
              Users may not engage in any of the following:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Attempting to bypass security protocols or "exploit" the liquidity pool logic.</li>
              <li>Using automated bots or scripts to manipulate market spreads.</li>
              <li>Engaging in money laundering or terrorist financing activities.</li>
              <li>Providing false identification during any KYC (Know Your Customer) process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. LIMITATION OF LIABILITY</h2>
            <p>
              In no event shall Nirshux, its directors, or its affiliates be liable for any indirect, incidental, special, or consequential damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Platform, even if Nirshux has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. GOVERNING LAW</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with international digital asset regulations and the laws of the jurisdiction in which the parent entity is registered.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;