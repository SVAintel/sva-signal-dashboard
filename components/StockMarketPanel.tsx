"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface CurrencyData { code: string; rate: number; changePct: number; }
interface MarketHealthData { symbol: string; label: string; color: string; price: number; change: number; changePercent: number; }
type HistoryPoint = { time: string; [symbol: string]: string | number };
const percent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const changeClass = (value: number) => value >= 0 ? "market-positive" : "market-negative";

function MarketSeries({ quotes, history }: { quotes: MarketHealthData[]; history: HistoryPoint[] }) {
  return <>
    <table className="market-table">
      <thead><tr><th scope="col">Instrument</th><th scope="col">USD</th><th scope="col">Change</th></tr></thead>
      <tbody>{quotes.map((quote) => <tr key={quote.symbol}>
        <td><span className="market-series-key" style={{ background: quote.color }} />{quote.label}</td>
        <td>{quote.price.toFixed(2)}</td><td className={changeClass(quote.changePercent)}>{percent(quote.changePercent)}</td>
      </tr>)}</tbody>
    </table>
    {history.length > 0 && <div className="market-chart" role="img" aria-label="Percentage change from seven days ago, by instrument">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history} margin={{ top: 6, right: 4, bottom: 6, left: 0 }}>
          <CartesianGrid stroke="#303d42" vertical={false} />
          <XAxis dataKey="time" stroke="#98a5a8" fontSize={11} minTickGap={22} tickLine={false} />
          <YAxis width={48} stroke="#98a5a8" fontSize={11} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "#172126", border: "1px solid #495956", fontSize: 12 }} labelStyle={{ color: "#c6ac77" }} formatter={(value) => `${value}%`} />
          {quotes.map((quote) => <Line key={quote.symbol} type="monotone" dataKey={quote.symbol} name={quote.label} stroke={quote.color} strokeWidth={1.5} dot={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>}
  </>;
}

export default function StockMarketPanel() {
  const [currencies, setCurrencies] = useState<CurrencyData[]>([]);
  const [usdIndexChange, setUsdIndexChange] = useState<number | null>(null);
  const [fxLoading, setFxLoading] = useState(true);
  const [fxError, setFxError] = useState("");
  const [marketHealth, setMarketHealth] = useState<MarketHealthData[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [riskIndicators, setRiskIndicators] = useState<MarketHealthData[]>([]);
  const [riskHistory, setRiskHistory] = useState<HistoryPoint[]>([]);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState("");
  useEffect(() => {
    const fetchForexData = async () => {
      try {
        const response = await fetch("/api/forex");
        if (!response.ok) throw new Error(`Currency request failed (${response.status})`);
        const data = await response.json();
        setCurrencies(data.currencies || []);
        setUsdIndexChange(typeof data.usdIndexChange === "number" ? data.usdIndexChange : null);
        setFxError("");
      } catch (error) {
        setFxError(error instanceof Error ? error.message : "Currency data could not be loaded.");
      } finally { setFxLoading(false); }
    };
    fetchForexData();
    const interval = setInterval(fetchForexData, 6 * 60 * 60000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const fetchMarketHealth = async () => {
      try {
        const response = await fetch("/api/market-health");
        if (!response.ok) throw new Error(`Market request failed (${response.status})`);
        const data = await response.json();
        setMarketHealth(data.indexes || []);
        setHistory(data.history || []);
        setRiskIndicators(data.riskIndicators || []);
        setRiskHistory(data.riskHistory || []);
        setHealthError("");
      } catch (error) {
        setHealthError(error instanceof Error ? error.message : "Market data could not be loaded.");
      } finally { setHealthLoading(false); }
    };
    fetchMarketHealth();
    const interval = setInterval(fetchMarketHealth, 6 * 60 * 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="surface-panel market-panel">
      <div className="surface-toolbar">
        <p className="surface-muted">Reference prices and market context, not a live trading feed. Data availability depends on upstream providers.</p>
        {healthError && <p className="surface-error" role="alert">{healthError}{marketHealth.length ? " Previous quotes retained." : ""}</p>}
      </div>
      <section className="market-section">
        <h2>US equity benchmarks</h2>
        {healthLoading ? <p className="surface-muted" role="status">Loading prices...</p> : marketHealth.length ? <MarketSeries quotes={marketHealth} history={history} /> : <p className="surface-muted">No benchmark data available.</p>}
        <p className="surface-muted">S&amp;P 500, Nasdaq and Dow represented by SPY, QQQ and DIA. Charts show change from seven days ago; table changes are the latest quoted session.</p>
      </section>
      <section className="market-section">
        <h2>Risk and safe-haven proxies</h2>
        {healthLoading ? <p className="surface-muted">Loading indicators...</p> : riskIndicators.length ? <MarketSeries quotes={riskIndicators} history={riskHistory} /> : <p className="surface-muted">No risk indicator data available.</p>}
        <p className="surface-muted">Oil, gold, defense and VIX futures proxies. These instruments provide context, not evidence of a particular event. VIXY is not the spot VIX.</p>
      </section>
      <section className="market-section">
        <h2>Dollar strength <span className="surface-muted">/ 7 days</span> {usdIndexChange !== null && <span className={changeClass(usdIndexChange)}>{percent(usdIndexChange)}</span>}</h2>
        {fxError && <p className="surface-error" role="alert">{fxError}{currencies.length ? " Previous rates retained." : ""}</p>}
        {fxLoading ? <p className="surface-muted" role="status">Loading exchange rates...</p> : currencies.length ? <table className="market-table">
          <thead><tr><th scope="col">Pair</th><th scope="col">Rate</th><th scope="col">7-day change</th></tr></thead>
          <tbody>{[...currencies].sort((a, b) => b.changePct - a.changePct).map((currency) => <tr key={currency.code}>
            <td>USD / {currency.code}</td><td>{currency.rate.toFixed(3)}</td><td className={changeClass(currency.changePct)}>{percent(currency.changePct)}</td>
          </tr>)}</tbody>
        </table> : <p className="surface-muted">No currency data available.</p>}
        <p className="surface-muted">ECB reference rates. A positive change means the dollar strengthened against that currency. Requests refresh every six hours; rates update daily.</p>
      </section>
    </div>
  );
}
