"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import EventList from "./EventList";
import { useStore } from "@/store/useStore";
import { Event } from "@/lib/types";
import axios from "axios";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

export default function Dashboard() {
  const { userProfile, selectedCategory } = useStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events", {
          params: {
            profile: userProfile,
            category: selectedCategory,
          },
        });
        setEvents(res.data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userProfile, selectedCategory]);

  return (
    <div className="flex h-screen gap-4 bg-slate-900 p-4">
      <div className="flex-1 rounded-lg bg-slate-800 shadow-lg">
        <WorldMap events={events} selectedEvent={selectedEvent} />
      </div>
      <div className="w-96 space-y-4">
        <EventList
          events={events}
          loading={loading}
          onSelectEvent={(event) => setSelectedEvent(event)}
          selectedEvent={selectedEvent}
        />
      </div>
    </div>
  );
}
