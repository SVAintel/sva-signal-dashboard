import { articleUrl } from "./report-context";

export function normalizeSignalText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

// Non-cryptographic identifiers, never authentication or trust signals.
export function signalId(value: string): string {
  let hash = 14695981039346656037n;
  for (let i = 0; i < value.length; i++) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function canonicalArticleUrl(value?: string): string | null {
  const safe = articleUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  url.hash = "";
  for (const key of Array.from(url.searchParams.keys())) {
    if (/^(?:utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|igshid|_hsenc|_hsmi|vero_id)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

export function sourceIdentity(source: string, url?: string) {
  const parts = source.split(/\s*\/\s*/);
  const provider = parts.length > 1 ? parts.shift()! : source;
  const attribution = parts.join(" / ").trim();
  const normalized = canonicalArticleUrl(url);
  const host = normalized ? new URL(normalized).hostname : "";
  const key = host || normalizeSignalText(attribution || source);
  return { provider, publisher: attribution || host || undefined, publisherKey: key, publisherLabel: attribution || host || source };
}

export function normalizedHeadline(title: string, source: string, url?: string): string {
  const identity = sourceIdentity(source, url);
  const labels = [identity.publisher || "", identity.publisherLabel, identity.publisherKey]
    .map(normalizeSignalText).filter(Boolean);
  const parts = title.split(/\s+(?:-|–|—|\|)\s+/);
  const suffix = normalizeSignalText(parts[parts.length - 1]);
  if (parts.length > 1 && labels.some(label => label === suffix || label.replace(/\s+(world|news)$/, "") === suffix)) parts.pop();
  return normalizeSignalText(parts.join(" "));
}
