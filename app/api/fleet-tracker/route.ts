import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { lookupFleetRegionCoords, lookupFleetRegionEventKeywords } from "@/lib/data/fleet-region-coords";
import { summarizeShipCapabilities } from "@/lib/data/ship-class-info";
import { generateMockEvents } from "@/lib/event-generator";
import { recordFleetSnapshot } from "@/lib/db";
import type { FleetGroup } from "@/lib/data/fleet-group-type";
export type { FleetGroup } from "@/lib/data/fleet-group-type";

// USNI News' weekly "Fleet and Marine Tracker" — approximate positions of
// deployed U.S. Navy carrier strike groups / amphibious ready groups /
// independently deployed surface combatants, described by NAMED REGION
// (e.g. "In the Arabian Sea"), never precise coordinates, for operational-
// security reasons. USNI publishes a new edition roughly weekly (usually
// Mondays), so this route only needs to re-scrape on that cadence — a long
// disk-backed cache avoids hammering their site on every page load.
export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";

// Re-check twice a day so a new weekly edition is picked up within a few
// hours of publishing, without scraping on every request. This also caps how
// often the AI mission-set/outlook analysis below is regenerated.
const CACHE_MS = 12 * 60 * 60 * 1000;
const CACHE_FILE = path.join(process.cwd(), ".fleet-tracker-cache.json");

interface FleetCache {
  groups: FleetGroup[];
  sourceUrl: string;
  sourceTitle: string;
  publishedAt: string | null;
  ts: number;
}

const g = globalThis as unknown as { __fleetTrackerCache?: FleetCache | null };

function readCacheFromDisk(): FleetCache | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCacheToDisk(cache: FleetCache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch (error) {
    console.error("[fleet-tracker] failed to write disk cache:", error);
  }
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "\u2019")
    .replace(/&#8220;|&ldquo;/g, "\u201c")
    .replace(/&#8221;|&rdquo;/g, "\u201d")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Splits the article's raw content HTML into one block per top-level "In
// <Region>" <h2> section (nested <h3>/<strong> unit breakdowns stay inside
// their parent region's block, since they only end at the NEXT <h2>).
function splitByRegionHeadings(html: string): { heading: string; bodyHtml: string }[] {
  const headingRegex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const matches: { heading: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(html))) {
    matches.push({ heading: stripTags(m[1]), start: m.index, end: headingRegex.lastIndex });
  }

  const sections: { heading: string; bodyHtml: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const bodyStart = matches[i].end;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].start : html.length;
    sections.push({ heading: matches[i].heading, bodyHtml: html.slice(bodyStart, bodyEnd) });
  }
  return sections;
}

