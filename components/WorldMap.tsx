"use client";

import { MapContainer, Marker, Popup, Polyline, Polygon, Circle, GeoJSON, Tooltip, useMap, AttributionControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";
import { infrastructureSymbol, vesselSymbol, fireSymbol, stormSymbol, type MapSymbol } from "@/lib/map-symbols";
import ReportMapMarkers from "./ReportMapMarkers";
import { ConflictZoneData } from "./ConflictZoneDetailPanel";
import type { MilitaryBaseData } from "./MilitaryBaseDetailPanel";
import type { MilitaryBaseDetail } from "@/lib/data/military-base-details";
import type { PortDetail } from "@/lib/data/port-details";
import type { FleetGroup } from "./FleetTrackerDetailPanel";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapLibreTileLayer } from "./MapLibreTileLayer";

const symbolIcon = (symbol: MapSymbol) => L.divIcon({
  className: "map-asset-symbol", html: symbol.html,
  iconSize: [symbol.size, symbol.size], iconAnchor: symbol.anchor,
});
const navalIcon = (course: number | null, kind: "military" | "tanker" | "sanctioned") => symbolIcon(vesselSymbol({ kind, course }));
const navalIconNoHeading = (kind: "military" | "tanker" | "sanctioned") => symbolIcon(vesselSymbol({ kind }));
const militaryBaseIcon = symbolIcon(infrastructureSymbol({ kind: "military" }));
const majorMilitaryBaseIcon = symbolIcon(infrastructureSymbol({ kind: "military", major: true }));
const fleetGroupIcon = symbolIcon(vesselSymbol({ kind: "fleet" }));
const wildfireIcon = (frp: number) => symbolIcon(fireSymbol({ magnitude: frp }));
const stormIcon = (classification: string) => symbolIcon(stormSymbol({ classification }));

// GPS/GNSS jamming marker: a real geographic-radius circle (meters, via
// Leaflet's Circle) rather than a fixed-pixel DivIcon — an H3 res-4 cell is
// roughly ~25km across, so rendering it at true scale means the marker
// naturally shrinks to a small dot when zoomed out (world view) and reads as
// a proper region-sized patch when zoomed in, instead of a fixed-pixel blob
// that blankets the whole map at low zoom. Deliberately a different hue from
// wildfires (orange) and storms (red/amber) since all three can be layered
// on simultaneously.
const GPS_JAM_RADIUS_METERS = { medium: 22000, high: 30000 };
const gpsJamStyle = (level: "medium" | "high") => {
  const color = level === "high" ? "#a855f7" : "#c4b5fd";
  return {
    color,
    weight: 0,
    fillColor: color,
    fillOpacity: level === "high" ? 0.55 : 0.35,
  };
};

const worldBounds = L.latLngBounds(L.latLng(-85.06, -180), L.latLng(85.06, 180));

const TRADE_ROUTES = [
  {
    name: "Suez Corridor",
    points: [
      [31.26, 32.3],
      [20.0, 38.0],
      [12.0, 44.0],
    ] as [number, number][],
  },
  {
    name: "Strait of Malacca Route",
    points: [
      [22.3, 114.2],
      [10.0, 103.8],
      [1.2, 104.0],
    ] as [number, number][],
  },
  {
    name: "Panama Route",
    points: [
      [25.8, -80.2],
      [9.0, -79.5],
      [-12.0, -77.0],
    ] as [number, number][],
  },
];

const CONFLICT_ZONES = [
  {
    name: "Eastern Europe AOI",
    area: [
      [51.5, 30.0],
      [49.5, 40.5],
      [45.0, 38.0],
      [46.5, 28.0],
    ] as [number, number][],
  },
  {
    name: "Levant AOI",
    area: [
      [37.0, 34.0],
      [36.0, 40.0],
      [30.0, 39.0],
      [30.0, 34.5],
    ] as [number, number][],
  },
  {
    name: "Red Sea AOI",
    area: [
      [22.0, 34.0],
      [22.0, 44.0],
      [12.0, 44.0],
      [12.0, 36.0],
    ] as [number, number][],
  },
];

const PORTS = [
  { name: "Rotterdam", lat: 51.95, lng: 4.13 },
  { name: "Singapore", lat: 1.26, lng: 103.84 },
  { name: "Shanghai", lat: 31.23, lng: 121.49 },
  { name: "Jebel Ali", lat: 25.01, lng: 55.06 },
  { name: "Los Angeles", lat: 33.74, lng: -118.27 },
  { name: "Panama", lat: 8.95, lng: -79.57 },
];

const portIcon = symbolIcon(infrastructureSymbol({ kind: "port" }));
const majorPortIcon = symbolIcon(infrastructureSymbol({ kind: "port", major: true }));

interface MapLayers {
  tradeRoutes: boolean;
  conflictZones: boolean;
  ports: boolean;
  navalVessels: boolean;
  cables: boolean;
  pipelines: boolean;
  militaryBases: boolean;
  wildfires: boolean;
  storms: boolean;
  gpsJamming: boolean;
  fleetTracker: boolean;
  countries: boolean;
}

interface NavalVessel {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  course: number | null;
  speed: number | null;
  shipType: number | null;
  kind: "military" | "tanker" | "sanctioned";
}

interface Wildfire {
  lat: number;
  lng: number;
  brightness: number;
  frp: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  daynight: string;
}

interface Storm {
  id: string;
  name: string;
  classification: string;
  lat: number;
  lng: number;
  intensity: number | null;
  pressure: number | null;
  movementDir: number | null;
  movementSpeed: number | null;
  advisoryUrl: string | null;
  lastUpdate: string | null;
}

interface GpsJamHex {
  h3: string;
  lat: number;
  lng: number;
  level: "medium" | "high";
  pct: number;
  affectedAircraft: number;
  totalAircraft: number;
}

