import type { Event } from "./types";
import { validCoordinates } from "./report-context";
import { signalId } from "./signal-identity";

export const REPORT_MAX_ZOOM = 8;
export const REPORT_DETAIL_ZOOM = 6;
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

export function clusterReports(events: readonly Event[], options: {
  zoom: number; centerLongitude: number; selectedId?: string;
}): ReportMapPoint[] {
  const zoom = Math.max(0, Math.min(REPORT_MAX_ZOOM, Number.isFinite(options.zoom) ? options.zoom : 0));
  const scale = 256 * 2 ** zoom;
  const radius = zoom < REPORT_DETAIL_ZOOM ? 46 : 24;
  const reference = Number.isFinite(options.centerLongitude) ? options.centerLongitude : 0;
  const points = uniqueMappableReports(events).map(event => {
    const latitude = Math.max(-85.05112878, Math.min(85.05112878, event.location.lat));
    const longitude = longitudeNear(event.location.lng, reference);
    const sine = Math.sin(latitude * Math.PI / 180);
    return { event, longitude, x: scale * (longitude + 180) / 360,
      y: scale * (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) };
  });
  type Bucket = { anchor: typeof points[number]; members: typeof points };
  const buckets: Bucket[] = [];
  const grid = new Map<string, Bucket[]>();
  const result: ReportMapPoint[] = [];
  for (const point of points) {
    if (point.event.id === options.selectedId) {
      result.push({ id: point.event.id, reports: [point.event], lat: point.event.location.lat, lng: point.longitude, selected: true });
      continue;
    }
    const cellX = Math.floor(point.x / radius), cellY = Math.floor(point.y / radius);
    const candidates: Bucket[] = [];
    for (let x = cellX - 1; x <= cellX + 1; x++) {
      for (let y = cellY - 1; y <= cellY + 1; y++) {
        candidates.push(...(grid.get(`${x}:${y}`) || []));
      }
    }
    // Fixed anchors avoid a chain of nearby points joining distant reports.
    const match = candidates.filter(bucket => Math.hypot(point.x - bucket.anchor.x, point.y - bucket.anchor.y) < radius)
      .sort((a, b) => Math.hypot(point.x - a.anchor.x, point.y - a.anchor.y) -
        Math.hypot(point.x - b.anchor.x, point.y - b.anchor.y) || compare(a.anchor.event.id, b.anchor.event.id))[0];
    if (match) match.members.push(point);
    else {
      const bucket = { anchor: point, members: [point] };
      buckets.push(bucket);
      const key = `${cellX}:${cellY}`;
      grid.set(key, [...(grid.get(key) || []), bucket]);
    }
  }
  for (const bucket of buckets) {
    const reports = bucket.members.map(point => point.event);
    const meanY = bucket.members.reduce((sum, point) => sum + point.y, 0) / reports.length;
    result.push({
      id: reports.length === 1 ? reports[0].id : `nearby-${signalId(JSON.stringify(reports.map(event => event.id)))}`,
      reports,
      lat: reports.length === 1 ? reports[0].location.lat : Math.atan(Math.sinh(Math.PI * (1 - 2 * meanY / scale))) * 180 / Math.PI,
      lng: bucket.members.reduce((sum, point) => sum + point.longitude, 0) / reports.length,
      selected: false,
    });
  }
  return result.sort((a, b) => compare(a.id, b.id));
}
