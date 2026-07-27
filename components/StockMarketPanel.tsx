"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface StockData {
  time: string;
  price: number;
  symbol: string;
}

export default function StockMarketPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState(["AAPL", "GOOGL", "MSFT"]);
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(`/api/stocks?symbol=${selectedSymbol}`);
        const stockData = await response.json();
        setData(stockData);
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    const interval = setInterval(fetchStockData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const lastPrice = data.length > 0 ? data[data.length - 1].price : 0;
  const firstPrice = data.length > 0 ? data[0].price : 0;
  const change = lastPrice - firstPrice;
  const changePercent = firstPrice ? ((change / firstPrice) * 100).toFixed(2) : "0.00";

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] border-l border-[#3a3a3a]">
      {/* Header */}
      <div className="border-b border-[#3a3a3a] bg-[#0e0e0e] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#d4b36a]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Market</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#d4b36a]">${lastPrice.toFixed(2)}</div>
            <div className={`text-xs ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change >= 0 ? "+" : ""}{changePercent}%
            </div>
          </div>
        </div>

        {/* Symbol Selector */}
        <div className="flex gap-1 flex-wrap">
          {symbols.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedSymbol(sym)}
              className={`text-[10px] px-2 py-1 rounded transition ${
                selectedSymbol === sym
                  ? "bg-[#d4b36a] text-[#0e0e0e] font-bold"
                  : "bg-[#1f1f1f] text-slate-300 hover:bg-[#3a3a3a]"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-center justify-center p-2">
        {loading ? (
          <div className="text-slate-500 text-xs">Loading chart...</div>
        ) : data.length === 0 ? (
          <div className="text-slate-600 text-xs">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                style={{ fontSize: "10px" }}
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis stroke="#64748b" style={{ fontSize: "10px" }} tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111111",
                  border: "1px solid #3a3a3a",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#d4b36a" }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#d4b36a"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

