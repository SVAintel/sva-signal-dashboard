// One-off / occasional-refresh script that snapshots submarine cable and
// oil & gas pipeline geometry into static JSON files bundled with the app
// (lib/data/cables.json, lib/data/pipelines.json).
//
// Both datasets describe physical infrastructure that essentially never
// changes route day-to-day, so there's no value in fetching them live on
// every request — a committed static snapshot avoids depending on an
// external repo's uptime (cables) and Overpass's rate limits (pipelines).
//
// Re-run manually if you want a refresh: `node scripts/fetch-infra-data.mjs`
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "lib", "data");

const CABLES_URL =
  "https://raw.githubusercontent.com/tbotnz/submarine-cables-geojson/main/cables.json";

// Regional bounding boxes (south, west, north, east) approximating full
// global coverage, queried sequentially with a delay to stay within
// Overpass's public-instance fair-use limits.
const PIPELINE_REGIONS = [
  { name: "North America", bbox: [5, -170, 75, -50] },
  { name: "South America", bbox: [-58, -85, 13, -33] },
  { name: "Europe", bbox: [34, -12, 72, 40] },
  { name: "Middle East & Central Asia", bbox: [10, 40, 55, 80] },
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

async function fetchCables() {
  console.log("Fetching submarine cables...");
  const res = await fetch(CABLES_URL);
  if (!res.ok) throw new Error(`Cables fetch failed: ${res.status}`);
  const geojson = await res.json();

  const byName = new Map();
  for (const f of geojson.features || []) {
    const geom = f?.geometry;
    if (!geom || geom.type !== "MultiLineString" || !Array.isArray(geom.coordinates)) continue;
    const name = String(f?.properties?.name || "").trim() || "Unnamed Cable";

    for (const line of geom.coordinates) {
      // Coordinates in this dataset are "lng lat" strings, not [lng, lat] pairs.
      const points = line
        .map((pair) => {
          if (Array.isArray(pair)) {
            return [Number(pair[1]), Number(pair[0])];
          }
          if (typeof pair === "string") {
            const [lngStr, latStr] = pair.split(" ");
            return [Number(latStr), Number(lngStr)];
          }
          return [NaN, NaN];
        })
        .filter((p) => !isNaN(p[0]) && !isNaN(p[1]));
      if (points.length < 2) continue;

      const existing = byName.get(name) || [];
      existing.push(downsample(points, 30));
      byName.set(name, existing);
    }
  }

  const cables = Array.from(byName.entries())
    .map(([name, paths], idx) => ({ id: `cable-${idx}`, name, paths }))
    .slice(0, 400);
  console.log(`  -> ${cables.length} cables`);
  return cables;
}

async function fetchPipelineRegion(region) {
  const [s, w, n, e] = region.bbox;
  const query = `[out:json][timeout:60];way["man_made"="pipeline"]["substance"~"^(oil|gas)$"]["usage"="transmission"](${s},${w},${n},${e});out geom;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": "sva-signal-dashboard/1.0 (static data snapshot)" },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) {
    console.warn(`  ${region.name}: HTTP ${res.status}, skipping`);
    return [];
  }
  const data = await res.json();
  console.log(`  ${region.name}: ${data.elements?.length || 0} way segments`);
  return data.elements || [];
}

async function fetchPipelines() {
  console.log("Fetching oil & gas pipelines (Overpass, per region)...");
  const allElements = [];
  for (const region of PIPELINE_REGIONS) {
    try {
      const elements = await fetchPipelineRegion(region);
      allElements.push(...elements);
    } catch (error) {
      console.warn(`  ${region.name}: ${error.message}, skipping`);
    }
    // Be polite to the shared public Overpass instance between regions.
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const byName = new Map();
  for (const el of allElements) {
    if (el.type !== "way" || !Array.isArray(el.geometry)) continue;
    const tags = el.tags || {};
    const name = String(tags.name || tags["name:en"] || "").trim() || `Unnamed pipeline ${el.id}`;
    const substance = tags.substance === "gas" ? "gas" : "oil";
    const points = el.geometry
      .map((g) => [Number(g.lat), Number(g.lon)])
      .filter((p) => !isNaN(p[0]) && !isNaN(p[1]));
    if (points.length < 2) continue;

    const key = `${name}|${substance}`;
    const existing = byName.get(key) || { name, substance, paths: [] };
    existing.paths.push(downsample(points, 40));
    byName.set(key, existing);
  }

  const pipelines = Array.from(byName.values())
    .map((p, idx) => ({ id: `pipeline-${idx}`, ...p }))
    .slice(0, 500);
  console.log(`  -> ${pipelines.length} named pipelines total`);
  return pipelines;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const cables = await fetchCables();
  fs.writeFileSync(path.join(OUT_DIR, "cables.json"), JSON.stringify(cables));
  console.log(`Wrote lib/data/cables.json (${cables.length} cables)`);

  const pipelines = await fetchPipelines();
  fs.writeFileSync(path.join(OUT_DIR, "pipelines.json"), JSON.stringify(pipelines));
  console.log(`Wrote lib/data/pipelines.json (${pipelines.length} pipelines)`);
}

main().catch((err) => {
  console.error("fetch-infra-data failed:", err);
  process.exit(1);
});
