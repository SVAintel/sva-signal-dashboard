// Retries only the pipeline regions that failed in the initial run, merging
// results into the existing lib/data/pipelines.json snapshot. Re-run as
// needed if Overpass's public instance is still overloaded.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "lib", "data", "pipelines.json");

const REGIONS_TO_RETRY = [
  { name: "South America", bbox: [-58, -85, 13, -33] },
  { name: "Europe", bbox: [34, -12, 72, 40] },
  { name: "Africa", bbox: [-36, -20, 38, 52] },
  { name: "Russia & Far East", bbox: [40, 80, 78, 180] },
  { name: "South & Southeast Asia + Oceania", bbox: [-50, 80, 34, 180] },
];

function downsample(points, maxPoints) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const sampled = points.filter((_, idx) => idx % step === 0);
  const last = points[points.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

async function fetchPipelineRegion(region, attempt) {
  const [s, w, n, e] = region.bbox;
  const query = `[out:json][timeout:90];way["man_made"="pipeline"]["substance"~"^(oil|gas)$"]["usage"="transmission"](${s},${w},${n},${e});out geom;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": "sva-signal-dashboard/1.0 (static data snapshot retry)" },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = await res.json();
  console.log(`  ${region.name} (attempt ${attempt}): ${data.elements?.length || 0} way segments`);
  return data.elements || [];
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf-8"));
  console.log(`Loaded existing snapshot: ${existing.length} pipelines`);

  const byKey = new Map(existing.map((p) => [`${p.name}|${p.substance}`, p]));
  let nextId = existing.length;

  for (const region of REGIONS_TO_RETRY) {
    let elements = null;
    for (let attempt = 1; attempt <= 3 && !elements; attempt++) {
      try {
        elements = await fetchPipelineRegion(region, attempt);
      } catch (error) {
        console.warn(`  ${region.name} attempt ${attempt} failed: ${error.message}`);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 20000 * attempt));
      }
    }
    if (!elements) {
      console.warn(`  ${region.name}: giving up after 3 attempts`);
      elements = [];
    }

    for (const el of elements) {
      if (el.type !== "way" || !Array.isArray(el.geometry)) continue;
      const tags = el.tags || {};
      const name = String(tags.name || tags["name:en"] || "").trim() || `Unnamed pipeline ${el.id}`;
      const substance = tags.substance === "gas" ? "gas" : "oil";
      const points = el.geometry
        .map((g) => [Number(g.lat), Number(g.lon)])
        .filter((p) => !isNaN(p[0]) && !isNaN(p[1]));
      if (points.length < 2) continue;

      const key = `${name}|${substance}`;
      const existingEntry = byKey.get(key);
      if (existingEntry) {
        existingEntry.paths.push(downsample(points, 40));
      } else {
        byKey.set(key, { id: `pipeline-${nextId++}`, name, substance, paths: [downsample(points, 40)] });
      }
    }

    // Be polite between regions.
    await new Promise((r) => setTimeout(r, 15000));
  }

  const merged = Array.from(byKey.values()).slice(0, 800);
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged));
  console.log(`Wrote lib/data/pipelines.json (${merged.length} pipelines total)`);
}

main().catch((err) => {
  console.error("retry-pipelines failed:", err);
  process.exit(1);
});
