import { getAppCache, setAppCache } from "@/lib/db";

const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Alpha Vantage's free tier caps out at 25 requests/day total, shared across
// this route, market-health, and the event-generator's market-signal quotes.
// Cached once/day per-symbol in Postgres (survives Vercel's ephemeral
// filesystem/cold starts) instead of relying solely on Next's per-fetch
// revalidate window.
const CACHE_MS = 24 * 60 * 60 * 1000; // once a day
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const cacheKey = `stocks-${symbol}`;

  if (!ALPHA_VANTAGE_KEY) {
    return Response.json(generateMockStockData(symbol));
  }

  const cached = await getAppCache<any[]>(cacheKey);
  if (cached && Date.now() - new Date(cached.updatedAt).getTime() < CACHE_MS) {
    return Response.json(cached.value);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(timeout);

    const data = await res.json();
    const timeSeries = data["Time Series (Daily)"] || {};

    const chartData = Object.entries(timeSeries)
      .slice(0, 7)
      .reverse()
      .map(([date, values]: any) => ({
        time: new Date(date).toLocaleDateString([], { month: "short", day: "numeric" }),
        price: parseFloat(values["4. close"]),
        symbol,
      }));

    if (chartData.length > 0) {
      await setAppCache(cacheKey, chartData);
      return Response.json(chartData);
    }

    // Quota exhausted / no data this cycle — keep serving yesterday's cache
    // if we have it, rather than falling back to mock data unnecessarily.
    return Response.json(cached?.value || generateMockStockData(symbol));
  } catch (e) {
    console.error("Alpha Vantage error:", e);
    return Response.json(cached?.value || generateMockStockData(symbol));
  }
}

// Generate mock data when API fails or is unavailable
function generateMockStockData(symbol: string) {
  const now = new Date();
  const data = [];
  let basePrice = 150 + Math.random() * 50;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60000);
    basePrice += (Math.random() - 0.5) * 4;
    data.push({
      time: date.toLocaleDateString([], { month: "short", day: "numeric" }),
      price: parseFloat(basePrice.toFixed(2)),
      symbol,
    });
  }

  return data;
}
