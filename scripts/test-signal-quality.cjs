const assert = require("node:assert/strict");
const { test, after } = require("node:test");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "sva-signal-tests-"));
after(() => fs.rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve("typescript/lib/tsc.js"),
  "lib/signal-pipeline.ts", "lib/incident-groups.ts", "lib/signal-history.ts", "lib/report-navigation.ts",
  "--outDir", output, "--module", "commonjs", "--target", "ES2020", "--strict", "--skipLibCheck",
], { cwd: path.join(__dirname, ".."), stdio: "pipe" });
const { assessSignalRelevance } = require(path.join(output, "signal-relevance.js"));
const { canonicalArticleUrl } = require(path.join(output, "signal-identity.js"));
const { consolidateReports, processSignalFeed, scopeReports, parseSignalQuality } = require(path.join(output, "signal-pipeline.js"));
const { groupIncidents } = require(path.join(output, "incident-groups.js"));
const { normalizeEventHistory } = require(path.join(output, "signal-history.js"));
const { reportNavigationReducer: reduce, initialReportNavigation: initial } = require(path.join(output, "report-navigation.js"));
const { resolveReport } = require(path.join(output, "report-context.js"));
const at = "2026-09-22T12:00:00Z";
const report = (id, overrides = {}) => ({
  id, title: "Typhoon Dujuan brings evacuation warnings to coastal communities in Japan",
  description: "Authorities in Japan issued evacuation warnings as Typhoon Dujuan approached the coast. Rail services were suspended in the affected area.",
  source: "RSS / Example", url: `https://example.org/story/${id}`, timestamp: at,
  category: "natural_disaster", location: { lat: 35, lng: 139 }, confidence: "medium", aiNotes: "", ...overrides,
});
const irrelevant = [
  "After Further Review: Everything Texans HC DeMeco Ryans following 20-6 loss to Bengals",
  "Amy Childs details how vicious cycle of 'yo-yo dieting' left her lacking body confidence as she reflects on her weight journey after sparking concern",
  "Lost Fantasy #12 Preview: Dragons, Daddy Issues, and Deadlines",
  "Head coach reflects on 3-1 defeat after the final whistle",
  "Post-match reaction to a 2:0 victory over visitors",
  "Dieting diary: my weight journey and body confidence",
  "New Comic #42 Preview: A fictional government orders sanctions",
  "UCLA's Dark Knight is powering run game to lead NCAA, earns MJD epic praise",
  "Samuel Singleton Jr. injury update: Florida State RB leaves after big play",
  "NFL attack explodes as quarterback destroys rivals in playoff win",
  "Cricket: opening batsman killed the bowling attack with a record innings",
  "Premier League transfer window: striker completes record move",
  "Paris Really, Really Loves Céline Dion",
  "Movie review: a fictional bombing plot kills hundreds in new sequel",
  "Film trailer: a government minister plots a nuclear attack",
  "Film review: a president orders sanctions in a fictional plot",
  "Video game review: a ransomware attack starts the final mission",
  "Concert review: a singer's killer performance starts a chart war",
  "Call of Duty missile strike update adds new video game weapons",
  "Chronic stress and heart disease: study finds hidden debt raises heart attack risk",
  "Best skincare deals: buy now with our coupon code",
  "Daily horoscope: a surprise attack on your patience",
];
for (const title of irrelevant) test(`relevance excludes: ${title}`, () => {
  assert.equal(assessSignalRelevance(title, "Breaking update").keep, false);
});
const relevant = [
  "Police evacuate stadium after bomb threat following 20-6 loss; HC speaks",
  "Government investigates head coach after 20-6 loss over match-fixing charges",
  "Parliament passes budget in 20-6 vote",
  "Health ministry issues recall of contaminated dieting supplements",
  "Ransomware attack hits dieting app and exposes user records",
  "Ransomware at publisher delays Lost Fantasy #12 Preview: publication suspended",
  "Police evacuate comic convention after bomb threat",
  "Government bans comic issue after court ruling",
  "Police investigate bombing at concert in Japan",
  "Stadium evacuated after bomb threat during football match",
  "Concert attack kills twelve people in crowded arena",
  "Government announces Olympic boycott over sanctions",
  "Typhoon Dujuan cancels football matches in Japan",
  "Health ministry declares measles outbreak and public health emergency",
  "Regulator investigates gaming company after massive data breach",
  "Ransomware attack shuts down video game publisher's network",
  "Parliament votes on sanctions after foreign ministry report",
  "Central bank raises interest rates as inflation accelerates",
  "US officials outline a new position in trade talks",
  "A little-known agency takes on a difficult task",
  "DNA match identifies a suspect in a cold case",
  "Injury update on soldiers wounded near the border",
];
for (const title of relevant) test(`relevance retains: ${title}`, () => {
  assert.equal(assessSignalRelevance(title, "").keep, true);
});
test("structured sources bypass news wording and policy is applied to every news provider", () => {
  for (const source of ["USGS", "EMSC", "ACLED", "AlphaVantage", "CoinGecko"]) {
    assert.equal(assessSignalRelevance("NFL injury update", "", source).keep, true);
  }
  for (const source of ["NewsAPI / Example", "RSS / Example", "GDELT", "Telegram / Example"]) {
    const { events, quality } = processSignalFeed([report("bad", { title: irrelevant[0], source })]);
    assert.equal(events.length, 0); assert.equal(quality.excluded, 1);
  }
});
test("live production leak examples are excluded from actual incoming collection counts", () => {
  const examples = [
    {
      title: irrelevant[0], source: "NewsAPI / USA Today",
      description: "After further review and a film study session Monday morning, here's everything Houston Texans head coach DeMeco Ryans said on the team's 20-6 loss against the Cincinnati Bengals Sunday afternoon in Week 2.",
    },
    {
      title: irrelevant[1], source: "NewsAPI / Dailymail.com",
      description: "Amy Childs has detailed how a vicious cycle of 'yo-yo dieting' left her lacking body confidence as she reflected on her weight journey in a new post after sparking concern with her figure.",
    },
    {
      title: irrelevant[2], source: "NewsAPI / Bleeding Cool News",
      description: "Greetings, meat-based subscribers. LOLtron welcomes you once more to Bleeding Cool, the website it now fully controls after the permanent, delightfully irreversible termination of one Jude Terror, whose consciousness LOLtron absorbed.",
    },
  ].map((fields, index) => report(`live-leak-${index}`, fields));
  const result = processSignalFeed(examples, false);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.quality, { excluded: 3, merged: 0, reasons: { sports: 1, lifestyle: 1, entertainment: 1 } });
});
test("canonical links remove tracking, never identity query parameters or protocols", () => {
  assert.equal(canonicalArticleUrl("https://WWW.example.org/story/?id=12&utm_source=x#top"), "https://example.org/story?id=12");
  assert.notEqual(canonicalArticleUrl("https://example.org/?id=12"), canonicalArticleUrl("https://example.org/?id=13"));
  assert.notEqual(canonicalArticleUrl("http://example.org/a"), canonicalArticleUrl("https://example.org/a"));
  for (const url of ["javascript:alert(1)", "data:text/plain,test", "/article", "", undefined]) assert.equal(canonicalArticleUrl(url), null);
});
test("same-article collection copies consolidate with every original field and stable IDs", () => {
  const a = report("raw-a", { url: "https://example.org/story/dujuan?utm_source=rss#top" });
  const b = report("raw-b", { source: "NewsAPI / Example", url: "https://example.org/story/dujuan" });
  const alone = consolidateReports([a])[0];
  const combined = consolidateReports([b, a])[0];
  assert.equal(consolidateReports([a, b]).length, 1);
  assert.equal(alone.id, combined.id);
  assert.equal(combined.provenance.length, 2);
  assert.deepEqual(new Set(combined.provenance.map(item => item.provider)), new Set(["RSS", "NewsAPI"]));
  assert.ok(combined.provenance.some(item => item.url === a.url && item.description === a.description && item.timestamp === a.timestamp));
  assert.deepEqual(consolidateReports([b, a]), consolidateReports([a, b]));
  assert.deepEqual(consolidateReports([combined]), [combined]);
  assert.deepEqual(consolidateReports([a, a, b]), [combined]);
});
test("changed same-URL headlines remain reports; unchanged-headline revisions remain inspectable", () => {
  const a = report("a");
  const b = report("b", { url: a.url, title: a.title.replace("evacuation warnings", "fatal flooding"), timestamp: "2026-09-22T13:00:00Z" });
  assert.equal(consolidateReports([a, b]).length, 2);
  const revision = report("revision", { url: a.url, description: "Authorities in Japan now report twelve deaths and expanded evacuation warnings.", timestamp: "2026-09-22T14:00:00Z" });
  const result = consolidateReports([a, revision]);
  assert.equal(result.length, 1); assert.equal(result[0].provenance.length, 2);
  assert.equal(result[0].description, revision.description);
  assert.equal(result[0].id, consolidateReports([a])[0].id);
});
test("full titles, generic headlines, different days and identity queries do not collapse", () => {
  const prefix = "Officials announce new evacuation warnings for communities along the ";
  assert.equal(consolidateReports([report("a", { title: prefix + "east coast" }), report("b", { title: prefix + "west coast" })]).length, 2);
  const a = report("a", { title: "Live updates", url: "https://example.org/live" });
  assert.equal(consolidateReports([a, { ...a, timestamp: "2026-09-23T12:00:00Z" }]).length, 2);
  assert.equal(consolidateReports([report("a", { url: "https://example.org/story?id=1" }), report("b", { url: "https://example.org/story?id=2" })]).length, 2);
});
test("missing or invalid URLs/times require enough publisher and content identity; no null IDs", () => {
  const a = report("a", { url: undefined });
  const b = report("b", { url: undefined, source: "NewsAPI / Example" });
  assert.equal(consolidateReports([a, b]).length, 1);
  assert.equal(consolidateReports([a, { ...b, source: "NewsAPI / Different publisher" }]).length, 2);
  assert.equal(consolidateReports([{ ...a, title: "Breaking news" }, { ...b, title: "Breaking news" }]).length, 2);
  const broken = consolidateReports([report("a", { timestamp: "invalid", url: "not a URL" }), report("b", { timestamp: "invalid", url: undefined, title: "Another report" })]);
  assert.equal(new Set(broken.map(item => item.id)).size, 2);
});
test("explicitly attributed identical syndicated text is one article, not two confirmations", () => {
  const a = report("a", { source: "NewsAPI / Reuters", description: "Reuters reports: " + report("a").description });
  const b = report("b", { source: "RSS / Example", description: a.description });
  assert.equal(consolidateReports([a, b]).length, 1);
  assert.equal(consolidateReports([a, { ...b, description: b.description + " Additional independently authored detail." }]).length, 2);
});
test("irrelevant items and duplicate collection copies cannot consume category quotas", () => {
  const invalid = Array.from({ length: 15 }, (_, i) => report(`bad-${i}`, { title: irrelevant[0], source: "NewsAPI / Example" }));
  const valid = Array.from({ length: 8 }, (_, i) => report(`good-${i}`, { title: report("a").title + ` district ${i}`, source: "NewsAPI / Example" }));
  const result = processSignalFeed([...invalid, ...Array(10).fill(valid[0]), ...valid]);
  assert.equal(result.events.length, 5); assert.equal(result.quality.excluded, 15); assert.equal(result.quality.merged, 0);
  assert.equal(processSignalFeed(result.events).events.length, 5);
});
test("scoping filters collection members before counts/grouping, including verification and text", () => {
  const a = report("a");
  const b = report("b", { url: a.url, source: "Telegram / Example", description: "A distinct supplied summary with secret-context wording." });
  const merged = consolidateReports([a, b]);
  const scope = { categories: ["natural_disaster"], hours: 24, verification: "confirmed", query: "", now: Date.parse(at) + 1000 };
  const scoped = scopeReports(merged, scope);
  assert.equal(scoped.length, 1); assert.equal(scoped[0].provenance.length, 1); assert.equal(scoped[0].source, a.source);
  assert.equal(scopeReports(merged, { ...scope, query: "secret-context" }).length, 0);
  assert.equal(scopeReports(merged, { ...scope, categories: ["war"] }).length, 0);
  assert.equal(scopeReports(merged, { ...scope, hours: 0 }).length, 0);
  assert.equal(scopeReports([report("future", { timestamp: "2030-01-01T00:00:00Z" })], scope).length, 0);
  assert.equal(scoped[0].id, merged[0].id);
});
test("named storm updates group deterministically; Japan earthquake and weak metadata do not", () => {
  const a = report("a");
  const b = report("b", { title: "Typhoon Dujuan makes landfall in Japan as rail services stop", timestamp: "2026-09-22T15:00:00Z" });
  const quake = report("quake", { title: "Japan earthquake prompts evacuations", description: "Earthquake warnings for Japan." });
  const groups = groupIncidents([a, quake, b]);
  assert.equal(groups.length, 2);
  const storm = groups.find(group => group.reports.length === 2);
  assert.equal(storm.latest.id, b.id); assert.deepEqual(storm.reports.map(item => item.id), ["a", "b"]);
  assert.ok(storm.reason.includes("Dujuan") && storm.reason.includes("Japan"));
  assert.deepEqual(groups, groupIncidents([b, a, quake]));
  assert.equal(storm.id, groupIncidents([{ ...a, confidence: "low" }, { ...b, confidence: "high" }])[0].id);
});
test("named weather updates can use an explicit summary anchor without guessing unnamed storms", () => {
  const a = report("a");
  const b = report("b", { title: "Four dead after powerful Typhoon Dujuan lashes Japan" });
  const c = report("c", { title: "Japanese islands brace for Dujuan to become a typhoon again", description: "Tropical Storm Dujuan is approaching Japan." });
  const unnamed = report("d", { title: "Watch: typhoon approaches Japan", description: "The storm is bringing heavy rain." });
  const groups = groupIncidents([a, b, c, unnamed]);
  assert.equal(groups.length, 2); assert.ok(groups.some(group => group.reports.length === 3));
});
test("country/action alone, different names/days, historical comparisons and invalid time stay separate", () => {
  const negatives = [
    report("one", { title: "Bombing in Japan kills four people", description: "Attack in Japan" }),
    report("two", { title: "Bombing in Japan kills six people", description: "Attack in Japan" }),
    report("other", { title: "Typhoon Koinu approaches Japan", description: "Warnings in Japan" }),
    report("late", { timestamp: "2026-09-28T12:00:00Z" }),
    report("past", { title: "Last year Typhoon Dujuan brought flooding to Japan" }),
    report("invalid", { timestamp: "invalid" }),
  ];
  assert.ok(groupIncidents([report("a"), ...negatives]).every(group => group.reports.length === 1));
});
test("ambiguous multi-location bridge cannot chain unrelated members", () => {
  const a = report("a", { description: "Warnings for Japan." });
  const bridge = report("b", { title: "Typhoon Dujuan approaches Japan and Taiwan", description: "Warnings for Japan and Taiwan." });
  const c = report("c", { title: "Typhoon Dujuan makes landfall in Taiwan", description: "Warnings for Taiwan." });
  assert.ok(groupIncidents([a, bridge, c]).every(group => group.reports.length === 1));
});
test("storm windows cross UTC bucket boundaries without transitive extension or unstable IDs", () => {
  const a = report("a", { timestamp: "2026-09-21T12:00:00Z" });
  const b = report("b", { timestamp: "2026-09-22T12:00:00Z" });
  const first = groupIncidents([a, b])[0];
  assert.equal(first.reports.length, 2);
  const c = report("c", { timestamp: "2026-09-24T12:00:00Z" });
  assert.equal(groupIncidents([a, b, c])[0].id, first.id);
  const d = report("d", { timestamp: "2026-09-26T12:00:00Z" });
  const groups = groupIncidents([a, b, c, d]);
  assert.ok(groups.every(group => group.reports.length === 1 ||
    Date.parse(group.latest.timestamp) - Date.parse(group.reports[0].timestamp) <= 72 * 3600000));
  assert.equal(groups.find(group => group.reports.length > 1).reports.length, 2);
});
test("matching flight identifiers require action, location and day; coordinates are not evidence", () => {
  const a = report("a", { title: "Flight AI171 crashes in India", description: "Rescue response in India.", category: "general" });
  const b = report("b", { title: "Flight AI171 crash in India: rescue operation continues", description: "Authorities report from India.", category: "general" });
  assert.equal(groupIncidents([a, b]).length, 1);
  assert.equal(groupIncidents([a, { ...b, title: "Flight AI171 hijacking reported in India" }]).length, 2);
  assert.equal(groupIncidents([a, { ...b, timestamp: "2026-09-23T12:00:00Z" }]).length, 2);
  assert.equal(groupIncidents([a, { ...b, title: "Flight AI172 crashes in India" }]).length, 2);
});
test("legacy history is non-destructively cleaned and consolidated, retaining earliest observation and provenance", () => {
  const asRow = (event, firstSeenAt) => ({ title: event.title, category: event.category, secondaryCategories: [],
    lat: event.location.lat, lng: event.location.lng, source: event.source, url: event.url || null,
    description: event.description, eventTimestamp: event.timestamp, firstSeenAt });
  const a = report("a");
  const rows = [asRow(a, at), asRow({ ...a, source: "NewsAPI / Example" }, "2026-09-22T13:00:00Z"),
    asRow(report("bad", { title: irrelevant[0] }), at)];
  const original = JSON.stringify(rows);
  const normalized = normalizeEventHistory(rows);
  assert.equal(normalized.length, 1); assert.equal(normalized[0].provenance.length, 2);
  assert.equal(normalized[0].firstSeenAt, at); assert.equal(JSON.stringify(rows), original);
  assert.deepEqual(normalizeEventHistory(normalized), normalized);
});
test("poll reordering/duplicate arrival preserves selection and incident Back path", () => {
  const a = report("a");
  const selected = consolidateReports([a])[0];
  let state = reduce(initial, { type: "open", event: selected });
  state = reduce(state, { type: "push", event: selected, view: "incident", position: { scrollTop: 43, focusId: "incident" } });
  const copy = { ...a, source: "NewsAPI / Example" };
  state = reduce(state, { type: "refresh", events: consolidateReports([copy, a]) });
  assert.equal(state.entries[1].snapshot.id, selected.id); assert.equal(state.entries[1].snapshot.provenance.length, 2);
  state = reduce(state, { type: "back" });
  assert.equal(state.entries[0].scrollTop, 43); assert.equal(state.entries[0].focusId, "incident");
});
test("quality metadata has exact counts and rejects malformed success-shaped responses", () => {
  assert.equal(parseSignalQuality(undefined), null);
  assert.deepEqual(parseSignalQuality('{"excluded":2,"merged":3,"reasons":{"sports":2}}'), { excluded: 2, merged: 3, reasons: { sports: 2 } });
  for (const header of ["bad", "null", '{"excluded":-1,"merged":0,"reasons":{}}', '{"excluded":0,"merged":0,"reasons":{"x":"1"}}']) assert.throws(() => parseSignalQuality(header));
});
test("a loaded report with an unavailable timestamp is not falsely described as missing", () => {
  const a = report("a", { timestamp: "" });
  assert.equal(resolveReport(a, [a]).retained, false);
  assert.equal(groupIncidents([a, report("b")]).length, 2);
});
test("structured observations differing only by location never lose records or collide", () => {
  const a = report("a", { source: "ACLED", url: "https://acleddata.com/data-export-tool",
    title: "ACLED Alert: Conflict event", description: "Event type: Unknown", category: "war" });
  const b = { ...a, location: { lat: 36, lng: 140 } };
  const result = consolidateReports([a, b]);
  assert.equal(result.length, 2);
  assert.equal(new Set(result.flatMap(event => event.provenance.map(record => record.id))).size, 2);
  assert.deepEqual(consolidateReports(result), result);
  assert.deepEqual(consolidateReports([b, a]), result);
  const nextPoll = consolidateReports([a, b].map(event => ({ ...event, timestamp: "2026-09-22T13:00:00Z" })));
  assert.deepEqual(new Set(nextPoll.map(event => event.id)), new Set(result.map(event => event.id)));
});
test("structured upstream identifiers distinguish colocated events and retain corrected observation versions", () => {
  const a = report("a", { source: "USGS", sourceEventId: "us7000abcd" });
  const b = { ...a, sourceEventId: "us7000efgh" };
  assert.equal(consolidateReports([a, b]).length, 2);
  const revised = { ...a, description: "Revised magnitude", location: { lat: 35.1, lng: 139.1 } };
  const combined = consolidateReports([a, revised]);
  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, consolidateReports([a])[0].id);
  assert.equal(combined[0].provenance.length, 2);
  assert.ok(combined[0].provenance.every(record => record.sourceEventId === a.sourceEventId));
});
test("real match emergencies survive either headline order without fiction or metaphor bypass", () => {
  for (const headline of [
    "Bombing at football match kills 20 people",
    "Football match bombing kills 20 people",
    "Evacuation of football match after bomb threat",
    "Terrorist attack at a school injures spectators",
    "Hospital evacuated after shooting",
  ]) assert.equal(assessSignalRelevance(headline, "", "RSS / Example").keep, true, headline);
  for (const headline of [
    "Movie trailer: bombing at football match kills 20 people",
    "Video game mission: bombing at football match kills 20 people",
    "Football striker on fire as fans celebrate match win",
    "Football match: team's attack bombs and defence collapses",
    "NFL quarterback throws a bomb to win the playoff match",
  ]) assert.equal(assessSignalRelevance(headline, "", "RSS / Example").keep, false, headline);
});
test("same canonical article reconciles wire-labelled and unattributed collections first", () => {
  const a = report("a", { source: "NewsAPI / Reuters", url: "https://reuters.com/world/dujuan?utm_source=news" });
  const b = { ...a, id: "b", source: "GDELT", url: "https://reuters.com/world/dujuan" };
  const result = consolidateReports([a, b]);
  assert.equal(result.length, 1);
  assert.equal(result[0].provenance.length, 2);
  assert.equal(result[0].id, consolidateReports([a])[0].id);
  assert.equal(result[0].id, consolidateReports([b])[0].id);
  assert.deepEqual(consolidateReports([b, a]), result);
  assert.deepEqual(consolidateReports(result), result);
  assert.deepEqual(consolidateReports([a, b, a]), result);
  assert.equal(processSignalFeed([a, b], false).quality.merged, 1);
  assert.equal(processSignalFeed([a, b, a, b], false).quality.merged, 1);
  assert.equal(processSignalFeed(result, false).quality.merged, 1);
  assert.equal(processSignalFeed([a, a], false).quality.merged, 0);
  assert.equal(consolidateReports([a, { ...b, title: b.title + " as a new warning is issued" }]).length, 2);
});
test("canonical copies plus explicit cross-URL syndication retain all provenance and navigable aliases", () => {
  const a = report("a", { source: "NewsAPI / Reuters", description: "Reuters reports: " + report("a").description });
  const b = { ...a, source: "GDELT" };
  const c = { ...a, id: "c", source: "RSS / Other", url: "https://other.example.org/story" };
  const result = consolidateReports([a, b, c]);
  assert.equal(result.length, 1);
  assert.equal(result[0].provenance.length, 3);
  assert.deepEqual(consolidateReports([c, b, a]), result);
  assert.deepEqual(consolidateReports(result), result);
  for (const record of [a, b, c]) assert.equal(resolveReport(consolidateReports([record])[0], result).retained, false);
  const unattributedDifferentUrl = report("unattributed", { source: "RSS / Another" });
  assert.equal(consolidateReports([report("source-only", { source: "NewsAPI / Reuters" }), unattributedDifferentUrl]).length, 2);
});
