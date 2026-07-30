// Currency strength via Frankfurter — free, no API key, no rate limit
// (ECB reference rates, updated once daily). Kept separate from Alpha
// Vantage so it never competes for that API's 25-req/day quota.
export const revalidate = 21600; // 6h — rates only update once/day anyway

const CURRENCIES = ["EUR", "GBP", "JPY", "CNY", "CHF", "CAD", "AUD", "MXN", "INR", "KRW"];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const to = CURRENCIES.join(",");
    const weekAgo = isoDaysAgo(7);

    const [latestRes, weekAgoRes] = await Promise.all([
      fetch(`https://api.frankfurter.dev/v1/latest?from=USD&to=${to}`, { next: { revalidate: 21600 } }),
      fetch(`https://api.frankfurter.dev/v1/${weekAgo}?from=USD&to=${to}`, { next: { revalidate: 21600 } }),
    ]);

    const latest = await latestRes.json();
    const past = await weekAgoRes.json();

    const currencies = CURRENCIES.map((code) => {
      const rate = latest.rates?.[code];
      const oldRate = past.rates?.[code];
      // Higher rate = more foreign currency per USD = USD strengthened
      const changePct = rate && oldRate ? ((rate - oldRate) / oldRate) * 100 : 0;
      return { code, rate, changePct: Math.round(changePct * 100) / 100 };
    }).filter((c) => c.rate != null);

    const usdIndexChange =
      currencies.length > 0
        ? Math.round((currencies.reduce((sum, c) => sum + c.changePct, 0) / currencies.length) * 100) / 100
        : 0;

    return Response.json({ date: latest.date, currencies, usdIndexChange });
  } catch (e) {
    console.error("Forex fetch error:", e);
    return Response.json({ date: null, currencies: [], usdIndexChange: 0 });
  }
}
