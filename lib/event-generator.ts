import { Event } from "@/lib/types";
import Parser from "rss-parser";

const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";
const ALPHA_VANTAGE_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || "";

// Geocode by scanning article text for known place names.
// Returns best match or a random plausible land coordinate as fallback.
//
// Two-tier lookup:
//  1. CITY_LOOKUP — specific, tightly-jittered coordinates for major
//     cities/regions, checked with priority so e.g. "New York" doesn't
//     collapse to the same USA-centroid pin as everything else.
//  2. GEO_LOOKUP — broader country-level fallback for stories that only
//     name a country, not a specific city.
// Matching is now SCORE-based (count keyword occurrences across the whole
// combined list and pick the highest-scoring entry) instead of "first array
// entry that matches wins". The old first-match approach caused wrong-country
// pins whenever a story mentioned multiple places — e.g. a Cuba story that
// also references "the US" (sanctions, embargo, etc.) would incorrectly pin
// to the US because the US entry happened to appear earlier in the array.
interface GeoEntry {
  names: string[];
  lat: number;
  lng: number;
  radius?: number; // jitter half-width in degrees; smaller = tighter pin
  weight?: number; // per-match score weight, default 1. Lower this for
  // ambiguous keywords (e.g. "U.S.", "Trump") that show up as commentary/
  // context in nearly every international story regardless of where the
  // actual event happened, so they don't out-score the real subject country.
}

