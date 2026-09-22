"use client";

import { Dispatch, useMemo, useRef } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight, FileSearch, MessageSquare, Network } from "lucide-react";
import { Event, isUnconfirmedSource } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import { categoryGuidance } from "@/lib/report-guidance";
import { articleUrl, CONTEXT_DISTANCE_KM, CONTEXT_WINDOW_HOURS, relatedReports, resolveReport, sourceReports, validCoordinates, validReportTime, type Relation, type RelatedReport } from "@/lib/report-context";
import { reportViewLabels, type ReportNavigation, type ReportNavigationAction, type ReportView } from "@/lib/report-navigation";
import DetailFrame from "./DetailFrame";
import ReportAnalysis, { ReportConversation } from "./ReportAnalysis";
import type { IncidentGroup } from "@/lib/incident-groups";
import { reportCollections } from "@/lib/signal-pipeline";

interface EventDetailPanelProps {
  navigation: ReportNavigation;
  dispatch: Dispatch<ReportNavigationAction>;
  loadedEvents: Event[];
  scopedEvents: Event[];
  scopeLabel: string;
  feedError: string;
  feedLoading: boolean;
  groups: IncidentGroup[];
}
const dateLabel = (event: Event) => validReportTime(event)
  ? new Date(event.timestamp).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  : "Timestamp unavailable";
const categoryLabel = (event: Event) => categoryMeta[event.category]?.label || event.category;
const confidenceLabel = (event: Event) => event.confidence?.trim() || "Not supplied";
const verificationLabel = (event: Event) => isUnconfirmedSource(event.source) ? "Unconfirmed source" : "Confirmed-source feed";

