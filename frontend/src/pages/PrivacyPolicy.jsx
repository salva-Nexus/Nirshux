import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#0A0A0A] text-gray-300 min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy <span className="text-nirshux-accent">Protocol</span></h1>
        <p className="text-sm text-gray-500 mb-12">Security Level: Institutional</p>

        <div className="space-y-8 leading-relaxed text-sm">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">I. DATA COLLECTION PHILOSOPHY</h2>
            <p>
              Nirshux operates on a "Privacy First" architecture. We collect the minimum amount of data necessary to provide secure investment services and comply with Anti-Money Laundering (AML) regulations. We do not sell, rent, or trade user data to third-party marketing firms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">II. INFORMATION WE COLLECT</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identification Data:</strong> Full name and email address for account authentication.</li>
              <li><strong>Financial Data:</strong> Wallet addresses, transaction history, and deposit/withdrawal records.</li>
              <li><strong>Technical Data:</strong> IP addresses (for security monitoring/fraud prevention) and browser session metadata.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">III. USE OF INFORMATION</h2>
            <p>
              Data is utilized exclusively for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Processing transactions and calculating daily ROI distributions.</li>
              <li>Executing security protocols (e.g., OTP verification).</li>
              <li>Complying with legal obligations and preventing fraudulent use of the Terminal.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">IV. DATA ENCRYPTION & STORAGE</h2>
            <p>
              All sensitive data is encrypted using AES-256 standards. Our database architecture utilizes isolation layers to prevent unauthorized cross-access. For users in the EEA, we adhere to the core principles of the General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">V. THIRD-PARTY DISCLOSURE</h2>
            <p>
              We may share information with law enforcement only when required by a valid court order or under mandatory AML reporting requirements. Outside of legal mandates, your financial data remains confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">VI. YOUR RIGHTS</h2>
            <p>
              Users have the right to request a full extract of their data or request the deletion of their profile, provided that all active investments are closed and no outstanding legal investigations are pending on the account.
            </p>
          </section>

          <section className="border-t border-white/10 pt-8 text-center italic">
            <p>For inquiries regarding data privacy, contact the Nirshux Security Office at: <br/>
            <span className="text-nirshux-accent">Nirshuxcom@gmail.com</span></p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;