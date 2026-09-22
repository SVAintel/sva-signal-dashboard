# SVA Signal Dashboard

Map-first, public-source intelligence workspace with AI-assisted analyst insights.

## Analyst workspace

The desktop workspace combines a compact navigation rail, resizable analyst dock,
and interactive map. The five analysis views are Signals, Insights, Markets,
Analyst, and Patterns. On phones, the bottom navigation switches between the map,
workspace, and live broadcasts; the workspace selector exposes all five views.

- **Signals:** an event ledger with source, report date, category, verification
  label and confidence. Search applies to the visible feed's titles, descriptions
  and sources. Search, category, time and verification filters apply to the map,
  dossier context and incident members before grouping or counting.
- **Map controls:** categories, time range, context layers and 2D/3D projection
  share one toolbar. Layer controls include base/port importance and fleet region
  filters. Category color does not indicate event severity.
- **Reading details:** select a signal for its brief, then open Sources & evidence,
  Related reporting, or Analysis & questions. Source and related-report lists open
  another report without losing the path. Back (or Escape / Alt+Left while focused
  in the sheet) restores the prior sheet, matching-reason filter, scroll and focus.
  Breadcrumbs return to an ancestor; Close exploration returns to the overview.
  A fresh map/ledger selection starts a new path. Asset and country details retain
  their existing map-popup entry points.
- **Preferences:** signed-in accounts retain filters, dock width and audio volume.
  Map projection and scan-sweep choice are stored locally. Reduced-motion settings
  suppress the sweep, marker pulses and automatic globe rotation.
- **Feed status:** the header and footer report loading, the last successful
  fetch, or failed updates. An unavailable feed is not shown as online.

