import React, { useState } from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const CoinChart = () => {
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");

  const coins = [
    { name: "Bitcoin", ticker: "BTC", id: "BINANCE:BTCUSDT" },
    { name: "Ethereum", ticker: "ETH", id: "BINANCE:ETHUSDT" },
    { name: "Solana", ticker: "SOL", id: "BINANCE:SOLUSDT" },
    { name: "Cardano", ticker: "ADA", id: "BINANCE:ADAUSDT" },
  ];

  const selected = coins.find((coin) => coin.id === symbol) || coins[0];

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#11161A] shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-nirshux-accent/15 bg-nirshux-accent/10 text-xs font-black text-nirshux-accent">
            {selected.ticker}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-white">
                Market Terminal
              </h3>
              <span className="h-1.5 w-1.5 rounded-full bg-nirshux-accent shadow-[0_0_9px_rgba(0,242,195,0.8)]" />
            </div>
            <p className="mt-0.5 text-[8px] font-black uppercase tracking-[0.18em] text-gray-600">
              Real-time market feed
            </p>
          </div>
        </div>

        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full md:w-auto rounded-xl border border-white/[0.08] bg-[#0B0E11] px-3.5 py-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-nirshux-accent outline-none transition focus:border-nirshux-accent/40"
        >
          {coins.map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name} · {coin.ticker}
            </option>
          ))}
        </select>
      </div>

      <div className="relative h-[340px] md:h-[400px] overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-[#11161A] to-transparent" />
        <AdvancedRealTimeChart
          key={symbol}
          theme="dark"
          symbol={symbol}
          autosize
          hide_side_toolbar
          allow_symbol_change={false}
          container_id="tradingview_chart_container"
          style="1"
          interval="D"
          timezone="Etc/UTC"
        />
      </div>
    </section>
  );
};

export default CoinChart;
