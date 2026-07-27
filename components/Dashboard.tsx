"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import EventList from "./EventList";
import NewsPanel from "./NewsPanel";
import StockMarketPanel from "./StockMarketPanel";
import LiveBroadcasts from "./LiveBroadcasts";
import EventDetailPanel from "./EventDetailPanel";
import AIAnalystPanel from "./AIAnalystPanel";
import { useStore, ALL_CATEGORIES } from "@/store/useStore";
import { Event } from "@/lib/types";
import axios from "axios";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });

const categoryLabels: Record<string, { label: string; color: string; tooltip: string }> = {
  war: { label: "WAR", color: "#ef4444", tooltip: "WAR — Armed Conflict & Military Operations" },
  counter_terrorism: { label: "CT", color: "#a855f7", tooltip: "CT — Counter-Terrorism" },
  natural_disaster: { label: "GEO", color: "#f59e0b", tooltip: "GEO — Geophysical & Natural Disasters" },
  market: { label: "MKT", color: "#22d3ee", tooltip: "MKT — Financial Markets & Economic Events" },
  biological: { label: "BIO", color: "#22c55e", tooltip: "BIO — Biological Threats & Outbreaks" },
  political_unrest: { label: "POL", color: "#f97316", tooltip: "POL — Political Unrest & Civil Instability" },
  cyber: { label: "CYB", color: "#06b6d4", tooltip: "CYB — Cyber Attacks & Digital Threats" },
  nuclear: { label: "NUC", color: "#84cc16", tooltip: "NUC — Nuclear & Radiological Activity" },
  energy: { label: "NRG", color: "#d97706", tooltip: "NRG — Energy Infrastructure & Supply" },
  humanitarian: { label: "HUM", color: "#f43f5e", tooltip: "HUM — Humanitarian Crises & Displacement" },
};

type SidebarTab = "events" | "news" | "stocks" | "analyst";

export default function Dashboard() {
  const { activeCategories, toggleCategory, setAllCategories, setDashboardActive } = useStore();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");

  const fetchEvents = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await axios.get("/api/events");
      setAllEvents(res.data);
      setLastUpdated(
        new Date().toLocaleString(undefined, {
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        })
      );
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), 1800000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  // Client-side filter by active categories
  const events = allEvents.filter((e) => activeCategories.includes(e.category));

  const allOn = activeCategories.length === ALL_CATEGORIES.length;

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

        <div className="flex items-center gap-3 flex-wrap">
          {/* ALL toggle */}
          <button
            onClick={() => setAllCategories(allOn ? [] : ALL_CATEGORIES)}
            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
              allOn
                ? "border-cyan-400 text-cyan-400 bg-[#0f172a]"
                : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            ALL
          </button>
          {/* Per-category toggles */}
          {ALL_CATEGORIES.map((cat) => {
            const meta = categoryLabels[cat];
            const isOn = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                title={meta.tooltip}
                style={isOn ? { borderColor: meta.color, color: meta.color } : {}}
                className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
                  isOn ? "bg-[#0f172a]" : "border-slate-700 text-slate-400 opacity-40 hover:opacity-70"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
          <span className="text-[10px] text-slate-600 whitespace-nowrap ml-2">
            UPDATED: <span className="text-slate-400">{lastUpdated || "—"}</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with Tabs - on LEFT */}
        <div className="w-[420px] flex flex-col bg-[#080d1a] border-r border-[#1e3a5f]">
          {/* Tab Buttons */}
          <div className="flex border-b border-[#1e3a5f] bg-[#0f172a]">
            {(["events", "news", "stocks", "analyst"] as SidebarTab[]).map((tab) => (
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
                {tab === "analyst" && "AI ANALYST"}
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
            {activeTab === "analyst" && <AIAnalystPanel events={events} />}
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

          <WorldMap
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={handleEventSelect}
          />
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