The entry-page atlas is an original static reference illustration, not live
activity. Its country geometry comes from [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)
(public domain), with cable routes from the repository's existing reference
dataset. The operational map remains interactive: MapLibre renders OpenFreeMap
vector tiles through the Leaflet bridge, while Leaflet retains the event and
infrastructure overlays. On-map provider attribution remains visible.
MapLibre is pinned to 5.24.0 because the 6.x/OpenFreeMap combination can stall
before requesting vector tiles ([upstream report](https://github.com/maplibre/maplibre-gl-js/issues/8402)).

The interface takes workflow cues from [ArcGIS Mission](https://learn.arcgis.com/en/projects/get-started-with-arcgis-mission/),
[NASA Open MCT](https://nasa.github.io/openmct/) and
[Kepler.gl](https://docs.kepler.gl/docs/user-guides/b-kepler-gl-workflow):
map-first context, composed information views and explicit layer visibility.
It does not reuse their branding or interface assets.

### Report dossiers

Source dossiers expose only supplied source fields and article links. Background
resources are explicitly not event citations; missing/invalid article URLs are
shown as unavailable. Nothing is scraped or represented as new corroboration.

Related candidates use the **current category, time, verification and text-search filters**.
Candidates must be within 24 hours of the selected
report and share a source label, a specific category (not General), or reported
coordinates within 300 km. They are ranked by number of matches, proximity
eligibility, time difference, recency and ID; at most eight appear. Source-only
lists show up to twelve other reports, newest first, from the full selected time
range. Both lists exclude self, duplicate IDs and invalid timestamps/coordinates.
These are navigation rules, not incident matching, country attribution or causal
analysis. Each result states why it appears.

Polling resolves report IDs to current data without resetting the exploration.
If a report disappears, the latest available snapshot is retained with a notice.
Changing filters never changes the report being read, but immediately scopes its
context lists. Report AI conversations are scoped to the exact report version;
leaving a conversation cancels its pending request and guards against late replies.
Completed conversations and drafts remain available when returning to that version.
On phones a sheet is full-screen, traps keyboard focus and makes covered workspace
controls inert; desktop sheets leave the ledger and map usable.

## Data and interpretation

### Signal quality, copies and likely incidents

These are three distinct operations, not a confidence score:

- **Relevance:** an explainable, conservative phrase/context policy removes clear
  routine sport, entertainment/fiction, gaming, lifestyle and promotional items.
  Real venue emergencies, disaster disruption, public-health outbreaks, cyber
  incidents and public-policy actions remain eligible. Generic “attack”, “strike”
  or “breaking” does not override sport/fiction context. Ambiguous reports stay.
  Structured USGS, EMSC, ACLED and market observations bypass news wording rules.
  The shared pipeline rechecks cached news collections before source/category
  quotas and before history or fleet-context consumers. Insights research feeds
  are separate and unchanged. Telegram translation is limited to six recent
  non-Latin posts per channel; untranslated ambiguous posts are retained.
- **Article consolidation:** safe HTTP(S) URLs lose fragments and known tracking
  parameters, not article-identifying query parameters. URL plus the complete
  normalized headline identifies distinctive articles. Generic/live headlines
  additionally need the same UTC publication day and summary. Changed headlines
  at a reused URL stay separate; changed summaries/times under an unchanged
  distinctive headline remain verbatim collection records on that article.
  Missing links need a sufficiently long identical headline/summary, matching
  publisher attribution and publication day; otherwise records stay separate.
  Canonical URL copies reconcile before any syndication matching, regardless of
  collection-specific attribution. Identical syndicated text with explicit wire
  attribution in the shared summary can additionally consolidate across URLs;
  a provider label alone cannot establish syndication. Canonical IDs remain as
  aliases so open reports survive that merge. Structured records preserve supplied
  upstream event identifiers, or distinguish observation coordinates when no ID
  is available. Distinct colocated upstream observations remain separate.
  Stable IDs do not depend on feed order, numeric array position or confidence.
  The source dossier exposes each original provider, publisher/link host,
  title, URL, timestamp, summary, classification and supplied confidence.
- **Likely incidents:** conservative automatic groups currently recognize a
  named storm plus the same explicitly stated location set and reporting year;
  a flight number plus crash/hijacking action, stated locations and UTC day; or
  the same explicit USGS event identifier. Members must be within 72 hours of
  the newest matching report; older items stay individual, rather than chaining
  the window through intermediate reports. Same country, category, approximate coordinates,
  generic actions or shared “war” vocabulary are insufficient. No transitive
  proximity chains, confidence ranking or independent-corroboration claims are
  used. Ambiguous stories remain individual reports and can still be explored
  through the broader Related reporting view.

The ledger can expand a likely group's oldest-to-newest **reporting chronology**,
or switch to Individual reports. A group's headline is its newest supplied
headline. Unique articles/reports and collected records are counted separately;
copies and revisions are not additional witnesses. Incident chronology is also
a dossier step, preserving Back/breadcrumb navigation when opening a member.
Grouped maps display the newest report's coordinates, or the selected member's
coordinates, not an inferred incident centroid. The footer distinguishes unique
reports from map entries. Ungrouping restores each report marker.

The API retains its `Event[]` contract with optional `article` and `provenance`
metadata; `X-SVA-Signal-Quality` reports actual excluded-item reasons and merged
collection counts for that fetch, before quotas and UI filters. RSS is bounded
to 120 items per feed, GDELT to 60 returned records and Telegram to 60 parsed posts
per channel. NewsAPI/RSS category quotas and Telegram channel quotas are applied
after relevance/consolidation, not consumed by excluded items or article copies.
Legacy history is normalized non-destructively on read before pattern/AI inputs;
new news collections retain separate original records in the existing history
table. No schema migration, backfill or historical cleanup is required.

Events refresh every 30 minutes, with a manual refresh control. Context layers
have their own refresh intervals. A successful fetch means the feed was retrieved,
not that every underlying article is new or independently verified. Telegram
sources retain the existing unconfirmed classification; other feeds retain their
confirmed-source classification. Map positions may be approximate.

Event details separate original reporting from generic category research prompts
and optional AI conversation. Pattern scores are an open-ended composite, not a
calibrated probability or proof of causality. Market quotes are reference snapshots,
not a live trading feed. Broadcast availability depends on external providers.

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Maps**: MapLibre GL + Leaflet/React-Leaflet; Three.js globe
- **State Management**: Zustand
- **API Client**: Axios
- **Deployment**: Vercel (Hobby Plan)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Use a private, ignored `.env.local` for the existing data-provider, database,
authentication and AI configuration required by your deployment. Do not commit
credentials. Available data and AI features depend on those integrations;
unavailable services should not be represented as healthy or replaced with
fabricated activity.

## Project Structure

```
app/
  ├── page.tsx           # Main entry point
  ├── layout.tsx         # Root layout
  ├── globals.css        # Global styles
  └── api/
      └── events/route.ts  # Aggregated source reports
components/
  ├── Dashboard.tsx      # Main dashboard component
  ├── WorldMap.tsx       # Interactive map
  ├── EventList.tsx      # Event sidebar
  └── ProfileSelector.tsx # User profile selection
store/
  └── useStore.ts        # Zustand state management
```

## API Endpoints

### GET /api/events

Returns the aggregate report feed. Profile, category, time, verification and
visible-feed search filtering are handled by the workspace.

Returns:
```json
[
  {
    "id": "1",
    "title": "Event Title",
    "category": "war",
    "location": { "lat": 0, "lng": 0 },
    "source": "Reuters",
    "timestamp": "2024-07-26T00:00:00Z",
    "description": "Event description",
    "profiles": ["osint", "military"],
    "aiNotes": "Analysis notes",
    "confidence": "high"
  }
]
```

## Development

### Build

```bash
npm run build
```

To check a production build without writing into a running development server's
output, use a separate output directory (PowerShell):

```powershell
$env:SVA_NEXT_OUTPUT_DIR = ".next-check"
npm.cmd run build
```

### Report exploration tests

```bash
npm run test:report-exploration
npm run test:signal-quality
npx tsc --noEmit
```

The focused tests use Node's built-in test runner and the existing TypeScript
compiler; they do not install a test framework or contact external services.

### Lint

```bash
npm run lint
```

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel --prod
```

## Interaction and accessibility

The analyst dock divider supports arrow-key resizing. Popovers and details close
with Escape; selection and navigation controls expose accessible labels. The
account form preserves credential sign-in and signup. Ambient audio is optional,
with an explicit play control and keyboard-accessible volume slider.
