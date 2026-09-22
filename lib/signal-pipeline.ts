import { Event, ReportCollection, VerificationFilter, isUnconfirmedSource } from "./types";
import { assessSignalRelevance, isStructuredSource } from "./signal-relevance";
import { canonicalArticleUrl, normalizedHeadline, normalizeSignalText, signalId, sourceIdentity } from "./signal-identity";

export interface SignalQuality {
  excluded: number;
  reasons: Record<string, number>;
  merged: number;
}
export function parseSignalQuality(value: unknown): SignalQuality | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid signal quality response header");
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || !("excluded" in parsed) || !("merged" in parsed) || !("reasons" in parsed) ||
    typeof parsed.excluded !== "number" || !Number.isInteger(parsed.excluded) || parsed.excluded < 0 ||
    typeof parsed.merged !== "number" || !Number.isInteger(parsed.merged) || parsed.merged < 0 ||
    !parsed.reasons || typeof parsed.reasons !== "object" || Array.isArray(parsed.reasons) ||
    !Object.values(parsed.reasons).every(count => typeof count === "number" && Number.isInteger(count) && count >= 0)) {
    throw new Error("Invalid signal quality response header");
  }
  return { excluded: parsed.excluded, merged: parsed.merged, reasons: Object.fromEntries(Object.entries(parsed.reasons)) };
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const time = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const order = (a: Event, b: Event) => time(b.timestamp) - time(a.timestamp) ||
  b.description.length - a.description.length || compare(a.source, b.source) || compare(a.id, b.id);

export function reportCollections(event: Event): ReportCollection[] {
  if (event.provenance?.length) return event.provenance;
  const { provenance: _provenance, article: _article, ...record } = event;
  const identity = sourceIdentity(event.source, event.url);
  return [{
    ...record, provider: identity.provider, publisher: identity.publisher,
    id: `collection-${signalId(JSON.stringify([event.source, event.url || "", event.title, event.description, event.timestamp,
      event.sourceEventId || null, isStructuredSource(event.source) ? [event.location.lat, event.location.lng] : null]))}`,
  }];
}

function articleIdentity(record: ReportCollection): { key: string; article: NonNullable<Event["article"]> } {
  const headline = normalizedHeadline(record.title, record.source, record.url);
  const body = normalizeSignalText(record.description);
  const url = canonicalArticleUrl(record.url);
  const source = sourceIdentity(record.source, record.url);
  const date = Number.isFinite(Date.parse(record.timestamp)) ? new Date(record.timestamp).toISOString().slice(0, 10) : "";
  const article: NonNullable<Event["article"]> = {
    identity: "collection", canonicalUrl: url || undefined,
    publisherKey: source.publisherKey, publisherLabel: source.publisherLabel,
  };
  if (isStructuredSource(record.source)) {
    const observed = /^(USGS|EMSC)$/i.test(record.source) ? record.timestamp : "";
    return { key: record.sourceEventId
      ? JSON.stringify(["structured", record.source, record.sourceEventId])
      : JSON.stringify(["structured", record.source, url, headline, body, observed, record.location.lat, record.location.lng]),
    article: { ...article, identity: "structured" } };
  }
  const distinctive = headline.split(" ").length >= 7 && headline.length >= 45 &&
    !/^(?:live updates|latest news|breaking news|news update|daily briefing|world news|live blog)(?:\s|$)/.test(headline);
  const usefulUrl = url && new URL(url).pathname !== "/" && !/\/(?:rss|feed)(?:\/|\.|$)/i.test(new URL(url).pathname);
  if (usefulUrl && date) {
    // Stable article IDs do not depend on which collection copy arrived first.
    // Generic/live headlines need content and a day; changed distinctive headlines remain separate updates.
    return { key: JSON.stringify(["url", url, headline, distinctive ? "" : `${date}|${body}`]),
      article: { ...article, identity: "url-headline" } };
  }
  if (!url && distinctive && date && body.length >= 100 && body.split(" ").length >= 15 && source.publisherKey) {
    return { key: JSON.stringify(["text", source.publisherKey, date, headline, body]),
      article: { ...article, identity: "publisher-text" } };
  }
  return { key: record.id, article };
}

function syndicationIdentity(records: ReportCollection[]): string | null {
  const signatures = records.map(record => {
    // Attribution must be in the shared text, not just one collector's source label.
    const wire = /\b(?:Reuters|Associated Press|Agence France-Presse)\b/i.exec(record.description.slice(0, 220))?.[0];
    const headline = normalizedHeadline(record.title, record.source, record.url);
    const body = normalizeSignalText(record.description);
    if (!wire || isStructuredSource(record.source) || headline.length < 45 || headline.split(" ").length < 7 ||
      /^(?:live updates|latest news|breaking news|news update|daily briefing|world news|live blog)(?:\s|$)/.test(headline) ||
      body.length < 80 || !Number.isFinite(Date.parse(record.timestamp))) return null;
    return JSON.stringify([wire.toLowerCase(), new Date(record.timestamp).toISOString().slice(0, 10), headline, body]);
  });
  return signatures[0] && signatures.every(signature => signature === signatures[0]) ? signatures[0] : null;
}