const CITY_LOOKUP: GeoEntry[] = [
  // United States — split out so US stories don't all collapse onto one
  // country-centroid point (the main clustering complaint).
  { names: ["washington dc", "washington, d.c.", "the pentagon", "white house", "capitol hill"], lat: 38.9, lng: -77.0, radius: 0.4 },
  { names: ["new york", "manhattan", "nyc"], lat: 40.7, lng: -74.0, radius: 0.4 },
  { names: ["los angeles"], lat: 34.0, lng: -118.2, radius: 0.4 },
  { names: ["chicago"], lat: 41.9, lng: -87.6, radius: 0.4 },
  { names: ["miami", "florida"], lat: 26.1, lng: -80.4, radius: 0.6 },
  { names: ["texas", "houston", "dallas", "austin"], lat: 30.3, lng: -97.7, radius: 1.2 },
  { names: ["california", "san francisco", "silicon valley"], lat: 37.3, lng: -120.5, radius: 1.2 },
  { names: ["boston"], lat: 42.36, lng: -71.06, radius: 0.4 },
  { names: ["seattle"], lat: 47.6, lng: -122.3, radius: 0.4 },
  { names: ["atlanta"], lat: 33.75, lng: -84.39, radius: 0.4 },
  { names: ["denver"], lat: 39.74, lng: -104.99, radius: 0.4 },
  // Russia
  { names: ["moscow", "kremlin"], lat: 55.75, lng: 37.6, radius: 0.5 },
  { names: ["st petersburg", "st. petersburg"], lat: 59.93, lng: 30.34, radius: 0.5 },
  // Ukraine
  { names: ["kyiv", "kiev"], lat: 50.45, lng: 30.5, radius: 0.4 },
  { names: ["kharkiv"], lat: 49.99, lng: 36.23, radius: 0.4 },
  { names: ["odessa", "odesa"], lat: 46.48, lng: 30.72, radius: 0.4 },
  { names: ["zaporizhzhia"], lat: 47.85, lng: 35.14, radius: 0.4 },
  { names: ["mariupol"], lat: 47.1, lng: 37.5, radius: 0.4 },
  { names: ["bakhmut"], lat: 48.6, lng: 38.0, radius: 0.4 },
  { names: ["donetsk"], lat: 48.0, lng: 37.8, radius: 0.4 },
  { names: ["crimea"], lat: 45.3, lng: 34.4, radius: 0.6 },
  // Middle East
  { names: ["tel aviv"], lat: 32.08, lng: 34.78, radius: 0.3 },
  { names: ["jerusalem"], lat: 31.78, lng: 35.22, radius: 0.3 },
  { names: ["gaza"], lat: 31.5, lng: 34.47, radius: 0.3 },
  { names: ["west bank"], lat: 31.9, lng: 35.2, radius: 0.4 },
  { names: ["beirut"], lat: 33.89, lng: 35.5, radius: 0.3 },
  { names: ["damascus"], lat: 33.51, lng: 36.28, radius: 0.3 },
  { names: ["aleppo"], lat: 36.2, lng: 37.15, radius: 0.3 },
  { names: ["baghdad"], lat: 33.3, lng: 44.4, radius: 0.3 },
  { names: ["mosul"], lat: 36.34, lng: 43.13, radius: 0.3 },
  { names: ["tehran"], lat: 35.7, lng: 51.4, radius: 0.4 },
  { names: ["sanaa"], lat: 15.35, lng: 44.2, radius: 0.4 },
  { names: ["riyadh"], lat: 24.7, lng: 46.7, radius: 0.4 },
  { names: ["ankara"], lat: 39.93, lng: 32.86, radius: 0.4 },
  { names: ["istanbul"], lat: 41.0, lng: 28.98, radius: 0.4 },
  { names: ["cairo"], lat: 30.04, lng: 31.24, radius: 0.4 },
  { names: ["amman"], lat: 31.95, lng: 35.93, radius: 0.4 },
  { names: ["kabul"], lat: 34.56, lng: 69.2, radius: 0.4 },
  { names: ["islamabad", "karachi", "lahore"], lat: 31.5, lng: 71.0, radius: 1.0 },
  // Africa
  { names: ["khartoum", "darfur"], lat: 15.5, lng: 32.55, radius: 0.6 },
  { names: ["addis ababa", "tigray"], lat: 9.03, lng: 38.74, radius: 0.6 },
  { names: ["mogadishu"], lat: 2.04, lng: 45.34, radius: 0.4 },
  { names: ["lagos"], lat: 6.52, lng: 3.38, radius: 0.4 },
  { names: ["abuja"], lat: 9.08, lng: 7.49, radius: 0.4 },
  { names: ["bamako"], lat: 12.65, lng: -8.0, radius: 0.4 },
  { names: ["kinshasa"], lat: -4.44, lng: 15.27, radius: 0.4 },
  { names: ["nairobi"], lat: -1.29, lng: 36.82, radius: 0.4 },
  { names: ["tripoli", "benghazi"], lat: 30.5, lng: 17.0, radius: 1.0 },
  { names: ["johannesburg"], lat: -26.2, lng: 28.05, radius: 0.4 },
  { names: ["cape town"], lat: -33.9, lng: 18.4, radius: 0.4 },
  { names: ["maputo"], lat: -25.97, lng: 32.57, radius: 0.4 },
  { names: ["ouagadougou"], lat: 12.37, lng: -1.52, radius: 0.4 },
  // Asia Pacific
  { names: ["beijing"], lat: 39.9, lng: 116.4, radius: 0.4 },
  { names: ["shanghai"], lat: 31.2, lng: 121.47, radius: 0.4 },
  { names: ["pyongyang"], lat: 39.03, lng: 125.75, radius: 0.4 },
  { names: ["seoul"], lat: 37.57, lng: 126.98, radius: 0.4 },
  { names: ["taipei", "taiwan"], lat: 24.5, lng: 121.2, radius: 0.6 },
  { names: ["new delhi", "delhi"], lat: 28.6, lng: 77.2, radius: 0.4 },
  { names: ["mumbai"], lat: 19.08, lng: 72.88, radius: 0.4 },
  { names: ["yangon"], lat: 16.87, lng: 96.2, radius: 0.4 },
  { names: ["dhaka"], lat: 23.7, lng: 90.4, radius: 0.4 },
  { names: ["tokyo"], lat: 35.68, lng: 139.65, radius: 0.4 },
  { names: ["osaka"], lat: 34.69, lng: 135.5, radius: 0.4 },
  { names: ["jakarta"], lat: -6.2, lng: 106.85, radius: 0.4 },
  { names: ["manila"], lat: 14.6, lng: 120.98, radius: 0.4 },
  { names: ["bangkok"], lat: 13.76, lng: 100.5, radius: 0.4 },
  { names: ["hanoi"], lat: 21.03, lng: 105.85, radius: 0.4 },
  { names: ["ho chi minh"], lat: 10.78, lng: 106.7, radius: 0.4 },
  // Europe
  { names: ["paris"], lat: 48.86, lng: 2.35, radius: 0.4 },
  { names: ["berlin"], lat: 52.52, lng: 13.4, radius: 0.4 },
  { names: ["london"], lat: 51.51, lng: -0.13, radius: 0.4 },
  { names: ["warsaw"], lat: 52.23, lng: 21.0, radius: 0.4 },
  { names: ["budapest"], lat: 47.5, lng: 19.05, radius: 0.4 },
  { names: ["belgrade"], lat: 44.8, lng: 20.46, radius: 0.4 },
  { names: ["bucharest"], lat: 44.43, lng: 26.1, radius: 0.4 },
  { names: ["madrid"], lat: 40.42, lng: -3.7, radius: 0.4 },
  { names: ["barcelona"], lat: 41.39, lng: 2.17, radius: 0.4 },
  { names: ["rome"], lat: 41.9, lng: 12.5, radius: 0.4 },
  { names: ["milan"], lat: 45.46, lng: 9.19, radius: 0.4 },
  { names: ["athens"], lat: 37.98, lng: 23.73, radius: 0.4 },
  { names: ["stockholm"], lat: 59.33, lng: 18.07, radius: 0.4 },
  { names: ["helsinki"], lat: 60.17, lng: 24.94, radius: 0.4 },
  { names: ["minsk"], lat: 53.9, lng: 27.57, radius: 0.4 },
  // Americas
  { names: ["mexico city"], lat: 19.43, lng: -99.13, radius: 0.4 },
  { names: ["bogota"], lat: 4.71, lng: -74.07, radius: 0.4 },
  { names: ["caracas"], lat: 10.5, lng: -66.9, radius: 0.4 },
  { names: ["rio de janeiro", "rio"], lat: -22.9, lng: -43.2, radius: 0.4 },
  { names: ["brasilia"], lat: -15.8, lng: -47.9, radius: 0.4 },
  { names: ["port-au-prince"], lat: 18.54, lng: -72.34, radius: 0.4 },
  { names: ["havana"], lat: 23.13, lng: -82.38, radius: 0.4 },
  { names: ["quito"], lat: -0.18, lng: -78.47, radius: 0.4 },
  { names: ["lima"], lat: -12.05, lng: -77.04, radius: 0.4 },
  { names: ["santiago"], lat: -33.45, lng: -70.65, radius: 0.4 },
  { names: ["buenos aires"], lat: -34.6, lng: -58.38, radius: 0.4 },
  { names: ["ottawa"], lat: 45.42, lng: -75.7, radius: 0.4 },
  { names: ["toronto"], lat: 43.65, lng: -79.38, radius: 0.4 },
];

