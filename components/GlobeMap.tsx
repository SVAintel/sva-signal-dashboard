"use client";

import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Event } from "@/lib/types";
import { ConflictZoneData } from "./ConflictZoneDetailPanel";
import type { MilitaryBaseDetail } from "@/lib/data/military-base-details";

const CATEGORY_COLORS: Record<string, string> = {
  war: "#ef4444",
  counter_terrorism: "#a855f7",
  natural_disaster: "#f59e0b",
  market: "#22d3ee",
  biological: "#22c55e",
  political_unrest: "#f97316",
  cyber: "#06b6d4",
  nuclear: "#84cc16",
  energy: "#d97706",
  humanitarian: "#f43f5e",
};

const EARTH_TEXTURE = "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg";
const EARTH_BUMP_TEXTURE = "//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png";
const CLOUDS_TEXTURE = "https://cdn.jsdelivr.net/gh/vasturiano/react-globe.gl/example/clouds/clouds.png";
const CLOUDS_ALTITUDE = 0.006;
const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame, drifts independently of globe autorotation
const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.15 };
const FOCUSED_POV_ALTITUDE = 0.5;
// All point markers use a near-zero altitude so they render as flat
// discs sitting on the globe's surface, not raised 3D pillars/cylinders.
const FLAT_ALTITUDE = 0.003;

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

