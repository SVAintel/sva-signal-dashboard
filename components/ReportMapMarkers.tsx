"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { ArrowUpRight, X } from "lucide-react";
import type { Event } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import { reportSymbol } from "@/lib/map-symbols";
import { clusterReports, type ReportMapPoint } from "@/lib/spatial-reports";

function reportAge(timestamp: string) {
  const elapsed = Date.now() - Date.parse(timestamp);
  if (!Number.isFinite(elapsed)) return "Time unavailable";
  if (elapsed < 0) return "Future timestamp supplied";
  const hours = Math.floor(elapsed / 3600000);
  return hours < 1 ? `${Math.floor(elapsed / 60000)}m ago` : hours < 48 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function MapPin({ point, onPreview, onKeyboardPreview, quiet }: {
  point: ReportMapPoint; onPreview: () => void; onKeyboardPreview: () => void; quiet: boolean;
}) {
  const marker = useRef<L.Marker>(null);
  const report = point.reports[0];
  const label = `${report.title}. ${report.source}. Open report preview`;
  const icon = useMemo(() => {
    const symbol = reportSymbol({ category: report.category, selected: point.selected });
    return L.divIcon({ className: `report-map-marker${point.selected ? " is-selected" : ""}${quiet ? " is-quiet" : ""}`,
      html: symbol.html, iconSize: [symbol.size, symbol.size], iconAnchor: symbol.anchor });
  }, [point.selected, report.category, quiet]);
  useEffect(() => {
    const element = marker.current?.getElement();
    if (!element) return;
    element.setAttribute("aria-label", label);
    element.setAttribute("aria-haspopup", "dialog");
    const focus = () => onPreview();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        onKeyboardPreview();
      }
    };
    element.addEventListener("focus", focus);
    element.addEventListener("keydown", keydown);
    return () => {
      element.removeEventListener("focus", focus);
      element.removeEventListener("keydown", keydown);
    };
  }, [label, icon, onPreview, onKeyboardPreview]);
  return <Marker ref={marker} position={[point.lat, point.lng]} icon={icon}
    zIndexOffset={point.selected ? 1200 : 0}
    eventHandlers={{ click: onPreview }}>
    {point.selected && <Tooltip permanent direction="top" offset={[0, -12]} className="report-map-anchor">
      {report.title.length > 60 ? `${report.title.slice(0, 57)}...` : report.title}
    </Tooltip>}
  </Marker>;
}

type Preview = { reportId: string };

export default function ReportMapMarkers({ events, selectedId, onSelectEvent, reportGroupCounts, reducedMotion }: {
  events: Event[]; selectedId?: string; onSelectEvent: (event: Event) => void;
  reportGroupCounts: Record<string, number>; reducedMotion: boolean;
}) {
  const map = useMap();
  const [view, setView] = useState(() => ({ zoom: map.getZoom(), centerLongitude: map.getCenter().lng }));
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewElement = useRef<HTMLElement>(null);
  const initiatingElement = useRef<HTMLElement | null>(null);
  const restoringFocus = useRef(false);
  const [clock, setClock] = useState(0);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const zoom = map.getZoom(), centerLongitude = map.getCenter().lng;
        setView(previous => previous.zoom === zoom && previous.centerLongitude === centerLongitude ? previous : { zoom, centerLongitude });
      });
    };
    map.on("moveend zoomend resize", update);
    return () => { cancelAnimationFrame(frame); map.off("moveend zoomend resize", update); };
  }, [map]);
  useEffect(() => {
    if (!preview) return;
    const timer = setInterval(() => setClock(value => value + 1), 60000);
    return () => clearInterval(timer);
  }, [preview]);
  const points = useMemo(() => clusterReports(events, { ...view, selectedId }), [events, view, selectedId]);
  const byId = useMemo(() => new Map(points.flatMap(point => point.reports).map(event => [event.id, event])), [points]);
  const previewReport = preview?.reportId ? byId.get(preview.reportId) : undefined;
  const hasPreview = !!previewReport;
  const close = useCallback((restore = false) => {
    setPreview(null);
    if (restore) {
      restoringFocus.current = true;
      (initiatingElement.current?.isConnected ? initiatingElement.current : map.getContainer())?.focus({ preventScroll: true });
      restoringFocus.current = false;
    }
  }, [map]);
  useEffect(() => { setPreview(null); }, [selectedId]);
  useEffect(() => {
    if (!hasPreview) return;
    const element = previewElement.current;
    if (!element) return;
    L.DomEvent.disableClickPropagation(element);
    L.DomEvent.disableScrollPropagation(element);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    };
    map.getContainer().addEventListener("keydown", keydown);
    return () => map.getContainer().removeEventListener("keydown", keydown);
  }, [hasPreview, close, map]);
  useEffect(() => {
    const dismiss = () => close();
    map.on("click", dismiss);
    return () => { map.off("click", dismiss); };
  }, [map, close]);
  const show = (point: ReportMapPoint, keyboard = false) => {
    if (restoringFocus.current) return;
    if (document.activeElement instanceof HTMLElement) initiatingElement.current = document.activeElement;
    setPreview({ reportId: point.reports[0].id });
    if (keyboard) requestAnimationFrame(() => previewElement.current?.querySelector<HTMLElement>("[data-preview-primary]")?.focus());
  };
  const timestamp = previewReport && Number.isFinite(Date.parse(previewReport.timestamp)) ? new Date(previewReport.timestamp).toLocaleString() : "Time unavailable";
  void clock;
  void reducedMotion;
  return <>
    {points.map(point => <MapPin key={point.id} point={point} quiet={!!selectedId && !point.selected}
      onPreview={() => show(point)} onKeyboardPreview={() => show(point, true)} />)}
    {hasPreview && previewReport && createPortal(<section ref={previewElement} className="report-map-preview" role="dialog" aria-label="Map report preview">
      <header>
        <span>Report preview</span>
        <button className="desk-icon-button" aria-label="Close map preview" onClick={() => close(true)}><X size={17} /></button>
      </header>
      <div className="report-preview-content">
        <span className="report-preview-category">{categoryMeta[previewReport.category]?.label || "General"}</span>
        <h3>{previewReport.title}</h3>
        <p className="report-preview-source">{previewReport.source}</p>
        <time dateTime={timestamp === "Time unavailable" ? undefined : previewReport.timestamp} title={timestamp} aria-label={timestamp}>{reportAge(previewReport.timestamp)}</time>
        <p className="report-preview-coordinate">Reported coordinates; may be approximate</p>
        {reportGroupCounts[previewReport.id] > 1 && <p className="report-preview-context">Part of a likely incident group with {reportGroupCounts[previewReport.id]} reports. Inspect the chronology in its brief.</p>}
        <button data-preview-primary className="report-preview-open" onClick={() => { close(); onSelectEvent(previewReport); }}>Open report<ArrowUpRight size={16} /></button>
      </div>
    </section>, map.getContainer())}
  </>;
}