function parseFleetGroups(contentHtml: string): FleetGroup[] {
  const sections = splitByRegionHeadings(contentHtml);
  const groups: FleetGroup[] = [];

  for (const section of sections) {
    const headingMatch = section.heading.match(/^in\s+(the\s+)?(.+)$/i);
    if (!headingMatch) continue; // only "In X" headings are location sections
    const region = headingMatch[2].trim();

    const coords = lookupFleetRegionCoords(region);
    if (!coords) {
      console.log(`[fleet-tracker] no known coordinates for region "${region}" — skipping`);
      continue;
    }

    const bodyText = stripTags(section.bodyHtml);

    const shipByHull = new Map<string, string>();
    const shipRegex = /USS\s+([A-Z][A-Za-z0-9.'\- ]*?)\s*\(([A-Z]{1,4}-?\d{1,4})\)/g;
    let sm: RegExpExecArray | null;
    while ((sm = shipRegex.exec(bodyText))) {
      const hull = sm[2];
      if (!shipByHull.has(hull)) {
        shipByHull.set(hull, `USS ${sm[1].trim()} (${hull})`);
      }
    }

    const groupMatch = bodyText.match(
      /(Carrier Strike Group \d+|Amphibious Ready Group|Expeditionary Strike Group \d+)/i
    );

    groups.push({
      id: region.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      region,
      lat: coords[0],
      lng: coords[1],
      groupName: groupMatch ? groupMatch[1] : null,
      ships: Array.from(shipByHull.values()),
      summary: bodyText.slice(0, 900),
      capabilities: summarizeShipCapabilities(Array.from(shipByHull.values())),
      missionSet: "",
      outlook: "",
    });
  }

  return groups;
}

// Pulls a handful of live dashboard events thematically relevant to a fleet
// group's region (see FLEET_REGION_EVENT_KEYWORDS) so the AI enrichment step
// below can ground its "potential headings" analysis in what's actually on
// the dashboard right now, instead of generic/generic-sounding speculation.
function findRelevantEvents(
  region: string,
  events: Array<{ title: string; category: string; description: string; source: string; timestamp: string }>
): string[] {
  const keywords = lookupFleetRegionEventKeywords(region);
  if (keywords.length === 0) return [];
  const matches: string[] = [];
  for (const event of events) {
    const haystack = `${event.title} ${event.description}`.toLowerCase();
    if (keywords.some((kw) => haystack.includes(kw))) {
      matches.push(`[${event.category}] ${event.title}`);
      if (matches.length >= 5) break;
    }
  }
  return matches;
}

// Enriches each parsed group with an AI-generated mission set (what this
// group is likely doing there) and outlook (plausible near-term
// trajectory/headings), grounded in the group's known ship classes and any
// thematically relevant events currently on the dashboard's live signal
// feed. Runs once per 12h cache refresh, batched into a single Gemini call
// covering every group, not per-request — this is analytical speculation
// for context, not confirmed intent, and is captioned as such in the UI.
async function enrichWithAnalysis(groups: FleetGroup[]): Promise<FleetGroup[]> {
  if (!GEMINI_API_KEY || groups.length === 0) return groups;

  let liveEvents: Array<{ title: string; category: string; description: string; source: string; timestamp: string }> = [];
  try {
    liveEvents = await generateMockEvents();
  } catch (error) {
    console.error("[fleet-tracker] failed to load live events for analysis context:", error);
  }

  const groupContext = groups
    .map((group) => {
      const relevantEvents = findRelevantEvents(group.region, liveEvents);
      return (
        `ID: ${group.id}\nRegion: ${group.region}${group.groupName ? ` (${group.groupName})` : ""}\n` +
        `Ships: ${group.ships.join(", ") || "none individually named"}\n` +
        `Ship capabilities: ${group.capabilities || "unknown hull types"}\n` +
        `USNI report excerpt: ${group.summary.slice(0, 400)}\n` +
        `Relevant live dashboard signals: ${relevantEvents.length > 0 ? relevantEvents.join("; ") : "none currently on the feed"}`
      );
    })
    .join("\n\n");

  const prompt =
    `You are a naval intelligence analyst writing short briefing notes for each U.S. Navy group listed below, ` +
    `based on USNI News' weekly Fleet and Marine Tracker report plus the current live geopolitical signal feed. ` +
    `For EACH group, write two short items:\n` +
    `1. "missionSet": 1-2 concise sentences on the group's likely mission/purpose in that region (e.g. deterrence ` +
    `patrol, carrier strike group power projection, amphibious ready group crisis-response posture, freedom-of-` +
    `navigation presence, counter-piracy/counter-smuggling, BMD coverage) based on its composition and location.\n` +
    `2. "outlook": 1-2 concise sentences of grounded, appropriately-hedged analytical speculation on plausible ` +
    `near-term headings/taskings, referencing the relevant live signals if any were given, and general geopolitical ` +
    `context otherwise. Do not claim certainty about actual movements — USNI does not publish precise coordinates ` +
    `or intentions, so frame this explicitly as analytical judgment, not confirmed fact.\n\n` +
    `Groups:\n\n${groupContext}\n\n` +
    `Respond with ONLY a JSON array, no markdown fences, no commentary, in this exact shape: ` +
    `[{"id": "<id>", "missionSet": "...", "outlook": "..."}, ...] — one entry per group, in the same order given.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("[fleet-tracker] Gemini analysis request failed:", data?.error?.message);
      return groups;
    }
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[fleet-tracker] Gemini analysis response had no JSON array");
      return groups;
    }
    const parsed = JSON.parse(jsonMatch[0]) as Array<{ id: string; missionSet?: string; outlook?: string }>;
    const byId = new Map(parsed.map((p) => [p.id, p]));
    return groups.map((group) => {
      const analysis = byId.get(group.id);
      return {
        ...group,
        missionSet: analysis?.missionSet || group.missionSet,
        outlook: analysis?.outlook || group.outlook,
      };
    });
  } catch (error) {
    console.error("[fleet-tracker] Gemini analysis enrichment failed:", error);
    return groups;
  }
}

// USNI's individual article pages sit behind a Cloudflare JS challenge that
// blocks plain server-side fetches (confirmed: raw requests get a "Just a
// moment..." interstitial, not the article). Their public WordPress REST
// API is NOT behind that challenge and returns the full rendered HTML
// content directly — a far more reliable source than either the article
// page (Cloudflare-blocked) or the RSS feed (observed to lag several weeks
// behind the live site, likely a long-lived CDN cache on their end).
const FLEET_TRACKER_CATEGORY_ID = 4137;
const WP_API_URL = `https://news.usni.org/wp-json/wp/v2/posts?categories=${FLEET_TRACKER_CATEGORY_ID}&per_page=1&orderby=date&order=desc&_fields=title,link,date,content.rendered`;

async function fetchLatestEdition(): Promise<FleetCache | null> {
  const res = await fetch(WP_API_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`USNI WP API responded ${res.status}`);
  const posts = (await res.json()) as Array<{
    title?: { rendered?: string };
    link?: string;
    date?: string;
    content?: { rendered?: string };
  }>;
  const latest = posts?.[0];
  if (!latest) return null;

  const contentHtml = latest.content?.rendered || "";
  const groups = await enrichWithAnalysis(parseFleetGroups(contentHtml));

  return {
    groups,
    sourceUrl: latest.link || "https://news.usni.org/category/fleet-tracker",
    sourceTitle: latest.title?.rendered || "USNI News Fleet and Marine Tracker",
    publishedAt: latest.date || null,
    ts: Date.now(),
  };
}

export async function GET() {
  try {
    if (g.__fleetTrackerCache === undefined) {
      g.__fleetTrackerCache = readCacheFromDisk();
    }

    const cache = g.__fleetTrackerCache;
    const ageMs = cache ? Date.now() - cache.ts : Infinity;

    if (!cache || ageMs > CACHE_MS) {
      try {
        const fresh = await fetchLatestEdition();
        if (fresh) {
          g.__fleetTrackerCache = fresh;
          writeCacheToDisk(fresh);
          // Append (not overwrite) into Postgres history so weekly-brief
          // generation has real trailing data, unlike the disk cache above
          // which only ever holds the current edition.
          await recordFleetSnapshot(fresh.groups, fresh.sourceUrl, fresh.publishedAt);
        }
      } catch (error) {
        console.error("[fleet-tracker] refresh failed, serving stale/empty cache:", error);
      }
    }

    const result = g.__fleetTrackerCache;
    return NextResponse.json({
      groups: result?.groups || [],
      sourceUrl: result?.sourceUrl || null,
      sourceTitle: result?.sourceTitle || null,
      publishedAt: result?.publishedAt || null,
      lastUpdated: result?.ts || null,
    });
  } catch (error) {
    console.error("[fleet-tracker] error:", error);
    return NextResponse.json({ groups: [], sourceUrl: null, sourceTitle: null, publishedAt: null, lastUpdated: null });
  }
}
