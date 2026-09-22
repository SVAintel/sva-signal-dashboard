const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const output = fs.mkdtempSync(path.join(os.tmpdir(), "sva-report-tests-"));
after(() => fs.rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/lib/tsc.js"),
  "lib/report-context.ts", "lib/report-navigation.ts", "--outDir", output,
  "--module", "commonjs", "--target", "ES2020", "--strict", "--skipLibCheck",
], { cwd: path.join(__dirname, ".."), stdio: "pipe" });
const { relatedReports, sourceReports, resolveReport, articleUrl, RELATED_LIMIT, SOURCE_LIMIT } = require(path.join(output, "report-context.js"));
const { reportNavigationReducer: reduce, initialReportNavigation: initial } = require(path.join(output, "report-navigation.js"));
const report = (id, overrides = {}) => ({
  id, title: `Report ${id}`, description: `Description ${id}`, category: "war",
  source: "Source A", timestamp: "2026-09-22T12:00:00Z", location: { lat: 40, lng: 30 },
  confidence: "medium", aiNotes: "", ...overrides,
});
const parent = report("parent");
const position = { scrollTop: 231, focusId: "report-child" };

test("related candidates exclude self, repeated IDs, invalid time, weak and out-of-window matches", () => {
  const events = [
    parent, report("same"), report("same"), report("old", { timestamp: "2026-09-20T12:00:00Z" }),
    report("invalid", { timestamp: "invalid" }), report("", {}),
    report("weak", { category: "market", source: "Other", location: { lat: -40, lng: -100 } }),
  ];
  assert.deepEqual(relatedReports(parent, events).reports.map(item => item.event.id), ["same"]);
});
test("time/distance boundaries and reasons are exact, including valid zero coordinates", () => {
  const origin = report("origin", { category: "general", location: { lat: 0, lng: 0 } });
  const kmToLat = distance => distance / 6371 * 180 / Math.PI;
  const events = [
    report("inside", { source: "Other", category: "energy", timestamp: "2026-09-23T12:00:00Z", location: { lat: kmToLat(299.9), lng: 0 } }),
    report("outside", { source: "Other", category: "energy", location: { lat: kmToLat(300.1), lng: 0 } }),
    report("late", { timestamp: "2026-09-23T12:00:00.001Z" }),
  ];
  const result = relatedReports(origin, events);
  assert.equal(result.total, 1);
  assert.equal(result.reports[0].event.id, "inside");
  assert.ok(Math.abs(result.reports[0].distanceKm - 299.9) < 0.001);
  assert.equal(result.reports[0].sameSource, false);
  assert.equal(result.reports[0].sameCategory, false);
});
test("bad coordinates cannot claim proximity; General alone is not a specific-category match", () => {
  const bad = report("bad", { location: { lat: 91, lng: NaN } });
  assert.equal(relatedReports(parent, [bad], "nearby").total, 0);
  assert.equal(relatedReports(parent, [bad], "source").total, 0);
  assert.equal(sourceReports(parent, [bad]).total, 0);
  assert.equal(relatedReports({ ...parent, timestamp: "bad" }, [bad]).total, 0);
  assert.equal(relatedReports(report("general", { category: "general" }), [
    report("other-general", { category: "general", source: "Other", location: { lat: -40, lng: -100 } }),
  ]).total, 0);
});
test("related ranking is deterministic, strongest matches first and capped at eight", () => {
  const weaker = report("weak", { source: "Other", location: { lat: -40, lng: -100 } });
  const events = [weaker, ...Array.from({ length: 15 }, (_, i) => report(`match-${String(i).padStart(2, "0")}`))];
  const forward = relatedReports(parent, events);
  assert.deepEqual(forward, relatedReports(parent, [...events].reverse()));
  assert.equal(forward.total, 16);
  assert.equal(forward.reports.length, RELATED_LIMIT);
  assert.equal(forward.reports[0].event.id, "match-00");
  assert.ok(!forward.reports.some(item => item.event.id === "weak"));
});
test("only supplied filtered events qualify; source lists have exact scope, latest order and a twelve-item cap", () => {
  assert.equal(relatedReports(parent, []).total, 0);
  const events = Array.from({ length: 15 }, (_, i) => report(`source-${i}`, { timestamp: new Date(Date.parse(parent.timestamp) - i * 3600000).toISOString() }));
  const result = sourceReports(parent, [parent, ...events, events[0], report("different", { source: "Source A wire" })]);
  assert.equal(result.total, 15);
  assert.equal(result.reports.length, SOURCE_LIMIT);
  assert.equal(result.reports[0].id, "source-0");
  assert.equal(sourceReports(parent, [report("old", { timestamp: "2026-01-01T00:00:00Z" })]).total, 1);
});
test("source links allow only valid absolute HTTP(S) URLs", () => {
  assert.equal(articleUrl("https://example.org/report"), "https://example.org/report");
  for (const value of [undefined, "", "javascript:alert(1)", "file:///secret", "/article", "invalid"]) assert.equal(articleUrl(value), null);
});
test("refresh resolves an existing ID without retaining old content; missing reports retain an explicit snapshot", () => {
  const latest = report("parent", { title: "Updated title", timestamp: "2026-09-22T13:00:00Z" });
  assert.deepEqual(resolveReport(parent, [parent, latest]), { event: latest, retained: false });
  assert.deepEqual(resolveReport(parent, [report("other")]), { event: parent, retained: true });
  let state = reduce(initial, { type: "open", event: parent });
  state = reduce(state, { type: "refresh", events: [latest] });
  state = reduce(state, { type: "refresh", events: [] });
  assert.equal(state.entries[0].snapshot.title, "Updated title");
});
test("overview -> brief -> source dossier -> report -> Back restores exact location and view state", () => {
  let state = reduce(initial, { type: "open", event: parent });
  state = reduce(state, { type: "push", view: "sources", event: parent, position: { scrollTop: 10, focusId: "sources" } });
  state = reduce(state, { type: "push", view: "source", event: parent, position: { scrollTop: 120, focusId: "source" } });
  const sourceKey = state.entries.at(-1).key;
  state = reduce(state, { type: "push", view: "brief", event: report("child"), position });
  state = reduce(state, { type: "back" });
  assert.equal(state.entries.at(-1).key, sourceKey);
  assert.equal(state.entries.at(-1).snapshot.id, parent.id);
  assert.equal(state.entries.at(-1).view, "source");
  assert.equal(state.entries.at(-1).scrollTop, position.scrollTop);
  assert.equal(state.entries.at(-1).focusId, position.focusId);
  state = reduce(state, { type: "back" });
  assert.equal(state.entries.at(-1).scrollTop, 120);
});
test("related reason filter survives traversal; breadcrumb truncates descendants; new root resets even for same ID", () => {
  let state = reduce(initial, { type: "open", event: parent });
  const rootKey = state.entries[0].key;
  state = reduce(state, { type: "push", event: parent, view: "related", position });
  state = reduce(state, { type: "relation", relation: "nearby" });
  state = reduce(state, { type: "push", event: report("child"), view: "brief", position });
  state = reduce(state, { type: "back" });
  assert.equal(state.entries.at(-1).relation, "nearby");
  state = reduce(state, { type: "jump", key: rootKey });
  assert.equal(state.entries.length, 1);
  state = reduce(state, { type: "open", event: parent });
  assert.equal(state.entries.length, 1);
  assert.notEqual(state.entries[0].key, rootKey);
  assert.equal(state.entries[0].scrollTop, 0);
  state = reduce(state, { type: "close" });
  assert.equal(state.entries.length, 0);
  assert.deepEqual(reduce(state, { type: "back" }).entries, []);
});
