"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, GeoJSON, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";
import { ConflictZoneData } from "./ConflictZoneDetailPanel";
import { useEffect } from "react";

const makeIcon = (color: string) =>
  new L.DivIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 8px ${color};"></div>`,
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
}

interface ConflictZoneOutput extends ConflictZoneData {}

interface MapLayerData {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneOutput[];
  ports: Array<{ name: string; country: string; lat: number; lng: number; size: string }>;
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

export default function WorldMap({
  events,
  selectedEvent,
  onSelectEvent,
  activeLayers,
  layerData,
  onSelectConflictZone,
  mobileVisible = true,
}: {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
  activeLayers: MapLayers;
  layerData: MapLayerData | null;
  onSelectConflictZone?: (zone: ConflictZoneOutput) => void;
  mobileVisible?: boolean;
}) {
  const routesToRender = layerData?.tradeRoutes?.length ? layerData.tradeRoutes : TRADE_ROUTES;
  const zonesToRender = layerData?.conflictZones?.length ? layerData.conflictZones : [];
  const portsToRender = layerData?.ports?.length ? layerData.ports : PORTS.map((p) => ({ ...p, country: "N/A", size: "Unknown" }));

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={8}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#040906" }}
      zoomControl={false}
    >
      <MapFitter visible={mobileVisible} />
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

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.location.lat, event.location.lng]}
          icon={icons[event.category] || icons.war}
        >
          <Popup className="tactical-popup">
            <div style={{ background: "#0a1711", border: "1px solid #23503a", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
              <div style={{ color: "#d4b36a", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                {event.category.replace(/_/g, " ")}
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{event.title}</div>
              <div style={{ color: "#64748b", fontSize: "11px" }}>{event.source}</div>
              <button
                onClick={() => onSelectEvent(event)}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  border: "1px solid #23503a",
                  background: "#0f2018",
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
    </MapContainer>
  );
}
