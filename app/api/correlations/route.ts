import { NextResponse } from "next/server";
import { getRecentEvents } from "@/lib/db";
import { buildCorrelationClusters } from "@/lib/correlation";

// "Pattern Alerts" — surfaces geographic+temporal clusters of signals that
// span multiple categories (e.g. a WAR story and a MARKET signal both near
// the same place within a day), which is a much stronger "something's
// happening here" indicator than any single signal alone. Reuses the
// existing event_snapshots history (already populated every ~15-30min by
// /api/events) — no new external data source or quota cost.
export const dynamic = "force-dynamic";
export const revalidate = 900;

const WINDOW_DAYS = 2; // matches the 24h cluster window with a little slack

export async function GET() {
  try {
    const rows = await getRecentEvents(WINDOW_DAYS);
    const clusters = buildCorrelationClusters(rows);
    return NextResponse.json({ clusters });
  } catch (error) {
    console.error("[correlations] failed:", error);
    return NextResponse.json({ clusters: [], error: "Failed to compute correlations" }, { status: 500 });
  }
}
