"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";
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

function MapFitter() {
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

  return null;
}

export default function WorldMap({
  events,
  selectedEvent,
  onSelectEvent,
}: {
  events: Event[];
  selectedEvent: Event | null;
  onSelectEvent: (event: Event) => void;
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={8}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#090506" }}
      zoomControl={false}
    >
      <MapFitter />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        noWrap={true}
      />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.location.lat, event.location.lng]}
          icon={icons[event.category] || icons.war}
        >
          <Popup className="tactical-popup">
            <div style={{ background: "#140b0f", border: "1px solid #3a1d24", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
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
                  border: "1px solid #3a1d24",
                  background: "#1a0f12",
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
