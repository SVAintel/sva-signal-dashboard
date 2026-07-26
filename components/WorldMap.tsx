"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";

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
};

const worldBounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));

export default function WorldMap({
  events,
  selectedEvent,
}: {
  events: Event[];
  selectedEvent: Event | null;
}) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={8}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
      zoomControl={false}
    >
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
            <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", padding: "8px 10px", borderRadius: "4px", minWidth: "180px" }}>
              <div style={{ color: "#22d3ee", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                {event.category.replace(/_/g, " ")}
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{event.title}</div>
              <div style={{ color: "#64748b", fontSize: "11px" }}>{event.source}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
