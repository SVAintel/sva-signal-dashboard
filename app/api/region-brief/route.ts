import { NextRequest, NextResponse } from "next/server";
import { getRecentEvents, getRecentFleetSnapshots, type EventHistoryRow, type FleetHistoryRow } from "@/lib/db";
import { COUNTRY_DETAILS } from "@/lib/data/country-details";

// On-demand "what happened here in the last week" brief — the synthesis
// layer sitting on top of the raw event/fleet history captured by
// recordEventSnapshot()/recordFleetSnapshot(). Triggered by a user clicking a
// region (country or named sea/operating area) rather than on a schedule.
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const WINDOW_DAYS = 7;

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

// Matches events to a region by simple keyword containment in either
// direction (event text mentions the region name, or vice versa for short
// region names like "Iran"). Deliberately loose/textual rather than a strict
// geo-fence, since named sea regions (e.g. "Red Sea") don't correspond to any
// single country polygon and events don't carry a region label of their own.
function matchesRegion(text: string, regionName: string, aliases: string[]): boolean {
  const t = normalize(text);
  const candidates = [regionName, ...aliases].map(normalize).filter(Boolean);
  return candidates.some((c) => c.length > 2 && t.includes(c));
}

function eventsForRegion(events: EventHistoryRow[], regionName: string, aliases: string[]) {
  return events.filter((e) => matchesRegion(`${e.title} ${e.description ?? ""}`, regionName, aliases));
}

function fleetForRegion(fleets: FleetHistoryRow[], regionName: string, aliases: string[]) {
  const norm = normalize(regionName);
  return fleets.filter((f) => {
    const region = normalize(f.region);
    if (region.includes(norm) || norm.includes(region)) return true;
    return aliases.some((a) => region.includes(normalize(a)));
  });
}

async function generateBrief(
  regionName: string,
  events: EventHistoryRow[],
  fleets: FleetHistoryRow[],
  countryBlurb: string | null
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "AI brief generation is not configured (missing GEMINI_API_KEY).";
  }
  if (events.length === 0 && fleets.length === 0 && !countryBlurb) {
    return `No tracked activity for "${regionName}" in the last ${WINDOW_DAYS} days across the monitored event feed or fleet tracker.`;
  }

  const eventLines = events
    .slice(0, 40)
    .map((e) => `- [${e.category}] ${e.title} (${e.source}, ${e.firstSeenAt})`)
    .join("\n");

  const fleetLines = fleets
    .slice(0, 10)
    .map(
      (f) =>
        `- ${f.region}${f.groupName ? ` (${f.groupName})` : ""}: ${f.ships.join(", ")}. Mission: ${f.missionSet || "n/a"}. Outlook: ${f.outlook || "n/a"}`
    )
    .join("\n");

  const prompt = `You are a geopolitical risk analyst producing a concise, evidence-based weekly brief for a client-facing intelligence dashboard.

Region: ${regionName}
Time window: last ${WINDOW_DAYS} days

${countryBlurb ? `Baseline country context:\n${countryBlurb}\n` : ""}
Tracked events in this window (from the live monitoring feed):
${eventLines || "(none captured)"}

U.S. naval/fleet presence relevant to this region (from USNI Fleet Tracker, weekly, approximate positions):
${fleetLines || "(none reported nearby)"}

Write a brief with these sections, in plain analytical English, evidence-based and hedged where appropriate (do not invent facts not present above):
1. Situation Summary (2-3 sentences)
2. Key Developments (bulleted, most significant first)
3. Military Posture (only if fleet data above is non-empty; otherwise omit this section)
4. Outlook / Watch Items (short, clearly framed as analytical judgment, not confirmed fact)

Keep the whole brief under 300 words. Do not use markdown headers (##); just use the section titles as plain bolded-looking labels followed by a colon.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) {
      console.error("[region-brief] Gemini responded", res.status, await res.text());
      return "Brief generation failed (AI service error). Raw tracked activity is still available below.";
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("[region-brief] Gemini returned no text", JSON.stringify(data).slice(0, 500));
      return "Brief generation failed (empty AI response). Raw tracked activity is still available below.";
    }
    return text.trim();
  } catch (err) {
    console.error("[region-brief] Gemini call failed:", err);
    return "Brief generation failed (network/service error). Raw tracked activity is still available below.";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const regionName = searchParams.get("region")?.trim();
    if (!regionName) {
      return NextResponse.json({ error: "Missing required 'region' query param" }, { status: 400 });
    }
    const aliasesParam = searchParams.get("aliases");
    const aliases = aliasesParam ? aliasesParam.split(",").map((a) => a.trim()).filter(Boolean) : [];

    const [allEvents, allFleets] = await Promise.all([
      getRecentEvents(WINDOW_DAYS),
      getRecentFleetSnapshots(14),
    ]);

    const matchedEvents = eventsForRegion(allEvents, regionName, aliases);
    const matchedFleets = fleetForRegion(allFleets, regionName, aliases);
    const countryDetail = COUNTRY_DETAILS[regionName];
    const countryBlurb = countryDetail
      ? `Population ${countryDetail.population}. ${countryDetail.summary ?? ""}`.trim()
      : null;

    const brief = await generateBrief(regionName, matchedEvents, matchedFleets, countryBlurb);

    return NextResponse.json({
      region: regionName,
      windowDays: WINDOW_DAYS,
      eventCount: matchedEvents.length,
      fleetMatchCount: matchedFleets.length,
      events: matchedEvents.slice(0, 40),
      fleetGroups: matchedFleets.slice(0, 10),
      brief,
    });
  } catch (error) {
    console.error("[region-brief] error:", error);
    return NextResponse.json({ error: "Failed to generate region brief" }, { status: 500 });
  }
}
