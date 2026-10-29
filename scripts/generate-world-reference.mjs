// Regenerates public/world-reference.svg — the decorative globe/atlas
// illustration shown behind the landing page hero.
//
// Unlike the previous hand-approximated version (which had several
// corrupted/empty path segments and only loosely resembled real coastlines),
// this version projects real Natural Earth country geometry (bundled by the
// `world-atlas` package, via `topojson-client`) through a genuine
// `d3-geo` orthographic projection, so continent shapes are geographically
// accurate. Submarine-cable-style accent lines are real great-circle arcs
// between major cable landing hubs (computed with `d3.geoInterpolate`),
// not reused/broken country-border fragments.
//
// Run with: node scripts/generate-world-reference.mjs

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { geoOrthographic, geoPath, geoGraticule10, geoInterpolate } from "d3-geo";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIDTH = 704;
const HEIGHT = 600;
const CENTER = [352, 300];
const RADIUS = 283;

// Centered so Europe sits top-center, Africa lower-left, Asia to the right —
// matching the original composition.
const ROTATE = [-20, -15, 0];

const OCEAN_FILL = "#132025";
const OCEAN_STROKE = "#657067";
const GRATICULE_STROKE = "#42534f";
const LAND_FILL = "#2a3937";
const LAND_STROKE = "#6c786b";
const CABLE_STROKE = "#b3a172";
const BORDER_STROKE = "#46514e";
const GLOW_STROKE = "#34413f";
const LABEL_FILL = "#abb3a0";
const OCEAN_LABEL_FILL = "#81999b";

const projection = geoOrthographic()
  .rotate(ROTATE)
  .translate(CENTER)
  .scale(RADIUS)
  .clipAngle(90)
  .precision(0.1);

const pathGen = geoPath(projection);

const topology = require("world-atlas/countries-110m.json");
const countries = feature(topology, topology.objects.countries).features;

// --- Land/country shapes -----------------------------------------------
const landPaths = [];
for (const country of countries) {
  const d = pathGen(country);
  if (!d) continue; // fully on the far side of the globe — nothing to draw
  landPaths.push(
    `<path d="${d}" fill="${LAND_FILL}" stroke="${LAND_STROKE}" stroke-width=".5"/>`
  );
}

// --- Graticule (lat/long grid) ------------------------------------------
const graticuleD = pathGen(geoGraticule10());

// --- Ocean disk (full projected sphere) ----------------------------------
const sphereD = pathGen({ type: "Sphere" });

// --- Cable-route accent arcs ---------------------------------------------
// A small set of real submarine-cable landing hubs. Arcs are true
// great-circle paths (sampled geodesics), only drawn where at least part of
// the arc is visible on the near hemisphere.
const HUBS = {
  newYork: [-74.0, 40.7],
  london: [-0.1, 51.5],
  marseille: [5.4, 43.3],
  mumbai: [72.8, 19.0],
  singapore: [103.8, 1.3],
  tokyo: [139.7, 35.7],
  sydney: [151.2, -33.9],
  capeTown: [18.4, -33.9],
  lisbon: [-9.1, 38.7],
  hongKong: [114.2, 22.3],
};

const CABLE_ROUTES = [
  [HUBS.newYork, HUBS.london],
  [HUBS.london, HUBS.marseille],
  [HUBS.marseille, HUBS.mumbai],
  [HUBS.mumbai, HUBS.singapore],
  [HUBS.singapore, HUBS.hongKong],
  [HUBS.hongKong, HUBS.tokyo],
  [HUBS.singapore, HUBS.sydney],
  [HUBS.lisbon, HUBS.capeTown],
  [HUBS.marseille, HUBS.lisbon],
];

const cablePaths = [];
for (const [a, b] of CABLE_ROUTES) {
  const interpolate = geoInterpolate(a, b);
  const steps = 64;
  const coordinates = Array.from({ length: steps + 1 }, (_, i) => interpolate(i / steps));
  const d = pathGen({ type: "LineString", coordinates });
  if (!d) continue;
  cablePaths.push(`<path d="${d}" fill="none" stroke="${CABLE_STROKE}" stroke-width=".7" opacity=".58"/>`);
}

// --- Labels ---------------------------------------------------------------
// Positioned from approximate real-world centroids, projected through the
// same orthographic projection used for the land shapes.
const CONTINENT_LABELS = [
  { text: "EUROPE", lonLat: [15, 54] },
  { text: "AFRICA", lonLat: [20, 2] },
  { text: "ASIA", lonLat: [90, 42] },
];

const OCEAN_LABELS = [
  { text: "Atlantic", lonLat: [-35, 10], rotate: -18 },
  { text: "Indian Ocean", lonLat: [70, -20], rotate: 12 },
];

function projectLabel(lonLat) {
  const p = projection(lonLat);
  return p ? p.map((n) => Math.round(n * 100) / 100) : null;
}

const continentLabelMarkup = CONTINENT_LABELS.map(({ text, lonLat }) => {
  const p = projectLabel(lonLat);
  if (!p) return "";
  return `<text x="${p[0]}" y="${p[1]}">${text}</text>`;
}).join("");

const oceanLabelMarkup = OCEAN_LABELS.map(({ text, lonLat, rotate }) => {
  const p = projectLabel(lonLat);
  if (!p) return "";
  return `<text x="${p[0]}" y="${p[1]}" transform="rotate(${rotate} ${p[0]} ${p[1]})">${text}</text>`;
}).join("");

// --- Compass ticks (decorative, fixed — not data-driven) -------------------
const compassTicks = `<g stroke="${CABLE_STROKE}" stroke-width=".7"><path d="M${CENTER[0]} 5v22M${CENTER[0]} ${
  CENTER[1] + RADIUS + 5
}v22M${CENTER[0] - RADIUS - 17} ${CENTER[1]}h21M${CENTER[0] + RADIUS + 17} ${CENTER[1]}h21"/></g>`;

// --- Assemble --------------------------------------------------------------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <title>Connected world reference atlas</title>
  <desc>Country geometry: Natural Earth (public domain, via world-atlas), rendered with a true d3-geo orthographic projection. Cable routes are illustrative great-circle arcs between major landing hubs, not live activity.</desc>
  <circle cx="${CENTER[0]}" cy="${CENTER[1]}" r="${RADIUS}" stroke="${BORDER_STROKE}" stroke-width=".7"/>
  <circle cx="${CENTER[0]}" cy="${CENTER[1]}" r="${RADIUS + 7}" stroke="${GLOW_STROKE}" stroke-width=".5" stroke-dasharray="1 7"/>
  <path d="${sphereD}" fill="${OCEAN_FILL}" stroke="${OCEAN_STROKE}" stroke-width=".8"/>
  <path d="${graticuleD}" fill="none" stroke="${GRATICULE_STROKE}" stroke-width=".6" opacity=".8"/>
  ${landPaths.join("\n  ")}
  ${cablePaths.join("\n  ")}
  <g font-family="system-ui,sans-serif" font-size="10" letter-spacing="2" fill="${LABEL_FILL}">
  ${continentLabelMarkup}
  </g>
  <g font-family="Georgia,serif" font-style="italic" font-size="13" letter-spacing="1" fill="${OCEAN_LABEL_FILL}">
  ${oceanLabelMarkup}
  </g>
  ${compassTicks}
</svg>
`;

const outPath = path.join(__dirname, "..", "public", "world-reference.svg");
writeFileSync(outPath, svg, "utf8");
console.log(`Wrote ${outPath} (${(svg.length / 1024).toFixed(1)}KB, ${landPaths.length} countries, ${cablePaths.length} cable arcs)`);
