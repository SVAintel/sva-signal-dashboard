// Snapshots military base locations from OpenStreetMap (via Overpass) into
// a static file (lib/data/military-bases.json). Base locations are physical
// infrastructure that essentially never changes, so this is a one-off /
// occasional-refresh script, not a live API — same rationale as cables and
// pipelines. Re-run manually if you want a refresh:
//   node scripts/fetch-military-bases.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "lib", "data", "military-bases.json");

// Same regional bounding boxes used for pipelines, queried sequentially with
// delays + retries to stay within Overpass's public-instance fair-use limits.
const REGIONS = [
  { name: "North America", bbox: [5, -170, 75, -50] },
  { name: "South America", bbox: [-58, -85, 13, -33] },
  { name: "Europe", bbox: [34, -12, 72, 40] },
  { name: "Middle East & Central Asia", bbox: [10, 40, 55, 80] },
  { name: "Africa", bbox: [-36, -20, 38, 52] },
  { name: "Russia & Far East", bbox: [40, 80, 78, 180] },
  { name: "South & Southeast Asia + Oceania", bbox: [-50, 80, 34, 180] },
];

async function fetchRegion(region, attempt) {
  const [s, w, n, e] = region.bbox;
  const query = `[out:json][timeout:90];nwr["military"="base"](${s},${w},${n},${e});out center;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": "sva-signal-dashboard/1.0 (static data snapshot)" },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(`  ${region.name} (attempt ${attempt}): ${data.elements?.length || 0} elements`);
  return data.elements || [];
}

async function main() {
  const byKey = new Map();
  let nextId = 0;

  for (const region of REGIONS) {
    let elements = null;
    for (let attempt = 1; attempt <= 3 && !elements; attempt++) {
      try {
        elements = await fetchRegion(region, attempt);
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
      const tags = el.tags || {};
      const name = String(tags.name || tags["name:en"] || "").trim();
      if (!name) continue; // skip unnamed bases — too noisy/unreliable to label usefully

      const lat = el.type === "node" ? el.lat : el.center?.lat;
      const lng = el.type === "node" ? el.lon : el.center?.lon;
      if (typeof lat !== "number" || typeof lng !== "number") continue;

      const key = `${name}|${lat.toFixed(2)}|${lng.toFixed(2)}`;
      if (byKey.has(key)) continue;
      byKey.set(key, {
        id: `base-${nextId++}`,
        name,
        lat,
        lng,
        country: tags["addr:country"] || tags["is_in:country"] || null,
        operator: tags.operator || null,
      });
    }

    await new Promise((r) => setTimeout(r, 15000)); // be polite between regions
  }

  const bases = Array.from(byKey.values()).slice(0, 600);
  fs.writeFileSync(OUT_FILE, JSON.stringify(bases));
  console.log(`Wrote lib/data/military-bases.json (${bases.length} bases)`);
}

main().catch((err) => {
  console.error("fetch-military-bases failed:", err);
  process.exit(1);
});
