// PriceTicker.jsx
import React from 'react';

const coins = [
  { name: 'SOL/USD', price: '138.24', change: '+5.56%', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  { name: 'BTC/USD', price: '91,162', change: '+2.41%', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { name: 'ETH/USD', price: '3,105.00', change: '+1.18%', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { name: 'ADA/USD', price: '0.65', change: '-2.15%', icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  { name: 'DOT/USD', price: '7.30', change: '+2.50%', icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
];

const PriceTicker = () => {
  // We double the list so the end of the first set touches the start of the second
  const doubleCoins = [...coins, ...coins];

  return (
    <div className="bg-nirshux-dark py-12 overflow-hidden relative">
      <div className="flex animate-marquee whitespace-nowrap gap-6 w-max">
        {doubleCoins.map((coin, i) => (
          <div 
            key={i} 
            className="relative w-[300px] h-[170px] bg-nirshux-card rounded-2xl p-6 border border-white/10 flex flex-col justify-between group overflow-hidden"
          >
            {/* --- The Moving Glow Effect --- */}
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="absolute inset-0 border-2 border-transparent rounded-2xl"
                style={{
                  maskImage: 'linear-gradient(white, white)',
                  WebkitMaskImage: 'linear-gradient(white, white)',
                }}
              >
                <div 
                  className="absolute inset-[-2px] rounded-2xl animate-border-beam"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 60%, var(--color-nirshux-accent), transparent 100%)',
                    offsetPath: 'rect(0% 100% 100% 0% round 1rem)',
                  }}
                />
              </div>
            </div>
            {/* ------------------------------ */}

            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-gray-500 font-bold text-xs tracking-widest">{coin.name}</p>
                <h3 className="text-2xl font-bold mt-2 text-white">${coin.price}</h3>
              </div>
              <img src={coin.icon} alt="" className="w-10 h-10 grayscale brightness-200" />
            </div>
            
            <div className={`text-sm font-bold flex items-center gap-1 ${coin.change.startsWith('+') ? 'text-nirshux-accent' : 'text-red-500'}`}>
              <span className="text-lg">{coin.change.startsWith('+') ? '▴' : '▾'}</span>
              {coin.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceTicker;