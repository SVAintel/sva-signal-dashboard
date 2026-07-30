"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";
import { ConflictZoneData } from "./ConflictZoneDetailPanel";
import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const makeIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="position:relative;width:14px;height:14px;">
      <div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${color};"></div>
      <div style="position:relative;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${color};"></div>
    </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const icons: Record<string, L.DivIcon> = {
  war: makeIcon("#ef4444"),
  counter_terrorism: makeIcon("#a855f7"),
  natural_disaster: makeIcon("#f59e0b"),
  market: makeIcon("#22d3ee"),
  biological: makeIcon("#22c55e"),
  political_unrest: makeIcon("#f97316"),
  cyber: makeIcon("#06b6d4"),
  nuclear: makeIcon("#84cc16"),
  energy: makeIcon("#d97706"),
  humanitarian: makeIcon("#f43f5e"),
};

// Naval vessel marker: a small square/diamond in slate-blue to visually
// distinguish AIS-tracked ships from category event markers, with a heading
// arrow when course data is available.
const navalIcon = (course: number | null) =>
  new L.DivIcon({
    className: "",
    html: `<div style="position:relative;width:14px;height:14px;transform:rotate(${course ?? 0}deg);">
      <div style="position:absolute;left:50%;top:50%;width:0;height:0;transform:translate(-50%,-50%);
        border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:12px solid #7dd3fc;
        filter:drop-shadow(0 0 4px rgba(125,211,252,0.8));"></div>
    </div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
const navalIconNoHeading = new L.DivIcon({
  className: "",
  html: `<div style="width:10px;height:10px;background:#7dd3fc;border:2px solid rgba(255,255,255,0.6);border-radius:2px;box-shadow:0 0 6px #7dd3fc;"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

// Military base marker: small olive shield/square, static (non-pulsing)
// since these are fixed installations, not live-tracked assets.
const militaryBaseIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:9px;height:9px;background:#6b7d3d;border:1.5px solid rgba(212,179,106,0.8);box-shadow:0 0 4px rgba(107,125,61,0.8);"></div>`,
  iconSize: [9, 9],
  iconAnchor: [4, 4],
});

