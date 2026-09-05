// AI enrichment layer for Pattern Alerts clusters — kept separate from
// lib/correlation.ts (which is pure, I/O-free clustering logic) since this
// module does network calls (Gemini) and DB caching.
//
// Batches ALL clusters needing a summary into a single Gemini call per
// request (rather than one call per cluster) to keep latency/cost down, and
// persists each cluster's summary in app_cache keyed by cluster id so the
// same real-world pattern isn't re-summarized on every ~15min poll — only
// once per cluster id, which stays stable for as long as that cluster's
// earliest signal + centroid don't change (see lib/correlation.ts).
import { getAppCache, setAppCache } from "@/lib/db";
import type { CorrelationCluster } from "@/lib/correlation";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const CACHE_KEY_PREFIX = "correlation-summary:";

async function fetchSummariesFromGemini(
  clusters: CorrelationCluster[]
): Promise<Record<string, string>> {
  const prompt = `You are a geopolitical risk analyst. Below are ${clusters.length} "pattern alert" clusters — groups of signals from DIFFERENT categories (war, market, energy, natural disaster, etc.) that landed near the same place within about a day of each other. For each cluster, write ONE short sentence (max 25 words) explaining why the combination of these specific signals together is analytically interesting or worth a human's attention. Be concrete — reference what's actually converging, not generic language. Do not invent facts beyond what's listed.

Respond ONLY with a JSON array, no markdown fences, in this exact shape:
[{"id": "<cluster id>", "summary": "<one sentence>"}]

Clusters:
${clusters
  .map(
    (c) =>
      `id: ${c.id}\nplace: ${c.place}\ncategories: ${c.categories.join(", ")}\nsignals:\n${c.members
        .slice(0, 6)
        .map((m) => `  - [${m.category}] ${m.title}`)
        .join("\n")}`
  )
  .join("\n\n")}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY as string },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    console.error("[correlation-ai] Gemini responded", res.status, await res.text());
    return {};
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[correlation-ai] Gemini returned no text", JSON.stringify(data).slice(0, 500));
    return {};
  }

  try {
    // Gemini sometimes wraps JSON in ```json fences despite instructions —
    // strip those before parsing rather than failing the whole batch.
    const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const parsed: { id: string; summary: string }[] = JSON.parse(cleaned);
    const result: Record<string, string> = {};
    for (const item of parsed) {
      if (item?.id && item?.summary) result[item.id] = item.summary;
    }
    return result;
  } catch (err) {
    console.error("[correlation-ai] Failed to parse Gemini JSON:", err, text.slice(0, 300));
    return {};
  }
}

// Mutates-in-effect by returning a new array with `summary` filled in where
// available. Cached summaries are read first; only clusters missing a cache
// entry trigger a (single, batched) Gemini call.
export async function attachClusterSummaries(
  clusters: CorrelationCluster[]
): Promise<CorrelationCluster[]> {
  if (clusters.length === 0) return clusters;

  const cached = await Promise.all(
    clusters.map((c) => getAppCache<string>(`${CACHE_KEY_PREFIX}${c.id}`))
  );

  const withCached = clusters.map((c, i) => ({ ...c, summary: cached[i]?.value }));
  const missing = withCached.filter((c) => !c.summary);

  if (missing.length === 0) return withCached;

  if (!GEMINI_API_KEY) {
    // No key configured — leave summaries undefined rather than failing the
    // whole route; the UI falls back to showing raw signal titles.
    return withCached;
  }

  try {
    const generated = await fetchSummariesFromGemini(missing);
    await Promise.all(
      Object.entries(generated).map(([id, summary]) => setAppCache(`${CACHE_KEY_PREFIX}${id}`, summary))
    );
    return withCached.map((c) => (generated[c.id] ? { ...c, summary: generated[c.id] } : c));
  } catch (err) {
    console.error("[correlation-ai] summary generation failed:", err);
    return withCached;
  }
}
