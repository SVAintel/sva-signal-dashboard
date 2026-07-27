// Retries just the regions that failed in fetch-military-bases.mjs, split
// into smaller sub-boxes to reduce per-query cost on Overpass, and merges
// results into the existing lib/data/military-bases.json snapshot.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "lib", "data", "military-bases.json");

const REGIONS = [
  { name: "South America North", bbox: [-15, -85, 13, -33] },
  { name: "South America South", bbox: [-58, -85, -15, -33] },
  { name: "Europe West", bbox: [34, -12, 72, 14] },
  { name: "Europe East", bbox: [34, 14, 72, 40] },
];

async function fetchRegion(region, attempt) {
  const [s, w, n, e] = region.bbox;
  const query = `[out:json][timeout:90];nwr["military"="base"](${s},${w},${n},${e});out center;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": "sva-signal-dashboard/1.0 (static data snapshot retry)" },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(`  ${region.name} (attempt ${attempt}): ${data.elements?.length || 0} elements`);
  return data.elements || [];
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf-8"));
  console.log(`Loaded existing snapshot: ${existing.length} bases`);
  const byKey = new Map(existing.map((b) => [`${b.name}|${b.lat.toFixed(2)}|${b.lng.toFixed(2)}`, b]));
  let nextId = existing.length;

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
      if (!name) continue;

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

    await new Promise((r) => setTimeout(r, 15000));
  }

  const bases = Array.from(byKey.values()).slice(0, 800);
  fs.writeFileSync(OUT_FILE, JSON.stringify(bases));
  console.log(`Wrote lib/data/military-bases.json (${bases.length} bases total)`);
}

main().catch((err) => {
  console.error("retry-military-bases failed:", err);
  process.exit(1);
});
