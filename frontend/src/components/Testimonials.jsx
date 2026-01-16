import React from 'react';

const reviews = [
  { 
    name: "Jessica Devis", 
    role: "Crypto Analyst", 
    text: "The utility-first approach and extensive AI insights make Nirshux a breeze for my daily trades.", 
    active: true,
    image: "https://i.pravatar.cc/150?u=jessica" 
  },
  { 
    name: "Lucian Eurel", 
    role: "Day Trader", 
    text: "It's like having a superpower in your toolkit. The ability to craft custom strategies is unparalleled.", 
    active: false,
    image: "https://i.pravatar.cc/150?u=lucian" 
  },
  { 
    name: "Marcell Glock", 
    role: "Portfolio Manager", 
    text: "The security protocols are top-notch. I finally feel safe moving large volumes.", 
    active: true,
    image: "https://i.pravatar.cc/150?u=marcell" 
  },
  { 
    name: "Linde Michele", 
    role: "Investor", 
    text: "Nirshux stands out as the most user-friendly and effective solution I've ever used.", 
    active: false,
    image: "https://i.pravatar.cc/150?u=linde" 
  },
  { 
    name: "Sarah Chen", 
    role: "Quantitative Researcher", 
    text: "The real-time data feeds are faster than anything I've used on other platforms.", 
    active: true,
    image: "https://i.pravatar.cc/150?u=sarah" 
  },
  { 
    name: "Arjun Mehta", 
    role: "DeFi Strategist", 
    text: "I love how easy it is to manage multi-chain assets in one single dashboard.", 
    active: false,
    image: "https://i.pravatar.cc/150?u=arjun" 
  },
  { 
    name: "Elena Rossi", 
    role: "Risk Manager", 
    text: "The automated stop-loss features have saved my portfolio more times than I can count.", 
    active: true,
    image: "https://i.pravatar.cc/150?u=elena" 
  },
  { 
    name: "David Smith", 
    role: "Full-time Trader", 
    text: "Clean UI, deep liquidity, and zero lag. This is what professional trading looks like.", 
    active: false,
    image: "https://i.pravatar.cc/150?u=david" 
  },
  { 
    name: "Sofia Yang", 
    role: "Crypto Enthusiast", 
    text: "The onboarding process was so simple. I went from zero to my first trade in minutes.", 
    active: true,
    image: "https://i.pravatar.cc/150?u=sofia" 
  },
  { 
    name: "Marcus Thorne", 
    role: "Venture Capitalist", 
    text: "Nirshux is clearly the future of institutional-grade retail trading platforms.", 
    active: false,
    image: "https://i.pravatar.cc/150?u=marcus" 
  },
];

const Testimonials = () => {
  const tripleReviews = [...reviews, ...reviews, ...reviews];

  return (
    <section className="bg-nirshux-dark py-24 overflow-hidden">
      <div className="container mx-auto px-6 mb-16 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">Trusted by Traders</h2>
        <p className="text-gray-400">Join thousands of satisfied traders on Nirshux.</p>
      </div>

      <div className="flex gap-6 animate-marquee-reverse hover:[animation-play-state:paused] w-max">
        {tripleReviews.map((rev, i) => (
          <div 
            key={i} 
            className="relative w-[380px] min-h-[240px] p-8 rounded-3xl bg-nirshux-card border border-white/5 flex flex-col justify-between overflow-hidden shrink-0"
          >
            {rev.active && (
              <div className="absolute inset-0 pointer-events-none">
                <div 
                  className="absolute inset-[-2px] rounded-3xl animate-border-beam"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 60%, var(--color-nirshux-accent), transparent 100%)',
                    offsetPath: 'rect(0% 100% 100% 0% round 1.5rem)',
                  }}
                />
              </div>
            )}

            <div className="relative z-10">
              <p className="text-gray-300 italic mb-8 leading-relaxed text-sm">"{rev.text}"</p>
              <div className="flex items-center gap-4">
                {/* The Profile Picture Image */}
                <img 
                  src={rev.image} 
                  alt={rev.name} 
                  className="w-12 h-12 rounded-full border-2 border-nirshux-accent/30 object-cover"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">{rev.name}</h4>
                  <p className="text-nirshux-accent text-xs font-medium uppercase tracking-wider">{rev.role}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;