// Wildfire marker: flame-colored circle sized/opacity-scaled by Fire
// Radiative Power (a proxy for fire intensity) so bigger fires stand out.
const wildfireIcon = (frp: number) => {
  const size = Math.min(18, Math.max(6, 6 + Math.sqrt(frp) / 4));
  return new L.DivIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#fca5a5,#f97316 60%,#b91c1c);box-shadow:0 0 ${size / 2}px #f97316;opacity:0.85;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Storm marker: rotating cyclone glyph, colored by category (higher wind =
// more red) so hurricanes stand out from tropical storms/depressions.
const stormIcon = (classification: string) => {
  const color = classification === "HU" ? "#ef4444" : classification === "TS" ? "#f97316" : "#facc15";
  return new L.DivIcon({
    className: "",
    html: `<div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};opacity:0.5;"></div>
      <div style="font-size:14px;filter:drop-shadow(0 0 3px ${color});">🌀</div>
    </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
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
}

interface NavalVessel {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  course: number | null;
  speed: number | null;
  shipType: number | null;
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
}

interface MapLayerData {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneOutput[];
  ports: Array<{ name: string; country: string; lat: number; lng: number; size: string }>;
  cables: CableFeature[];
  pipelines: PipelineFeature[];
  militaryBases: MilitaryBaseFeature[];
}

function MapFitter({ visible = true }: { visible?: boolean }) {
  const map = useMap();

  useEffect(() => {
    // Leaflet's world tiles are always square (Web Mercator): worldWidth = worldHeight = 256 * 2^zoom.
    // fitBounds "contains" the whole square, which letterboxes when the container is wider than tall
    // (our case, since the sidebar makes the map panel landscape). Instead, compute zoom so the
    // world's width exactly matches the container's width — this crops slightly near the poles
    // (empty ocean/ice, no data there) but eliminates the side bars entirely.
    let isFirstRun = true;

    const fitToContainerWidth = () => {
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) return;
      const zoom = Math.log2(size.x / 256);
      map.setMinZoom(zoom);

      if (isFirstRun) {
        map.setView([0, 0], zoom, { animate: false });
        isFirstRun = false;
      } else if (map.getZoom() < zoom) {
        map.setZoom(zoom, { animate: false });
      }
    };

    fitToContainerWidth();
    map.on("resize", fitToContainerWidth);
    window.addEventListener("resize", fitToContainerWidth);

    return () => {
      map.off("resize", fitToContainerWidth);
      window.removeEventListener("resize", fitToContainerWidth);
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
        const zoom = Math.log2(size.x / 256);
        map.setMinZoom(zoom);
        if (map.getZoom() < zoom) map.setZoom(zoom, { animate: false });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visible, map]);

  return null;
}

// Flies the map to a selected event's location and zooms in, so opening the
// detail panel visually centers the underlying story on the map instead of
// leaving the user to hunt for it among other markers. Restores the prior
// view (center + zoom) when the detail panel is closed.
function MapEventFocuser({ event }: { event: Event | null }) {
  const map = useMap();
  const priorViewRef = useRef<{ center: L.LatLng; zoom: number } | null>(null);

  useEffect(() => {
    if (event) {
      // Only snapshot the view the first time we focus (not on every event
      // change while the panel stays open) so closing always returns to
      // where the user was before they started exploring events.
      if (!priorViewRef.current) {
        priorViewRef.current = { center: map.getCenter(), zoom: map.getZoom() };
      }
      const targetZoom = Math.max(map.getZoom(), 6);
      map.flyTo([event.location.lat, event.location.lng], targetZoom, { duration: 0.9 });
    } else if (priorViewRef.current) {
      const { center, zoom } = priorViewRef.current;
      map.flyTo(center, zoom, { duration: 0.9 });
      priorViewRef.current = null;
    }
  }, [event?.id, map]);

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
const RING_COUNT = 4;
const RING_STAGGER_MS = 420; // significantly slower stagger between rings
const RING_START_SIZE = 16;
const RING_GROW_MS = 3200; // significantly slower expand/fade per ring
const RING_BORDER_PX = 1; // constant hairline thickness, independent of ring size

const EventPingRings = memo(function EventPingRings({ event }: { event: Event | null }) {
  const map = useMap();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState<HTMLElement | null>(null);
  const ringElRefs = useRef(new Map<string, HTMLDivElement>());
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
    const update = () => {
      if (anchorRef.current) {
        const origin = map.containerPointToLayerPoint([0, 0]);
        anchorRef.current.style.transform = `translate(${origin.x}px, ${origin.y}px)`;
      }
      // Drive each active ring's size/opacity directly from elapsed time —
      // keeps the border a constant thin width the whole way out instead of
      // it being stretched by a CSS transform:scale.
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
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${r.x - size / 2}px`;
        el.style.top = `${r.y - size / 2}px`;
        el.style.opacity = `${opacity}`;
      });
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
      const maxSize = maxDist * 2.1;
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
      {rings.map((r) => (
        <div
          key={r.id}
          ref={(el) => {
            if (el) ringElRefs.current.set(r.id, el);
            else ringElRefs.current.delete(r.id);
          }}
          className="event-ping-ring"
          style={{
            position: "absolute",
            left: r.x - RING_START_SIZE / 2,
            top: r.y - RING_START_SIZE / 2,
            width: RING_START_SIZE,
            height: RING_START_SIZE,
            borderWidth: RING_BORDER_PX,
            opacity: 0,
          }}
        />
      ))}
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
function ScanSweep({ events, durationMs = 9000 }: { events: Event[]; durationMs?: number }) {
  const map = useMap();
  const barRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [flashes, setFlashes] = useState<
    { id: string; lat: number; lng: number; title: string; ts: number }[]
  >([]);
  const eventsRef = useRef(events);
  eventsRef.current = events;
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
    let start: number | null = null;
    let prevX = 0;
    let prevProgress = 0;
    // Avoid re-flashing the same marker multiple times within one sweep pass
    // if it happens to straddle two consecutive animation frames.
    const recentlyFlashed = new Map<string, number>();

    const step = (t: number) => {
      if (start === null) start = t;
      const elapsed = (t - start) % durationMs;
      const progress = elapsed / durationMs;
      const size = map.getSize();
      const width = size.x || 1;
      const currX = progress * width;

      // Counter the map pane's own pan/zoom transform so this wrapper's local
      // (0,0) always lines up with the viewport's top-left corner, keeping
      // all the screen-space math below (currX, flash container points)
      // valid exactly as if this were still rendered outside the map pane.
      if (anchorRef.current) {
        const origin = map.containerPointToLayerPoint([0, 0]);
        anchorRef.current.style.transform = `translate(${origin.x}px, ${origin.y}px)`;
        anchorRef.current.style.width = `${size.x}px`;
        anchorRef.current.style.height = `${size.y}px`;
      }

      if (barRef.current) {
        barRef.current.style.transform = `translateX(${currX}px)`;
      }

      // Only check for crossings on frames where the sweep moved forward normally
      // (skip the single frame where progress wraps back to 0 at loop restart).
      if (progress >= prevProgress) {
        const lo = Math.min(prevX, currX);
        const hi = Math.max(prevX, currX);
        const newFlashes: typeof flashes = [];
        for (const ev of eventsRef.current) {
          const last = recentlyFlashed.get(ev.id);
          if (last !== undefined && t - last < durationMs * 0.5) continue;
          const pt = map.latLngToContainerPoint([ev.location.lat, ev.location.lng]);
          if (pt.x >= lo && pt.x <= hi && pt.y >= 0 && pt.y <= size.y) {
            recentlyFlashed.set(ev.id, t);
            newFlashes.push({ id: `${ev.id}-${t}`, lat: ev.location.lat, lng: ev.location.lng, title: ev.title, ts: t });
          }
        }
        if (newFlashes.length > 0) {
          setFlashes((f) => [...f, ...newFlashes]);
        }
      }

      // Reposition all live flash bubbles to stay glued to their lat/lng,
      // regardless of pan/zoom — recomputed from the live map projection
      // every frame rather than a one-time screen coordinate.
      for (const [id, el] of flashElRefs.current) {
        if (!el) continue;
        const fl = flashesRef.current.find((f) => f.id === id);
        if (!fl) continue;
        const pt = map.latLngToContainerPoint([fl.lat, fl.lng]);
        el.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
      }

      prevX = currX;
      prevProgress = progress;
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
      {/* Thin static grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(212,179,106,0.06) 0px, rgba(212,179,106,0.06) 1px, transparent 1px, transparent 44px), repeating-linear-gradient(to bottom, rgba(212,179,106,0.06) 0px, rgba(212,179,106,0.06) 1px, transparent 1px, transparent 44px)",
        }}
      />
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

export default function WorldMap({
  events,
  selectedEvent,
  onSelectEvent,
  activeLayers,
  layerData,
  navalVessels = [],
  wildfires = [],
  storms = [],
  onSelectConflictZone,
  mobileVisible = true,
}: {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  activeLayers: MapLayers;
  layerData: MapLayerData | null;
  navalVessels?: NavalVessel[];
  wildfires?: Wildfire[];
  storms?: Storm[];
  onSelectConflictZone?: (zone: ConflictZoneOutput) => void;
  mobileVisible?: boolean;
}) {
  const routesToRender = layerData?.tradeRoutes?.length ? layerData.tradeRoutes : TRADE_ROUTES;
  const zonesToRender = layerData?.conflictZones?.length ? layerData.conflictZones : [];
  const portsToRender = layerData?.ports?.length ? layerData.ports : PORTS.map((p) => ({ ...p, country: "N/A", size: "Unknown" }));
  // Track each event marker's Leaflet instance so we can programmatically
  // close its popup (e.g. right when "Expand" is clicked and the map begins
  // flying/zooming into it — the popup would otherwise linger awkwardly).
  const markerRefs = useRef(new Map<string, L.Marker>());

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
    >
      <MapFitter visible={mobileVisible} />
      <MapEventFocuser event={selectedEvent} />
      <ScanSweep events={events} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        noWrap={true}
      />
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
                  eventHandlers={{
                    click: () => onSelectConflictZone?.(zone),
                  }}
                >
                  <Tooltip sticky>{`${zone.name} (click to expand)`}</Tooltip>
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
          <CircleMarker
            key={port.name}
            center={[port.lat, port.lng]}
            radius={5}
            pathOptions={{ color: "#93c5fd", fillColor: "#93c5fd", fillOpacity: 0.85, weight: 1 }}
          >
            <Tooltip>{`Port: ${port.name}${port.country ? ` (${port.country})` : ""}`}</Tooltip>
          </CircleMarker>
        ))}

      {activeLayers.navalVessels &&
        navalVessels.map((vessel) => (
          <Marker
            key={vessel.mmsi}
            position={[vessel.lat, vessel.lng]}
            icon={vessel.course !== null ? navalIcon(vessel.course) : navalIconNoHeading}
          >
            <Tooltip>
              {`⚓ ${vessel.name}${vessel.speed !== null ? ` — ${vessel.speed.toFixed(1)} kn` : ""}`}
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
          <Marker key={base.id} position={[base.lat, base.lng]} icon={militaryBaseIcon}>
            <Tooltip>
              {`🎯 ${base.name}${base.country ? ` (${base.country})` : ""}${base.operator ? ` — ${base.operator}` : ""}`}
            </Tooltip>
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

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.location.lat, event.location.lng]}
          icon={icons[event.category] || icons.war}
          ref={(m) => {
            if (m) markerRefs.current.set(event.id, m);
            else markerRefs.current.delete(event.id);
          }}
          eventHandlers={{
            // Bring the clicked marker to the front of the marker pane so it's
            // visible above every other marker layer (naval, bases, wildfires,
            // storms) while its popup is open; reset once the popup closes.
            // The radar sweep now renders in its own Leaflet pane (z-index
            // 550, below the marker pane's 600), so this alone is enough to
            // also keep the focused marker above the sweep line/labels.
            click: (e) => e.target.setZIndexOffset(1000),
            popupclose: (e) => e.target.setZIndexOffset(0),
          }}
        >
          <Popup className="tactical-popup">
            <div style={{ background: "#111111", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
              <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                {event.category.replace(/_/g, " ")}
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{event.title}</div>
              <div style={{ color: "#64748b", fontSize: "11px" }}>{event.source}</div>
              <button
                onClick={() => {
                  // Close the popup immediately — the map is about to fly/zoom
                  // in on this marker and the side detail panel takes over as
                  // the source of truth, so the small popup bubble would just
                  // sit awkwardly over the marker otherwise.
                  markerRefs.current.get(event.id)?.closePopup();
                  onSelectEvent(event);
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
      <EventPingRings event={selectedEvent} />
    </MapContainer>
  );
}