const GEO_LOOKUP: GeoEntry[] = [
  // Middle East
  { names: ["ukraine", "ukrainian"], lat: 49.0, lng: 31.5, radius: 2 },
  { names: ["russia", "russian"], lat: 61.0, lng: 60.0, radius: 2.5 },
  { names: ["israel", "hamas", "idf", "netanyahu", "israeli"], lat: 31.5, lng: 34.8, radius: 1 },
  { names: ["iran", "iranian", "irgc"], lat: 32.0, lng: 53.0, radius: 2 },
  { names: ["iraq", "iraqi", "erbil"], lat: 33.0, lng: 44.0, radius: 1.5 },
  { names: ["syria", "syrian"], lat: 34.8, lng: 38.9, radius: 1.5 },
  { names: ["lebanon", "hezbollah", "lebanese"], lat: 33.9, lng: 35.5, radius: 1 },
  { names: ["saudi arabia", "saudi"], lat: 24.0, lng: 45.0, radius: 2 },
  { names: ["yemen", "houthi", "yemeni"], lat: 15.5, lng: 48.0, radius: 1.5 },
  { names: ["turkey", "erdogan", "turkish"], lat: 39.0, lng: 35.0, radius: 2 },
  { names: ["egypt", "egyptian"], lat: 26.0, lng: 30.0, radius: 2 },
  { names: ["jordan", "jordanian"], lat: 31.0, lng: 36.0, radius: 1 },
  { names: ["afghanistan", "taliban", "afghan"], lat: 33.0, lng: 65.0, radius: 2 },
  { names: ["pakistan", "pakistani"], lat: 30.0, lng: 69.0, radius: 2 },
  // Africa
  { names: ["sudan", "sudanese"], lat: 15.0, lng: 30.0, radius: 2 },
  { names: ["ethiopia", "ethiopian"], lat: 9.0, lng: 40.5, radius: 2 },
  { names: ["somalia", "somali", "al-shabaab"], lat: 5.0, lng: 46.0, radius: 1.5 },
  { names: ["nigeria", "boko haram", "nigerian"], lat: 9.0, lng: 8.0, radius: 2 },
  { names: ["mali", "malian", "sahel"], lat: 17.0, lng: -4.0, radius: 2 },
  { names: ["congo", "drc", "m23"], lat: -4.0, lng: 24.0, radius: 2.5 },
  { names: ["kenya", "kenyan"], lat: -1.0, lng: 37.5, radius: 1.5 },
  { names: ["south africa"], lat: -29.0, lng: 25.0, radius: 2 },
  { names: ["libya", "libyan"], lat: 27.0, lng: 18.0, radius: 2 },
  { names: ["mozambique"], lat: -18.0, lng: 35.0, radius: 1.5 },
  { names: ["burkina faso"], lat: 12.0, lng: -1.5, radius: 1 },
  // Asia Pacific
  { names: ["china", "xi jinping", "chinese", "prc", "ccp"], lat: 35.0, lng: 105.0, radius: 3 },
  { names: ["north korea", "kim jong", "dprk", "icbm"], lat: 40.0, lng: 127.0, radius: 1.5 },
  { names: ["south korea", "korean"], lat: 37.0, lng: 127.5, radius: 1.5 },
  { names: ["india", "modi", "indian"], lat: 20.0, lng: 78.0, radius: 3 },
  { names: ["myanmar", "burma", "junta"], lat: 17.0, lng: 96.0, radius: 1.5 },
  { names: ["bangladesh"], lat: 23.7, lng: 90.4, radius: 1 },
  { names: ["japan", "japanese"], lat: 36.0, lng: 138.0, radius: 2 },
  { names: ["indonesia", "indonesian"], lat: -5.0, lng: 120.0, radius: 2.5 },
  { names: ["philippines", "philippine"], lat: 12.0, lng: 122.0, radius: 2 },
  { names: ["thailand", "thai"], lat: 15.0, lng: 101.0, radius: 1.5 },
  { names: ["vietnam", "vietnamese"], lat: 16.0, lng: 107.0, radius: 1.5 },
  // Europe
  { names: ["france", "french", "macron"], lat: 46.0, lng: 2.0, radius: 2 },
  { names: ["germany", "german", "bundeswehr"], lat: 51.0, lng: 10.0, radius: 2 },
  { names: ["uk", "united kingdom", "britain", "british", "sunak"], lat: 52.5, lng: -1.5, radius: 1.5 },
  { names: ["poland", "polish"], lat: 52.0, lng: 20.0, radius: 1.5 },
  { names: ["hungary", "orban"], lat: 47.0, lng: 19.0, radius: 1 },
  { names: ["serbia", "serbian"], lat: 44.0, lng: 21.0, radius: 1 },
  { names: ["romania"], lat: 45.9, lng: 24.9, radius: 1.5 },
  { names: ["spain", "spanish"], lat: 40.0, lng: -4.0, radius: 2 },
  { names: ["italy", "italian"], lat: 42.5, lng: 12.5, radius: 1.5 },
  { names: ["greece", "greek"], lat: 39.0, lng: 22.0, radius: 1 },
  { names: ["sweden", "swedish"], lat: 60.0, lng: 15.0, radius: 2 },
  { names: ["finland", "finnish"], lat: 64.0, lng: 26.0, radius: 2 },
  { names: ["belarus", "lukashenko"], lat: 53.7, lng: 27.9, radius: 1 },
  // Americas
  // Low weight: "U.S."/"Trump"/"Biden"/"America" appear constantly as the
  // reacting/allied power in stories about OTHER countries (e.g. "Iran
  // attacks U.S. base", "Trump, Netanyahu reaffirm..."), so a full-weight
  // match here was frequently out-scoring the actual subject country. When
  // this IS the winning entry (i.e. no other specific country/city beat it),
  // it means the story is a bare US-politics mention with no other place
  // named — pin it to Washington DC (the political center) instead of a
  // wide, diffuse country-centroid jitter.
  { names: ["united states", "u.s.", "america", "biden", "trump"], lat: 38.9, lng: -77.0, radius: 0.8, weight: 0.2 },
  { names: ["mexico", "cartel", "mexican"], lat: 23.0, lng: -102.0, radius: 2.5 },
  { names: ["colombia", "colombian", "farc"], lat: 4.0, lng: -72.0, radius: 2 },
  { names: ["venezuela", "maduro"], lat: 8.0, lng: -66.0, radius: 1.5 },
  { names: ["brazil", "lula", "brazilian"], lat: -10.0, lng: -55.0, radius: 3 },
  { names: ["haiti", "haitian"], lat: 19.0, lng: -72.0, radius: 0.6 },
  { names: ["cuba", "cuban"], lat: 22.0, lng: -79.0, radius: 1 },
  { names: ["ecuador"], lat: -2.0, lng: -77.5, radius: 1 },
  { names: ["peru"], lat: -10.0, lng: -75.0, radius: 1.5 },
  { names: ["chile"], lat: -35.0, lng: -71.0, radius: 2 },
  { names: ["argentina"], lat: -34.0, lng: -64.0, radius: 2.5 },
  { names: ["canada", "canadian"], lat: 56.0, lng: -96.0, radius: 4 },
];

