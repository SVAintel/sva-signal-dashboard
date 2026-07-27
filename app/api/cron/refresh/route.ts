import { NextRequest, NextResponse } from "next/server";

// Vercel Cron (Hobby plan: once/day max) hits this route on a fixed schedule
// (see vercel.json) to proactively refresh the signals/news/stocks data caches
// at a known, low-traffic time — instead of relying purely on user-triggered
// revalidation. This guarantees at least one fresh pull per day even with zero
// visitors, while the per-source `revalidate` windows (event-generator.ts,
// news/route.ts, stocks/route.ts) keep any traffic-triggered refreshes safely
// under each upstream API's daily quota.
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
  const targets = ["/api/events", "/api/news", "/api/stocks?symbol=AAPL", "/api/stocks?symbol=GOOGL", "/api/stocks?symbol=MSFT"];

  const results = await Promise.allSettled(
    targets.map((path) => fetch(`${origin}${path}`, { cache: "no-store" }))
  );

  const summary = targets.map((path, i) => ({
    path,
    ok: results[i].status === "fulfilled" && (results[i] as PromiseFulfilledResult<Response>).value.ok,
  }));

  return NextResponse.json({ refreshed: summary, timestamp: new Date().toISOString() });
}
