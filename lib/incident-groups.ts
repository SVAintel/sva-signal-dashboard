import type { Event } from "./types";
import { signalId } from "./signal-identity";
import { validReportTime } from "./report-context";

export interface IncidentGroup {
  id: string;
  reports: Event[];
  latest: Event;
  reason: string | null;
}
const REGIONS = "AF AL DZ AO AR AM AU AT AZ BH BD BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CA CV CF TD CL CN CO KM CG CD CR HR CU CY CZ DK DJ DO EC EG SV GQ ER EE ET FJ FI FR GA GM GE DE GH GR GT GN GW GY HT HN HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KP KR KW KG LA LV LB LS LR LY LT LU MG MW MY MV ML MT MR MU MX MD MN ME MA MZ MM NA NP NL NZ NI NE NG MK NO OM PK PA PG PY PE PH PL PT QA RO RU RW SA SN RS SL SG SK SI SO ZA SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TN TR TM UG UA AE GB US UY UZ VE VN YE ZM ZW".split(" ");
const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const regionNames = REGIONS.map(code => displayNames.of(code)).filter((name): name is string => !!name);
const namedPlaces = [...regionNames, "Gaza", "West Bank", "Hong Kong", "Haiti", "United States", "United Kingdom", "South Korea", "North Korea", "Turkey"];
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const places = namedPlaces.map(name => ({ name, pattern: new RegExp(`\\b${escaped(name)}\\b`, "i") }));
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

function anchor(event: Event): { key: string; reason: string } | null {
  if (!validReportTime(event)) return null;
  const headline = event.title;
  const text = `${headline} ${event.description.slice(0, 500)}`;
  if (/\b(?:anniversary|years? ago|last year|historical|fictional|movie|film|video game)\b/i.test(headline)) return null;
  const locations = Array.from(new Set(places.filter(place => place.pattern.test(text)).map(place => place.name))).sort();
  const date = Date.parse(event.timestamp);
  const earthquake = /\b(us[0-9a-z]{8,12})\b/i.exec(`${text} ${event.url || ""}`);
  if (earthquake && /\d/.test(earthquake[1]) && /\bUSGS\b/i.test(`${text} ${event.source} ${event.url || ""}`) && /\b(?:earthquake|quake|magnitude)\b/i.test(text)) {
    return { key: `usgs|${earthquake[1].toLowerCase()}`, reason: `Same explicit USGS event identifier: ${earthquake[1]}` };
  }
  if (!locations.length) return null;
  const storms = Array.from(`${headline} ${event.description.slice(0, 180)}`.matchAll(/\b(?:[Tt]yphoon|[Hh]urricane|[Cc]yclone|[Tt]ropical [Ss]torm)\s+([A-Z][a-zA-Z'-]{2,})\b/g));
  const names = Array.from(new Set(storms.map(match => match[1].toLowerCase())));
  if (names.length === 1 && new RegExp(`\\b${escaped(names[0])}\\b`, "i").test(headline) &&
    !/^(warning|season|hits|strikes|slams|brings|kills|death|disaster|damage|victims|no)$/.test(names[0]) &&
    !/\b(?:earthquake|magnitude|eruption)\b/i.test(headline) &&
    /\b(?:landfall|winds?|storm|flood(?:ing|s)?|evacuat\w*|warnings?|rain(?:fall)?|intensif\w*|weakens?|hits?|slams?|lash(?:es|ing)?|kills?|killing|dead|deaths?|cancels?|disrupts?|approach\w*|bear(?:s|ing)? down|prepar\w*|brac\w*)\b/i.test(headline)) {
    const period = new Date(date).getUTCFullYear();
    return { key: `storm|${names[0]}|${locations.join("|")}|${period}`,
      reason: `Named storm ${storms[0][1]} and the same stated location${locations.length > 1 ? "s" : ""}: ${locations.join(", ")}; within 72 hours of the latest matching report` };
  }
  const flight = /\bflight\s+([A-Z]{2,3})[ -]?(\d{2,4})\b/i.exec(headline);
  const action = /\b(?:crash(?:es|ed)?|crash landing)\b/i.test(headline) ? "crash" :
    /\b(?:hijack(?:ed|ing)?|hijackers?)\b/i.test(headline) ? "hijacking" : null;
  if (flight && action) return {
    key: `flight|${flight[1].toUpperCase()}${flight[2]}|${action}|${locations.join("|")}|${new Date(date).toISOString().slice(0, 10)}`,
    reason: `Flight ${flight[1].toUpperCase()}${flight[2]}, ${action}, the same stated locations and UTC reporting day`,
  };
  return null;
}

export function groupIncidents(events: readonly Event[]): IncidentGroup[] {
  const buckets = new Map<string, IncidentGroup>();
  const seen = new Set<string>();
  const sorted = events.slice().sort((a, b) => {
    const ta = validReportTime(a) ? Date.parse(a.timestamp) : 0;
    const tb = validReportTime(b) ? Date.parse(b.timestamp) : 0;
    return tb - ta || compare(a.id, b.id);
  });
  for (const event of sorted) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const match = anchor(event);
    const key = match ? `incident-${signalId(match.key)}` : event.id;
    const existing = buckets.get(key);
    // Compare with the newest anchor, not the previous member: A-B-C cannot
    // extend a group's reporting window through a sequence of weak time links.
    if (existing && Date.parse(existing.latest.timestamp) - Date.parse(event.timestamp) > 72 * 3600000) {
      buckets.set(event.id, { id: event.id, reports: [event], latest: event, reason: null });
    } else if (existing) existing.reports.push(event);
    else buckets.set(key, { id: key, reports: [event], latest: event, reason: match?.reason || null });
  }
  return Array.from(buckets.values()).map(group => ({
    ...group, reason: group.reports.length > 1 ? group.reason : null,
    reports: group.reports.slice().reverse(),
  }));
}