interface GeoJsonFeature {
  type: "Feature";
  properties?: { ISO_A2?: string; ADMIN?: string; NAME?: string; [key: string]: unknown };
  geometry: { type: string; coordinates: unknown };
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

interface MapLayerData {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneData[];
  ports: Array<{ name: string; country: string; lat: number; lng: number; size: string }>;
  cables: CableFeature[];
  pipelines: PipelineFeature[];
  militaryBases: MilitaryBaseFeature[];
}

interface GlobePoint {
  id: string;
  kind: "port" | "naval" | "wildfire" | "storm";
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
  label: string;
}

interface GlobeMarker {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  color: string;
  size: number;
  label: string;
  kind: "event" | "militaryBase";
  event?: Event;
  base?: MilitaryBaseFeature;
}

interface GlobePath {
  id: string;
  points: [number, number, number][];
  color: string;
  label: string;
  stroke: number;
  dashLength: number;
  dashGap: number;
  dashInitialGap: number;
  dashAnimateTime: number;
  altitude: number;
}

// three-globe reads path altitude PER POINT (not per path), via whatever
// field/function pathPointAlt is set to, applied to each raw point tuple —
// not to the path object itself. So altitude must be baked into every
// point as a 3rd array element; a path-level "altitude" property is never
// read and silently produces NaN positions (an invisible line).
function withAltitude(points: [number, number][], altitude: number): [number, number, number][] {
  return points.map(([lat, lng]) => [lat, lng, altitude]);
}

interface RingDatum {
  id: string;
  lat: number;
  lng: number;
  color: [string, string];
  maxRadius: number;
  propagationSpeed: number;
  repeatPeriod: number;
}

// Curated set of well-known, real-world shipping corridors, chosen specifically
// for the 3D globe: each is a single continuous, hand-picked waypoint chain
// (unlike the raw shipping-lane dataset, which is thousands of short,
// disconnected density fragments that read as "broken" lines on a sphere).
const TRADE_ROUTES = [
  {
    name: "Trans-Pacific Route",
    points: [
      [31.2, 121.5], // Shanghai
      [35.5, 140.5], // off Japan
      [45.0, 175.0], // North Pacific
      [48.0, -170.0], // crossing antimeridian
      [45.0, -140.0],
      [33.7, -118.2], // Los Angeles
    ] as [number, number][],
  },
  {
    name: "Trans-Atlantic Route",
    points: [
      [51.9, 4.5], // Rotterdam
      [49.0, -8.0],
      [45.0, -35.0],
      [42.0, -60.0],
      [40.7, -74.0], // New York
    ] as [number, number][],
  },
  {
    name: "Asia-Europe via Suez",
    points: [
      [31.2, 121.5], // Shanghai
      [10.0, 106.0], // South China Sea
      [1.3, 103.8], // Singapore Strait
      [6.0, 80.0], // south of Sri Lanka
      [12.6, 43.4], // Bab-el-Mandeb
      [27.8, 34.3], // Red Sea
      [31.3, 32.3], // Suez Canal
      [35.5, 22.0], // Mediterranean
      [36.0, -5.4], // Strait of Gibraltar
      [51.9, 4.5], // Rotterdam
    ] as [number, number][],
  },
  {
    name: "Cape of Good Hope Route",
    points: [
      [31.2, 121.5], // Shanghai
      [1.3, 103.8], // Singapore Strait
      [-6.0, 80.0], // south of Sri Lanka
      [-34.0, 18.4], // Cape Town
      [10.0, -12.0], // West Africa coast
      [51.9, 4.5], // Rotterdam
    ] as [number, number][],
  },
  {
    name: "Panama Canal Route",
    points: [
      [33.7, -118.2], // Los Angeles
      [17.0, -95.0],
      [9.0, -79.5], // Panama Canal
      [25.8, -80.2], // Miami
      [40.7, -74.0], // New York
    ] as [number, number][],
  },
  {
    name: "Strait of Hormuz Route",
    points: [
      [26.5, 56.25], // Strait of Hormuz
      [18.0, 65.0],
      [8.0, 77.5],
      [1.3, 103.8], // Singapore Strait
      [22.3, 114.2], // Hong Kong
    ] as [number, number][],
  },
  {
    name: "Australia-Asia Route",
    points: [
      [-33.9, 151.2], // Sydney
      [-15.0, 128.0],
      [1.3, 103.8], // Singapore Strait
      [22.3, 114.2], // Hong Kong
    ] as [number, number][],
  },
  {
    name: "West Africa-Europe Route",
    points: [
      [6.4, 3.4], // Lagos
      [20.0, -17.0],
      [36.0, -5.4], // Strait of Gibraltar
      [51.9, 4.5], // Rotterdam
    ] as [number, number][],
  },
];

const FALLBACK_CONFLICT_ZONES: ConflictZoneData[] = [
  {
    id: "fallback-eastern-europe-aoi",
    name: "Eastern Europe AOI",
    countries: ["Ukraine", "Belarus", "Russia"],
    actors: ["State military forces", "Regional militias"],
    description: "Fallback operational area of interest used when live conflict-zone polygons are unavailable.",
    casualties: "Unknown",
    startYear: 2022,
    intensity: "high",
    sources: ["Fallback AOI"],
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[
          [30.0, 51.5],
          [40.5, 49.5],
          [38.0, 45.0],
          [28.0, 46.5],
          [30.0, 51.5],
        ]],
      ],
    },
  },
  {
    id: "fallback-levant-aoi",
    name: "Levant AOI",
    countries: ["Syria", "Iraq", "Israel", "Jordan"],
    actors: ["Regional militaries", "Non-state armed groups"],
    description: "Fallback Levant area of interest used while detailed polygon data is unavailable.",
    casualties: "Unknown",
    startYear: 2011,
    intensity: "medium",
    sources: ["Fallback AOI"],
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[
          [34.0, 37.0],
          [40.0, 36.0],
          [39.0, 30.0],
          [34.5, 30.0],
          [34.0, 37.0],
        ]],
      ],
    },
  },
  {
    id: "fallback-red-sea-aoi",
    name: "Red Sea AOI",
    countries: ["Egypt", "Sudan", "Saudi Arabia", "Yemen"],
    actors: ["Regional naval forces", "Militant groups"],
    description: "Fallback Red Sea area of interest used while live polygon coverage is unavailable.",
    casualties: "Unknown",
    startYear: 2023,
    intensity: "low",
    sources: ["Fallback AOI"],
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[
          [34.0, 22.0],
          [44.0, 22.0],
          [44.0, 12.0],
          [36.0, 12.0],
          [34.0, 22.0],
        ]],
      ],
    },
  },
];

