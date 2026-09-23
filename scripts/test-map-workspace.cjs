const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "sva-map-tests-"));
after(() => fs.rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/lib/tsc.js"),
  "lib/spatial-reports.ts", "lib/workspace-layout.ts", "lib/map-symbols.ts", "--outDir", output,
  "--module", "commonjs", "--target", "ES2020", "--strict", "--skipLibCheck",
], { cwd: path.join(__dirname, ".."), stdio: "pipe" });
const { clusterReports, uniqueMappableReports, longitudeNear, reportBounds } = require(path.join(output, "spatial-reports.js"));
const { COMPACT_WORKSPACE_QUERY } = require(path.join(output, "workspace-layout.js"));
const { reportSymbol, infrastructureSymbol, vesselSymbol, fireSymbol, stormSymbol } = require(path.join(output, "map-symbols.js"));
const event = (id, lat = 10, lng = 20, overrides = {}) => ({
  id, location: { lat, lng }, title: `Report ${id}`, description: "", source: "RSS / Test",
  timestamp: "2026-09-22T12:00:00Z", category: "general", confidence: "", aiNotes: "", ...overrides,
});
const options = { zoom: 2, centerLongitude: 0 };
test("spatial counts conserve unique filtered IDs and are independent of input ordering", () => {
  const events = [event("c", 10, 21), event("a"), event("b", 45, -120), event("a")];
  const result = clusterReports(events, options);
  assert.deepEqual(result, clusterReports(events.slice().reverse(), options));
  assert.deepEqual(result.flatMap(point => point.reports.map(report => report.id)).sort(), ["a", "b", "c"]);
  assert.equal(clusterReports([events[0]], options).flatMap(point => point.reports).length, 1);
  assert.equal(clusterReports([], options).length, 0);
});
test("invalid coordinates and blank IDs are excluded, unavailable timestamps remain truthful mappable reports", () => {
  const events = [event(""), event("lat", 91), event("lng", 1, 181), event("nan", NaN), event("inf", 10, Infinity), event("valid", 0, 0, { timestamp: "" })];
  assert.deepEqual(uniqueMappableReports(events).map(event => event.id), ["valid"]);
});
test("poll duplicate versions deterministically keep the newest snapshot", () => {
  const a = event("a"), b = { ...a, timestamp: "2026-09-23T00:00:00Z", title: "Updated" };
  assert.equal(clusterReports([a, b], options)[0].reports[0].title, "Updated");
  assert.deepEqual(clusterReports([a, b], options), clusterReports([b, a], options));
});
test("regional zoom splits nearby reports while coincident maximum-zoom points remain browsable", () => {
  const events = [event("a"), event("b", 10, 20.3)];
  assert.equal(clusterReports(events, options).length, 1);
  assert.equal(clusterReports(events, { ...options, zoom: 8 }).length, 2);
  const same = clusterReports([event("a"), event("b"), event("c")], { ...options, zoom: 8 });
  assert.equal(same.length, 1); assert.equal(same[0].reports.length, 3);
  assert.deepEqual(reportBounds(same[0].reports, 20), { south: 10, north: 10, west: 20, east: 20 });
});
test("selected extraction never duplicates a report or invents an out-of-filter point", () => {
  const events = [event("a"), event("b"), event("c")];
  const result = clusterReports(events, { ...options, selectedId: "a" });
  assert.equal(result.find(point => point.selected).reports[0].id, "a");
  assert.equal(result.find(point => !point.selected).reports.length, 2);
  assert.equal(result.flatMap(point => point.reports).length, 3);
  assert.equal(clusterReports(events, { ...options, selectedId: "missing" }).some(point => point.selected), false);
});
test("dateline neighbors cluster in the current wrapped world and fit narrow real bounds", () => {
  const events = [event("west", 5, 179.9), event("east", 5, -179.9)];
  const result = clusterReports(events, { zoom: 4, centerLongitude: 180 });
  assert.equal(result.length, 1);
  assert.ok(Math.abs(result[0].lng - 180) < .001);
  const bounds = reportBounds(events, result[0].lng);
  assert.ok(bounds.east - bounds.west < .21);
  assert.equal(longitudeNear(-179, 540), 541);
  assert.equal(clusterReports(events, { zoom: 4, centerLongitude: 0 }).length, 2);
});
test("compact CSS and both JS consumers use one responsive criterion", () => {
  const root = path.join(__dirname, "..");
  const css = fs.readFileSync(path.join(root, "app", "compact.css"), "utf8");
  assert.ok(css.includes(`@media ${COMPACT_WORKSPACE_QUERY} {`));
  for (const file of ["Dashboard.tsx", "DetailFrame.tsx"]) {
    const source = fs.readFileSync(path.join(root, "components", file), "utf8");
    assert.ok(source.includes("useCompactWorkspace()"));
    assert.ok(!source.includes('matchMedia("(max-width:'));
  }
});
test("symbols preserve categories, valid heading and fire magnitude without injected markup or idle effects", () => {
  assert.equal(reportSymbol({ category: "war" }).color, "#ef4444");
  assert.equal(reportSymbol({ category: "<img onerror=alert(1)>", color: '"><script>' }).color, "#94a3b8");
  assert.ok(vesselSymbol({ kind: "military", course: 90 }).html.includes("rotate(90"));
  assert.ok(!vesselSymbol({ kind: "military", course: 360 }).html.includes("rotate("));
  assert.ok(!vesselSymbol({ kind: "military", course: NaN }).html.includes("NaN"));
  assert.notEqual(fireSymbol({ magnitude: 0 }).html, fireSymbol({ magnitude: 200 }).html);
  assert.equal(fireSymbol({ magnitude: -1 }).html, fireSymbol({ magnitude: 0 }).html);
  assert.equal(stormSymbol({ classification: "HU" }).color, "#ef4444");
  for (const symbol of [reportSymbol({ category: "general", selected: true }), infrastructureSymbol({ kind: "port" }), infrastructureSymbol({ kind: "military" })]) {
    assert.equal(symbol.size, 24);
    assert.ok(!/animation|box-shadow|<script|onerror/.test(symbol.html));
  }
});
