"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import EventList from "./EventList";
import NewsPanel from "./NewsPanel";
import StockMarketPanel from "./StockMarketPanel";
import LiveBroadcasts from "./LiveBroadcasts";
import EventDetailPanel from "./EventDetailPanel";
import { useStore } from "@/store/useStore";
import { Event } from "@/lib/types";
import axios from "axios";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

const categoryLabels: Record<string, { label: string; color: string }> = {
  war: { label: "WAR", color: "#ef4444" },
  counter_terrorism: { label: "CT", color: "#a855f7" },
  natural_disaster: { label: "GEO", color: "#f59e0b" },
  market: { label: "MKT", color: "#22d3ee" },
  biological: { label: "BIO", color: "#22c55e" },
  political_unrest: { label: "POL", color: "#f97316" },
  cyber: { label: "CYB", color: "#06b6d4" },
  nuclear: { label: "NUC", color: "#84cc16" },
  energy: { label: "NRG", color: "#d97706" },
  humanitarian: { label: "HUM", color: "#f43f5e" },
};

type SidebarTab = "events" | "news" | "stocks";

export default function Dashboard() {
  const { userProfile, selectedCategory, setSelectedCategory, setUserProfile } = useStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/events", {
          params: { profile: userProfile, category: selectedCategory },
        });
        setEvents(res.data);
        setLastUpdated(new Date().toUTCString().replace("GMT", "Z"));
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 1800000); // 30 minutes
    return () => clearInterval(interval);
  }, [userProfile, selectedCategory]);

  const categories = ["all", "war", "counter_terrorism", "natural_disaster", "market", "biological", "political_unrest", "cyber", "nuclear", "energy", "humanitarian"];

  const handleEventSelect = (event: Event | null) => {
    setSelectedEvent(event);
    setDetailPanelOpen(!!event);
  };

  const handleCloseDetail = () => {
    setDetailPanelOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="flex h-screen flex-col bg-[#060a14] text-slate-200">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-[#1e3a5f] bg-[#080d1a] px-6 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">SVA Signal</span>
          </div>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs uppercase tracking-widest text-slate-500">
            Global Intelligence Dashboard
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Category filters */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => {
              const meta = cat !== "all" ? categoryLabels[cat] : null;
              const active = (selectedCategory ?? "all") === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === "all" ? null : cat)}
                  style={active && meta ? { borderColor: meta.color, color: meta.color } : {}}
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
                    active
                      ? "bg-[#0f172a]"
                      : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cat === "all" ? "ALL" : categoryLabels[cat].label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>PROFILE: <span className="text-cyan-400 font-bold">{userProfile?.toUpperCase()}</span></span>
            <button
              onClick={() => setUserProfile(null)}
              className="text-slate-600 hover:text-slate-400 transition"
            >
              [SWITCH]
            </button>
          </div>

          <div className="text-[10px] text-slate-600">
            UPDATED: <span className="text-slate-400">{lastUpdated || "—"}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Tabs - on LEFT */}
        <div className="w-[420px] flex flex-col bg-[#080d1a] border-r border-[#1e3a5f]">
          {/* Tab Buttons */}
          <div className="flex border-b border-[#1e3a5f] bg-[#0f172a]">
            {(["events", "news", "stocks"] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${
                  activeTab === tab
                    ? "border-cyan-400 text-cyan-400 bg-[#1a2847]"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab === "events" && "SIGNALS"}
                {tab === "news" && "NEWS"}
                {tab === "stocks" && "MARKETS"}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "events" && (
              <>
                {/* Signals — fills remaining space, scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <EventList
                    events={events}
                    loading={loading}
                    onSelectEvent={handleEventSelect}
                    selectedEvent={selectedEvent}
                  />
                </div>
                {/* Live feed — natural height (16:9 video + controls), no black bars */}
                <div className="shrink-0">
                  <LiveBroadcasts />
                </div>
              </>
            )}
            {activeTab === "news" && <NewsPanel />}
            {activeTab === "stocks" && <StockMarketPanel />}
          </div>
        </div>

        {/* Map - on RIGHT, fills remaining space */}
        <div className="relative flex-1">
          {/* Map legend */}
          <div className="absolute bottom-4 left-4 z-[999] rounded border border-[#1e3a5f] bg-[#080d1acc] px-3 py-2 text-[10px] backdrop-blur">
            {Object.entries(categoryLabels).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 py-0.5">
                <div className="h-2 w-2 rounded-full" style={{ background: val.color, boxShadow: `0 0 6px ${val.color}` }} />
                <span className="uppercase tracking-wider text-slate-400">{key.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>

          {/* Event count badge */}
          <div className="absolute right-4 top-4 z-[999] rounded border border-[#1e3a5f] bg-[#080d1acc] px-3 py-1 text-[10px] backdrop-blur">
            <span className="font-bold text-cyan-400">{events.length}</span>
            <span className="ml-1 text-slate-500">SIGNALS ACTIVE</span>
          </div>

          <WorldMap events={events} selectedEvent={selectedEvent} />
        </div>
      </div>

      {/* Event Detail Modal */}
      <EventDetailPanel
        event={selectedEvent}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