interface ConflictZoneOutput extends ConflictZoneData {}

interface CableFeature {
  id: string;
  name: string;
  paths: [number, number][][];
}

interface PipelineFeature {
  id: string;
  name: string;
  substance: "oil" | "gas";
  paths: [number, number][][];
}

interface MilitaryBaseFeature {
  id: string;
  name: string;
  lat: number;
  lng: number;
  country: string | null;
  operator: string | null;
  isMajor: boolean;
  details?: MilitaryBaseDetail;
}

interface PortFeature {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  country: string;
  size: string;
  isMajor: boolean;
  details?: PortDetail;
}

interface CountryFeature {
  type: "Feature";
  properties?: { ISO_A2?: string; ADMIN?: string; NAME?: string; [key: string]: unknown };
  geometry: { type: string; coordinates: unknown };
}

interface MapLayerData {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneOutput[];
  ports: PortFeature[];
  cables: CableFeature[];
  pipelines: PipelineFeature[];
  militaryBases: MilitaryBaseFeature[];
}

function MapFitter({ visible = true }: { visible?: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Cover the viewport without repeating the world or exposing empty tile edges.
    let isFirstRun = true;

    const fitToContainerWidth = () => {
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) return;
      const zoom = Math.log2(Math.max(size.x, size.y) / 256);
      map.setMinZoom(zoom);

      if (isFirstRun) {
        map.setView([20, 0], zoom, { animate: false });
        isFirstRun = false;
      } else if (map.getZoom() < zoom) {
        map.setZoom(zoom, { animate: false });
      }
    };

    fitToContainerWidth();
    map.on("resize", fitToContainerWidth);
    window.addEventListener("resize", fitToContainerWidth);
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false, pan: true, debounceMoveend: true }));
    observer.observe(map.getContainer());

    return () => {
      map.off("resize", fitToContainerWidth);
      window.removeEventListener("resize", fitToContainerWidth);
      observer.disconnect();
    };
  }, [map]);

  // On mobile the map container toggles display:none/block via the view switcher.
  // Leaflet measures 0x0 while hidden, so force a re-measure + refit once it reappears.
  useEffect(() => {
    if (!visible) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
      const size = map.getSize();
      if (size.x > 0 && size.y > 0) {
        const zoom = Math.log2(Math.max(size.x, size.y) / 256);
        map.setMinZoom(zoom);
        if (map.getZoom() < zoom) map.setZoom(zoom, { animate: false });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visible, map]);

  return null;
}

// Fires three quick expanding radar rings from a selected event's marker out
// toward the edge of the map — a brief "detected" pulse once the fly-to zoom
// settles. Rendered into the same dedicated sweep pane (z-index 550) used by
// the radar sweep line, via a portal + counter-transformed anchor so plain
// container-pixel math (ring center) stays valid across pan/zoom.
// Rings grow via a per-frame JS-driven width/height (not a CSS transform:scale)
// so the border stays a constant thin hairline — like the radar sweep line —
// instead of visually thickening as border-width gets multiplied by scale.
const RING_COUNT = 1;
const RING_STAGGER_MS = 0;
const RING_START_SIZE = 16;
const RING_GROW_MS = 700;

