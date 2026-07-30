const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// US market health snapshot — S&P 500, Nasdaq, Dow (via liquid ETF proxies,
// since Alpha Vantage's free tier doesn't carry raw index tickers like
// ^GSPC/^IXIC/^DJI). Cached 6h to stay well within the 25 req/day quota.
// Uses TIME_SERIES_DAILY (not GLOBAL_QUOTE) so a single call per symbol
// gives us both the latest price/change AND the 7-day history for the chart.
export const revalidate = 21600;

const INDEXES = [
  { symbol: "SPY", label: "S&P 500", color: "#d4b36a" },
  { symbol: "QQQ", label: "Nasdaq", color: "#5bc0de" },
  { symbol: "DIA", label: "Dow Jones", color: "#8b7cf6" },
];

export async function GET() {
  if (!ALPHA_VANTAGE_KEY) {
    return Response.json({ indexes: [], history: [] });
  }

  const results = await Promise.allSettled(
    INDEXES.map(async ({ symbol, label, color }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`,
          { signal: controller.signal, next: { revalidate: 21600 } }
        );
        clearTimeout(timeout);
        const data = await res.json();
        const series = data["Time Series (Daily)"];
        if (!series) return null;

        const days = Object.entries(series)
          .slice(0, 7)
          .reverse()
          .map(([date, values]: any) => ({
            date,
            time: new Date(date).toLocaleDateString([], { month: "short", day: "numeric" }),
            close: parseFloat(values["4. close"]),
          }));
        if (days.length === 0) return null;

        const latest = days[days.length - 1];
        const prev = days.length > 1 ? days[days.length - 2] : latest;
        const change = latest.close - prev.close;
        const changePercent = prev.close ? (change / prev.close) * 100 : 0;

        return {
          symbol,
          label,
          color,
          price: latest.close,
          change,
          changePercent,
          days,
        };
      } catch (e) {
        clearTimeout(timeout);
        console.error(`Market health fetch error (${symbol}):`, e);
        return null;
      }
    })
  );

  const fetched = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);

  const indexes = fetched.map(({ symbol, label, color, price, change, changePercent }) => ({
    symbol, label, color, price, change, changePercent,
  }));

  // Merge each index's daily series into one array keyed by date, with each
  // symbol's price normalized to % change from its own first day in the
  // window — puts all three on a comparable scale despite very different
  // absolute price levels (SPY ~$700s, DIA ~$500s, QQQ ~$600s).
  const historyMap = new Map<string, any>();
  for (const idx of fetched) {
    const basePrice = idx.days[0].close;
    for (const day of idx.days) {
      const entry = historyMap.get(day.time) || { time: day.time };
      entry[idx.symbol] = Math.round(((day.close - basePrice) / basePrice) * 10000) / 100;
      historyMap.set(day.time, entry);
    }
  }
  const history = Array.from(historyMap.values());

  return Response.json({ indexes, history });
}
