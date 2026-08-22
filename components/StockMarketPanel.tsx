"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, Activity } from "lucide-react";

interface CurrencyData {
  code: string;
  rate: number;
  changePct: number;
}

interface MarketHealthData {
  symbol: string;
  label: string;
  color: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function StockMarketPanel() {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [usdIndexChange, setUsdIndexChange] = useState(0);
  const [fxLoading, setFxLoading] = useState(true);
  const [marketHealth, setMarketHealth] = useState<MarketHealthData[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<MarketHealthData[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const fetchForexData = async () => {
      try {
        const response = await fetch("/api/forex");
        const forexData = await response.json();
        setCurrencies(forexData.currencies || []);
        setUsdIndexChange(forexData.usdIndexChange || 0);
      } catch (error) {
        console.error("Failed to fetch forex data:", error);
      } finally {
        setFxLoading(false);
      }
    };

    fetchForexData();
    const interval = setInterval(fetchForexData, 6 * 60 * 60000); // Refresh every 6h — rates only update daily
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMarketHealth = async () => {
      try {
        const response = await fetch("/api/market-health");
        const healthData = await response.json();
        setMarketHealth(healthData.indexes || []);
        setHistory(healthData.history || []);
        setRiskIndicators(healthData.riskIndicators || []);
        setRiskHistory(healthData.riskHistory || []);
      } catch (error) {
        console.error("Failed to fetch market health data:", error);
      } finally {
        setHealthLoading(false);
      }
    };

    fetchMarketHealth();
    const interval = setInterval(fetchMarketHealth, 6 * 60 * 60000); // Refresh every 6h — Alpha Vantage quota
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0a0a0a] border-l border-[#3a3a3a]">
      {/* US Market Health */}
      <div className="border-b border-[#3a3a3a] bg-[#0e0e0e] px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className="text-[#d4b36a]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">US Market Health</h2>
        </div>

        {healthLoading ? (
          <div className="text-slate-500 text-xs">Loading...</div>
        ) : marketHealth.length === 0 ? (
          <div className="text-slate-600 text-xs">No data available</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {marketHealth.map((idx) => (
                <div key={idx.symbol} className="bg-[#1a1a1a] rounded px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-wide text-slate-500">{idx.label}</div>
                  <div className="text-xs font-bold text-slate-200">${idx.price.toFixed(2)}</div>
                  <div className={`text-[10px] font-mono ${idx.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "#94a3b8" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid #3a3a3a",
                      borderRadius: "4px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "#d4b36a" }}
                    formatter={(value: any) => [`${value}%`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  {marketHealth.map((idx) => (
                    <Line
                      key={idx.symbol}
                      type="monotone"
                      dataKey={idx.symbol}
                      name={idx.label}
                      stroke={idx.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-600 mt-1 leading-relaxed">
              % change from 7 days ago (S&P 500 / Nasdaq / Dow via SPY/QQQ/DIA proxies).
            </p>
          </>
        )}
      </div>

      {/* Risk & Safe-Haven Gauges */}
      <div className="border-b border-[#3a3a3a] bg-[#0e0e0e] px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className="text-[#d4b36a]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Risk &amp; Safe-Haven Gauges</h2>
        </div>

        {healthLoading ? (
          <div className="text-slate-500 text-xs">Loading...</div>
        ) : riskIndicators.length === 0 ? (
          <div className="text-slate-600 text-xs">No data available</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {riskIndicators.map((idx) => (
                <div key={idx.symbol} className="bg-[#1a1a1a] rounded px-2 py-1.5">
                  <div className="text-[9px] uppercase tracking-wide text-slate-500">{idx.label}</div>
                  <div className="text-xs font-bold text-slate-200">${idx.price.toFixed(2)}</div>
                  <div className={`text-[10px] font-mono ${idx.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {idx.changePercent >= 0 ? "+" : ""}{idx.changePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>

            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskHistory} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "#94a3b8" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111111",
                      border: "1px solid #3a3a3a",
                      borderRadius: "4px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "#d4b36a" }}
                    formatter={(value: any) => [`${value}%`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  {riskIndicators.map((idx) => (
                    <Line
                      key={idx.symbol}
                      type="monotone"
                      dataKey={idx.symbol}
                      name={idx.label}
                      stroke={idx.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-600 mt-1 leading-relaxed">
              % change from 7 days ago. Oil/gold often move on conflict escalation (supply-route risk, flight to safety); VIXY tracks VIX futures as a volatility proxy (raw ^VIX unavailable on free tier); defense sector (ITA) often rallies on escalation ahead of headlines.
            </p>
          </>
        )}
      </div>

      {/* Currency Strength */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign size={13} className="text-[#d4b36a]" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#d4b36a]">USD Strength (7d)</h3>
          </div>
          <div className={`text-xs font-bold ${usdIndexChange >= 0 ? "text-green-400" : "text-red-400"}`}>
            {usdIndexChange >= 0 ? "+" : ""}{usdIndexChange}%
          </div>
        </div>

        {fxLoading ? (
          <div className="text-slate-500 text-xs">Loading currency data...</div>
        ) : currencies.length === 0 ? (
          <div className="text-slate-600 text-xs">No currency data available</div>
        ) : (
          <div className="space-y-1.5">
            {[...currencies].sort((a, b) => b.changePct - a.changePct).map((c) => {
              const magnitude = Math.min(Math.abs(c.changePct) * 20, 100);
              return (
                <div key={c.code} className="flex items-center gap-2 text-xs">
                  <span className="w-10 shrink-0 font-mono text-slate-300">USD/{c.code}</span>
                  <span className="w-16 shrink-0 font-mono text-slate-400 text-[10px]">{c.rate.toFixed(3)}</span>
                  <div className="flex-1 h-2 bg-[#1f1f1f] rounded overflow-hidden flex">
                    <div className="w-1/2 flex justify-end">
                      {c.changePct < 0 && (
                        <div className="h-full bg-red-500/70 rounded-l" style={{ width: `${magnitude}%` }} />
                      )}
                    </div>
                    <div className="w-1/2 flex justify-start">
                      {c.changePct >= 0 && (
                        <div className="h-full bg-green-500/70 rounded-r" style={{ width: `${magnitude}%` }} />
                      )}
                    </div>
                  </div>
                  <span className={`w-12 shrink-0 text-right font-mono ${c.changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {c.changePct >= 0 ? "+" : ""}{c.changePct}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[9px] text-slate-600 mt-3 leading-relaxed">
          % change in USD value vs. each currency over the past 7 days (ECB reference rates). Positive = dollar strengthened.
        </p>
      </div>
    </div>
  );
}


