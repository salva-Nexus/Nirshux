import React, { useState } from 'react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const CoinChart = () => {
  const [symbol, setSymbol] = useState("BTCUSD");

  const coins = [
    { name: "Bitcoin", id: "BTCUSD" },
    { name: "Ethereum", id: "ETHUSD" },
    { name: "Solana", id: "SOLUSD" },
    { name: "Cardano", id: "ADAUSD" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
          Market <span className="text-nirshux-accent">Terminal</span>
        </h3>
        
        <select 
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-[#0B0E11] border border-white/10 text-nirshux-accent text-xs font-bold rounded-lg px-4 py-2 outline-none focus:border-nirshux-accent transition-all uppercase"
        >
          {coins.map(coin => (
            <option key={coin.id} value={coin.id}>{coin.name}</option>
          ))}
        </select>
      </div>

      <div className="h-[400px] rounded-xl overflow-hidden border border-white/5">
        <AdvancedRealTimeChart 
          key={symbol} // FORCES RE-LOAD WHEN SYMBOL CHANGES
          theme="dark" 
          symbol={symbol} 
          autosize
          hide_side_toolbar={true}
          allow_symbol_change={false}
          container_id={`tv_chart_${symbol}`} // UNIQUE ID
        />
      </div>
    </div>
  );
};

export default CoinChart;