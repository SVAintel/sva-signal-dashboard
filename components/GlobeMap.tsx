"use client";

import Globe, { GlobeMethods } from "react-globe.gl";
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
const STARFIELD_TEXTURE = "//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png";
const DEFAULT_POV = { lat: 20, lng: 0, altitude: 2.15 };
const FOCUSED_POV_ALTITUDE = 1.45;

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
  kind: "event" | "port" | "naval" | "militaryBase" | "wildfire" | "storm";
  lat: number;
  lng: number;
  color: string;
  radius: number;
  altitude: number;
  label: string;
  event?: Event;
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

    if (selectedEvent) {
      if (!priorPointOfViewRef.current) {
        priorPointOfViewRef.current = globe.pointOfView();
      }
      globe.pointOfView(
        {
          lat: selectedEvent.location.lat,
          lng: selectedEvent.location.lng,
          altitude: FOCUSED_POV_ALTITUDE,
        },
        1200
      );
      return;
    }

    const fallback = priorPointOfViewRef.current ?? DEFAULT_POV;
    globe.pointOfView(fallback, 1200);
    priorPointOfViewRef.current = null;
  }, [globeReady, selectedEvent?.id]);

  const routesToRender = layerData?.tradeRoutes?.length ? layerData.tradeRoutes : TRADE_ROUTES;
  const zonesToRender = layerData?.conflictZones?.length ? layerData.conflictZones : FALLBACK_CONFLICT_ZONES;
  const portsToRender = layerData?.ports?.length ? layerData.ports : PORTS;

  const pointData = useMemo<GlobePoint[]>(() => {
    const eventPoints = events.map((event) => ({
      id: `event-${event.id}`,
      kind: "event" as const,
      lat: event.location.lat,
      lng: event.location.lng,
      color: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.war,
      radius: 0.28,
      altitude: 0.12,
      label: `${event.title}\n${event.category.replace(/_/g, " ")}`,
      event,
    }));

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
          altitude: 0.025,
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
          altitude: 0.04,
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
          altitude: 0.03,
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
          altitude: 0.05,
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
          altitude: 0.055,
          label: `${storm.name}${storm.intensity !== null ? ` — ${storm.intensity} kn` : ""}${storm.pressure !== null ? `, ${storm.pressure} mb` : ""}`,
        }))
      );
    }

    return [...layerPoints, ...eventPoints];
  }, [
    activeLayers.militaryBases,
    activeLayers.navalVessels,
    activeLayers.ports,
    activeLayers.storms,
    activeLayers.wildfires,
    events,
    layerData?.militaryBases,
    navalVessels,
    portsToRender,
    storms,
    wildfires,
  ]);

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

  const ringData = useMemo<RingDatum[]>(() => {
    if (!selectedEvent) return [];
    const color = CATEGORY_COLORS[selectedEvent.category] || CATEGORY_COLORS.war;
    return [
      {
        id: `ring-${selectedEvent.id}`,
        lat: selectedEvent.location.lat,
        lng: selectedEvent.location.lng,
        color: [hexToRgba(color, 0.82), hexToRgba(color, 0.12)],
      },
    ];
  }, [selectedEvent]);

  if (!mobileVisible) {
    return <div className="h-full w-full" style={{ display: "none" }} />;
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-[#050505]">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          backgroundImageUrl={STARFIELD_TEXTURE}
          globeImageUrl={EARTH_TEXTURE}
          showAtmosphere={true}
          atmosphereColor="#d4b36a"
          atmosphereAltitude={0.12}
          pointsData={pointData}
          pointColor="color"
          pointAltitude="altitude"
          pointRadius="radius"
          pointLabel="label"
          pointsTransitionDuration={300}
          onPointClick={(point) => {
            const marker = point as GlobePoint;
            if (marker.kind === "event" && marker.event) {
              onSelectEvent(marker.event);
            }
          }}
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
          polygonsData={activeLayers.conflictZones ? zonesToRender : []}
          polygonGeoJsonGeometry="geometry"
          polygonCapColor={(zone) => hexToRgba(intensityColor((zone as ConflictZoneData).intensity), 0.22)}
          polygonSideColor={(zone) => hexToRgba(intensityColor((zone as ConflictZoneData).intensity), 0.08)}
          polygonStrokeColor={(zone) => intensityColor((zone as ConflictZoneData).intensity)}
          polygonAltitude={(zone) => {
            const intensity = (zone as ConflictZoneData).intensity;
            return intensity === "high" ? 0.02 : intensity === "medium" ? 0.014 : 0.01;
          }}
          polygonLabel={(zone) => `${(zone as ConflictZoneData).name} (click to expand)`}
          polygonsTransitionDuration={250}
          onPolygonClick={(zone) => onSelectConflictZone?.(zone as ConflictZoneData)}
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
          ringMaxRadius={5.5}
          ringPropagationSpeed={4.6}
          ringRepeatPeriod={1150}
          enablePointerInteraction={true}
          showPointerCursor={(objType, objData) => {
            const data = objData as { kind?: string } | undefined;
            return (objType === "point" && data?.kind === "event") || objType === "polygon";
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