const PORTS = [
  { name: "Rotterdam", country: "Netherlands", lat: 51.95, lng: 4.13, size: "Major" },
  { name: "Singapore", country: "Singapore", lat: 1.26, lng: 103.84, size: "Major" },
  { name: "Shanghai", country: "China", lat: 31.23, lng: 121.49, size: "Major" },
  { name: "Jebel Ali", country: "UAE", lat: 25.01, lng: 55.06, size: "Major" },
  { name: "Los Angeles", country: "United States", lat: 33.74, lng: -118.27, size: "Major" },
  { name: "Panama", country: "Panama", lat: 8.95, lng: -79.57, size: "Strategic" },
];

const intensityColor = (intensity: ConflictZoneData["intensity"]) =>
  intensity === "high" ? "#ef4444" : intensity === "medium" ? "#f59e0b" : "#84cc16";

const stormColor = (classification: string) =>
  classification === "HU" ? "#ef4444" : classification === "TS" ? "#f97316" : "#facc15";

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function GlobeMap({
  events,
  selectedEvent,
  onSelectEvent,
  activeLayers,
  layerData,
  navalVessels = [],
  wildfires = [],
  storms = [],
  onSelectConflictZone,
  selectedMilitaryBase = null,
  onSelectMilitaryBase,
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
  onSelectConflictZone?: (zone: ConflictZoneData) => void;
  selectedMilitaryBase?: MilitaryBaseFeature | null;
  onSelectMilitaryBase?: (base: MilitaryBaseFeature) => void;
  mobileVisible?: boolean;
}) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const priorPointOfViewRef = useRef<{ lat: number; lng: number; altitude: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [globeReady, setGlobeReady] = useState(false);
  const [countryFeatures, setCountryFeatures] = useState<GeoJsonFeature[]>([]);
  const sweepBarRef = useRef<HTMLDivElement | null>(null);
  const [sweepFlashes, setSweepFlashes] = useState<
    { id: string; lat: number; lng: number; title: string; ts: number }[]
  >([]);
  const sweepFlashElRefs = useRef(new Map<string, HTMLDivElement | null>());
  const sweepFlashesRef = useRef(sweepFlashes);
  sweepFlashesRef.current = sweepFlashes;

  // Country outlines aren't baked into the night-earth texture (unlike the
  // 2D map's tile basemap), so fetch a lightweight world-borders GeoJSON
  // once and render it as a always-on, non-interactive polygon layer.
  useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/gh/vasturiano/react-globe.gl/example/datasets/ne_110m_admin_0_countries.geojson")
      .then((res) => res.json())
      .then((geojson: { features?: GeoJsonFeature[] }) => {
        if (cancelled) return;
        const features = (geojson.features || []).filter(
          (feature) => feature?.properties?.ISO_A2 !== "AQ"
        );
        setCountryFeatures(features);
      })
      .catch(() => {
        if (!cancelled) setCountryFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mobileVisible) return;
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setDimensions({
        width: Math.max(container.clientWidth, 0),
        height: Math.max(container.clientHeight, 0),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener("resize", updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [mobileVisible]);

  // Adds a subtle, semi-transparent cloud sphere slightly above the globe
  // surface that drifts independently of the globe's own rotation — gives
  // the render a sense of depth/atmosphere instead of a flat static texture.
  useEffect(() => {
    if (!globeReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    let cloudMesh: THREE.Mesh | null = null;
    let frameId: number;
    let cancelled = false;

    new THREE.TextureLoader().load(CLOUDS_TEXTURE, (cloudsTexture) => {
      if (cancelled) {
        cloudsTexture.dispose();
        return;
      }
      const geometry = new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALTITUDE), 75, 75);
      // Unlit material (not affected by scene lighting) kept subtle and
      // non-depth-writing so it never occludes country borders/markers
      // rendered at a higher altitude on the globe surface.
      const material = new THREE.MeshBasicMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      cloudMesh = new THREE.Mesh(geometry, material);
      globe.scene().add(cloudMesh);

      const rotateClouds = () => {
        if (cloudMesh) cloudMesh.rotation.y += (CLOUDS_ROTATION_SPEED * Math.PI) / 180;
        frameId = requestAnimationFrame(rotateClouds);
      };
      frameId = requestAnimationFrame(rotateClouds);
    });

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (cloudMesh) {
        globe.scene().remove(cloudMesh);
        cloudMesh.geometry.dispose();
        (cloudMesh.material as THREE.MeshBasicMaterial).map?.dispose();
        (cloudMesh.material as THREE.MeshBasicMaterial).dispose();
      }
    };
  }, [globeReady]);

  // Radar-style sweep, matching the 2D map's ScanSweep: a bright vertical
  // line pulses left-to-right across the view on a loop. When the sweep
  // front crosses an event marker's current on-screen projection — and that
  // point currently faces the camera rather than being hidden on the far
  // side of the globe — the event briefly "reveals" with an expanding ring
  // + fading title label, tracked every frame via the live globe projection
  // so it stays accurate as the camera orbits.
  useEffect(() => {
    if (!globeReady) return;
    const globe = globeRef.current;
    if (!globe) return;
    if (dimensions.width <= 0 || dimensions.height <= 0) return;

    const durationMs = 9000;
    let raf: number;
    let start: number | null = null;
    let prevX = 0;
    let prevProgress = 0;
    const recentlyFlashed = new Map<string, number>();

    const step = (t: number) => {
      if (start === null) start = t;
      const elapsed = (t - start) % durationMs;
      const progress = elapsed / durationMs;
      const width = dimensions.width;
      const height = dimensions.height;
      const currX = progress * width;

      if (sweepBarRef.current) {
        sweepBarRef.current.style.transform = `translateX(${currX}px)`;
      }

      const camera = globe.camera();

      if (progress >= prevProgress) {
        const lo = Math.min(prevX, currX);
        const hi = Math.max(prevX, currX);
        const newFlashes: typeof sweepFlashes = [];
        for (const event of events) {
          const last = recentlyFlashed.get(event.id);
          if (last !== undefined && t - last < durationMs * 0.5) continue;
          const { lat, lng } = event.location;
          const world = globe.getCoords(lat, lng, FLAT_ALTITUDE);
          const facingCamera =
            world.x * camera.position.x + world.y * camera.position.y + world.z * camera.position.z > 0;
          if (!facingCamera) continue;
          const screen = globe.getScreenCoords(lat, lng, FLAT_ALTITUDE);
          if (screen.x >= lo && screen.x <= hi && screen.y >= 0 && screen.y <= height) {
            recentlyFlashed.set(event.id, t);
            newFlashes.push({ id: `${event.id}-${t}`, lat, lng, title: event.title, ts: t });
          }
        }
        if (newFlashes.length > 0) {
          setSweepFlashes((f) => [...f, ...newFlashes]);
        }
      }

      for (const [id, el] of sweepFlashElRefs.current) {
        if (!el) continue;
        const fl = sweepFlashesRef.current.find((f) => f.id === id);
        if (!fl) continue;
        const screen = globe.getScreenCoords(fl.lat, fl.lng, FLAT_ALTITUDE);
        el.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
      }

      prevX = currX;
      prevProgress = progress;
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [globeReady, dimensions.width, dimensions.height, events]);

  // Sweep out old flash entries so the array doesn't grow unbounded.
  useEffect(() => {
    if (sweepFlashes.length === 0) return;
    const id = setTimeout(() => {
      setSweepFlashes((f) => f.filter((fl) => performance.now() - fl.ts < 2000));
      for (const key of Array.from(sweepFlashElRefs.current.keys())) {
        if (!sweepFlashes.some((fl) => fl.id === key)) sweepFlashElRefs.current.delete(key);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [sweepFlashes]);

  useEffect(() => {
    if (!globeReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
  }, [globeReady, dimensions.width, dimensions.height]);

  useEffect(() => {
    if (!globeReady) return;
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();

    const focusTarget = selectedEvent
      ? { lat: selectedEvent.location.lat, lng: selectedEvent.location.lng }
      : selectedMilitaryBase
      ? { lat: selectedMilitaryBase.lat, lng: selectedMilitaryBase.lng }
      : null;

    if (focusTarget) {
      controls.autoRotate = false;
      if (!priorPointOfViewRef.current) {
        priorPointOfViewRef.current = globe.pointOfView();
      }
      globe.pointOfView(
        {
          lat: focusTarget.lat,
          lng: focusTarget.lng,
          altitude: FOCUSED_POV_ALTITUDE,
        },
        900
      );
      return;
    }

    controls.autoRotate = true;
    const fallback = priorPointOfViewRef.current ?? DEFAULT_POV;
    globe.pointOfView(fallback, 900);
    priorPointOfViewRef.current = null;
  }, [globeReady, selectedEvent?.id, selectedMilitaryBase?.id]);

  // The globe always uses the curated named routes (not the raw shipping-lane
  // dataset) — that dataset is thousands of short, disconnected density
  // fragments which read as "broken" lines when drawn on a sphere.
  const routesToRender = TRADE_ROUTES;
  const zonesToRender = layerData?.conflictZones?.length ? layerData.conflictZones : FALLBACK_CONFLICT_ZONES;
  const portsToRender = layerData?.ports?.length ? layerData.ports : PORTS;

  // react-globe.gl only supports a single polygon layer, so country outlines
  // and conflict-zone polygons are merged into one array and styled per-item
  // via the "kind" discriminant.
  const combinedPolygons = useMemo(() => {
    const countries = countryFeatures.map((feature) => ({
      kind: "country" as const,
      geometry: feature.geometry,
      name: feature.properties?.ADMIN || feature.properties?.NAME || "",
    }));
    const zones = activeLayers.conflictZones
      ? zonesToRender.map((zone) => ({ ...zone, kind: "zone" as const }))
      : [];
    return [...countries, ...zones];
  }, [countryFeatures, zonesToRender, activeLayers.conflictZones]);

  const pointData = useMemo<GlobePoint[]>(() => {
    const layerPoints: GlobePoint[] = [];

    if (activeLayers.ports) {
      layerPoints.push(
        ...portsToRender.map((port) => ({
          id: `port-${port.name}`,
          kind: "port" as const,
          lat: port.lat,
          lng: port.lng,
          color: "#93c5fd",
          radius: 0.14,
          altitude: FLAT_ALTITUDE,
          label: `Port: ${port.name}${port.country ? ` (${port.country})` : ""}`,
        }))
      );
    }

    if (activeLayers.navalVessels) {
      layerPoints.push(
        ...navalVessels.map((vessel) => ({
          id: `naval-${vessel.mmsi}`,
          kind: "naval" as const,
          lat: vessel.lat,
          lng: vessel.lng,
          color: "#7dd3fc",
          radius: 0.18,
          altitude: FLAT_ALTITUDE,
          label: `⚓ ${vessel.name}${vessel.speed !== null ? ` — ${vessel.speed.toFixed(1)} kn` : ""}`,
        }))
      );
    }

    if (activeLayers.wildfires) {
      layerPoints.push(
        ...wildfires.map((fire, index) => ({
          id: `fire-${index}`,
          kind: "wildfire" as const,
          lat: fire.lat,
          lng: fire.lng,
          color: fire.frp > 200 ? "#f97316" : "#fca5a5",
          radius: Math.min(0.42, Math.max(0.12, Math.sqrt(Math.max(fire.frp, 1)) / 32)),
          altitude: FLAT_ALTITUDE,
          label: `🔥 FRP ${fire.frp.toFixed(0)} MW — ${fire.acqDate} ${fire.confidence}% confidence`,
        }))
      );
    }

    if (activeLayers.storms) {
      layerPoints.push(
        ...storms.map((storm) => ({
          id: `storm-${storm.id}`,
          kind: "storm" as const,
          lat: storm.lat,
          lng: storm.lng,
          color: stormColor(storm.classification),
          radius: 0.24,
          altitude: FLAT_ALTITUDE,
          label: `${storm.name}${storm.intensity !== null ? ` — ${storm.intensity} kn` : ""}${storm.pressure !== null ? `, ${storm.pressure} mb` : ""}`,
        }))
      );
    }

    return [...layerPoints];
  }, [
    activeLayers.navalVessels,
    activeLayers.ports,
    activeLayers.storms,
    activeLayers.wildfires,
    navalVessels,
    portsToRender,
    storms,
    wildfires,
  ]);

  // Event markers use HTML overlays (not WebGL points) so they render as
  // crisp, sharply-defined dots with a white border + glow + pulse ring —
  // identical to the 2D map's marker style — instead of blending into the
  // dark earth texture like the flat WebGL discs did. Military bases share
  // this same HTML-overlay layer (not the WebGL pointsData layer) so they
  // get the identical pulsing-ring treatment as events.
  const eventMarkers = useMemo<GlobeMarker[]>(() => {
    const markers: GlobeMarker[] = events.map((event) => ({
      id: `event-${event.id}`,
      lat: event.location.lat,
      lng: event.location.lng,
      altitude: FLAT_ALTITUDE,
      color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.war,
      size: 14,
      label: `${event.title}\n${event.category.replace(/_/g, " ")}`,
      kind: "event",
      event,
    }));

    if (activeLayers.militaryBases) {
      (layerData?.militaryBases || []).forEach((base) => {
        markers.push({
          id: `base-${base.id}`,
          lat: base.lat,
          lng: base.lng,
          altitude: FLAT_ALTITUDE,
          color: base.isMajor ? "#d4b36a" : "#6b7d3d",
          size: base.isMajor ? 12 : 9,
          label: `🎯 ${base.name}${base.country ? ` (${base.country})` : ""}${base.operator ? ` — ${base.operator}` : ""}${base.isMajor ? " ★" : ""}`,
          kind: "militaryBase",
          base,
        });
      });
    }

    return markers;
  }, [events, activeLayers.militaryBases, layerData?.militaryBases]);

  const pathData = useMemo<GlobePath[]>(() => {
    const paths: GlobePath[] = [];

    // Trade routes render as dashed surface paths (like cables/pipelines)
    // instead of raised arcs — arcs bulging above the surface were hard to
    // tell apart from each other at a glance; flat glowing lines hugging
    // the globe read much more clearly as distinct routes.
    if (activeLayers.tradeRoutes) {
      routesToRender.forEach((route) => {
        paths.push({
          id: `trade-${route.name}`,
          points: withAltitude(route.points, 0.09),
          color: "#f5d68a",
          label: `📦 ${route.name}`,
          stroke: 0.45,
          // Solid (not dashed) so routes read as continuous, unbroken lines
          // instead of looking glitchy/disconnected at a glance.
          dashLength: 1,
          dashGap: 0,
          dashInitialGap: 0,
          dashAnimateTime: 0,
          // Raised well above the surface (cloud shell, borders, and higher
          // still) so more of each route stays visible near the horizon
          // before the globe's curvature occludes it going over the back.
          altitude: 0.09,
        });
      });
    }

    if (activeLayers.cables) {
      for (const cable of layerData?.cables || []) {
        cable.paths.forEach((path, index) => {
          paths.push({
            id: `cable-${cable.id}-${index}`,
            points: withAltitude(path, 0.01),
            color: "#22d3ee",
            label: `🔌 ${cable.name}`,
            stroke: 0.18,
            dashLength: 0.22,
            dashGap: 0.14,
            dashInitialGap: index * 0.03,
            dashAnimateTime: 2400,
            altitude: 0.01,
          });
        });
      }
    }

    if (activeLayers.pipelines) {
      for (const pipeline of layerData?.pipelines || []) {
        pipeline.paths.forEach((path, index) => {
          paths.push({
            id: `pipeline-${pipeline.id}-${index}`,
            points: withAltitude(path, 0.008),
            color: pipeline.substance === "gas" ? "#eab308" : "#b45309",
            label: `${pipeline.substance === "gas" ? "🔥" : "🛢️"} ${pipeline.name}`,
            stroke: 0.22,
            dashLength: 1,
            dashGap: 0,
            dashInitialGap: 0,
            dashAnimateTime: 0,
            altitude: 0.008,
          });
        });
      }
    }

    return paths;
  }, [
    activeLayers.tradeRoutes,
    activeLayers.cables,
    activeLayers.pipelines,
    routesToRender,
    layerData?.cables,
    layerData?.pipelines,
  ]);

  // Give every event marker the same continuous small pulse ring the 2D
  // map's ".marker-pulse-ring" CSS animation shows (fast, tight, ~2s loop),
  // so events read as "live" on the globe too — not just the selected one.
  // The small continuous per-event pulse now lives in the HTML marker's own
  // CSS (`.marker-pulse-ring`, matching the 2D map exactly), so only the
  // larger, slower focus ring for the selected event remains here (mirrors
  // the 2D map's bigger EventPingRings focus effect).
  const ringData = useMemo<RingDatum[]>(() => {
    if (!selectedEvent) return [];
    const color = CATEGORY_COLORS[selectedEvent.category] || CATEGORY_COLORS.war;
    return [
      {
        id: `focus-${selectedEvent.id}`,
        lat: selectedEvent.location.lat,
        lng: selectedEvent.location.lng,
        color: [hexToRgba(color, 0.82), hexToRgba(color, 0.12)],
        maxRadius: 5.5,
        propagationSpeed: 4.6,
        repeatPeriod: 1150,
      },
    ];
  }, [selectedEvent]);

  if (!mobileVisible) {
    return <div className="h-full w-full" style={{ display: "none" }} />;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[#050505]">
      {/* Thin static grid overlay, matching the 2D map's radar-style grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(212,179,106,0.06) 0px, rgba(212,179,106,0.06) 1px, transparent 1px, transparent 44px), repeating-linear-gradient(to bottom, rgba(212,179,106,0.06) 0px, rgba(212,179,106,0.06) 1px, transparent 1px, transparent 44px)",
        }}
      />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={EARTH_TEXTURE}
          bumpImageUrl={EARTH_BUMP_TEXTURE}
          showAtmosphere={true}
          atmosphereColor="#f0d9a0"
          atmosphereAltitude={0.1}
          pointsData={pointData}
          pointColor="color"
          pointAltitude="altitude"
          pointRadius="radius"
          pointLabel="label"
          pointsTransitionDuration={300}
          htmlElementsData={eventMarkers}
          htmlLat="lat"
          htmlLng="lng"
          htmlAltitude="altitude"
          htmlElement={(d) => {
            const marker = d as GlobeMarker;
            const size = marker.size;
            const el = document.createElement("div");
            el.style.position = "relative";
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.cursor = "pointer";
            el.style.pointerEvents = "auto";
            el.title = marker.label;
            el.innerHTML = `
              <div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${marker.color};"></div>
              <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${marker.color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${marker.color};"></div>
            `;
            el.addEventListener("click", (evt) => {
              evt.stopPropagation();
              if (marker.kind === "event" && marker.event) onSelectEvent(marker.event);
              else if (marker.kind === "militaryBase" && marker.base) onSelectMilitaryBase?.(marker.base);
            });
            return el;
          }}
          htmlTransitionDuration={300}
          polygonsData={combinedPolygons}
          polygonGeoJsonGeometry="geometry"
          polygonCapColor={(polygon) => {
            const p = polygon as { kind: "country" | "zone"; intensity?: ConflictZoneData["intensity"] };
            return p.kind === "country" ? "rgba(0,0,0,0)" : hexToRgba(intensityColor(p.intensity!), 0.22);
          }}
          polygonSideColor={(polygon) => {
            const p = polygon as { kind: "country" | "zone"; intensity?: ConflictZoneData["intensity"] };
            return p.kind === "country" ? "rgba(0,0,0,0)" : hexToRgba(intensityColor(p.intensity!), 0.08);
          }}
          polygonStrokeColor={(polygon) => {
            const p = polygon as { kind: "country" | "zone"; intensity?: ConflictZoneData["intensity"] };
            return p.kind === "country" ? "rgba(148, 163, 184, 0.45)" : intensityColor(p.intensity!);
          }}
          polygonAltitude={(polygon) => {
            const p = polygon as { kind: "country" | "zone"; intensity?: ConflictZoneData["intensity"] };
            // Country borders sit above the cloud shell (CLOUDS_ALTITUDE = 0.006)
            // so the cloud layer never visually swallows the outline strokes.
            if (p.kind === "country") return CLOUDS_ALTITUDE + 0.003;
            return p.intensity === "high" ? 0.02 : p.intensity === "medium" ? 0.014 : 0.01;
          }}
          polygonLabel={(polygon) => {
            const p = polygon as { kind: "country" | "zone"; name?: string };
            return p.kind === "country" ? p.name || "" : `${p.name} (click to expand)`;
          }}
          polygonsTransitionDuration={250}
          onPolygonClick={(polygon) => {
            const p = polygon as { kind: "country" | "zone" };
            if (p.kind === "zone") onSelectConflictZone?.(polygon as ConflictZoneData);
          }}
          pathsData={pathData}
          pathPoints="points"
          pathPointAlt={(pnt: unknown) => (pnt as [number, number, number])[2]}
          pathColor="color"
          pathStroke="stroke"
          pathLabel="label"
          pathDashLength="dashLength"
          pathDashGap="dashGap"
          pathDashInitialGap="dashInitialGap"
          pathDashAnimateTime="dashAnimateTime"
          pathTransitionDuration={0}
          ringsData={ringData}
          ringColor="color"
          ringAltitude={0.01}
          ringMaxRadius="maxRadius"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
          enablePointerInteraction={true}
          showPointerCursor={(objType, objData) => {
            const data = objData as { kind?: string } | undefined;
            return objType === "polygon" && data?.kind === "zone";
          }}
          lineHoverPrecision={0.4}
          onGlobeReady={() => {
            setGlobeReady(true);
            globeRef.current?.pointOfView(DEFAULT_POV, 0);
          }}
        />
      )}
      {/* Sweeping line — thin bright core + soft wide glow trailing behind
          it, matching the 2D map's ScanSweep bar exactly. */}
      <div
        ref={sweepBarRef}
        className="pointer-events-none absolute top-0 bottom-0 z-10"
        style={{ left: -60, width: 120, willChange: "transform" }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,179,106,0.16), transparent)" }}
        />
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: 60,
            width: 2,
            background: "rgba(212,179,106,0.95)",
            boxShadow: "0 0 16px 3px rgba(212,179,106,0.6)",
          }}
        />
      </div>
      {/* Reveal flashes — positioned via a direct ref + transform, updated
          every animation frame from the live globe projection, so they
          track the camera's orbit instead of staying pinned to stale
          screen coordinates from when they fired. */}
      {sweepFlashes.map((f) => (
        <div
          key={f.id}
          ref={(el) => {
            sweepFlashElRefs.current.set(f.id, el);
          }}
          className="pointer-events-none absolute left-0 top-0 z-10"
          style={{ willChange: "transform" }}
        >
          <div
            className="scan-reveal-ring absolute rounded-full"
            style={{ left: -18, top: -18, width: 36, height: 36, border: "2px solid #d4b36a" }}
          />
          <div
            className="scan-label-fade absolute whitespace-nowrap rounded"
            style={{
              left: 12,
              top: -10,
              background: "#0e0e0ecc",
              border: "1px solid #3a3a3a",
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
    </div>
  );
}
