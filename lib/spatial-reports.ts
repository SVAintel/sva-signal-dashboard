import type { Event } from "./types";
import { validCoordinates } from "./report-context";

export const REPORT_MAX_ZOOM = 8;
export interface ReportMapPoint {
  id: string;
  reports: Event[];
  lat: number;
  lng: number;
  selected: boolean;
}

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const timestamp = (event: Event) => Number.isFinite(Date.parse(event.timestamp)) ? Date.parse(event.timestamp) : 0;
export const longitudeNear = (longitude: number, reference: number) =>
  longitude + Math.round((reference - longitude) / 360) * 360;

export function uniqueMappableReports(events: readonly Event[]): Event[] {
  const seen = new Set<string>();
  return events.filter(event => event.id.trim() && validCoordinates(event.location)).slice()
    .sort((a, b) => compare(a.id, b.id) || timestamp(b) - timestamp(a) || compare(JSON.stringify(a), JSON.stringify(b)))
    .filter(event => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
}

export function reportBounds(events: readonly Event[], centerLongitude: number) {
  const points = events.filter(event => validCoordinates(event.location));
  if (!points.length) return null;
  const longitudes = points.map(event => longitudeNear(event.location.lng, centerLongitude));
  return {
    south: Math.min(...points.map(event => event.location.lat)),
    north: Math.max(...points.map(event => event.location.lat)),
    west: Math.min(...longitudes), east: Math.max(...longitudes),
  };
}

// Every unique mappable report gets its own marker; reports are never merged into a
// count-based cluster. Reports whose screen positions would otherwise sit on top of
// each other (identical or near-identical coordinates) are nudged apart in a small
// deterministic spiral so each stays independently reachable by pointer, keyboard and touch.
const OVERLAP_RADIUS = 20;
// Marker icons render at 24px (map-symbols.ts TARGET_SIZE) — adjacent spread points
// need at least this much center-to-center distance, plus a little slack, or their
// clickable areas overlap and only the topmost marker in a dense group is reachable.
const MIN_MARKER_SPACING = 28;
// A fixed on-screen spacing covers a much larger real-world distance when zoomed out (few
// screen pixels span huge stretches of ground), so grouped reports used to get nudged many
// degrees away from their true coordinates while the map was zoomed out. Ramping the spacing
// down at low zoom keeps that drift small; it reaches the full click-friendly spacing once
// zoomed in to SPACING_FULL_ZOOM, where the smaller real-world distance per pixel matters more
// than the trimmed screen spacing.
const SPACING_FULL_ZOOM = 4;
const MIN_MARKER_SPACING_AT_ZOOM_0 = 4;

export function clusterReports(events: readonly Event[], options: {
  zoom: number; centerLongitude: number; selectedId?: string;
}): ReportMapPoint[] {
  const zoom = Math.max(0, Math.min(REPORT_MAX_ZOOM, Number.isFinite(options.zoom) ? options.zoom : 0));
  const scale = 256 * 2 ** zoom;
  const minMarkerSpacing = zoom >= SPACING_FULL_ZOOM ? MIN_MARKER_SPACING
    : MIN_MARKER_SPACING_AT_ZOOM_0 + (MIN_MARKER_SPACING - MIN_MARKER_SPACING_AT_ZOOM_0) * (zoom / SPACING_FULL_ZOOM);
  const reference = Number.isFinite(options.centerLongitude) ? options.centerLongitude : 0;
  const points = uniqueMappableReports(events).map(event => {
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, event.location.lat));
    const longitude = longitudeNear(event.location.lng, reference);
    const sine = Math.sin(latitude * Math.PI / 180);
    return { event, longitude, x: scale * (longitude + 180) / 360,
      y: scale * (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) };
  });
  type Point = typeof points[number];
  const toLatLng = (x: number, y: number) => ({
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale))) * 180 / Math.PI,
    lng: (x / scale) * 360 - 180,
  });
  const groups: Point[][] = [];
  const grid = new Map<string, Point[][]>();
  for (const point of points) {
    const cellX = Math.floor(point.x / OVERLAP_RADIUS), cellY = Math.floor(point.y / OVERLAP_RADIUS);
    const candidates: Point[][] = [];
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) candidates.push(...(grid.get(`${x}:${y}`) || []));
    }
    // Fixed anchors avoid a chain of nearby points dragging in distant reports.
    const match = candidates.find(group => Math.hypot(point.x - group[0].x, point.y - group[0].y) < OVERLAP_RADIUS);
    if (match) match.push(point);
    else {
      const group = [point];
      groups.push(group);
      const key = `${cellX}:${cellY}`;
      grid.set(key, [...(grid.get(key) || []), group]);
    }
  }
  const result: ReportMapPoint[] = [];
  for (const group of groups) {
    const foundSelected = group.findIndex(point => point.event.id === options.selectedId);
    const anchorIndex = foundSelected >= 0 ? foundSelected : 0;
    // The anchor stays put at the center; the rest sit on a ring around it. The ring
    // radius itself is the anchor-to-ring distance, so it must be at least
    // minMarkerSpacing on its own; it must also grow further with group size, or
    // tightly-packed clusters (common for a single busy country/region) squeeze
    // adjacent ring markers closer than their own icon width apart, making the ones
    // underneath unreachable by click/tap. Required chord length between adjacent
    // ring slots is 2 * r * sin(pi / n); solve for r and take the larger constraint.
    const spread = Math.max(minMarkerSpacing, minMarkerSpacing / (2 * Math.sin(Math.PI / group.length)));
    group.forEach((point, index) => {
      const selected = point.event.id === options.selectedId;
      if (group.length === 1 || index === anchorIndex) {
        result.push({ id: point.event.id, reports: [point.event], lat: point.event.location.lat, lng: point.longitude, selected });
        return;
      }
      const angle = (2 * Math.PI * index) / group.length;
      const { lat, lng } = toLatLng(point.x + Math.cos(angle) * spread, point.y + Math.sin(angle) * spread);
      result.push({ id: point.event.id, reports: [point.event], lat, lng, selected });
    });
  }
  return result.sort((a, b) => compare(a.id, b.id));
}
