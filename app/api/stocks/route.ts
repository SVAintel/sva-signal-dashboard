const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Alpha Vantage's free tier caps out at 25 requests/day total. This route was
// previously fully dynamic (no caching at all) — every page load / symbol
// switch hit the upstream API fresh, which exhausts the daily quota almost
// immediately. Cache per-symbol for 6h so repeat visits/symbol-switches reuse
// the same cached response instead of re-pulling.
export const revalidate = 21600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "AAPL";

  if (!ALPHA_VANTAGE_KEY) {
    return Response.json(generateMockStockData(symbol));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`,
      { signal: controller.signal, next: { revalidate: 21600 } }
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

    return Response.json(chartData.length > 0 ? chartData : generateMockStockData(symbol));
  } catch (e) {
    console.error("Alpha Vantage error:", e);
    return Response.json(generateMockStockData(symbol));
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