const EventPingRings = memo(function EventPingRings({ event }: { event: Event | null }) {
  const map = useMap();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState<HTMLElement | null>(null);
  const ringElRefs = useRef(new Map<string, SVGCircleElement>());
  const [rings, setRings] = useState<
    { id: string; x: number; y: number; maxSize: number; startAt: number }[]
  >([]);
  const ringsRef = useRef<typeof rings>([]);
  useEffect(() => {
    ringsRef.current = rings;
  }, [rings]);

  useEffect(() => {
    let p = map.getPane("sweepPane");
    if (!p) {
      p = map.createPane("sweepPane");
      p.style.zIndex = "550";
      p.style.pointerEvents = "none";
    }
    setPane(p);
  }, [map]);

  useEffect(() => {
    // Depend on `pane` too: the anchor div only mounts once `pane` is ready
    // (the component renders null before then), so gating on `[map]` alone
    // would start this loop before anchorRef.current ever exists and never
    // retry — leaving rings frozen at their initial size/opacity forever.
    let raf: number;
    // This loop runs for the lifetime of the map regardless of whether any
    // ping rings are currently active (they're only shown briefly after
    // clicking an event) — same pattern as the radar sweep's own loop, so it
    // gets the same "skip redundant work/writes when idle" treatment to
    // avoid two always-on rAF loops fighting for frame budget.
    let lastOriginX: number | null = null;
    let lastOriginY: number | null = null;
    const update = () => {
      if (anchorRef.current) {
        const origin = map.containerPointToLayerPoint([0, 0]);
        if (origin.x !== lastOriginX || origin.y !== lastOriginY) {
          anchorRef.current.style.transform = `translate(${origin.x}px, ${origin.y}px)`;
          lastOriginX = origin.x;
          lastOriginY = origin.y;
        }
      }
      // Drive each active ring's size/opacity directly from elapsed time —
      // keeps the border a constant thin width the whole way out instead of
      // it being stretched by a CSS transform:scale.
      if (ringElRefs.current.size > 0) {
        const now = performance.now();
        ringElRefs.current.forEach((el, id) => {
          const r = ringsRef.current.find((x) => x.id === id);
          if (!r) return;
          const elapsed = now - r.startAt;
          if (elapsed < 0) return;
          const t = Math.min(elapsed / RING_GROW_MS, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const size = RING_START_SIZE + (r.maxSize - RING_START_SIZE) * eased;
          const opacity = Math.max(0, 0.7 * (1 - t));
          // SVG attribute writes (not CSS layout properties) — cheap, scoped
          // to this shape only, no full-page reflow.
          el.setAttribute("r", String(size / 2));
          el.setAttribute("cx", String(r.x));
          el.setAttribute("cy", String(r.y));
          el.style.opacity = `${opacity}`;
        });
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [map, pane]);

  useEffect(() => {
    if (!event) return;
    // Wait for the flyTo (see MapEventFocuser, ~900ms) to settle so the rings
    // emanate from the marker's final on-screen position, not a mid-flight one.
    const startTimer = setTimeout(() => {
      const pt = map.latLngToContainerPoint([event.location.lat, event.location.lng]);
      const size = map.getSize();
      // Diagonal distance from the marker to the farthest corner, so the ring
      // reliably reaches the edge of the map regardless of where it sits.
      const maxDist = Math.max(
        Math.hypot(pt.x, pt.y),
        Math.hypot(size.x - pt.x, pt.y),
        Math.hypot(pt.x, size.y - pt.y),
        Math.hypot(size.x - pt.x, size.y - pt.y)
      );
      const maxSize = Math.min(48, maxDist * 2.1);
      const stamp = Date.now();
      const now = performance.now();
      setRings(
        Array.from({ length: RING_COUNT }, (_, i) => ({
          id: `${event.id}-${stamp}-${i}`,
          x: pt.x,
          y: pt.y,
          maxSize,
          startAt: now + i * RING_STAGGER_MS,
        }))
      );
      const clearTimer = setTimeout(
        () => setRings([]),
        (RING_COUNT - 1) * RING_STAGGER_MS + RING_GROW_MS + 300
      );
      return () => clearTimeout(clearTimer);
    }, 950);
    return () => clearTimeout(startTimer);
  }, [event?.id, map]);

  if (!pane) return null;

  return createPortal(
    <div ref={anchorRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
      {/* Rendered as SVG circles rather than bordered divs: changing an SVG
          circle's `r`/`cx`/`cy` attributes only invalidates that shape inside
          the SVG's own render tree, whereas animating a div's width/height/
          left/top every frame forces a full-page layout reflow (expensive,
          and the likely cause of "click an event and it gets laggy"). SVG's
          stroke-width is independent of radius by design, so the ring's
          border still stays a constant hairline as it grows — same visual
          result as the old width/height approach, far cheaper to animate. */}
      <svg style={{ position: "absolute", top: 0, left: 0, overflow: "visible", pointerEvents: "none" }} width={1} height={1}>
        {rings.map((r) => (
          <circle
            key={r.id}
            ref={(el) => {
              if (el) ringElRefs.current.set(r.id, el);
              else ringElRefs.current.delete(r.id);
            }}
            className="event-ping-ring"
            cx={r.x}
            cy={r.y}
            r={RING_START_SIZE / 2}
            fill="none"
            opacity={0}
          />
        ))}
      </svg>
    </div>,
    pane
  );
});

// Radar-style sweep: a thin grid overlay with a bright vertical line that pulses
// left-to-right across the map on a loop. When the sweep front crosses an
// event marker's on-screen position, that event "reveals" — a brief expanding
// ring + a fading label bubble with its title. Position tracking uses the live
// Leaflet map projection (map.latLngToContainerPoint) recalculated every
// animation frame, so it stays accurate through pans/zooms and window resizes.
// Rendered via a portal into a dedicated Leaflet pane (z-index 550, between
// the overlay/shadow panes and the marker pane at 600) so normal z-index
// stacking against markers/popups works correctly. Since that pane picks up
// Leaflet's own pan/zoom transform, an inner wrapper counter-transforms every
// frame so its coordinate space still matches plain screen/container points.
// Generic sweep-detectable target — events and military bases are both
// reduced to this shape so the radar sweep reveals them identically.
interface SweepTarget {
  id: string;
  lat: number;
  lng: number;
  title: string;
}

function ScanSweep({
  events,
  militaryBases = [],
  durationMs = 9000,
}: {
  events: Event[];
  militaryBases?: MilitaryBaseFeature[];
  durationMs?: number;
}) {
  const map = useMap();
  const barRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [flashes, setFlashes] = useState<
    { id: string; lat: number; lng: number; title: string; ts: number }[]
  >([]);
  const targets: SweepTarget[] = [
    ...events.map((ev) => ({ id: ev.id, lat: ev.location.lat, lng: ev.location.lng, title: ev.title })),
    ...militaryBases.map((base) => ({ id: base.id, lat: base.lat, lng: base.lng, title: `🎯 ${base.name}` })),
  ];
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  // DOM refs for each flash's wrapper, so we can reposition them every frame
  // (on pan/zoom) via direct style writes instead of React re-renders.
  const flashElRefs = useRef(new Map<string, HTMLDivElement | null>());
  // Mirror of `flashes` state for the animation loop to read without being
  // a dependency of the main step() effect (which would restart the sweep
  // animation's timer every time a flash is added/removed).
  const flashesRef = useRef(flashes);
  flashesRef.current = flashes;
  // Wrapper that stays pixel-aligned with the viewport (top-left corner) even
  // though it now lives *inside* the Leaflet map pane (see below) so it picks
  // up the same pan/zoom CSS transform as tiles/markers. Every frame we apply
  // a counter-transform so its own coordinate space still matches plain
  // on-screen container points, letting the rest of this component's math
  // (currX, flash positions, etc.) stay exactly the same as before.
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Give the sweep its own Leaflet pane, sandwiched between the overlay/
    // shadow panes (~400/500) and the marker pane (600). Rendering into a
    // real pane (instead of a portal appended as a sibling of the whole map
    // pane) means ordinary z-index comparisons against markers/popups work
    // correctly — markers naturally render above the sweep, and clicking one
    // no longer needs to hack the entire map pane's z-index to "win".
    let pane = map.getPane("sweepPane");
    if (!pane) {
      pane = map.createPane("sweepPane");
      pane.style.zIndex = "550";
      pane.style.pointerEvents = "none";
    }
    setContainer(pane);
  }, [map]);

  useEffect(() => {
    let raf: number;
    let lastFrameT: number | null = null;
    // Accumulated progress (0..1), advanced incrementally each frame by
    // elapsed delta-time rather than derived from `(now - start) % duration`.
    // The wall-clock-modulo approach looks perfectly smooth in isolation, but
    // any main-thread stall (a burst of React re-renders from flash state
    // updates, a GC pause, etc.) causes the *next* frame's elapsed-time to
    // have jumped by however long the stall lasted — so the bar visibly
    // teleports forward to "catch up" the instant rendering resumes. Since
    // progress here is accumulated frame-by-frame instead, a stall just
    // results in a brief pause; the sweep resumes from exactly where it
    // paused instead of snapping ahead.
    let progress = 0;
    // Cap how much a single frame can advance progress by, so a large stall
    // (e.g. a slow re-render) still can't produce a big visible jump — worst
    // case the sweep is very slightly slower during heavy load, which is far
    // less noticeable than a jump.
    const MAX_FRAME_MS = 100;
    let prevX = 0;
    let prevProgress = 0;
    // Avoid re-flashing the same marker multiple times within one sweep pass
    // if it happens to straddle two consecutive animation frames.
    const recentlyFlashed = new Map<string, number>();
    // The bar's own translateX (and the anchor's pan/zoom counter-transform)
    // are cheap and run every frame for a perfectly smooth sweep. Target
    // crossing-detection and flash repositioning involve an O(targets)
    // Leaflet projection call each, which used to run at full 60fps too —
    // with 100+ combined events/bases that's a lot of unnecessary main-thread
    // work fighting the animation for frame time. Throttling that part to
    // ~15Hz is imperceptible for "did the sweep line cross this point yet"
    // detection but removes the bulk of the per-frame cost.
    const DETECTION_INTERVAL_MS = 66;
    let lastDetectionT = 0;
    // Cache the last-written anchor transform/size so an idle (non-panning,
    // non-resizing) map — the overwhelming majority of the time the sweep is
    // running — skips these style writes entirely instead of redundantly
    // rewriting identical values on every single animation frame.
    let lastOriginX: number | null = null;
    let lastOriginY: number | null = null;
    let lastSizeX: number | null = null;
    let lastSizeY: number | null = null;

    const step = (t: number) => {
      if (lastFrameT === null) lastFrameT = t;
      const dt = Math.min(t - lastFrameT, MAX_FRAME_MS);
      lastFrameT = t;
      progress += dt / durationMs;
      if (progress >= 1) progress -= Math.floor(progress);
      const size = map.getSize();
      const width = size.x || 1;
      const currX = progress * width;

      // Counter the map pane's own pan/zoom transform so this wrapper's local
      // (0,0) always lines up with the viewport's top-left corner, keeping
      // all the screen-space math below (currX, flash container points)
      // valid exactly as if this were still rendered outside the map pane.
      if (anchorRef.current) {
        const origin = map.containerPointToLayerPoint([0, 0]);
        if (origin.x !== lastOriginX || origin.y !== lastOriginY) {
          anchorRef.current.style.transform = `translate(${origin.x}px, ${origin.y}px)`;
          lastOriginX = origin.x;
          lastOriginY = origin.y;
        }
        if (size.x !== lastSizeX || size.y !== lastSizeY) {
          anchorRef.current.style.width = `${size.x}px`;
          anchorRef.current.style.height = `${size.y}px`;
          lastSizeX = size.x;
          lastSizeY = size.y;
        }
      }

      if (barRef.current) {
        barRef.current.style.transform = `translateX(${currX}px)`;
      }

      if (t - lastDetectionT >= DETECTION_INTERVAL_MS) {
        lastDetectionT = t;

        // Only check for crossings on frames where the sweep moved forward normally
        // (skip the single frame where progress wraps back to 0 at loop restart).
        if (progress >= prevProgress) {
          const lo = Math.min(prevX, currX);
          const hi = Math.max(prevX, currX);
          const newFlashes: typeof flashes = [];
          const liveIds = new Set<string>();
          for (const target of targetsRef.current) {
            liveIds.add(target.id);
            const last = recentlyFlashed.get(target.id);
            if (last !== undefined && t - last < durationMs * 0.5) continue;
            const pt = map.latLngToContainerPoint([target.lat, target.lng]);
            if (pt.x >= lo && pt.x <= hi && pt.y >= 0 && pt.y <= size.y) {
              recentlyFlashed.set(target.id, t);
              newFlashes.push({ id: `${target.id}-${t}`, lat: target.lat, lng: target.lng, title: target.title, ts: t });
            }
          }
          if (newFlashes.length > 0) {
            setFlashes((f) => [...f, ...newFlashes]);
          }
          // Prevent recentlyFlashed from growing unbounded across long-running
          // sessions as the underlying event/base list changes over time.
          for (const id of recentlyFlashed.keys()) {
            if (!liveIds.has(id)) recentlyFlashed.delete(id);
          }
        }

        prevX = currX;
        prevProgress = progress;
      }

      // Reposition all live flash bubbles to stay glued to their lat/lng,
      // regardless of pan/zoom — recomputed from the live map projection
      // every frame (unlike the detection loop above) since this is only
      // O(active flashes), which is always small, and skipping frames here
      // is what let a freshly-created flash sit at its default (0,0) —
      // i.e. the map's top-left corner — for up to one throttle interval
      // before its first real position landed.
      for (const [id, el] of flashElRefs.current) {
        if (!el) continue;
        const fl = flashesRef.current.find((f) => f.id === id);
        if (!fl) continue;
        const pt = map.latLngToContainerPoint([fl.lat, fl.lng]);
        el.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [map, durationMs]);

  // Sweep out old flash entries so the array doesn't grow unbounded
  useEffect(() => {
    if (flashes.length === 0) return;
    const id = setTimeout(() => {
      setFlashes((f) => f.filter((fl) => performance.now() - fl.ts < 2000));
      for (const key of Array.from(flashElRefs.current.keys())) {
        if (!flashes.some((fl) => fl.id === key)) flashElRefs.current.delete(key);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [flashes]);

  if (!container) return null;

  return createPortal(
    <div
      ref={anchorRef}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", overflow: "hidden" }}
    >
      {/* Sweeping line — thin bright core + soft wide glow trailing behind it */}
      <div
        ref={barRef}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: -60,
          width: 120,
          willChange: "transform",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, transparent, rgba(212,179,106,0.16), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 60,
            width: 2,
            background: "rgba(212,179,106,0.95)",
            boxShadow: "0 0 16px 3px rgba(212,179,106,0.6)",
          }}
        />
      </div>

      {/* Reveal flashes — positioned via a direct ref + transform, updated
          every animation frame from lat/lng, so they track pan/zoom instead
          of staying pinned to the screen coordinates from when they fired. */}
      {flashes.map((f) => (
        <div
          key={f.id}
          ref={(el) => {
            flashElRefs.current.set(f.id, el);
          }}
          style={{ position: "absolute", left: 0, top: 0, willChange: "transform" }}
        >
          <div
            className="scan-reveal-ring"
            style={{
              position: "absolute",
              left: -18,
              top: -18,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid #d4b36a",
            }}
          />
          <div
            className="scan-label-fade"
            style={{
              position: "absolute",
              left: 12,
              top: -10,
              whiteSpace: "nowrap",
              background: "#0e0e0ecc",
              border: "1px solid #3a3a3a",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#d4b36a",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {f.title}
          </div>
        </div>
      ))}
    </div>,
    container
  );
}

// Picks the bounds of a country's largest contiguous landmass, ignoring
// smaller disjoint parts (e.g. France's MultiPolygon includes French Guiana,
// Réunion, Guadeloupe, etc. — fitting the full bounding box would center the
// view in the middle of the Atlantic between mainland France and those
// overseas territories). Falls back to the whole feature's bounds for a
// simple Polygon.
function getPrimaryLandmassBounds(feature: CountryFeature): L.LatLngBounds | null {
  const geometry = feature.geometry as { type: string; coordinates: any } | undefined;
  if (!geometry) return null;
  if (geometry.type !== "MultiPolygon") {
    const bounds = L.geoJSON(feature as any).getBounds();
    return bounds.isValid() ? bounds : null;
  }
  let bestBounds: L.LatLngBounds | null = null;
  let bestArea = 0;
  for (const coords of geometry.coordinates as any[]) {
    const polygonFeature = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: coords } };
    const bounds = L.geoJSON(polygonFeature as any).getBounds();
    if (!bounds.isValid()) continue;
    const area = (bounds.getEast() - bounds.getWest()) * (bounds.getNorth() - bounds.getSouth());
    if (area > bestArea) {
      bestArea = area;
      bestBounds = bounds;
    }
  }
  return bestBounds;
}

type CameraTarget = { center: L.LatLngTuple; zoom: number } | { bounds: L.LatLngBounds };

function MapSelectionFocuser({ event, base, group, port, country, zone, cluster, visible, reducedMotion }: {
  event: Event | null; base: MilitaryBaseData | null; group: FleetGroup | null;
  port: PortFeature | null; country: CountryFeature | null; zone: ConflictZoneOutput | null;
  cluster: { id: string; lat: number; lng: number } | null; visible: boolean; reducedMotion: boolean;
}) {
  const map = useMap();
  const priorView = useRef<{ center: L.LatLng; zoom: number } | null>(null);
  const target = useMemo<CameraTarget | null>(() => {
    if (event) return { center: [event.location.lat, event.location.lng], zoom: 6 };
    if (base) return { center: [base.lat, base.lng], zoom: 6 };
    if (group) return { center: [group.lat, group.lng], zoom: 4 };
    if (port) return { center: [port.lat, port.lng], zoom: 6 };
    if (country) {
      const bounds = getPrimaryLandmassBounds(country);
      if (bounds?.isValid()) return { bounds };
    }
    if (zone) {
      const bounds = L.geoJSON(zone.geometry as GeoJSON.GeoJsonObject).getBounds();
      if (bounds.isValid()) return { bounds };
    }
    if (cluster) return { center: [cluster.lat, cluster.lng], zoom: 5 };
    return null;
  }, [event, base, group, port, country, zone, cluster]);
  useEffect(() => {
    map.stop();
    if (!visible) return;
    // MapFitter remeasures a newly visible phone map before this frame runs.
    const frame = requestAnimationFrame(() => {
      if (!map.getSize().x || !map.getSize().y) return;
      const options = { duration: 0.9, animate: !reducedMotion };
      if (target) {
        if (!priorView.current) priorView.current = { center: map.getCenter(), zoom: map.getZoom() };
        if ("bounds" in target) map.flyToBounds(target.bounds, { ...options, padding: [40, 40], maxZoom: 6 });
        else map.flyTo(target.center, Math.max(map.getZoom(), target.zoom), options);
      } else if (priorView.current) {
        map.flyTo(priorView.current.center, priorView.current.zoom, options);
        priorView.current = null;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [map, target, visible, reducedMotion]);
  return null;
}

// Keep pointer updates inside the map rather than rerendering the workspace.
function MapCoordinateReadout() {
  const map = useMap();
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const onMove = (e: L.LeafletMouseEvent) => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      const nextCoord = { lat: e.latlng.lat, lng: e.latlng.lng };
      frameRef.current = requestAnimationFrame(() => {
        setCoord(nextCoord);
        frameRef.current = null;
      });
    };
    const onLeave = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      setCoord(null);
    };
    map.on("mousemove", onMove);
    map.on("mouseout", onLeave);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      map.off("mousemove", onMove);
      map.off("mouseout", onLeave);
    };
  }, [map]);

  if (!coord) return null;

  const lat = `${Math.abs(coord.lat).toFixed(3)}°${coord.lat >= 0 ? "N" : "S"}`;
  const lng = `${Math.abs(coord.lng).toFixed(3)}°${coord.lng >= 0 ? "E" : "W"}`;

  return createPortal(
    <div className="map-coord-readout font-mono">
      {lat} &nbsp;{lng}
    </div>,
    map.getContainer()
  );
}

export default function WorldMap({
  events,
  reportGroupCounts = {},
  selectedEvent,
  onSelectEvent,
  activeLayers,
  layerData,
  navalVessels = [],
  wildfires = [],
  storms = [],
  gpsJamHexes = [],
  onSelectConflictZone,
  selectedConflictZone = null,
  selectedMilitaryBase = null,
  onSelectMilitaryBase,
  fleetGroups = [],
  selectedFleetGroup = null,
  onSelectFleetGroup,
  onSelectCountry,
  selectedCountryName = null,
  mobileVisible = true,
  selectedPort = null,
  onSelectPort,
  selectedCluster = null,
  scanEnabled = true,
  reducedMotion = false,
}: {
  events: Event[];
  reportGroupCounts?: Record<string, number>;
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  activeLayers: MapLayers;
  layerData: MapLayerData | null;
  navalVessels?: NavalVessel[];
  wildfires?: Wildfire[];
  storms?: Storm[];
  gpsJamHexes?: GpsJamHex[];
  onSelectConflictZone?: (zone: ConflictZoneOutput) => void;
  selectedConflictZone?: ConflictZoneOutput | null;
  selectedMilitaryBase?: MilitaryBaseData | null;
  onSelectMilitaryBase?: (base: MilitaryBaseFeature) => void;
  fleetGroups?: FleetGroup[];
  selectedFleetGroup?: FleetGroup | null;
  onSelectFleetGroup?: (group: FleetGroup) => void;
  onSelectCountry?: (name: string) => void;
  selectedCountryName?: string | null;
  mobileVisible?: boolean;
  selectedPort?: PortFeature | null;
  onSelectPort?: (port: PortFeature) => void;
  selectedCluster?: { id: string; lat: number; lng: number } | null;
  scanEnabled?: boolean;
  reducedMotion?: boolean;
}) {
  const routesToRender = layerData?.tradeRoutes?.length ? layerData.tradeRoutes : TRADE_ROUTES;
  const zonesToRender = layerData?.conflictZones?.length ? layerData.conflictZones : [];
  const portsToRender: PortFeature[] = layerData?.ports?.length
    ? layerData.ports
    : PORTS.map((p) => ({ ...p, displayName: p.name, country: "N/A", size: "Unknown", isMajor: true }));
  const [countryFeatures, setCountryFeatures] = useState<CountryFeature[]>([]);
  // Lazy-load the country borders GeoJSON only once the layer is toggled on
  // (it's ~180 features and not needed unless the user asks for it).
  useEffect(() => {
    if (!activeLayers.countries || countryFeatures.length > 0) return;
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/gh/vasturiano/react-globe.gl/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((geojson: { features?: CountryFeature[] }) => {
        if (cancelled) return;
        setCountryFeatures((geojson.features || []).filter((f) => f?.properties?.ISO_A2 !== "AQ"));
      })
      .catch(() => {
        if (!cancelled) setCountryFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeLayers.countries, countryFeatures.length]);
  const baseMarkerRefs = useRef(new Map<string, L.Marker>());
  // Same purpose again, but for fleet-tracker group markers.
  const fleetMarkerRefs = useRef(new Map<string, L.Marker>());
  // Same purpose again, but for port markers.
  const portMarkerRefs = useRef(new Map<string, L.Marker>());
  // Same purpose again, but for country border GeoJSON layers.
  const countryLayerRefs = useRef(new Map<string, L.GeoJSON>());
  // Same purpose again, but for conflict zone GeoJSON layers.
  const conflictZoneLayerRefs = useRef(new Map<string, L.GeoJSON>());
  // Look up the selected country's GeoJSON feature (for MapCountryFocuser to
  // fly/zoom to) — memoized so its identity is stable unless the selection
  // or the loaded feature set actually changes.
  const selectedCountryFeature = useMemo(
    () =>
      countryFeatures.find((f) => (f.properties?.ADMIN || f.properties?.NAME) === selectedCountryName) || null,
    [countryFeatures, selectedCountryName]
  );

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={8}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
      zoomControl={false}
      attributionControl={false}
    >
      <AttributionControl prefix={false} />
      <MapFitter visible={mobileVisible} />
      <MapSelectionFocuser visible={mobileVisible} reducedMotion={reducedMotion}
        event={selectedEvent} base={selectedMilitaryBase} group={selectedFleetGroup} port={selectedPort}
        country={selectedCountryFeature} zone={selectedConflictZone} cluster={selectedCluster} />
      <MapCoordinateReadout />
      {selectedCluster && (
        <Circle
          center={[selectedCluster.lat, selectedCluster.lng]}
          radius={300000}
          pathOptions={{ color: "#d4b36a", weight: 2, fillColor: "#d4b36a", fillOpacity: 0.08, dashArray: "6 6" }}
        />
      )}
      {scanEnabled && <ScanSweep events={events} militaryBases={activeLayers.militaryBases ? layerData?.militaryBases || [] : []} />}
      <MapLibreTileLayer
        styleUrl="https://tiles.openfreemap.org/styles/dark"
        attribution='<a href="https://openfreemap.org/">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {activeLayers.countries &&
        countryFeatures.map((feature) => {
          const name = feature.properties?.ADMIN || feature.properties?.NAME || "Unknown";
          const isSelected = name === selectedCountryName;
          const baseStyle = isSelected
            ? { color: "#d4b36a", weight: 2.5, fillColor: "#d4b36a", fillOpacity: 0.05, className: "country-border-path" }
            : { color: "#7f8c82", weight: 0.65, fillColor: "#64748b", fillOpacity: 0, className: "country-border-path" };
          return (
            <GeoJSON
              key={name}
              data={feature as any}
              style={baseStyle}
              ref={(layer) => {
                if (layer) countryLayerRefs.current.set(name, layer);
                else countryLayerRefs.current.delete(name);
              }}
              eventHandlers={{
                mouseover: (e) => {
                  if (!isSelected) e.target.setStyle({ weight: 1.6, color: "#94a3b8" });
                },
                mouseout: (e) => {
                  if (!isSelected) e.target.setStyle(baseStyle);
                },
              }}
            >
              <Popup className="tactical-popup">
                <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
                  <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                    Country
                  </div>
                  <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{name}</div>
                  <button
                    onClick={() => {
                      // Close the popup immediately — the map is about to
                      // fly/zoom in on this country and the side detail
                      // panel takes over as the source of truth.
                      countryLayerRefs.current.get(name)?.closePopup();
                      onSelectCountry?.(name);
                    }}
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      border: "1px solid #3a3a3a",
                      background: "#1e1e1e",
                      color: "#d4b36a",
                      borderRadius: "4px",
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      padding: "6px 8px",
                      cursor: "pointer",
                    }}
                  >
                    Expand
                  </button>
                </div>
              </Popup>
            </GeoJSON>
          );
        })}

      {activeLayers.tradeRoutes &&
        routesToRender.map((route) => (
          <Polyline
            key={route.name}
            positions={route.points}
            pathOptions={{ color: "#d4b36a", weight: 2.5, opacity: 0.85, dashArray: "6 6" }}
          >
            <Tooltip>{route.name}</Tooltip>
          </Polyline>
        ))}

      {activeLayers.conflictZones &&
        (zonesToRender.length > 0
          ? zonesToRender.map((zone) => {
              const color =
                zone.intensity === "high" ? "#ef4444" : zone.intensity === "medium" ? "#f59e0b" : "#84cc16";
              return (
                <GeoJSON
                  key={zone.id}
                  data={{ type: "Feature", properties: {}, geometry: zone.geometry } as any}
                  style={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.16 }}
                  ref={(layer) => {
                    if (layer) conflictZoneLayerRefs.current.set(zone.id, layer);
                    else conflictZoneLayerRefs.current.delete(zone.id);
                  }}
                >
                  <Popup className="tactical-popup">
                    <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
                      <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                        Conflict Zone • {zone.intensity}
                      </div>
                      <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{zone.name}</div>
                      <button
                        onClick={() => {
                          // Close the popup immediately — the map is about to
                          // fly/zoom in on this zone and the side detail
                          // panel takes over as the source of truth.
                          conflictZoneLayerRefs.current.get(zone.id)?.closePopup();
                          onSelectConflictZone?.(zone);
                        }}
                        style={{
                          marginTop: "8px",
                          width: "100%",
                          border: "1px solid #3a3a3a",
                          background: "#1e1e1e",
                          color: "#d4b36a",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "6px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Expand
                      </button>
                    </div>
                  </Popup>
                </GeoJSON>
              );
            })
          : CONFLICT_ZONES.map((zone) => (
              <Polygon
                key={zone.name}
                positions={zone.area}
                pathOptions={{ color: "#ef4444", weight: 1.5, fillColor: "#ef4444", fillOpacity: 0.14 }}
              >
                <Tooltip>{zone.name}</Tooltip>
              </Polygon>
            )))}

      {activeLayers.ports &&
        portsToRender.map((port) => (
          <Marker
            key={port.name}
            position={[port.lat, port.lng]}
            icon={port.isMajor ? majorPortIcon : portIcon}
            ref={(m) => {
              if (m) portMarkerRefs.current.set(port.name, m);
              else portMarkerRefs.current.delete(port.name);
            }}
            eventHandlers={{
              click: (e) => e.target.setZIndexOffset(1000),
              popupclose: (e) => e.target.setZIndexOffset(0),
            }}
          >
            <Popup className="tactical-popup">
              <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
                <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                  Seaport{port.isMajor ? " • Major" : ""}{port.details?.chokepoint ? " • Chokepoint" : ""}
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                  ⚓ {port.displayName}
                </div>
                <div style={{ color: "#64748b", fontSize: "11px" }}>
                  {port.country || "N/A"} — {port.size}
                </div>
                <button
                  onClick={() => {
                    portMarkerRefs.current.get(port.name)?.closePopup();
                    onSelectPort?.(port);
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    border: "1px solid #3a3a3a",
                    background: "#1e1e1e",
                    color: "#d4b36a",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "6px 8px",
                    cursor: "pointer",
                  }}
                >
                  Expand
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

      {activeLayers.navalVessels &&
        navalVessels.map((vessel) => (
          <Marker
            key={vessel.mmsi}
            position={[vessel.lat, vessel.lng]}
            icon={vessel.course !== null ? navalIcon(vessel.course, vessel.kind) : navalIconNoHeading(vessel.kind)}
          >
            <Tooltip>
              {`${vessel.kind === "tanker" ? "🛢️" : vessel.kind === "sanctioned" ? "🚫" : "⚓"} ${vessel.name}${vessel.speed !== null ? ` — ${vessel.speed.toFixed(1)} kn` : ""}${vessel.kind === "sanctioned" ? " (sanctioned, RU-flagged)" : ""}`}
            </Tooltip>
          </Marker>
        ))}

      {activeLayers.cables &&
        (layerData?.cables || []).map((cable) =>
          cable.paths.map((path, idx) => (
            <Polyline
              key={`${cable.id}-${idx}`}
              positions={path}
              pathOptions={{ color: "#22d3ee", weight: 1.5, opacity: 0.55, dashArray: "2 6" }}
            >
              <Tooltip>{`🔌 ${cable.name}`}</Tooltip>
            </Polyline>
          ))
        )}

      {activeLayers.pipelines &&
        (layerData?.pipelines || []).map((pipeline) =>
          pipeline.paths.map((path, idx) => (
            <Polyline
              key={`${pipeline.id}-${idx}`}
              positions={path}
              pathOptions={{
                color: pipeline.substance === "gas" ? "#eab308" : "#b45309",
                weight: 2,
                opacity: 0.75,
              }}
            >
              <Tooltip>{`${pipeline.substance === "gas" ? "🔥" : "🛢️"} ${pipeline.name}`}</Tooltip>
            </Polyline>
          ))
        )}

      {activeLayers.militaryBases &&
        (layerData?.militaryBases || []).map((base) => (
          <Marker
            key={base.id}
            position={[base.lat, base.lng]}
            icon={base.isMajor ? majorMilitaryBaseIcon : militaryBaseIcon}
            ref={(m) => {
              if (m) baseMarkerRefs.current.set(base.id, m);
              else baseMarkerRefs.current.delete(base.id);
            }}
            eventHandlers={{
              click: (e) => e.target.setZIndexOffset(1000),
              popupclose: (e) => e.target.setZIndexOffset(0),
            }}
          >
            <Popup className="tactical-popup">
              <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
                <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                  Military Installation{base.isMajor ? " • Major" : ""}
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{base.name}</div>
                <div style={{ color: "#64748b", fontSize: "11px" }}>
                  {base.country || "Location unconfirmed"}{base.operator ? ` — ${base.operator}` : ""}
                </div>
                <button
                  onClick={() => {
                    // Close the popup immediately — the map is about to
                    // fly/zoom in on this base and the side detail panel
                    // takes over as the source of truth.
                    baseMarkerRefs.current.get(base.id)?.closePopup();
                    onSelectMilitaryBase?.(base);
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    border: "1px solid #3a3a3a",
                    background: "#1e1e1e",
                    color: "#d4b36a",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "6px 8px",
                    cursor: "pointer",
                  }}
                >
                  Expand
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

      {activeLayers.fleetTracker &&
        fleetGroups.map((group) => (
          <Marker
            key={group.id}
            position={[group.lat, group.lng]}
            icon={fleetGroupIcon}
            ref={(m) => {
              if (m) fleetMarkerRefs.current.set(group.id, m);
              else fleetMarkerRefs.current.delete(group.id);
            }}
            eventHandlers={{
              click: (e) => e.target.setZIndexOffset(1000),
              popupclose: (e) => e.target.setZIndexOffset(0),
            }}
          >
            <Popup className="tactical-popup">
              <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "200px" }}>
                <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                  US Fleet Tracker{group.groupName ? ` • ${group.groupName}` : ""}
                </div>
                <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                  🇺🇸⚓ {group.region}
                </div>
                <div style={{ color: "#64748b", fontSize: "11px" }}>
                  {group.ships.length > 0 ? group.ships.slice(0, 2).join(", ") : "See detail for ship list"}
                  {group.ships.length > 2 ? ` +${group.ships.length - 2} more` : ""}
                </div>
                <button
                  onClick={() => {
                    fleetMarkerRefs.current.get(group.id)?.closePopup();
                    onSelectFleetGroup?.(group);
                  }}
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    border: "1px solid #3a3a3a",
                    background: "#1e1e1e",
                    color: "#d4b36a",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "6px 8px",
                    cursor: "pointer",
                  }}
                >
                  Expand
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

      {activeLayers.wildfires &&
        wildfires.map((fire, idx) => (
          <Marker key={`fire-${idx}`} position={[fire.lat, fire.lng]} icon={wildfireIcon(fire.frp)}>
            <Tooltip>
              {`🔥 FRP ${fire.frp.toFixed(0)} MW — ${fire.acqDate} ${fire.confidence}% confidence`}
            </Tooltip>
          </Marker>
        ))}

      {activeLayers.storms &&
        storms.map((storm) => (
          <Marker key={storm.id} position={[storm.lat, storm.lng]} icon={stormIcon(storm.classification)}>
            <Tooltip>
              {`${storm.name}${storm.intensity !== null ? ` — ${storm.intensity} kn` : ""}${
                storm.pressure !== null ? `, ${storm.pressure} mb` : ""
              }`}
            </Tooltip>
          </Marker>
        ))}

      {activeLayers.gpsJamming &&
        gpsJamHexes.map((hex) => (
          <Circle
            key={hex.h3}
            center={[hex.lat, hex.lng]}
            radius={GPS_JAM_RADIUS_METERS[hex.level]}
            pathOptions={gpsJamStyle(hex.level)}
          >
            <Tooltip>
              {`📡 GPS Jamming — ${hex.level === "high" ? "High" : "Medium"} (${hex.pct}% of ${hex.totalAircraft} aircraft affected)`}
            </Tooltip>
          </Circle>
        ))}

      <ReportMapMarkers events={events} selectedId={selectedEvent?.id} onSelectEvent={onSelectEvent}
        reportGroupCounts={reportGroupCounts} reducedMotion={reducedMotion} />
      {scanEnabled && !reducedMotion && <EventPingRings event={selectedEvent} />}
    </MapContainer>
  );
}
