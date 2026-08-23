import { NextRequest, NextResponse } from "next/server";

// Vercel Cron (Hobby plan: once/day max) hits this route on a fixed schedule
// (see vercel.json) to proactively refresh the signals/news data caches at a
// known, low-traffic time — instead of relying purely on user-triggered
// revalidation. This guarantees at least one fresh pull per day even with zero
// visitors, while the per-source `revalidate` windows (event-generator.ts,
// news/route.ts) keep any traffic-triggered refreshes safely under each
// upstream API's daily quota.
//
// Vercel automatically sends `Authorization: Bearer ${CRON_SECRET}` when
// invoking scheduled cron requests, as long as CRON_SECRET is set as an env
// var on the project — this checks that header so the route can't be hit
// by randoms to force extra upstream API calls.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = req.nextUrl.origin;
  // /api/stocks is no longer warmed here — nothing on the frontend actually
  // reads that route (only market-health/StockMarketPanel and the
  // event-generator's Alpha Vantage quotes do), so warming it was silently
  // burning 3 of Alpha Vantage's 25 free requests/day for a route with no
  // consumers.
  const targets = ["/api/events", "/api/news"];

  const results = await Promise.allSettled(
    targets.map((path) => fetch(`${origin}${path}`, { cache: "no-store" }))
  );

  const summary = targets.map((path, i) => ({
    path,
    ok: results[i].status === "fulfilled" && (results[i] as PromiseFulfilledResult<Response>).value.ok,
  }));

  // Also runs the once-daily country-data staleness check (see
  // lib/country-staleness-check.ts). It's a separate route rather than an
  // inline function call so it has its own clear log namespace/URL to hit
  // manually, but it still requires the same CRON_SECRET auth, so forward
  // the header this request already carried and validated above.
  let stalenessCheckOk = false;
  try {
    const stalenessRes = await fetch(`${origin}/api/cron/country-staleness`, {
      cache: "no-store",
      headers: authHeader ? { authorization: authHeader } : undefined,
    });
    stalenessCheckOk = stalenessRes.ok;
  } catch (error) {
    console.error("[cron/refresh] country-staleness check failed:", error);
  }

  return NextResponse.json({
    refreshed: summary,
    countryStalenessCheckOk: stalenessCheckOk,
    timestamp: new Date().toISOString(),
  });
}
