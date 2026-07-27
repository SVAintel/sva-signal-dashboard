"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import EventList from "./EventList";
import NewsPanel from "./NewsPanel";
import StockMarketPanel from "./StockMarketPanel";
import LiveBroadcasts from "./LiveBroadcasts";
import EventDetailPanel from "./EventDetailPanel";
import ConflictZoneDetailPanel, { ConflictZoneData } from "./ConflictZoneDetailPanel";
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
type MapLayerKey = "tradeRoutes" | "conflictZones" | "ports";
type MapLayerData = {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneData[];
  ports: Array<{ name: string; country: string; lat: number; lng: number; size: string }>;
};

export default function Dashboard() {
  const { activeCategories, toggleCategory, setAllCategories, setDashboardActive } = useStore();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedConflictZone, setSelectedConflictZone] = useState<ConflictZoneData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");
  const [mobileView, setMobileView] = useState<"panel" | "map">("map");
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [layerData, setLayerData] = useState<MapLayerData | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    tradeRoutes: true,
    conflictZones: true,
    ports: true,
  });

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

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const res = await axios.get("/api/map-layers");
        setLayerData(res.data);
      } catch (error) {
        console.error("Failed to fetch map layers:", error);
      }
    };
    fetchLayers();
    const interval = setInterval(fetchLayers, 3600000); // 60 minutes
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

  const toggleLayer = (layer: MapLayerKey) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };
  return (
    <div className="flex h-screen flex-col bg-[#040906] text-slate-200">
      {/* Top Bar */}
      <header className="flex flex-col gap-2 border-b border-[#23503a] bg-[#07120d] px-3 py-2 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#d4b36a]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Sovergein Veil Analytics</span>
          </div>
          <span className="hidden text-xs text-slate-500 sm:inline">|</span>
          <span className="hidden text-xs uppercase tracking-widest text-slate-500 sm:inline">
            Global Intelligence Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 md:flex-wrap md:gap-3 md:overflow-visible md:whitespace-normal md:pb-0">
          {/* ALL toggle */}
          <button
            onClick={() => setAllCategories(allOn ? [] : ALL_CATEGORIES)}
            className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
              allOn
                ? "border-[#d4b36a] text-[#d4b36a] bg-[#0f2018]"
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
                className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
                  isOn ? "bg-[#0f2018]" : "border-slate-700 text-slate-400 opacity-40 hover:opacity-70"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
          <span className="ml-2 hidden shrink-0 text-[10px] text-slate-600 sm:inline whitespace-nowrap">
            UPDATED: <span className="text-slate-400">{lastUpdated || "—"}</span>
          </span>
        </div>
      </header>

      {/* Mobile view switcher — only shown below md breakpoint, split view handles desktop */}
      <div className="flex border-b border-[#23503a] bg-[#0f2018] md:hidden">
        {(["map", "panel"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setMobileView(view)}
            className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${
              mobileView === view
                ? "border-[#d4b36a] text-[#d4b36a] bg-[#163025]"
                : "border-transparent text-slate-500"
            }`}
          >
            {view === "map" ? "MAP" : "SIGNALS & PANELS"}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar with Tabs - on LEFT (desktop) / toggled full-screen panel (mobile) */}
        <div
          className={`w-full flex-col bg-[#07120d] border-r border-[#23503a] md:flex md:w-[420px] ${
            mobileView === "panel" ? "flex" : "hidden"
          }`}
        >
          {/* Tab Buttons */}
          <div className="flex border-b border-[#23503a] bg-[#0f2018]">
            {(["events", "news", "stocks", "analyst"] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${
                  activeTab === tab
                    ? "border-[#d4b36a] text-[#d4b36a] bg-[#163025]"
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

        {/* Map - on RIGHT (desktop) / toggled full-screen panel (mobile) */}
        <div className={`relative flex-1 md:block ${mobileView === "map" ? "block" : "hidden"}`}>
          {/* Map legend — collapsed to a compact strip on mobile to save screen space */}
          <div className="absolute bottom-2 left-2 z-[999] max-h-[40vh] overflow-y-auto rounded border border-[#23503a] bg-[#07120dcc] px-2 py-1.5 text-[9px] backdrop-blur sm:bottom-4 sm:left-4 sm:max-h-none sm:px-3 sm:py-2 sm:text-[10px]">
            {Object.entries(categoryLabels).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 py-0.5">
                <div className="h-2 w-2 rounded-full" style={{ background: val.color, boxShadow: `0 0 6px ${val.color}` }} />
                <span className="uppercase tracking-wider text-slate-400">{key.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>

          {/* Event count badge */}
          <div className="absolute right-2 top-2 z-[999] rounded border border-[#23503a] bg-[#07120dcc] px-2 py-1 text-[9px] backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:text-[10px]">
            <span className="font-bold text-[#d4b36a]">{events.length}</span>
            <span className="ml-1 text-slate-500">SIGNALS ACTIVE</span>
          </div>

          {/* Map Layers dropdown — positioned under the signals-active badge */}
          <div className="absolute right-2 top-10 z-[999] sm:right-4 sm:top-12">
            <button
              onClick={() => setLayersMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded border border-[#23503a] bg-[#07120dcc] px-2 py-1 text-[9px] uppercase tracking-wider text-slate-400 backdrop-blur transition hover:text-[#d4b36a] sm:px-3 sm:text-[10px]"
            >
              Map Layers
              <span className={`transition-transform ${layersMenuOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {layersMenuOpen && (
              <div className="mt-1 flex flex-col gap-1 rounded border border-[#23503a] bg-[#07120dcc] px-2 py-2 text-[9px] backdrop-blur sm:px-3 sm:text-[10px]">
                {(
                  [
                    ["tradeRoutes", "Trade Routes"],
                    ["conflictZones", "Conflict Zones"],
                    ["ports", "Ports"],
                  ] as [MapLayerKey, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`flex items-center justify-between gap-3 rounded border px-2 py-1 uppercase tracking-wider transition ${
                      activeLayers[key]
                        ? "border-[#d4b36a] bg-[#0f2018] text-[#d4b36a]"
                        : "border-slate-700 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <span>{label}</span>
                    <span>{activeLayers[key] ? "ON" : "OFF"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <WorldMap
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={handleEventSelect}
            activeLayers={activeLayers}
            layerData={layerData}
            onSelectConflictZone={setSelectedConflictZone}
            mobileVisible={mobileView === "map"}
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      <EventDetailPanel
        event={selectedEvent}
        onClose={handleCloseDetail}
      />

      {/* Conflict Zone Detail Modal */}
      <ConflictZoneDetailPanel
        zone={selectedConflictZone}
        onClose={() => setSelectedConflictZone(null)}
      />
    </div>
  );
}
