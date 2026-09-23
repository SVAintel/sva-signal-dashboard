"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import { Event, VerificationFilter, isUnconfirmedSource } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import type { IncidentGroup } from "@/lib/incident-groups";
import { reportCollections, type SignalQuality } from "@/lib/signal-pipeline";
import { useResponsiveScrollAnchor } from "./useResponsiveScrollAnchor";

const reportTime = (event: Event) => Number.isFinite(Date.parse(event.timestamp))
  ? new Date(event.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })
  : "Time unavailable";

export default function EventList({
  events, loading, error, onSelectEvent, selectedEvent, verification, onVerificationChange,
  query, onQueryChange, groups, grouped, onGroupedChange, quality,
}: {
  events: Event[];
  loading: boolean;
  error?: string;
  onSelectEvent: (event: Event | null) => void;
  selectedEvent: Event | null;
  verification: VerificationFilter;
  onVerificationChange: (value: VerificationFilter) => void;
  query: string;
  onQueryChange: (value: string) => void;
  groups: IncidentGroup[];
  grouped: boolean;
  onGroupedChange: (value: boolean) => void;
  quality: SignalQuality | null;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const lastSelection = useRef<string | undefined>();
  const rows = useRef<HTMLDivElement>(null);
  useResponsiveScrollAnchor(rows, ".ledger-row, .ledger-incident-heading");
  useEffect(() => {
    if (lastSelection.current === selectedEvent?.id) return;
    lastSelection.current = selectedEvent?.id;
    const group = groups.find(item => item.reports.length > 1 && item.reports.some(report => report.id === selectedEvent?.id));
    if (group) setExpanded(previous => new Set(previous).add(group.id));
  }, [groups, selectedEvent?.id]);
  const renderReport = (event: Event, index: number, chronology = false) => {
    const meta = categoryMeta[event.category] || categoryMeta.general;
    const selected = selectedEvent?.id === event.id;
    const collections = reportCollections(event).length;
    return <button className={`ledger-row${selected ? " is-selected" : ""}`} key={event.id}
      aria-pressed={selected} onClick={() => onSelectEvent(event)}>
      <div className="ledger-row-top"><span className="ledger-category"><i style={{ background: meta.color }} />{meta.label}</span>
        <span className="ledger-index">{chronology ? "Report" : ""} {String(index + 1).padStart(2, "0")}</span></div>
      <h3>{event.title}</h3>
      {chronology && <p className="ledger-member-snippet">{event.description || "No summary supplied."}</p>}
      <div className="ledger-source"><span>{event.source}</span><ArrowRight size={14} aria-hidden="true" /></div>
      <div className="ledger-row-bottom">
        <time dateTime={event.timestamp || undefined}>{reportTime(event)}</time>
        <span className={isUnconfirmedSource(event.source) ? "ledger-unconfirmed" : ""}>{isUnconfirmedSource(event.source) ? "Unconfirmed" : "Confirmed"}</span>
        <span title="Report confidence">{event.confidence || "Unspecified"} confidence</span>
        {collections > 1 && <span>{collections} collection records</span>}
      </div>
    </button>;
  };

  return (
    <div className="ledger">
      <div className="ledger-controls">
        <label className="ledger-search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search signal titles, descriptions and sources" placeholder="Search this signal feed" value={query} onChange={(event) => onQueryChange(event.target.value)} />
          {query && <button aria-label="Clear signal search" onClick={() => onQueryChange("")}><X size={15} /></button>}
        </label>
        <div className="ledger-verification" aria-label="Source verification">
          {(["all", "confirmed", "unconfirmed"] as VerificationFilter[]).map((value) => (
            <button key={value} aria-pressed={verification === value}
              onClick={() => onVerificationChange(value)}>
              {value === "all" ? "All reports" : value === "confirmed" ? "Confirmed" : "Unconfirmed"}
            </button>
          ))}
        </div>
        <div className="ledger-context"><span>{loading ? "Retrieving reports" : `${events.length} unique reports`}</span>
          <label><span className="sr-only">Report arrangement</span><select aria-label="Report arrangement" value={grouped ? "grouped" : "reports"} onChange={event => onGroupedChange(event.target.value === "grouped")}>
            <option value="grouped">Likely incidents</option><option value="reports">Individual reports</option>
          </select></label>
        </div>
      </div>
      <div ref={rows} className="ledger-rows" aria-busy={loading}>
        {loading && <div className="desk-empty" role="status"><span className="desk-loading-line" /><h3>Gathering the latest reports</h3><p>The map is ready to explore while sources load.</p></div>}
        {!loading && events.length === 0 && (
          <div className="desk-empty">
            <Search size={24} />
            <h3>{error && events.length === 0 ? "The signal feed is unavailable" : "No reports in this view"}</h3>
            <p>{error && events.length === 0 ? "The last request failed. Use Refresh signals to try again." : "Try a wider time range, another category or a different search."}</p>
          </div>
        )}
        {!loading && !grouped && events.map((event, index) => renderReport(event, index))}
        {!loading && grouped && groups.map((group, index) => {
          if (group.reports.length === 1) return renderReport(group.latest, index);
          const open = expanded.has(group.id);
          const copies = group.reports.reduce((sum, report) => sum + reportCollections(report).length, 0);
          return <section className="ledger-incident" key={group.id} aria-label={`Likely incident: ${group.latest.title}`}>
            <button className="ledger-incident-heading" aria-expanded={open} aria-controls={`chronology-${group.id}`}
              onClick={() => setExpanded(previous => { const next = new Set(previous); if (next.has(group.id)) next.delete(group.id); else next.add(group.id); return next; })}>
              <span className="ledger-incident-label">Likely incident · automatic<ChevronDown size={16} /></span>
              <h3>{group.latest.title}</h3>
              <span>{group.reports.length} {group.reports.every(report => report.article?.identity !== "structured") ? "articles" : "reports"} · {copies} collection records</span>
              <time>{reportTime(group.reports[0])} – {reportTime(group.latest)}</time>
            </button>
            {open && <div className="ledger-chronology" id={`chronology-${group.id}`}>
              <p className="ledger-group-reason">{group.reason}. This is a reading aid, not independent corroboration. Oldest report first.</p>
              {group.reports.map((event, memberIndex) => renderReport(event, memberIndex, true))}
            </div>}
          </section>;
        })}
      </div>
      <details className="ledger-note">
        <summary>{quality ? `Feed cleanup · ${quality.excluded} omitted, ${quality.merged} merged` : "Source & grouping notes"}</summary>
        {quality && <p>Incoming collection items omitted: {Object.entries(quality.reasons).map(([reason, count]) => `${count} ${reason}`).join(", ") || "none"}. {quality.merged} repeated collection items were consolidated before source quotas. Counts cover the fetch, not the current filters.</p>}
        <p>Source labels do not independently verify claims. Collection records can be copies or revisions of one article, not independent witnesses. Likely incident groups use explicit named evidence; uncertain matches stay separate. Search and filters apply before groups and counts.</p>
      </details>
    </div>
  );
}