function assemble(id: string, article: Event["article"], records: ReportCollection[]): Event {
  const sorted = records.slice().sort(order);
  const { provider: _provider, publisher: _publisher, ...representative } = sorted[0];
  return { ...representative, id, article, provenance: sorted };
}

export function consolidateReports(events: readonly Event[]): Event[] {
  const buckets = new Map<string, { article: Event["article"]; records: Map<string, ReportCollection> }>();
  for (const record of events.flatMap(reportCollections).sort(order)) {
    const { key, article } = articleIdentity(record);
    const id = `report-${signalId(key)}`;
    let bucket = buckets.get(id);
    if (!bucket) { bucket = { article, records: new Map() }; buckets.set(id, bucket); }
    if (!bucket.records.has(record.id)) bucket.records.set(record.id, record);
  }
  // Canonical copies reconcile first, regardless of collection-specific attribution.
  // Only then can identical, explicitly attributed text link different URLs.
  const syndicationRoots = new Map<string, string>();
  for (const [id, bucket] of Array.from(buckets).sort(([a], [b]) => compare(a, b))) {
    const signature = syndicationIdentity(Array.from(bucket.records.values()));
    if (!signature) continue;
    const rootId = syndicationRoots.get(signature);
    if (!rootId) { syndicationRoots.set(signature, id); continue; }
    const root = buckets.get(rootId)!;
    for (const [collectionId, record] of bucket.records) root.records.set(collectionId, record);
    root.article = { ...root.article!, identity: "attributed-syndication",
      aliases: [...(root.article?.aliases || []), id].sort(compare) };
    buckets.delete(id);
  }
  return Array.from(buckets, ([id, bucket]) => assemble(id, bucket.article, Array.from(bucket.records.values()))).sort(order);
}

export function processSignalFeed(events: readonly Event[], applyQuotas = true) {
  const quality: SignalQuality = { excluded: 0, reasons: {}, merged: 0 };
  const accepted: Event[] = [];
  const seenCollections = new Set<string>();
  for (const record of events.flatMap(reportCollections)) {
    if (seenCollections.has(record.id)) continue;
    seenCollections.add(record.id);
    const decision = assessSignalRelevance(record.title, record.description, record.source);
    if (decision.keep) accepted.push(record);
    else {
      quality.excluded++;
      quality.reasons[decision.reason] = (quality.reasons[decision.reason] || 0) + 1;
    }
  }
  const consolidated = consolidateReports(accepted);
  quality.merged = accepted.length - consolidated.length;
  if (!applyQuotas) return { events: consolidated, quality };
  const counts = new Map<string, number>();
  const limited = consolidated.filter(event => {
    const quotas = Array.from(new Map(reportCollections(event).map(record => {
      const provider = record.provider;
      const key = provider === "Telegram" ? record.source : `${provider}|${record.category}`;
      const limit = provider === "NewsAPI" ? 5 : provider === "RSS" ? 8 : provider === "GDELT" || provider === "Telegram" ? 6 : Infinity;
      return [key, { key, limit }] as const;
    })).values());
    if (!quotas.some(({ key, limit }) => (counts.get(key) || 0) < limit)) return false;
    for (const { key } of quotas) counts.set(key, (counts.get(key) || 0) + 1);
    return true;
  });
  return { events: limited, quality };
}

export interface SignalScope {
  categories: readonly string[];
  hours: number | null;
  verification: VerificationFilter;
  query: string;
  now: number;
}
export function scopeReports(events: readonly Event[], scope: SignalScope): Event[] {
  const query = scope.query.trim().toLowerCase();
  return events.flatMap(event => {
    const records = reportCollections(event).filter(record => {
      const age = scope.now - Date.parse(record.timestamp);
      return scope.categories.includes(record.category) &&
        (scope.hours === null || Number.isFinite(age) && age >= 0 && age <= scope.hours * 3600000) &&
        (scope.verification === "all" || isUnconfirmedSource(record.source) === (scope.verification === "unconfirmed")) &&
        (!query || `${record.title} ${record.source} ${record.description}`.toLowerCase().includes(query));
    });
    return records.length ? [assemble(event.id, event.article, records)] : [];
  }).sort(order);
}
