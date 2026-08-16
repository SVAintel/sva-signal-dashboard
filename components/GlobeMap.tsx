"use client";

import Globe, { GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Event } from "@/lib/types";
import { ConflictZoneData } from "./ConflictZoneDetailPanel";

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
  kind: "port" | "naval" | "militaryBase" | "wildfire" | "storm";
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
  label: string;
}

interface GlobeEventMarker {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  color: string;
  label: string;
  event: Event;
}

interface GlobeArc {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label: string;
  altitude: number;
  dashLength: number;
  dashGap: number;
  dashInitialGap: number;
  dashAnimateTime: number;
}

interface GlobePath {
  id: string;
  points: [number, number][];
  color: string;
  label: string;
  stroke: number;
  dashLength: number;
  dashGap: number;
  dashInitialGap: number;
  dashAnimateTime: number;
  altitude: number;
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
  mobileVisible?: boolean;
}) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const priorPointOfViewRef = useRef<{ lat: number; lng: number; altitude: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [globeReady, setGlobeReady] = useState(false);
  const [countryFeatures, setCountryFeatures] = useState<GeoJsonFeature[]>([]);

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
      const material = new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true, opacity: 0.4 });
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
        (cloudMesh.material as THREE.MeshPhongMaterial).map?.dispose();
        (cloudMesh.material as THREE.MeshPhongMaterial).dispose();
      }
    };
  }, [globeReady]);

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

    if (selectedEvent) {
      controls.autoRotate = false;
      if (!priorPointOfViewRef.current) {
        priorPointOfViewRef.current = globe.pointOfView();
      }
      globe.pointOfView(
        {
          lat: selectedEvent.location.lat,
          lng: selectedEvent.location.lng,
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
  }, [globeReady, selectedEvent?.id]);

  const routesToRender = layerData?.tradeRoutes?.length ? layerData.tradeRoutes : TRADE_ROUTES;
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

  // All point markers use a near-zero altitude so they render as flat
  // discs sitting on the globe's surface, not raised 3D pillars/cylinders.
  const FLAT_ALTITUDE = 0.003;

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

    if (activeLayers.militaryBases) {
      layerPoints.push(
        ...(layerData?.militaryBases || []).map((base) => ({
          id: `base-${base.id}`,
          kind: "militaryBase" as const,
          lat: base.lat,
          lng: base.lng,
          color: "#6b7d3d",
          radius: 0.14,
          altitude: FLAT_ALTITUDE,
          label: `🎯 ${base.name}${base.country ? ` (${base.country})` : ""}${base.operator ? ` — ${base.operator}` : ""}`,
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
    activeLayers.militaryBases,
    activeLayers.navalVessels,
    activeLayers.ports,
    activeLayers.storms,
    activeLayers.wildfires,
    layerData?.militaryBases,
    navalVessels,
    portsToRender,
    storms,
    wildfires,
  ]);

  // Event markers use HTML overlays (not WebGL points) so they render as
  // crisp, sharply-defined dots with a white border + glow + pulse ring —
  // identical to the 2D map's marker style — instead of blending into the
  // dark earth texture like the flat WebGL discs did.
  const eventMarkers = useMemo<GlobeEventMarker[]>(
    () =>
      events.map((event) => ({
        id: `event-${event.id}`,
        lat: event.location.lat,
        lng: event.location.lng,
        altitude: FLAT_ALTITUDE,
        color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.war,
        label: `${event.title}\n${event.category.replace(/_/g, " ")}`,
        event,
      })),
    [events]
  );

  const tradeArcs = useMemo<GlobeArc[]>(() => {
    if (!activeLayers.tradeRoutes) return [];
    return routesToRender.flatMap((route, routeIndex) =>
      route.points.slice(0, -1).map((point, segmentIndex) => ({
        id: `trade-${route.name}-${segmentIndex}`,
        startLat: point[0],
        startLng: point[1],
        endLat: route.points[segmentIndex + 1][0],
        endLng: route.points[segmentIndex + 1][1],
        color: "#d4b36a",
        label: route.name,
        altitude: 0.08,
        dashLength: 0.38,
        dashGap: 0.18,
        dashInitialGap: ((routeIndex + segmentIndex) % 4) * 0.08,
        dashAnimateTime: 2800,
      }))
    );
  }, [activeLayers.tradeRoutes, routesToRender]);

  const pathData = useMemo<GlobePath[]>(() => {
    const paths: GlobePath[] = [];

    if (activeLayers.cables) {
      for (const cable of layerData?.cables || []) {
        cable.paths.forEach((path, index) => {
          paths.push({
            id: `cable-${cable.id}-${index}`,
            points: path,
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
            points: path,
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
  }, [activeLayers.cables, activeLayers.pipelines, layerData?.cables, layerData?.pipelines]);

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
    <div ref={containerRef} className="relative h-full w-full bg-[#050505]">
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
            const marker = d as GlobeEventMarker;
            const el = document.createElement("div");
            el.style.position = "relative";
            el.style.width = "14px";
            el.style.height = "14px";
            el.style.cursor = "pointer";
            el.style.pointerEvents = "auto";
            el.title = marker.label;
            el.innerHTML = `
              <div class="marker-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${marker.color};"></div>
              <div style="position:relative;width:14px;height:14px;border-radius:50%;background:${marker.color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${marker.color};"></div>
            `;
            el.addEventListener("click", (evt) => {
              evt.stopPropagation();
              onSelectEvent(marker.event);
            });
            return el;
          }}
          htmlTransitionDuration={300}
          arcsData={tradeArcs}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcAltitude="altitude"
          arcStroke={0.17}
          arcLabel="label"
          arcDashLength="dashLength"
          arcDashGap="dashGap"
          arcDashInitialGap="dashInitialGap"
          arcDashAnimateTime="dashAnimateTime"
          arcsTransitionDuration={0}
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
            if (p.kind === "country") return 0.001;
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
          pathPointAlt="altitude"
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
    </div>
  );
}