// Cities first (higher specificity), then countries — order sets the
// tie-break when scores are equal (specific city beats generic country).
const COMBINED_GEO_LOOKUP: GeoEntry[] = [...CITY_LOOKUP, ...GEO_LOOKUP];

// Random land-biased fallback (Eurasia/Africa band)
const LAND_FALLBACKS = [
  { lat: 48.0, lng: 15.0 },  // Central Europe
  { lat: 30.0, lng: 35.0 },  // Middle East
  { lat: 15.0, lng: 20.0 },  // Sahel
  { lat: 28.0, lng: 77.0 },  // South Asia
  { lat: 35.0, lng: 105.0 }, // East Asia
  { lat: -5.0, lng: 25.0 },  // Central Africa
  { lat: 10.0, lng: -5.0 },  // West Africa
  { lat: 38.0, lng: -97.0 }, // USA
  { lat: -15.0, lng: -55.0 },// Brazil
  { lat: 55.0, lng: 37.0 },  // Russia/Moscow
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary keyword match — plain .includes() caused false positives
// from short/ambiguous keywords matching inside unrelated words, e.g.
// "ied" (counter_terrorism/IED) matching inside "lobbied", "riot" matching
// inside "Patriot" (missiles), "dead" matching inside "deadline". \b anchors
// require the keyword to stand as its own word/phrase.
function hasKeyword(text: string, keyword: string): boolean {
  const escaped = escapeRegExp(keyword);
  // Only add a boundary anchor on edges that are word characters — some
  // keywords intentionally end in punctuation (e.g. "analysis:"), and \b
  // doesn't behave usefully next to non-word characters.
  const startsWord = /^\w/.test(keyword);
  const endsWord = /\w$/.test(keyword);
  const pattern = `${startsWord ? "\\b" : ""}${escaped}${endsWord ? "\\b" : ""}`;
  return new RegExp(pattern, "i").test(text);
}

function geolocateFromText(text: string): { lat: number; lng: number } {
  const lower = text.toLowerCase();

  // Score every entry by how many times its keywords appear in the text,
  // and pick the highest-scoring entry — not just the first one that
  // matches. This fixes wrong-country pins on stories that mention
  // multiple places (e.g. a Cuba story that also references "the US"
  // sanctions no longer gets pinned to the US just because that entry
  // happened to appear earlier in the lookup array).
  let best: GeoEntry | null = null;
  let bestScore = 0;
  for (const entry of COMBINED_GEO_LOOKUP) {
    let score = 0;
    const weight = entry.weight ?? 1;
    for (const name of entry.names) {
      const matches = lower.match(new RegExp(escapeRegExp(name), "g"));
      if (matches) score += matches.length * weight;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Special case: Russia-Ukraine war coverage. Stories naming both
  // countries (very common — "Russian strikes on Ukraine", "Ukraine
  // repels Russian assault") should land in Ukraine near the front
  // line/border with Russia, not at Russia's own country-centroid (deep
  // in the Urals) and not at Ukraine's general centroid (which skews
  // west, away from the actual front line). Only applies when no more
  // specific city already won (e.g. "Kharkiv"/"Kyiv" still take priority).
  const mentionsUkraine = /ukrain/.test(lower);
  const mentionsRussia = /russia/.test(lower);
  const bestIsCountryLevel = !best || GEO_LOOKUP.includes(best);
  if (mentionsUkraine && mentionsRussia && bestIsCountryLevel) {
    const radius = 1.2;
    return {
      lat: 48.5 + (Math.random() - 0.5) * radius, // eastern Ukraine, near the Russian border/front line
      lng: 37.0 + (Math.random() - 0.5) * radius,
    };
  }

  if (best) {
    const radius = best.radius ?? 1;
    return {
      lat: best.lat + (Math.random() - 0.5) * radius,
      lng: best.lng + (Math.random() - 0.5) * radius,
    };
  }
  // No match — pick a random land fallback instead of open ocean
  const fb = LAND_FALLBACKS[Math.floor(Math.random() * LAND_FALLBACKS.length)];
  return { lat: fb.lat + (Math.random() - 0.5) * 4, lng: fb.lng + (Math.random() - 0.5) * 4 };
}

// Fetch events from all real APIs with timeout
export async function generateMockEvents(): Promise<Event[]> {
  const events: Event[] = [];
  let eventId = 1;

  try {
    // Fetch from real APIs in parallel with 5 second timeout each
    const results = await Promise.allSettled([
      fetchNewsAPIEvents(),
      fetchRSSEvents(),
      fetchAlphaVantageEvents(),
      fetchUSGSEvents(),
      fetchGDELTEvents(),
      fetchACLEDEvents(),
      fetchCoinGeckoEvents(),
      fetchEMSCEvents(),
      fetchTelegramEvents(),
    ]);

    const allEvents = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .flatMap(r => (r as any).value || []);

    for (const rawEvent of allEvents) {
      const category = rawEvent.category as keyof typeof knownKnownsMap;
      const event: Event = {
        id: `evt-${String(eventId++).padStart(4, "0")}`,
        title: rawEvent.title,
        description: rawEvent.description,
        category: rawEvent.category,
        location: rawEvent.location,
        source: rawEvent.source,
        url: rawEvent.url,
        timestamp: rawEvent.timestamp,
        aiNotes: knownKnownsMap[category]?.[Math.floor(Math.random() * knownKnownsMap[category].length)] || "Event under analysis",
        confidence: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
      };
      events.push(event);
    }
  } catch (error) {
    console.error("Error fetching events:", error);
  }

  return events.length > 0 ? events : getFallbackEvents();
}

// Fallback events if APIs fail
function getFallbackEvents(): Event[] {
  return [
    {
      id: "evt-0001",
      title: "Global Intelligence Dashboard - Live",
      description: "Real-time events from NewsAPI, RSS feeds, Alpha Vantage, USGS, GDELT, ACLED, CoinGecko, and EMSC",
      category: "war",
      location: { lat: 35, lng: 0 },
      source: "Dashboard",
      timestamp: new Date().toISOString(),
      aiNotes: "Waiting for live API data...",
      confidence: "pending",
    },
  ];
}

// Shared text-classification helpers used by both NewsAPI and RSS ingestion
const NEWS_EXCLUDE_KEYWORDS = [
  "opinion", "editorial", "analysis:", "commentary", "column:", "review",
  "how to", "tips for", "best of", "ranked:", "why you", "what you need",
  "smithsonian", "museum", "anime", "crunchyroll", "movie", "film", "box office",
  "actor", "actress", "celebrity", "oscars", "grammy", "grammys", "emmy", "emmys",
  "concert", "music chart", "album", "billboard chart", "spotify", "tour dates",
  "red carpet", "premiere", "biopic", "kardashian", "influencer", "tiktok star",
  "sports", "video game", "riot games", "esports", "nfl", "nba", "mlb", "nhl",
  "fifa", "premier league", "champions league", "world cup final",
  "entertainment", "streaming", "sequel", "tv show", "reality show",
  "dancing with the stars", "the bachelor", "season finale", "season premiere",
  "recipe", "fashion", "beauty", "horoscope", "crossword", "royal wedding",
];

const NEWS_BREAKING_SIGNALS = [
  "killed", "dead", "attack", "airstrike", "missile", "bomb", "explosion",
  "troops", "invasion", "seized", "arrest", "detained", "sanction", "strike",
  "outbreak", "virus", "pandemic", "epidemic", "contamination",
  "cyberattack", "hack", "breach", "ransomware",
  "nuclear", "radiation", "warhead", "reactor",
  "protest", "riot", "coup", "unrest", "demonstration",
  "refugee", "displaced", "famine", "humanitarian crisis",
  "pipeline", "blackout", "power grid", "energy crisis",
  "breaking", "urgent", "developing", "update:", "latest:",
  "fires on", "clashes", "offensive", "ceasefire", "escalat",
  "militant", "insurgent", "insurgency", "extremist", "terrorist", "jihadist",
  "junta", "martial law", "election fraud", "resigns amid",
  "earthquake", "tsunami", "wildfire", "hurricane", "typhoon", "flood",
  "landslide", "volcano", "eruption", "tornado", "cyclone", "avalanche",
];

function isBreakingNews(title: string, desc: string) {
  const text = (title + " " + desc).toLowerCase();
  if (NEWS_EXCLUDE_KEYWORDS.some(kw => hasKeyword(text, kw))) return false;
  return NEWS_BREAKING_SIGNALS.some(kw => hasKeyword(text, kw));
}

function categorizeNewsText(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (["outbreak", "pandemic", "disease", "virus", "pathogen", "bioterror", "epidemic", "plague", "infection", "contamination"].some(kw => hasKeyword(text, kw)))
    return "biological";
  // Natural disasters — checked early since these are unambiguous and
  // otherwise fall through to the generic "war" default (e.g. an
  // earthquake headline mentioning "seized" or "strike" for something
  // unrelated would still get miscategorized without this check).
  if ([
    "earthquake", "quake", "tsunami", "wildfire", "hurricane", "typhoon",
    "flood", "landslide", "mudslide", "volcano", "eruption", "tornado",
    "cyclone", "drought", "avalanche", "aftershock", "seismic",
  ].some(kw => hasKeyword(text, kw)))
    return "natural_disaster";
  // Terror/insurgent-group activity — check before the generic "war" bucket
  // so militant/terror-group violence isn't mislabeled as conventional war.
  if ([
    "terror", "isis", "isis-k", "al-qaeda", "al-shabaab", "boko haram",
    "bombing", "suicide bomb", "car bomb", "ied", "jihad", "jihadist",
    "extremist", "radicalization", "militant", "insurgent", "insurgency",
    "hostage", "hijack",
  ].some(kw => hasKeyword(text, kw)))
    return "counter_terrorism";
  // Civil/political instability — protests, coups, election crises, regime
  // change — distinct from armed conflict between states/organized forces.
  if ([
    "protest", "coup", "uprising", "riot", "civil unrest", "unrest",
    "election fraud", "demonstration", "political crisis", "impeach",
    "overthrow", "junta", "martial law", "no-confidence vote", "resigns amid",
    "opposition crackdown", "regime", "ballot", "disputed election",
    "government collapse", "parliament dissolved", "mass resignation",
  ].some(kw => hasKeyword(text, kw)))
    return "political_unrest";
  if (["cyberattack", "ransomware", "hacking", "data breach", "malware", "phishing", "cyber", "infrastructure attack"].some(kw => hasKeyword(text, kw)))
    return "cyber";
  if (["nuclear", "radiation", "iaea", "proliferation", "uranium", "warhead", "reactor accident", "dirty bomb"].some(kw => hasKeyword(text, kw)))
    return "nuclear";
  if (["energy crisis", "pipeline", "oil sanction", "gas supply", "energy security", "blackout", "power grid"].some(kw => hasKeyword(text, kw)))
    return "energy";
  if (["refugee", "famine", "humanitarian", "displaced", "aid worker", "starvation", "food crisis", "human rights"].some(kw => hasKeyword(text, kw)))
    return "humanitarian";
  return "war";
}

// NewsAPI - breaking news for live geopolitical/threat events
async function fetchNewsAPIEvents() {
  if (!NEWS_API_KEY) return [];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // top-headlines with category=general gives breaking news, not editorials
    // We fetch two passes: world headlines + specific threat keywords
    const [headlinesRes, everythingRes] = await Promise.all([
      fetch(
        `https://newsapi.org/v2/top-headlines?category=general&language=en&pageSize=50&apiKey=${NEWS_API_KEY}`,
        { signal: controller.signal, next: { revalidate: 14400 } } // 4h — NewsAPI free tier caps at 100 req/24h across all call sites
      ),
      fetch(
        `https://newsapi.org/v2/everything?q=attack+OR+airstrike+OR+missile+OR+shooting+OR+explosion+OR+troops+OR+outbreak+OR+cyberattack+OR+nuclear+OR+coup+OR+arrested+OR+sanctions&sortBy=publishedAt&language=en&pageSize=50&apiKey=${NEWS_API_KEY}`,
        { signal: controller.signal, next: { revalidate: 14400 } }
      ),
    ]);
    clearTimeout(timeout);

    const [h, e] = await Promise.all([headlinesRes.json(), everythingRes.json()]);
    const combined: any[] = [...(h.articles || []), ...(e.articles || [])];

    // Deduplicate by title
    const seen = new Set<string>();
    const unique = combined.filter(a => {
      const key = a.title?.slice(0, 60);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const categoryCounts: Record<string, number> = {};

    return unique
      .filter((article: any) => isBreakingNews(article.title || "", article.description || ""))
      .reduce((acc: any[], article: any) => {
        const category = categorizeNewsText(article.title, article.description || "");
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        if (categoryCounts[category] > 5) return acc; // max 5 per category
        acc.push({
          title: article.title,
          description: article.description || "Breaking news",
          location: geolocateFromText(article.title + " " + (article.description || "") + " " + (article.source?.name || "")),
          source: `NewsAPI / ${article.source?.name || "Unknown"}`,
          url: article.url,
          category,
          timestamp: new Date(article.publishedAt).toISOString(),
        });
        return acc;
      }, []);
  } catch (e) {
    console.error("NewsAPI error:", e);
    return [];
  }
}

// RSS feeds — free, no API key, no rate-limit quota. Pulls straight from
// major outlets' public world/breaking-news feeds and runs them through the
// same breaking-news filter + categorizer used for NewsAPI, so this scales up
// event volume without touching any metered API budget.
export const RSS_FEEDS: { name: string; url: string }[] = [
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "The Guardian World", url: "https://www.theguardian.com/world/rss" },
  { name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { name: "DW World", url: "https://rss.dw.com/rdf/rss-en-world" },
  { name: "Sky News World", url: "https://feeds.skynews.com/feeds/rss/world.xml" },
  { name: "France24 World", url: "https://www.france24.com/en/rss" },
  { name: "UN News", url: "https://news.un.org/feed/subscribe/en/news/all/rss.xml" },
];

// Opinion/editorial/analysis feeds — kept separate from the hard-news list
// above because these are explicitly commentary, not breaking events, and
// should never feed the map's event-classification pipeline. Used only by
// the Live News side panel (app/api/news/route.ts) which is unfiltered.
export const OPINION_RSS_FEEDS: { name: string; url: string }[] = [
  { name: "The Guardian Opinion", url: "https://www.theguardian.com/commentisfree/rss" },
  { name: "NYT Opinion", url: "https://rss.nytimes.com/services/xml/rss/nyt/Opinion.xml" },
];

// Think tank / policy research feeds — the sole source for the "Global
// Analysis" side panel (replaces the old general-news feed there). All
// verified to serve valid RSS/Atom directly (no API key, no paywall). Kept
// separate from RSS_FEEDS since these are long-form policy analysis, not
// breaking-news wire content, and shouldn't feed the map's event pipeline.
export const THINK_TANK_FEEDS: { name: string; url: string }[] = [
  { name: "RAND Corporation", url: "https://www.rand.org/blog.xml" },
  { name: "CSIS", url: "https://www.csis.org/rss.xml" },
  { name: "Brookings", url: "https://www.brookings.edu/feed/" },
  { name: "Atlantic Council", url: "https://www.atlanticcouncil.org/feed/" },
  { name: "Carnegie Endowment", url: "https://carnegieendowment.org/rss/analysis" },
  { name: "Crisis Group", url: "https://www.crisisgroup.org/rss.xml" },
  { name: "Stratfor", url: "https://www.stratfor.com/rss.xml" },
  { name: "AEI", url: "https://www.aei.org/feed/" },
];

let rssParser: Parser | null = null;
export function getRssParser() {
  if (!rssParser) {
    rssParser = new Parser({ timeout: 6000 });
  }
  return rssParser;
}

// Module-level in-memory cache (survives across requests within the same
// serverless/lambda instance) so RSS feeds aren't re-fetched on every event
// request — same caching philosophy applied to the metered APIs earlier.
let rssCache: { data: any[]; ts: number } | null = null;
const RSS_CACHE_MS = 10 * 60 * 1000; // 10 minutes

async function fetchRSSEvents() {
  const now = Date.now();
  if (rssCache && now - rssCache.ts < RSS_CACHE_MS) {
    return rssCache.data;
  }

  const parser = getRssParser();
  const categoryCounts: Record<string, number> = {};
  const seen = new Set<string>();
  const out: any[] = [];

  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return { feed, items: parsed.items || [] };
    })
  );

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    const { feed, items } = r.value;
    for (const item of items) {
      const title = (item.title || "").trim();
      const description = (item.contentSnippet || item.content || item.summary || "").trim();
      if (!title) continue;

      const key = title.slice(0, 60);
      if (seen.has(key)) continue;

      if (!isBreakingNews(title, description)) continue;

      const category = categorizeNewsText(title, description);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      if (categoryCounts[category] > 8) continue; // cap per category across all RSS feeds combined

      seen.add(key);
      out.push({
        title,
        description: description ? description.slice(0, 240) : "Breaking news",
        location: geolocateFromText(title + " " + description + " " + feed.name),
        source: `RSS / ${feed.name}`,
        url: item.link || feed.url,
        category,
        timestamp: item.isoDate ? new Date(item.isoDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  rssCache = { data: out, ts: now };
  return out;
}

// Alpha Vantage - market events (with timeout)
// Tracks a small basket across asset classes (equities/gold/oil) instead of
// just AAPL — a single static tech-stock check made "market" events feel
// stuck/repetitive. Gold and oil moves in particular are meaningful
// geopolitical-stress signals (flight-to-safety, energy-security shocks),
// so pairing them with real hub locations gives more useful map coverage.
const ALPHA_VANTAGE_SYMBOLS: { symbol: string; label: string; lat: number; lng: number }[] = [
  { symbol: "SPY", label: "Broad market (S&P 500)", lat: 40.7069, lng: -74.0113 }, // NYSE, Wall St
  { symbol: "GLD", label: "Gold (safe-haven demand)", lat: 51.5138, lng: -0.0985 }, // London bullion market
  { symbol: "USO", label: "Crude oil (energy security)", lat: 29.7604, lng: -95.3698 }, // Houston energy hub
];

async function fetchAlphaVantageEvents() {
  if (!ALPHA_VANTAGE_KEY) return [];

  const results = await Promise.allSettled(
    ALPHA_VANTAGE_SYMBOLS.map(async ({ symbol, label, lat, lng }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`,
          { signal: controller.signal, next: { revalidate: 21600 } } // 6h — Alpha Vantage free tier caps at 25 req/day
        );
        clearTimeout(timeout);
        const data = await res.json();

        if (data["Global Quote"]?.["05. price"]) {
          const quote = data["Global Quote"];
          const change = parseFloat(quote["09. change"] || "0");
          const changePercent = quote["10. change percent"] || "0%";
          return {
            title: `Market Signal: ${label} — ${change > 0 ? "Bullish" : "Bearish"} pressure`,
            description: `${symbol} at $${quote["05. price"]}, change: ${change} (${changePercent})`,
            location: { lat, lng },
            source: "Alpha Vantage",
            url: "https://www.alphavantage.co/", // raw API endpoint needs an apikey param to load; link to the human-readable site instead
            category: "market",
            timestamp: new Date().toISOString(),
          };
        }
        return null;
      } catch (e) {
        clearTimeout(timeout);
        console.error(`Alpha Vantage error (${symbol}):`, e);
        return null;
      }
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

// USGS Earthquakes - free, no key
async function fetchUSGSEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 6).map((feature: any) => {
      const mag = feature.properties.mag;
      return {
        title: `Seismic Alert: Magnitude ${mag} earthquake`,
        description: feature.properties.title || "Seismic activity detected",
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "USGS",
        url: feature.properties.url || "https://earthquake.usgs.gov",
        category: "natural_disaster",
        timestamp: new Date(feature.properties.time).toISOString(),
      };
    });
  } catch (e) {
    console.error("USGS error:", e);
    return [];
  }
}

// GDELT - geopolitical events (free, 15min delay)
async function fetchGDELTEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.gdeltproject.org/api/v2/search?query=conflict&mode=artlist&maxrecords=6&format=json",
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.articles || []).slice(0, 6).map((article: any) => ({
      title: article.title,
      description: article.snippet || "Geopolitical event detected",
      location: geolocateFromText(article.title + " " + (article.snippet || "")),
      source: "GDELT",
      url: article.url,
      category: "war",
      timestamp: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("GDELT error:", e);
    return [];
  }
}

// ACLED - Armed Conflict Location & Event Data (free, no key needed)
async function fetchACLEDEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.acleddata.com/api/explore/1.0/csv/read/?",
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    const text = await res.text();
    const lines = text.split('\n').slice(1, 4); // Get first 3 rows
    
    return lines
      .filter(line => line.trim())
      .map((line: string) => {
        const parts = line.split(',');
        const lat = parseFloat(parts[11]);
        const lng = parseFloat(parts[12]);
        const title = `ACLED Alert: ${parts[5]?.trim() || "Conflict event"}`;
        const desc = `Event type: ${parts[6]?.trim() || "Unknown"} - ${parts[9]?.trim() || ""}`;
        // Use parsed coords only when they look valid (not 0,0 null island)
        const location =
          !isNaN(lat) && !isNaN(lng) && (Math.abs(lat) > 0.5 || Math.abs(lng) > 0.5)
            ? { lat, lng }
            : geolocateFromText(title + " " + desc);
        return {
          title,
          description: desc,
          location,
          source: "ACLED",
          url: "https://acleddata.com/data-export-tool",
          category: parts[5]?.includes("Violence") || parts[5]?.includes("Battle") ? "war" :
                   parts[5]?.includes("Protest") ? "counter_terrorism" : "war",
          timestamp: new Date().toISOString(),
        };
      });
  } catch (e) {
    console.error("ACLED error:", e);
    return [];
  }
}

// CoinGecko - Crypto market volatility (free, no key)
async function fetchCoinGeckoEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://api.coingecko.com/api/v3/global",
      { signal: controller.signal, next: { revalidate: 900 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    const btcChange = data.data?.btc_market_cap_change_percentage_24h || 0;
    
    return [{
      title: `Crypto Signal: Bitcoin ${btcChange > 0 ? "📈" : "📉"} ${Math.abs(btcChange).toFixed(1)}% (24h)`,
      description: `Global crypto market volatility signal. Total market cap: $${(data.data?.total_market_cap?.usd / 1e9).toFixed(2)}B`,
      location: { lat: 51.5074, lng: -0.1278 }, // London - crypto hub
      source: "CoinGecko",
      url: "https://www.coingecko.com/en/global-charts",
      category: "market",
      timestamp: new Date().toISOString(),
    }];
  } catch (e) {
    console.error("CoinGecko error:", e);
    return [];
  }
}

// EMSC - European Mediterranean Seismic Centre (free, no key)
async function fetchEMSCEvents() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(
      "https://www.emsc-csem.org/api/test/latest?limit=6&start_year=2023",
      { signal: controller.signal, next: { revalidate: 900 } }
    );
    clearTimeout(timeout);
    
    const data = await res.json();
    
    return (data.features || []).slice(0, 6).map((feature: any) => {
      const mag = feature.properties.magnitude;
      return {
        title: `EMSC Alert: Magnitude ${mag} - ${feature.properties.eventLocationName || "European Mediterranean"}`,
        description: `Depth: ${feature.geometry.coordinates[2]}km - EMSC high-precision data`,
        location: { lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] },
        source: "EMSC",
        url: feature.properties.source_id
          ? `https://www.emsc-csem.org/Earthquake/earthquake.php?id=${feature.properties.source_id}`
          : "https://www.emsc-csem.org",
        category: "natural_disaster",
        timestamp: new Date(feature.properties.origin_time).toISOString(),
      };
    });
  } catch (e) {
    console.error("EMSC error:", e);
    return [];
  }
}

// Telegram — scrape well-known public OSINT / war-monitor channels via
// Telegram's public "instant view" preview pages (https://t.me/s/<channel>).
// These pages are served without login/API keys and are what most
// third-party OSINT trackers scrape for exactly this purpose. Only public
// channels work this way (no private/invite-only channels).
//
// NOTE: handles below are our best-known picks for large OSINT/war-monitor
// channels — edit this list freely if a handle changes or you want to swap
// in different channels.
export const TELEGRAM_CHANNELS: { name: string; handle: string }[] = [
  { name: "Clash Report", handle: "clashreport" },
  { name: "WarTranslated", handle: "wartranslated" },
  { name: "UA War Infographics", handle: "UAWarInfographics" },
  { name: "OSINTtechnical", handle: "OSINTtechnical" },
  { name: "OSINTdefender", handle: "OSINTdefender" },
];

let telegramCache: { data: any[]; ts: number } | null = null;
const TELEGRAM_CACHE_MS = 10 * 60 * 1000; // 10 minutes

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Cyrillic / Arabic / Hebrew / CJK / Hangul — if a post is mostly one of
// these scripts it's not English, so translate it before it hits the feed.
const NON_LATIN_RE = /[\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/;

// Free, unofficial Google Translate endpoint (no API key) — same one used
// by many lightweight translation widgets. Best-effort: on any failure we
// just fall back to the original text rather than dropping the post.
async function translateToEnglish(text: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = (data?.[0] || []).map((segment: any) => segment[0]).join("");
    return translated || text;
  } catch {
    return text;
  }
}

async function fetchTelegramChannel(channel: { name: string; handle: string }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://t.me/s/${channel.handle}`, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SVA-Signal-Dashboard/1.0)" },
      next: { revalidate: 600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();

    // Each message block looks like:
    //   <div class="tgme_widget_message ..." data-post="handle/12345" ...>
    //     ...<div class="tgme_widget_message_text ...">TEXT</div>...
    //     ...<time datetime="2024-01-01T12:00:00+00:00">...
    const messageRe =
      /data-post="([^"]+)"[\s\S]*?<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<time datetime="([^"]+)"/g;

    const raw: { postId: string; text: string; datetime: string }[] = [];
    let match: RegExpExecArray | null;
    while ((match = messageRe.exec(html)) !== null) {
      const [, postId, rawText, datetime] = match;
      const text = decodeHtmlEntities(rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      if (!text || text.length < 20) continue; // skip media-only / empty posts
      raw.push({ postId, text, datetime });
    }
    // Most recent posts first, cap per channel so one prolific channel
    // doesn't drown out the others — cap BEFORE translating to limit
    // outbound translation calls.
    const capped = raw.slice(-6);

    const translated = await Promise.all(
      capped.map(async (m) => (NON_LATIN_RE.test(m.text) ? await translateToEnglish(m.text) : m.text))
    );

    return capped.map((m, i) => {
      const text = translated[i];
      return {
        title: `${channel.name}: ${text.slice(0, 100)}`,
        description: text,
        location: geolocateFromText(text),
        source: `Telegram / ${channel.name}`,
        url: `https://t.me/${m.postId}`,
        category: categorizeNewsText(text, ""),
        timestamp: new Date(m.datetime).toISOString(),
      };
    });
  } catch (e) {
    console.error(`Telegram scrape error (${channel.handle}):`, e);
    return [];
  }
}

async function fetchTelegramEvents() {
  const now = Date.now();
  if (telegramCache && now - telegramCache.ts < TELEGRAM_CACHE_MS) {
    return telegramCache.data;
  }

  const results = await Promise.allSettled(TELEGRAM_CHANNELS.map(fetchTelegramChannel));
  const out = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);

  telegramCache = { data: out, ts: now };
  return out;
}

const knownKnownsMap: Record<string, string[]> = {
  war: [
    "Established military deployment pattern",
    "Historical precedent for similar activity",
    "Confirmed unit movements in region",
  ],
  counter_terrorism: [
    "Organization fingerprints detected",
    "Tactical method consistent with group profile",
    "Known supporter networks activated",
  ],
  natural_disaster: [
    "Geological patterns align with historical data",
    "Seismic zone activity detected",
    "Weather model predictions confirmed",
  ],
  market: [
    "Policy signals align with economic theory",
    "Sector rotation follows historical patterns",
    "Technical indicators confirm trend shift",
  ],
  biological: [
    "Pathogen transmission vectors identified",
    "Epidemiological modeling underway",
    "WHO surveillance activated",
  ],
  political_unrest: [
    "Opposition coordination networks active",
    "Historical precedent for regime change",
    "Security forces on elevated alert",
  ],
  cyber: [
    "Attack signature matches known APT group",
    "Infrastructure vulnerability confirmed",
    "Lateral movement indicators detected",
  ],
  nuclear: [
    "Enrichment activity above threshold",
    "IAEA monitoring protocols activated",
    "Delivery system capability assessment underway",
  ],
  energy: [
    "Supply disruption cascading through markets",
    "Strategic reserve drawdown initiated",
    "Geopolitical leverage play confirmed",
  ],
  humanitarian: [
    "IDP movement patterns tracked",
    "Aid corridor access compromised",
    "International response coordination active",
  ],
};

export function filterByProfile(events: Event[], profile: string): Event[] {
  const profileCategoryMap: Record<string, string[]> = {
    osint: ["war", "counter_terrorism", "natural_disaster", "biological", "political_unrest", "cyber", "humanitarian"],
    finance: ["market", "natural_disaster", "energy", "cyber"],
    military: ["war", "counter_terrorism", "natural_disaster", "biological", "cyber", "nuclear", "energy"],
  };

  const allowedCategories = profileCategoryMap[profile] || profileCategoryMap.osint;
  return events.filter((event) => allowedCategories.includes(event.category));
}

export function filterByCategory(events: Event[], category: string): Event[] {
  return events.filter((event) => event.category === category);
}
