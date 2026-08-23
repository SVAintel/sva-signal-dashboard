import { NextResponse } from "next/server";
import { getActiveCountryStalenessFlags } from "@/lib/db";

// Lightweight, read-only endpoint the frontend can poll to show a "some
// country profiles may be out of date" indicator. Safe to call freely —
// unlike /api/cron/country-staleness, this never triggers a Gemini call,
// it just reads whatever the daily cron check has already flagged.
export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await getActiveCountryStalenessFlags();
  return NextResponse.json({ flags });
}
