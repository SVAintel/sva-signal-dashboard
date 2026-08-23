import { COUNTRY_DETAILS } from "@/lib/data/country-details";
import {
  getRecentEvents,
  setCountryStalenessFlag,
  clearCountryStalenessFlag,
  pruneOldCountryStalenessFlags,
} from "@/lib/db";
import { eventsForRegion } from "@/lib/region-match";

// Periodically cross-checks each curated country-details.ts profile against
// the live signal feed to catch exactly the class of bug hit twice already
// (Iran's war status, then Venezuela's Maduro capture): a static profile
// asserting a status quo that a live-tracked signal shows has changed —
// leadership captured/killed/replaced, a war starting/ending, a government
// collapsing, a major territorial change, etc. This does NOT edit
// country-details.ts itself (that's source code, not writable at runtime,
// and factual edits should still get a human/AI review pass before ship) —
// it only flags candidates for someone (or a future automated PR flow) to
// review and update, the same way the Venezuela fix was made.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const LIVE_SIGNAL_WINDOW_DAYS = 14;
const MAX_SIGNALS_PER_COUNTRY = 8;
const MAX_CANDIDATE_COUNTRIES = 40; // bound prompt size/cost per run
const FLAG_RETENTION_DAYS = 30;

interface StalenessResult {
  country: string;
  stale: boolean;
  issue: string;
}

export interface CountryStalenessCheckSummary {
  candidatesChecked: number;
  flagged: string[];
  cleared: string[];
}

export async function runCountryStalenessCheck(): Promise<CountryStalenessCheckSummary> {
  const summary: CountryStalenessCheckSummary = { candidatesChecked: 0, flagged: [], cleared: [] };

  if (!GEMINI_API_KEY) {
    console.error("[country-staleness] GEMINI_API_KEY not configured, skipping check");
    return summary;
  }

  await pruneOldCountryStalenessFlags(FLAG_RETENTION_DAYS);

  const recentEvents = await getRecentEvents(LIVE_SIGNAL_WINDOW_DAYS);
  if (recentEvents.length === 0) return summary;

  // Only spend a Gemini call on countries that actually have recent live
  // signal activity — most curated countries won't on any given day, since
  // this dashboard only tracks newsworthy geopolitical/military events.
  const candidates: { name: string; signals: string[] }[] = [];
  for (const name of Object.keys(COUNTRY_DETAILS)) {
    const matched = eventsForRegion(recentEvents, name);
    if (matched.length === 0) continue;
    candidates.push({
      name,
      signals: matched.slice(0, MAX_SIGNALS_PER_COUNTRY).map((e) => `${e.title} (${e.source}, ${e.firstSeenAt})`),
    });
  }

  if (candidates.length === 0) return summary;

  const capped = candidates.slice(0, MAX_CANDIDATE_COUNTRIES);
  summary.candidatesChecked = capped.length;

  const context = capped
    .map(({ name, signals }) => {
      const detail = COUNTRY_DETAILS[name];
      return (
        `Country: ${name}\n` +
        `Curated ruling parties/government: ${detail.rulingParties}\n` +
        `Curated summary: ${detail.summary}\n` +
        `Recent live signals (last ${LIVE_SIGNAL_WINDOW_DAYS} days):\n${signals.map((s) => `- ${s}`).join("\n")}`
      );
    })
    .join("\n\n");

  const prompt =
    `You are an intelligence QA analyst reviewing curated country profiles for staleness against recent news ` +
    `signals. For EACH country below, decide whether any of its recent live signals indicate the curated profile ` +
    `is now factually WRONG on a MAJOR point — specifically: a change of head of state/government (death, ` +
    `capture, resignation, coup, decisive election result), the start or end of a war/major armed conflict, a ` +
    `ceasefire, the collapse or overthrow of the government, or a major territorial/regime change. Do NOT flag ` +
    `routine political news, economic fluctuations, minor skirmishes, protests, or anything that doesn't directly ` +
    `contradict the curated profile's core claims. Err on the side of NOT flagging unless a signal clearly and ` +
    `specifically contradicts the profile.\n\n` +
    `Countries:\n\n${context}\n\n` +
    `Respond with ONLY a JSON array, no markdown fences, no commentary, in this exact shape: ` +
    `[{"country": "<name>", "stale": true|false, "issue": "<if stale, a 1-2 sentence description of exactly what ` +
    `changed and why the curated profile is now wrong; empty string if not stale>"}, ...] — one entry per ` +
    `country, in the same order given, using the exact country name provided.`;

  let results: StalenessResult[];
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
      console.error("[country-staleness] Gemini request failed:", data?.error?.message);
      return summary;
    }
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("[country-staleness] Gemini response had no JSON array");
      return summary;
    }
    results = JSON.parse(jsonMatch[0]) as StalenessResult[];
  } catch (error) {
    console.error("[country-staleness] check failed:", error);
    return summary;
  }

  for (const result of results) {
    const candidate = capped.find((c) => c.name === result.country);
    if (!candidate) continue;

    if (result.stale && result.issue) {
      await setCountryStalenessFlag(result.country, result.issue, candidate.signals.join("; "));
      summary.flagged.push(result.country);
    } else {
      // Not stale (or no longer stale after a curated-data fix) — clear any
      // previously-set flag for this country. No-op if none exists.
      await clearCountryStalenessFlag(result.country);
      summary.cleared.push(result.country);
    }
  }

  return summary;
}