export default function EventDetailPanel({ navigation, dispatch, loadedEvents, scopedEvents, scopeLabel, feedError, feedLoading, groups }: EventDetailPanelProps) {
  const body = useRef<HTMLDivElement>(null);
  const conversations = useRef(new Map<string, ReportConversation>());
  const location = navigation.entries[navigation.entries.length - 1];
  const resolution = resolveReport(location.snapshot, loadedEvents);
  const event = scopedEvents.find(report => report.id === location.snapshot.id) || resolution.event;
  const retained = resolution.retained;
  const incident = groups.find(group => group.reports.length > 1 && group.reports.some(report => report.id === event.id));
  const collections = reportCollections(event);
  const related = useMemo(() => relatedReports(event, scopedEvents, location.relation), [event, scopedEvents, location.relation]);
  const allRelated = useMemo(() => relatedReports(event, scopedEvents), [event, scopedEvents]);
  const source = useMemo(() => sourceReports(event, scopedEvents), [event, scopedEvents]);
  const url = articleUrl(event.url);
  const guidance = categoryGuidance(event.category);
  const currentInScope = scopedEvents.some((report) => report.id === event.id);
  const depth = navigation.entries.length;
  const close = () => dispatch({ type: "close" });
  const back = () => dispatch({ type: "back" });
  const open = (view: ReportView, report = event) => {
    const focused = document.activeElement;
    dispatch({ type: "push", event: report, view, position: {
      scrollTop: body.current?.scrollTop || 0,
      focusId: focused instanceof HTMLElement ? focused.dataset.reportFocus || null : null,
    } });
  };
  const conversationKey = JSON.stringify(event);

  const contextScope = <div className="dossier-scope">
    <strong>Current signal scope</strong>
    <p>{scopeLabel}. Category, time, verification and text search are applied before matching.</p>
    {feedLoading && <p role="status">The signal feed is loading.</p>}
    {feedError && <p className="surface-error" role="status">The latest fetch failed. Context uses the last loaded reports.</p>}
  </div>;

  const reportLink = (report: Event, reasons?: RelatedReport) => <button
    key={report.id} data-report-focus={`report-${report.id}`} className="dossier-report-link"
    onClick={() => open("brief", report)} aria-label={`Open report: ${report.title}`}>
    <span className="dossier-report-category">{categoryLabel(report)}<ArrowRight size={16} /></span>
    <strong>{report.title}</strong>
    {reasons && <span className="dossier-reasons">
      {reasons.sameSource && <span>Same source</span>}
      {reasons.sameCategory && <span>Same category</span>}
      {reasons.distanceKm !== null && <span>Nearby reported coordinates · {Math.round(reasons.distanceKm)} km</span>}
    </span>}
    <span className="dossier-report-meta">{report.source} · {dateLabel(report)}</span>
  </button>;

  return <DetailFrame title={location.view === "brief" ? event.title : location.view === "source" ? event.source || "Source not supplied" : reportViewLabels[location.view]}
    eyebrow={location.view === "brief" ? `${categoryLabel(event)} / Selected report` : "Report dossier"}
    onClose={close} closeLabel="Close exploration" onBack={back} depth={depth}
    viewKey={location.key} bodyRef={body} scrollTop={location.scrollTop} focusId={location.focusId}
    navigation={<nav className="dossier-breadcrumbs" aria-label="Report exploration">
      <ol>
        <li><button onClick={close}>Overview</button></li>
        {navigation.entries.map((entry, index) => <li key={entry.key}>
          <ChevronRight size={12} aria-hidden="true" />
          {index === depth - 1 ? <span aria-current="page">{reportViewLabels[entry.view]}</span> :
            <button title={entry.snapshot.title} aria-label={`Return to ${reportViewLabels[entry.view]}: ${entry.snapshot.title}`}
              onClick={() => dispatch({ type: "jump", key: entry.key })}>{reportViewLabels[entry.view]}</button>}
        </li>)}
      </ol>
    </nav>}
    context={location.view !== "brief" ? <div className="dossier-parent-context">
      <span>Reading within</span><p>{event.title}</p>
    </div> : depth > 1 ? <div className="dossier-parent-context">
      <span>Opened from {reportViewLabels[navigation.entries[depth - 2].view].toLowerCase()}</span>
      <p>{navigation.entries[depth - 2].snapshot.title}</p>
    </div> : undefined}>
    <div className="detail-content">
      {retained && <p className="dossier-notice" role="status">This report is no longer in the loaded feed. Its last opened snapshot is retained for this exploration.</p>}
      {!retained && !currentInScope && <p className="dossier-notice" role="status">This selected report is outside the current filters. Context lists still follow your current filters.</p>}

      {location.view === "brief" && <>
        <div className="report-brief-source"><BookOpen size={15} /><strong>{event.source || "Source not supplied"}</strong><span>{verificationLabel(event)}</span></div>
        <div className="report-brief-facts">
          <div><span>Reported</span><p>{dateLabel(event)}</p></div>
          <div><span>Supplied confidence</span><p>{confidenceLabel(event)}</p></div>
        </div>
        <section className="report-brief-summary"><h3>What the report says</h3>
          <p>{event.description?.trim() || "No summary was supplied. Check the original reporting if a source link is available."}</p>
        </section>
        <div className="dossier-entry-points">
          {incident && <button data-report-focus="incident" onClick={() => open("incident")}><Network size={20} />
            <span><strong>Incident chronology</strong><small>{incident.reports.length} distinct reports · automatically grouped, not corroborated</small></span><ChevronRight size={17} /></button>}
          <button data-report-focus="sources" onClick={() => open("sources")}><FileSearch size={20} />
            <span><strong>Sources &amp; evidence</strong><small>{url ? "Original link, provenance & limitations" : "Provenance & missing source information"}</small></span><ChevronRight size={17} /></button>
          <button data-report-focus="related" onClick={() => open("related")}><Network size={20} />
            <span><strong>Related reporting</strong><small>{allRelated.total} scoped {allRelated.total === 1 ? "candidate" : "candidates"} · explore the context</small></span><ChevronRight size={17} /></button>
          <button data-report-focus="analysis" onClick={() => open("analysis")}><MessageSquare size={20} />
            <span><strong>Analysis &amp; questions</strong><small>AI conversation & category research prompts</small></span><ChevronRight size={17} /></button>
        </div>
        <p className="detail-disclaimer">A report, not an established fact. Source labels and supplied confidence do not independently verify its claims.</p>
      </>}

      {location.view === "sources" && <>
        <p className="dossier-intro">Follow the provenance before drawing conclusions. These are the source fields supplied with this report, not additional evidence gathered by SVA.</p>
        <section className="dossier-evidence">
          <span className="dossier-section-label">Original reporting</span>
          <h3>{event.source || "Source not supplied"}</h3>
          {url ? <a className="dossier-external-link" href={url} target="_blank" rel="noopener noreferrer">
            <span>Open original report<small>{new URL(url).hostname}</small></span><ArrowUpRight size={20} />
          </a> : <p className="dossier-notice">{event.url ? "The supplied article link is not a valid HTTP or HTTPS address." : "No original article URL was supplied."} This view cannot establish the original article or corroborate the report.</p>}
          <dl className="dossier-evidence-facts">
            <div><dt>Reported timestamp</dt><dd>{dateLabel(event)}</dd></div>
            <div><dt>Supplied confidence</dt><dd>{confidenceLabel(event)}</dd></div>
            <div><dt>Source classification</dt><dd>{verificationLabel(event)}</dd></div>
            <div><dt>Reported coordinates</dt><dd>{validCoordinates(event.location) ? `${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°` : "Valid coordinates not supplied"}</dd></div>
          </dl>
        </section>
        <section className="dossier-limitations"><h3>What this does not establish</h3>
          <p>Source labels distinguish Telegram from other feeds, not verified facts from false claims. Confidence is the report&apos;s supplied label, not a probability of truth. Coordinates may be inferred or approximate.</p>
          <p>No full article text has been retrieved for this dossier. Other items from this source are not independent corroboration.</p>
        </section>
        <section className="dossier-collections" aria-label="Collection provenance">
          <h3>{collections.length} collected {collections.length === 1 ? "record" : "records"}</h3>
          <p>These are this feed&apos;s original collection fields. Copies and captured revisions of the same article are retained together, not counted as independent confirmation. Expand each record to compare the supplied summaries.</p>
          {collections.slice().reverse().map((record, index) => {
            const link = articleUrl(record.url);
            return <details key={record.id} className="dossier-collection">
              <summary><span>{index + 1}. {record.source}</span><time>{dateLabel(record)}</time></summary>
              <h4>{record.title}</h4>
              <dl className="dossier-evidence-facts">
                <div><dt>Collection provider</dt><dd>{record.provider}</dd></div>
                <div><dt>Publisher / link host</dt><dd>{record.publisher || "Not supplied"}</dd></div>
                <div><dt>Source classification</dt><dd>{verificationLabel(record)}</dd></div>
                <div><dt>Supplied confidence</dt><dd>{confidenceLabel(record)}</dd></div>
              </dl>
              <p>{record.description || "No summary supplied with this collection."}</p>
              {link ? <a href={link} target="_blank" rel="noopener noreferrer">Open this collection&apos;s original link <ArrowUpRight size={14} /></a> :
                <p className="dossier-notice">No valid original article URL was supplied with this collection.</p>}
            </details>;
          })}
        </section>
        <button className="dossier-source-button" data-report-focus="source" onClick={() => open("source")}>
          <span><strong>More from {event.source || "this source"}</strong><small>{source.total} other loaded {source.total === 1 ? "report" : "reports"} in the current scope</small></span><ChevronRight size={18} />
        </button>
        {guidance.additionalSources.length > 0 && <section className="detail-section">
          <h3 className="detail-section-title">Background resources</h3>
          <p className="detail-disclaimer">Category references only. These are not citations for this report or evidence of corroboration.</p>
          <div className="dossier-background-links">{guidance.additionalSources.map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noopener noreferrer">
            <span>{reference.name}<small>{reference.title}</small></span><ArrowUpRight size={16} />
          </a>)}</div>
        </section>}
      </>}

      {location.view === "related" && <>
        <p className="dossier-intro">Other reports worth reading alongside this one. Similar metadata is a navigation aid, not proof of the same incident, a causal link or independent corroboration.</p>
        {contextScope}
        <label className="dossier-relation-filter">Show candidates by
          <select data-report-focus="relation" aria-label="Related reporting match" value={location.relation}
            onChange={(e) => dispatch({ type: "relation", relation: e.target.value as Relation })}>
            <option value="all">All matching reasons</option><option value="source">Same source</option>
            <option value="category">Same specific category</option><option value="nearby">Nearby reported coordinates</option>
          </select>
        </label>
        <p className="dossier-list-count">Showing {related.reports.length} of {related.total} candidates</p>
        {related.reports.length ? <div className="dossier-report-list">{related.reports.map((item) => reportLink(item.event, item))}</div> :
          <div className="dossier-empty"><Network size={24} /><h3>No matching reports in this scope</h3><p>{validReportTime(event) ? "Try another matching reason or change the map filters yourself. This does not mean there are no related events elsewhere." : "This report has no valid timestamp, so a time-bounded comparison cannot be made."}</p></div>}
        <details className="dossier-method"><summary>How these candidates are selected</summary>
          <p>Loaded reports within {CONTEXT_WINDOW_HOURS} hours of this report, sharing a source, a specific category (not General), or reported coordinates within {CONTEXT_DISTANCE_KM} km. Ranked by number of matching reasons, then proximity eligibility, time difference, recency and ID. At most 8 results are shown.</p>
          <p>Reports with invalid timestamps or coordinates and duplicate IDs are excluded. Coordinates may be inferred; proximity is not proof of a shared incident or country.</p>
        </details>
      </>}

      {location.view === "incident" && <>
        <p className="dossier-intro">A likely incident, grouped automatically from explicit named evidence. Each entry remains a distinct report. Similar accounts can share an upstream source; they do not establish independent corroboration or a verified sequence of events.</p>
        {contextScope}
        {incident ? <>
          <div className="dossier-scope"><strong>Why these reports are together</strong><p>{incident.reason}.</p></div>
          <p className="dossier-list-count">{incident.reports.length} unique reports · {incident.reports.reduce((sum, report) => sum + reportCollections(report).length, 0)} collection records · oldest reported timestamp first</p>
          <div className="dossier-report-list">{incident.reports.map(report => <div className="dossier-chronology-entry" key={report.id}>
            {reportLink(report)}<p>{report.description || "No summary supplied."}</p>
          </div>)}</div>
          <p className="detail-disclaimer">Reported times are not necessarily incident times. Differing summaries are displayed as supplied, not adjudicated as contradictions. Use Individual reports in the ledger to remove this grouping.</p>
        </> : <div className="dossier-empty"><Network size={24} /><h3>No multi-report group in the current scope</h3><p>The other members may no longer match your filters or the latest feed. This report and its exploration path are retained; filters have not been changed.</p></div>}
      </>}

      {location.view === "source" && <>
        <p className="dossier-intro">Other loaded reports carrying the same source label. A source label may identify an aggregator, not an individual publisher or an independent witness.</p>
        {contextScope}
        <p className="dossier-list-count">Showing {source.reports.length} of {source.total} other reports · newest first</p>
        {source.reports.length ? <div className="dossier-report-list">{source.reports.map((report) => reportLink(report))}</div> :
          <div className="dossier-empty"><BookOpen size={24} /><h3>No other reports from this source</h3><p>None with valid timestamps and map coordinates are present in the current filtered feed. Filters have not been changed.</p></div>}
        <p className="detail-disclaimer">Up to 12 unique reports with valid timestamps and coordinates, excluding the selected report. Unlike related candidates, this source list uses the full selected time range, not a separate 24-hour comparison window.</p>
      </>}

      {location.view === "analysis" && <ReportAnalysis key={`${location.key}-${conversationKey}`} event={event}
        saved={conversations.current.get(conversationKey)} onSave={(conversation) => conversations.current.set(conversationKey, conversation)} />}
    </div>
  </DetailFrame>;
}
