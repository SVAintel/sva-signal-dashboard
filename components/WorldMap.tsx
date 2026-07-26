"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Event } from "@/lib/types";

const warIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ef4444'><circle cx='12' cy='12' r='10'/></svg>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const disasterIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f59e0b'><circle cx='12' cy='12' r='10'/></svg>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const financeIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'><circle cx='12' cy='12' r='10'/></svg>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function WorldMap({
  events,
  selectedEvent,
}: {
  events: Event[];
  selectedEvent: Event | null;
}) {
  const getIcon = (category: string) => {
    if (category === "war") return warIcon;
    if (category === "natural_disaster") return disasterIcon;
    return financeIcon;
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.location.lat, event.location.lng]}
          icon={getIcon(event.category)}
        >
          <Popup>
            <div className="font-semibold">{event.title}</div>
            <div className="text-sm text-gray-600">{event.source}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
