import React, { useState } from 'react';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const CoinChart = () => {
  // Added "BINANCE:" prefix to ensure data loads correctly
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");

  const coins = [
    { name: "Bitcoin", id: "BINANCE:BTCUSDT" },
    { name: "Ethereum", id: "BINANCE:ETHUSDT" },
    { name: "Solana", id: "BINANCE:SOLUSDT" },
    { name: "Cardano", id: "BINANCE:ADAUSDT" },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        {/* Style matched to NIRSHUX heading: bold, tracking-tight, uppercase */}
        <h3 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase">
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
          key={symbol} 
          theme="dark" 
          symbol={symbol} 
          autosize
          hide_side_toolbar={true}
          allow_symbol_change={false}
          container_id="tradingview_chart_container"
          style="1" // Standard candlestick chart
          interval="D"
          timezone="Etc/UTC"
        />
      </div>
    </div>
  );
};

export default CoinChart;