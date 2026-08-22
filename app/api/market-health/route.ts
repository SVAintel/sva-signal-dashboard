import fs from "fs";
import path from "path";

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// US market health snapshot — equity indexes plus geopolitical risk/safe-haven
// gauges, all via liquid ETF proxies since Alpha Vantage's free tier doesn't
// carry raw index/commodity tickers like ^GSPC/^VIX or spot WTI/gold.
//
// A disk-backed cache (same pattern as the fleet-tracker route) guarantees we
// only hit Alpha Vantage twice a day, no matter how often the client polls or
// how many times the dev server restarts — relying solely on Next's fetch()
// revalidate window isn't enough since that in-memory cache resets on every
// server restart, which is what blew through the 25-req/day quota earlier.
export const dynamic = "force-dynamic";

const CACHE_MS = 12 * 60 * 60 * 1000; // twice a day
const CACHE_FILE = path.join(process.cwd(), ".market-health-cache.json");

const INDEXES = [
  { symbol: "SPY", label: "S&P 500", color: "#d4b36a" },
  { symbol: "QQQ", label: "Nasdaq", color: "#5bc0de" },
  { symbol: "DIA", label: "Dow Jones", color: "#8b7cf6" },
];

// Geopolitical risk / safe-haven gauges — oil and gold typically move on
// conflict escalation (supply-route disruption, flight to safety), VIXY
// tracks VIX futures as a proxy for the "fear gauge" since raw ^VIX isn't
// available on the free tier, and the defense-sector basket (ITA) tends to
// rally on escalation, often ahead of it being obvious in headlines.
const RISK_INDICATORS = [
  { symbol: "USO", label: "Crude Oil (WTI)", color: "#f59e0b" },
  { symbol: "GLD", label: "Gold", color: "#eab308" },
  { symbol: "VIXY", label: "Volatility (VIX)", color: "#ef4444" },
  { symbol: "ITA", label: "Defense Sector", color: "#22c55e" },
];

interface FetchedSeries {
  symbol: string;
  label: string;
  color: string;
  price: number;
  change: number;
  changePercent: number;
  days: { date: string; time: string; close: number }[];
}

interface MarketCache {
  indexes: FetchedSeries[];
  riskIndicators: FetchedSeries[];
  ts: number;
}

const g = globalThis as unknown as { __marketHealthCache?: MarketCache | null };

function readCacheFromDisk(): MarketCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCacheToDisk(cache: MarketCache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch (error) {
    console.error("[market-health] failed to write disk cache:", error);
  }
}

async function fetchSeries(list: { symbol: string; label: string; color: string }[]): Promise<FetchedSeries[]> {
  // Alpha Vantage's free tier caps burst traffic at 1 request/second, so we
  // must fetch these sequentially (with a short delay between calls) rather
  // than in parallel — concurrent requests get silently rate-limited and
  // dropped, which is why only one symbol (whichever won the race) used to
  // show up in the UI.
  const fetched: FetchedSeries[] = [];
  for (const { symbol, label, color } of list) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`,
        { signal: controller.signal, cache: "no-store" }
      );
      clearTimeout(timeout);
      const data = await res.json();
      const series = data["Time Series (Daily)"];
      if (!series) {
        console.error(`[market-health] fetch error (${symbol}):`, data["Information"] || data["Note"] || "no series");
      } else {
        const days = Object.entries(series)
          .slice(0, 7)
          .reverse()
          .map(([date, values]: any) => ({
            date,
            time: new Date(date).toLocaleDateString([], { month: "short", day: "numeric" }),
            close: parseFloat(values["4. close"]),
          }));

        if (days.length > 0) {
          const latest = days[days.length - 1];
          const prev = days.length > 1 ? days[days.length - 2] : latest;
          const change = latest.close - prev.close;
          const changePercent = prev.close ? (change / prev.close) * 100 : 0;

          fetched.push({ symbol, label, color, price: latest.close, change, changePercent, days });
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      console.error(`[market-health] fetch error (${symbol}):`, e);
    }
    // Space out calls to stay under Alpha Vantage's 1 req/sec burst limit.
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  return fetched;
}

// If this cycle's fetch only partially succeeded (e.g. daily quota ran out
// partway through), keep the prior cycle's data for whichever symbols didn't
// come back fresh, rather than dropping them from the UI entirely.
function mergeBySymbol(fresh: FetchedSeries[], stale: FetchedSeries[]): FetchedSeries[] {
  const freshSymbols = new Set(fresh.map((f) => f.symbol));
  const keptStale = stale.filter((s) => !freshSymbols.has(s.symbol));
  const bySymbol = new Map([...fresh, ...keptStale].map((s) => [s.symbol, s]));
  return Array.from(bySymbol.values());
}

// Merges each symbol's daily series into one array keyed by date, with each
// symbol's price normalized to % change from its own first day in the
// window — puts them on a comparable scale despite very different absolute
// price levels (SPY ~$700s vs. GLD ~$250s vs. VIXY ~$15).
function buildHistory(series: FetchedSeries[]) {
  const historyMap = new Map<string, any>();
  for (const idx of series) {
    if (!idx.days.length) continue;
    const basePrice = idx.days[0].close;
    for (const day of idx.days) {
      const entry = historyMap.get(day.time) || { time: day.time };
      entry[idx.symbol] = Math.round(((day.close - basePrice) / basePrice) * 10000) / 100;
      historyMap.set(day.time, entry);
    }
  }
  return Array.from(historyMap.values());
}

function toPublic(series: FetchedSeries[]) {
  return series.map(({ symbol, label, color, price, change, changePercent }) => ({
    symbol, label, color, price, change, changePercent,
  }));
}

export async function GET() {
  if (!ALPHA_VANTAGE_KEY) {
    return Response.json({ indexes: [], history: [], riskIndicators: [], riskHistory: [] });
  }

  if (g.__marketHealthCache === undefined) {
    g.__marketHealthCache = readCacheFromDisk();
  }

  const cache = g.__marketHealthCache;
  const ageMs = cache ? Date.now() - cache.ts : Infinity;

  if (!cache || ageMs > CACHE_MS) {
    try {
      const freshIndexes = await fetchSeries(INDEXES);
      const freshRisk = await fetchSeries(RISK_INDICATORS);

      const mergedIndexes = mergeBySymbol(freshIndexes, cache?.indexes || []);
      const mergedRisk = mergeBySymbol(freshRisk, cache?.riskIndicators || []);

      const next: MarketCache = { indexes: mergedIndexes, riskIndicators: mergedRisk, ts: Date.now() };
      g.__marketHealthCache = next;
      writeCacheToDisk(next);
    } catch (error) {
      console.error("[market-health] refresh failed, serving stale/empty cache:", error);
    }
  }

  const result = g.__marketHealthCache;
  return Response.json({
    indexes: toPublic(result?.indexes || []),
    history: buildHistory(result?.indexes || []),
    riskIndicators: toPublic(result?.riskIndicators || []),
    riskHistory: buildHistory(result?.riskIndicators || []),
  });
}
