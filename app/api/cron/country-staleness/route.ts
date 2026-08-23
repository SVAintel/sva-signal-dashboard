import { NextRequest, NextResponse } from "next/server";
import { runCountryStalenessCheck } from "@/lib/country-staleness-check";

// Runs the country-data staleness check (see lib/country-staleness-check.ts)
// once a day via /api/cron/refresh, which forwards its own CRON_SECRET-
// validated Authorization header here — see that route for why this can't
// simply be its own top-level Vercel Cron entry (Hobby plan cron limits).
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await runCountryStalenessCheck();
  return NextResponse.json({ ...summary, timestamp: new Date().toISOString() });
}
