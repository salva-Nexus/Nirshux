// frontend/src/pages/AboutUs.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  const team = [
    { name: "Sarah Chen", role: "Chief Executive Officer", desc: "Former Goldman Sachs executive with 15+ years in algorithmic trading and fintech innovation.", img: "https://i.pravatar.cc/150?u=sarah" },
    { name: "Marcus Rodriguez", role: "Chief Technology Officer", desc: "Ex-Google engineer specializing in blockchain technology and high-frequency trading systems.", img: "https://i.pravatar.cc/150?u=marcus" },
    { name: "Elena Volkov", role: "Head of Quantitative Research", desc: "PhD in Mathematical Finance from MIT; former quantitative analyst at Renaissance Technologies.", img: "https://i.pravatar.cc/150?u=elena" },
    { name: "David Kim", role: "Chief Risk Officer", desc: "Former JP Morgan risk management director with expertise in cryptocurrency market analysis.", img: "https://i.pravatar.cc/150?u=david" },
    { name: "Amara Okafor", role: "Head of Operations", desc: "Operations excellence expert from McKinsey & Company, specializing in financial services scaling.", img: "https://i.pravatar.cc/150?u=amara" },
    { name: "James Thompson", role: "Head of Security", desc: "Cybersecurity veteran with 12+ years protecting financial institutions and crypto exchanges.", img: "https://i.pravatar.cc/150?u=james" }
  ];

  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen font-sans">
      {/* Hero Section - Image 2 */}
      <section className="container mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12">
        <div className="md:w-1/2">
          <p className="text-[#00FFCC] text-sm font-bold mb-4 uppercase tracking-widest">Home / About Us</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Revolutionizing <br/><span className="text-[#00FFCC]">Crypto Investment</span></h1>
          <p className="text-gray-400 leading-relaxed text-lg max-w-lg">
            We're building the future of decentralized finance, making sophisticated investment strategies accessible to everyone through cutting-edge technology and expert guidance.
          </p>
        </div>
        <div className="md:w-1/2">
          <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800" alt="Terminal" className="rounded-2xl border border-white/10 shadow-2xl" />
        </div>
      </section>

      {/* Stats - Image 2 Bottom */}
      <section className="bg-[#0D0D0D] py-16 border-y border-white/5">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h3 className="text-3xl font-bold text-[#00FFCC] mb-2">36M+</h3>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Registered Users</p>
          </div>
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h3 className="text-3xl font-bold text-[#00FFCC] mb-2">178</h3>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Countries Supported</p>
          </div>
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h3 className="text-3xl font-bold text-[#00FFCC] mb-2">$10M+</h3>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Monthly Withdrawals</p>
          </div>
          <div className="bg-[#111] p-8 rounded-2xl border border-white/5">
            <h3 className="text-3xl font-bold text-[#00FFCC] mb-2">18k+</h3>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Daily Active Investors</p>
          </div>
        </div>
      </section>

      {/* Mission & Core Values - Image 3 */}
      <section className="container mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row gap-16 mb-24 items-center">
            <div className="md:w-1/2">
                <h2 className="text-4xl font-bold mb-8">Our <span className="text-[#00FFCC]">Mission</span></h2>
                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                    At Nirshux, we believe that sophisticated investment opportunities shouldn't be reserved for Wall Street elites. Our mission is to democratize access to professional-grade cryptocurrency investment strategies through innovative technology and algorithmic trading.
                </p>
                <p className="text-gray-400 text-lg leading-relaxed">
                    We combine cutting-edge artificial intelligence, machine learning algorithms, and decades of collective trading experience to deliver consistent returns while minimizing risk.
                </p>
            </div>
            <div className="md:w-1/2">
                <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800" className="rounded-2xl border border-white/5" alt="Mission" />
            </div>
        </div>

        <h2 className="text-4xl font-bold text-center mb-4">Our Core Values</h2>
        <p className="text-gray-500 text-center mb-16 uppercase tracking-widest text-sm">The principles that guide everything we do</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
                { title: "Security First", icon: "🔒", desc: "Bank-grade security protocols protect every transaction and user asset." },
                { title: "Data-Driven", icon: "📊", desc: "Advanced algorithms and AI-powered analytics drive our strategies." },
                { title: "Global Access", icon: "🌐", desc: "Making sophisticated tools accessible to everyone, regardless of location." },
                { title: "Transparency", icon: "🤝", desc: "Complete transparency in fees and performance builds lasting trust." }
            ].map((val, i) => (
                <div key={i} className="bg-[#111] p-8 rounded-2xl border border-white/5 text-center hover:bg-[#161616] transition-all">
                    <div className="text-4xl mb-6">{val.icon}</div>
                    <h4 className="text-lg font-bold mb-4">{val.title}</h4>
                    <p className="text-gray-500 text-sm leading-relaxed">{val.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Team - Image 4 */}
      <section className="bg-[#0D0D0D] py-24">
        <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-4">Meet Our <span className="text-[#00FFCC]">Expert Team</span></h2>
            <p className="text-gray-500 text-center mb-16">World-class professionals driving innovation in cryptocurrency investment</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
                <div key={i} className="bg-[#111] p-10 rounded-2xl border border-white/5 text-center group hover:border-[#00FFCC]/30 transition-all">
                <img src={member.img} className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-[#00FFCC] grayscale group-hover:grayscale-0 transition-all" alt={member.name} />
                <h4 className="text-xl font-bold mb-1">{member.name}</h4>
                <p className="text-[#00FFCC] text-sm font-bold mb-6 uppercase tracking-widest">{member.role}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{member.desc}</p>
                </div>
            ))}
            </div>
        </div>
      </section>

      {/* Footer CTA - Image 5 */}
      <section className="py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Start Your <br/>Investment Journey?</h2>
        <p className="text-gray-500 mb-12">Join thousands of investors who trust Nirshux with their cryptocurrency investments.</p>
        <button 
          onClick={() => navigate('/signup')}
          className="bg-[#00FFCC] text-black font-extrabold py-5 px-12 rounded-full hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] transition-all transform hover:-translate-y-1"
        >
          Start Investing Today →
        </button>
      </section>
    </div>
  );
};

export default AboutUs;