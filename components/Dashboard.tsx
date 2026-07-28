"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import EventList from "./EventList";
import NewsPanel from "./NewsPanel";
import StockMarketPanel from "./StockMarketPanel";
import LiveBroadcasts from "./LiveBroadcasts";
import AmbientAudio from "./AmbientAudio";
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
type MapLayerKey =
  | "tradeRoutes"
  | "conflictZones"
  | "ports"
  | "navalVessels"
  | "cables"
  | "pipelines"
  | "militaryBases"
  | "wildfires"
  | "storms";
type MapLayerData = {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneData[];
  ports: Array<{ name: string; country: string; lat: number; lng: number; size: string }>;
  cables: Array<{ id: string; name: string; paths: [number, number][][] }>;
  pipelines: Array<{ id: string; name: string; substance: "oil" | "gas"; paths: [number, number][][] }>;
  militaryBases: Array<{ id: string; name: string; lat: number; lng: number; country: string | null; operator: string | null }>;
};
type NavalVessel = {
  mmsi: string;
  name: string;
  lat: number;
  lng: number;
  course: number | null;
  speed: number | null;
  shipType: number | null;
};
type Wildfire = {
  lat: number;
  lng: number;
  brightness: number;
  frp: number;
  confidence: string;
  acqDate: string;
  acqTime: string;
  daynight: string;
};
type Storm = {
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
  const [lastFetchError, setLastFetchError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");
  const [mobileView, setMobileView] = useState<"panel" | "map">("map");
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [layerData, setLayerData] = useState<MapLayerData | null>(null);
  const [navalVessels, setNavalVessels] = useState<NavalVessel[]>([]);
  const [navalLoading, setNavalLoading] = useState(false);
  const [navalLastChecked, setNavalLastChecked] = useState<string>("");
  const [wildfires, setWildfires] = useState<Wildfire[]>([]);
  const [wildfiresLoading, setWildfiresLoading] = useState(false);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [stormsLoading, setStormsLoading] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    tradeRoutes: false,
    conflictZones: false,
    ports: false,
    navalVessels: false,
    cables: false,
    pipelines: false,
    militaryBases: false,
    wildfires: false,
    storms: false,
  });

  // Resizable panel state — sidebar width (drag divider between sidebar/map)
  // and live-feed height (drag divider between signals list and broadcasts).
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [liveFeedHeight, setLiveFeedHeight] = useState(260);
  const dragStateRef = useRef<{ type: "sidebar" | "liveFeed"; startPos: number; startSize: number } | null>(null);

  const handleDragMove = useCallback((e: MouseEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    if (drag.type === "sidebar") {
      const delta = e.clientX - drag.startPos;
      const next = Math.min(720, Math.max(300, drag.startSize + delta));
      setSidebarWidth(next);
    } else {
      // Live feed divider: dragging up (negative delta) grows the feed since it sits at the bottom.
      const delta = drag.startPos - e.clientY;
      const next = Math.min(600, Math.max(140, drag.startSize + delta));
      setLiveFeedHeight(next);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }, [handleDragMove]);

  const startDrag = (type: "sidebar" | "liveFeed") => (e: React.MouseEvent) => {
    e.preventDefault();
    dragStateRef.current = {
      type,
      startPos: type === "sidebar" ? e.clientX : e.clientY,
      startSize: type === "sidebar" ? sidebarWidth : liveFeedHeight,
    };
    document.body.style.cursor = type === "sidebar" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

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
      setLastFetchError("");
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setLastFetchError(
        error instanceof Error ? error.message : "Failed to fetch events"
      );
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

  // Naval vessel layer is a live, best-effort AIS feed (military-flagged ships
  // only, sparse coverage) — only poll it while the layer is actually toggled
  // on, since each request opens a short-lived upstream WebSocket connection.
  // Server now self-refreshes the AIS scan every 30 min in the background and
  // persists results to disk (see app/api/naval/route.ts) — GET here is an
  // instant read of that cache, never a live 90s scan. Poll frequently so the
  // "SCANNING…" status and vessel count update promptly once a background
  // refresh completes, without any cost since reads are cheap.
  useEffect(() => {
    if (!activeLayers.navalVessels) return;
    const fetchNaval = async () => {
      try {
        const res = await axios.get("/api/naval");
        setNavalVessels(res.data?.vessels || []);
        setNavalLoading(!!res.data?.refreshing);
        setNavalLastChecked(
          res.data?.lastUpdated ? new Date(res.data.lastUpdated).toLocaleTimeString() : ""
        );
      } catch (error) {
        console.error("Failed to fetch naval vessels:", error);
      }
    };
    fetchNaval();
    const interval = setInterval(fetchNaval, 20000); // 20s — cheap read, just polls cache status
    return () => clearInterval(interval);
  }, [activeLayers.navalVessels]);

  // Wildfires: NASA FIRMS 24h global active-fire feed, server-cached for 1h.
  // Only poll while the layer is on; 30 min matches the data's real update
  // cadence closely enough without adding load.
  useEffect(() => {
    if (!activeLayers.wildfires) return;
    const fetchWildfires = async () => {
      try {
        setWildfiresLoading(true);
        const res = await axios.get("/api/wildfires");
        setWildfires(res.data?.fires || []);
      } catch (error) {
        console.error("Failed to fetch wildfires:", error);
      } finally {
        setWildfiresLoading(false);
      }
    };
    fetchWildfires();
    const interval = setInterval(fetchWildfires, 30 * 60 * 1000); // 30 min
    return () => clearInterval(interval);
  }, [activeLayers.wildfires]);

  // Storms: NOAA NHC active tropical cyclones (Atlantic + E/C Pacific only —
  // not global). Server-cached 15 min; poll at the same cadence.
  useEffect(() => {
    if (!activeLayers.storms) return;
    const fetchStorms = async () => {
      try {
        setStormsLoading(true);
        const res = await axios.get("/api/storms");
        setStorms(res.data?.storms || []);
      } catch (error) {
        console.error("Failed to fetch storms:", error);
      } finally {
        setStormsLoading(false);
      }
    };
    fetchStorms();
    const interval = setInterval(fetchStorms, 15 * 60 * 1000); // 15 min
    return () => clearInterval(interval);
  }, [activeLayers.storms]);

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
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-slate-200">
      {/* Top Bar */}
      <header className="flex flex-col gap-2 border-b border-[#3a3a3a] bg-[#0e0e0e] px-3 py-2 sm:px-6 md:flex-row md:items-center md:justify-between">
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
                ? "border-[#d4b36a] text-[#d4b36a] bg-[#1e1e1e]"
                : "border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
            }`}
          >
            ALL
          </button>
          {/* Per-category toggles */}
          {ALL_CATEGORIES.map((cat) => {
            const meta = categoryLabels[cat];
            // While every category is active (default state), none show as individually
            // highlighted — only the ALL button reflects that. The first click on a
            // category exclusively selects it; further clicks multi-select from there.
            const isOn = !allOn && activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => (allOn ? setAllCategories([cat]) : toggleCategory(cat))}
                title={meta.tooltip}
                style={isOn ? { borderColor: meta.color, color: meta.color } : {}}
                className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition ${
                  isOn ? "bg-[#1e1e1e]" : "border-slate-700 text-slate-400 opacity-40 hover:opacity-70"
                }`}
              >
                {meta.label}
              </button>
            );
          })}
          <span className="ml-2 hidden shrink-0 text-[10px] text-slate-600 sm:inline whitespace-nowrap">
            UPDATED: <span className="text-slate-400">{lastUpdated || "—"}</span>
          </span>
          {lastFetchError && (
            <span
              className="ml-2 hidden shrink-0 text-[10px] font-bold text-red-500 sm:inline whitespace-nowrap"
              title={lastFetchError}
            >
              UPDATE FAILED — SHOWING STALE DATA
            </span>
          )}
          <AmbientAudio />
        </div>
      </header>

      {/* Mobile view switcher — only shown below md breakpoint, split view handles desktop */}
      <div className="flex border-b border-[#3a3a3a] bg-[#1e1e1e] md:hidden">
        {(["map", "panel"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setMobileView(view)}
            className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${
              mobileView === view
                ? "border-[#d4b36a] text-[#d4b36a] bg-[#262626]"
                : "border-transparent text-slate-500"
            }`}
          >
            {view === "map" ? "MAP" : "SIGNALS & PANELS"}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Sidebar with Tabs - on LEFT (desktop) / toggled full-screen panel (mobile) */}
        <div
          style={{ ["--sidebar-w" as any]: `${sidebarWidth}px` }}
          className={`w-full flex-col bg-[#0e0e0e] border-r border-[#3a3a3a] flex-1 min-h-0 md:flex md:w-[var(--sidebar-w)] md:flex-none md:shrink-0 ${
            mobileView === "panel" ? "flex" : "hidden"
          }`}
        >
          {/* Tab Buttons */}
          <div className="flex border-b border-[#3a3a3a] bg-[#1e1e1e]">
            {(["events", "news", "stocks", "analyst"] as SidebarTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${
                  activeTab === tab
                    ? "border-[#d4b36a] text-[#d4b36a] bg-[#262626]"
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
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
                {/* Drag handle to resize the live feed panel height (desktop only — mobile keeps natural height) */}
                <div
                  onMouseDown={startDrag("liveFeed")}
                  className="hidden md:block h-1.5 shrink-0 cursor-row-resize bg-[#1e1e1e] hover:bg-[#d4b36a]/40 transition"
                  title="Drag to resize live feed"
                />
                {/* Live feed — explicit resizable height on desktop, natural height on mobile */}
                <div className="shrink-0 overflow-y-auto md:block" style={{ maxHeight: liveFeedHeight + 160 }}>
                  <LiveBroadcasts videoHeight={liveFeedHeight} />
                </div>
              </>
            )}
            {activeTab === "news" && <NewsPanel />}
            {activeTab === "stocks" && <StockMarketPanel />}
            {activeTab === "analyst" && <AIAnalystPanel events={events} />}
          </div>
        </div>

        {/* Drag handle to resize the sidebar width (desktop only) */}
        <div
          onMouseDown={startDrag("sidebar")}
          className="hidden md:block w-1.5 shrink-0 cursor-col-resize bg-[#1e1e1e] hover:bg-[#d4b36a]/40 transition"
          title="Drag to resize panel"
        />

        {/* Map - on RIGHT (desktop) / toggled full-screen panel (mobile) */}
        <div className={`relative flex-1 md:block ${mobileView === "map" ? "block" : "hidden"}`}>
          {/* Map legend — collapsed to a compact strip on mobile to save screen space */}
          <div className="absolute bottom-2 left-2 z-[999] max-h-[40vh] overflow-y-auto rounded border border-[#3a3a3a] bg-[#0e0e0ecc] px-2 py-1.5 text-[9px] backdrop-blur sm:bottom-4 sm:left-4 sm:max-h-none sm:px-3 sm:py-2 sm:text-[10px]">
            {Object.entries(categoryLabels).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 py-0.5">
                <div className="h-2 w-2 rounded-full" style={{ background: val.color, boxShadow: `0 0 6px ${val.color}` }} />
                <span className="uppercase tracking-wider text-slate-400">{key.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>

          {/* Event count badge */}
          <div className="absolute right-2 top-2 z-[999] rounded border border-[#3a3a3a] bg-[#0e0e0ecc] px-2 py-1 text-[9px] backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:text-[10px]">
            <span className="font-bold text-[#d4b36a]">{events.length}</span>
            <span className="ml-1 text-slate-500">SIGNALS ACTIVE</span>
          </div>

          {/* Map Layers dropdown — positioned under the signals-active badge */}
          <div className="absolute right-2 top-10 z-[999] sm:right-4 sm:top-12">
            <button
              onClick={() => setLayersMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded border border-[#3a3a3a] bg-[#0e0e0ecc] px-2 py-1 text-[9px] uppercase tracking-wider text-slate-400 backdrop-blur transition hover:text-[#d4b36a] sm:px-3 sm:text-[10px]"
            >
              Map Layers
              <span className={`transition-transform ${layersMenuOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {layersMenuOpen && (
              <div className="mt-1 flex flex-col gap-1 rounded border border-[#3a3a3a] bg-[#0e0e0ecc] px-2 py-2 text-[9px] backdrop-blur sm:px-3 sm:text-[10px]">
                {(
                  [
                    ["tradeRoutes", "Trade Routes"],
                    ["conflictZones", "Conflict Zones"],
                    ["ports", "Ports"],
                    ["navalVessels", "Naval Vessels"],
                    ["cables", "Submarine Cables"],
                    ["pipelines", "Oil & Gas Pipelines"],
                    ["militaryBases", "Military Bases"],
                    ["wildfires", "Wildfires"],
                    ["storms", "Storms"],
                  ] as [MapLayerKey, string][]
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className={`flex items-center justify-between gap-3 rounded border px-2 py-1 uppercase tracking-wider transition ${
                      activeLayers[key]
                        ? "border-[#d4b36a] bg-[#1e1e1e] text-[#d4b36a]"
                        : "border-slate-700 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <span>{label}</span>
                    <span>
                      {key === "navalVessels" && activeLayers.navalVessels
                        ? navalLoading
                          ? "SCANNING…"
                          : `ON (${navalVessels.length})`
                        : key === "wildfires" && activeLayers.wildfires
                        ? wildfiresLoading && wildfires.length === 0
                          ? "LOADING…"
                          : `ON (${wildfires.length})`
                        : key === "storms" && activeLayers.storms
                        ? stormsLoading && storms.length === 0
                          ? "LOADING…"
                          : `ON (${storms.length})`
                        : activeLayers[key]
                        ? "ON"
                        : "OFF"}
                    </span>
                  </button>
                ))}
                {activeLayers.navalVessels && (
                  <p className="px-2 pt-1 text-[8px] normal-case tracking-normal text-slate-500">
                    AIS scan takes ~90s per refresh (every 30 min). Military-flagged
                    vessels are rare — 0 results on a given scan is expected.
                    {navalLastChecked && ` Last checked: ${navalLastChecked}.`}
                  </p>
                )}
                {activeLayers.storms && (
                  <p className="px-2 pt-1 text-[8px] normal-case tracking-normal text-slate-500">
                    Covers Atlantic + Eastern/Central Pacific only (NOAA NHC) — not
                    global.
                  </p>
                )}
              </div>
            )}
          </div>

          <WorldMap
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={handleEventSelect}
            activeLayers={activeLayers}
            layerData={layerData}
            navalVessels={activeLayers.navalVessels ? navalVessels : []}
            wildfires={activeLayers.wildfires ? wildfires : []}
            storms={activeLayers.storms ? storms : []}
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
