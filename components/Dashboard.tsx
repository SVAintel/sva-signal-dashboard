"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, ArrowLeft, BookOpen, ChartNoAxesCombined, ChevronDown, Globe2, Layers, ListFilter, Map, MessageSquare, Network, RefreshCw, Tv, X } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import EventList from "./EventList";
import NewsPanel from "./NewsPanel";
import StockMarketPanel from "./StockMarketPanel";
import LiveBroadcasts, { HlsVideo, ActiveLiveChannel } from "./LiveBroadcasts";
import AmbientAudio from "./AmbientAudio";
import AuthWidget from "./AuthWidget";
import AIAnalystPanel from "./AIAnalystPanel";
import WorkspacePopover from "./WorkspacePopover";
import EventDetailPanel from "./EventDetailPanel";
import ConflictZoneDetailPanel, { ConflictZoneData } from "./ConflictZoneDetailPanel";
import MilitaryBaseDetailPanel, { MilitaryBaseData } from "./MilitaryBaseDetailPanel";
import FleetTrackerDetailPanel, { FleetGroup } from "./FleetTrackerDetailPanel";
import CountryDetailPanel, { CountryData } from "./CountryDetailPanel";
import PortDetailPanel, { PortData } from "./PortDetailPanel";
import PatternAlertsPanel, { CorrelationCluster } from "./PatternAlertsPanel";
import { COUNTRY_DETAILS } from "@/lib/data/country-details";
import { useStore, ALL_CATEGORIES } from "@/store/useStore";
import { Event, VerificationFilter } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import { initialReportNavigation, reportNavigationReducer } from "@/lib/report-navigation";
import { resolveReport } from "@/lib/report-context";
import { groupIncidents } from "@/lib/incident-groups";
import { scopeReports, parseSignalQuality, type SignalQuality } from "@/lib/signal-pipeline";

const WorldMap = dynamic(() => import("./WorldMap"), { ssr: false });
const GlobeMap = dynamic(() => import("./GlobeMap"), { ssr: false });

const panels = [
  { id: "events", label: "Signals", title: "Signal ledger", subtitle: "Reporting in geographic context", icon: Activity },
  { id: "news", label: "Insights", title: "Policy & perspective", subtitle: "Research beyond the headlines", icon: BookOpen },
  { id: "stocks", label: "Markets", title: "Market watch", subtitle: "The economic context", icon: ChartNoAxesCombined },
  { id: "analyst", label: "Analyst", title: "Analyst desk", subtitle: "Interrogate the current picture", icon: MessageSquare },
  { id: "patterns", label: "Patterns", title: "Spatial patterns", subtitle: "Connections across reports", icon: Network },
] as const;
type SidebarTab = typeof panels[number]["id"];
const TIME_RANGES = [
  { label: "Past 12 hours", hours: 12 },
  { label: "Past 24 hours", hours: 24 },
  { label: "Past 48 hours", hours: 48 },
  { label: "Any time", hours: null },
];
const mapLayerDefs = [
  ["countries", "Country borders"],
  ["conflictZones", "Conflict zones"],
  ["tradeRoutes", "Trade routes"],
  ["ports", "Ports"],
  ["cables", "Submarine cables"],
  ["pipelines", "Oil & gas pipelines"],
  ["militaryBases", "Military bases"],
  ["navalVessels", "Naval & tanker vessels"],
  ["fleetTracker", "US fleet tracker"],
  ["wildfires", "Wildfires"],
  ["storms", "Tropical storms"],
  ["gpsJamming", "GPS interference"],
] as const;
type MapLayerKey = typeof mapLayerDefs[number][0];
type MapLayerData = {
  tradeRoutes: Array<{ name: string; points: [number, number][] }>;
  conflictZones: ConflictZoneData[];
  ports: PortData[];
  cables: Array<{ id: string; name: string; paths: [number, number][][] }>;
  pipelines: Array<{ id: string; name: string; substance: "oil" | "gas"; paths: [number, number][][] }>;
  militaryBases: MilitaryBaseData[];
};
type NavalVessel = {
  mmsi: string; name: string; lat: number; lng: number; course: number | null;
  speed: number | null; shipType: number | null; kind: "military" | "tanker" | "sanctioned";
};
type Wildfire = {
  lat: number; lng: number; brightness: number; frp: number; confidence: string;
  acqDate: string; acqTime: string; daynight: string;
};
type Storm = {
  id: string; name: string; classification: string; lat: number; lng: number;
  intensity: number | null; pressure: number | null; movementDir: number | null;
  movementSpeed: number | null; advisoryUrl: string | null; lastUpdate: string | null;
};
type GpsJamHex = {
  h3: string; lat: number; lng: number; level: "medium" | "high"; pct: number;
  affectedAircraft: number; totalAircraft: number;
};

export default function Dashboard() {
  const { activeCategories, toggleCategory, setAllCategories, setDashboardActive, activeTimeRangeHours, setActiveTimeRangeHours } = useStore();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [lastFetchError, setLastFetchError] = useState("");
  const [reportNavigation, dispatchReport] = useReducer(reportNavigationReducer, initialReportNavigation);
  const reportLocation = reportNavigation.entries[reportNavigation.entries.length - 1];
  useEffect(() => { dispatchReport({ type: "refresh", events: allEvents }); }, [allEvents]);
  const [selectedConflictZone, setSelectedConflictZone] = useState<ConflictZoneData | null>(null);
  const [selectedMilitaryBase, setSelectedMilitaryBase] = useState<MilitaryBaseData | null>(null);
  const [selectedFleetGroup, setSelectedFleetGroup] = useState<FleetGroup | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedPort, setSelectedPort] = useState<PortData | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<CorrelationCluster | null>(null);
  const [verification, setVerification] = useState<VerificationFilter>("all");
  const [signalQuery, setSignalQuery] = useState("");
  const [groupedReports, setGroupedReports] = useState(true);
  const [signalQuality, setSignalQuality] = useState<SignalQuality | null>(null);
  const [militaryBaseFilter, setMilitaryBaseFilter] = useState<"all" | "major" | "minor">("major");
  const [portFilter, setPortFilter] = useState<"all" | "major" | "minor">("major");
  const [fleetRegionFilter, setFleetRegionFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<SidebarTab>("events");
  const [mobileView, setMobileView] = useState<"panel" | "map" | "live">("map");
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [layerData, setLayerData] = useState<MapLayerData | null>(null);
  const [navalVessels, setNavalVessels] = useState<NavalVessel[]>([]);
  const [navalLoading, setNavalLoading] = useState(false);
  const [navalLastChecked, setNavalLastChecked] = useState("");
  const [navalOutage, setNavalOutage] = useState(false);
  const [wildfires, setWildfires] = useState<Wildfire[]>([]);
  const [wildfiresLoading, setWildfiresLoading] = useState(false);
  const [storms, setStorms] = useState<Storm[]>([]);
  const [stormsLoading, setStormsLoading] = useState(false);
  const [gpsJamHexes, setGpsJamHexes] = useState<GpsJamHex[]>([]);
  const [gpsJamLoading, setGpsJamLoading] = useState(false);
  const [fleetGroups, setFleetGroups] = useState<FleetGroup[]>([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetLastChecked, setFleetLastChecked] = useState("");
  const [fleetSourceUrl, setFleetSourceUrl] = useState<string | null>(null);
  const [fleetPublishedAt, setFleetPublishedAt] = useState<string | null>(null);
  const [staleCountryFlags, setStaleCountryFlags] = useState<{ country: string; issue: string; evidence: string | null; detectedAt: string }[]>([]);
  const [staleCountryPanelOpen, setStaleCountryPanelOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Record<MapLayerKey, boolean>>({
    tradeRoutes: false, conflictZones: false, ports: false, navalVessels: false,
    cables: false, pipelines: false, militaryBases: false, wildfires: false,
    storms: false, gpsJamming: false, fleetTracker: false, countries: true,
  });
  const [mapViewMode, setMapViewMode] = useState<"2d" | "3d">("2d");
  const [scanEnabled, setScanEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [mapPrefsReady, setMapPrefsReady] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [liveFeedCollapsed, setLiveFeedCollapsed] = useState(true);
  const [pipChannel, setPipChannel] = useState<ActiveLiveChannel | null>(null);
  const [pipDismissed, setPipDismissed] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const dragStateRef = useRef<{ startPos: number; startSize: number } | null>(null);
  const { status: sessionStatus } = useSession();
  const prefsHydratedRef = useRef(false);
  const skipNextPrefsSaveRef = useRef(false);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || prefsHydratedRef.current) return;
    prefsHydratedRef.current = true;
    (async () => {
      try {
        const res = await fetch("/api/prefs");
        if (!res.ok) return;
        const { prefs } = await res.json();
        if (!prefs || typeof prefs !== "object") return;
        skipNextPrefsSaveRef.current = true;
        if (Array.isArray(prefs.activeCategories)) setAllCategories(prefs.activeCategories);
        if (prefs.activeTimeRangeHours !== undefined) setActiveTimeRangeHours(prefs.activeTimeRangeHours);
        if (typeof prefs.sidebarWidth === "number") setSidebarWidth(prefs.sidebarWidth);
        if (typeof prefs.ambientVolume === "number") setAmbientVolume(prefs.ambientVolume);
      } catch (error) {
        console.error("Workspace preferences could not be loaded:", error);
      }
    })();
  }, [sessionStatus, setAllCategories, setActiveTimeRangeHours]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    if (skipNextPrefsSaveRef.current) {
      skipNextPrefsSaveRef.current = false;
      return;
    }
    const id = setTimeout(() => {
      fetch("/api/prefs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeCategories, activeTimeRangeHours, sidebarWidth, ambientVolume }),
      }).catch((error) => console.error("Workspace preferences could not be saved:", error));
    }, 800);
    return () => clearTimeout(id);
  }, [sessionStatus, activeCategories, activeTimeRangeHours, sidebarWidth, ambientVolume]);

  const handleDragMove = useCallback((event: MouseEvent) => {
    const drag = dragStateRef.current;
    if (drag) setSidebarWidth(Math.min(720, Math.max(320, drag.startSize + event.clientX - drag.startPos)));
  }, []);
  const handleDragEnd = useCallback(() => {
    dragStateRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }, [handleDragMove]);
  const startDrag = (event: React.MouseEvent) => {
    event.preventDefault();
    dragStateRef.current = { startPos: event.clientX, startSize: sidebarWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
  };
  useEffect(() => () => handleDragEnd(), [handleDragEnd]);

  const fetchEvents = async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await axios.get("/api/events");
      const quality = parseSignalQuality(res.headers["x-sva-signal-quality"]);
      setAllEvents(res.data);
      setSignalQuality(quality);
      setLastUpdated(new Date().toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }));
      setLastFetchError("");
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setLastFetchError(error instanceof Error ? error.message : "Failed to fetch events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), 1800000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const fetchLayers = async () => {
      try { setLayerData((await axios.get("/api/map-layers")).data); }
      catch (error) { console.error("Failed to fetch map layers:", error); }
    };
    fetchLayers();
    const interval = setInterval(fetchLayers, 3600000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!activeLayers.navalVessels) return;
    const fetchNaval = async () => {
      try {
        const res = await axios.get("/api/naval");
        setNavalVessels(res.data?.vessels || []);
        setNavalLoading(!!res.data?.refreshing);
        setNavalOutage(!!res.data?.outage);
        setNavalLastChecked(res.data?.lastUpdated ? new Date(res.data.lastUpdated).toLocaleTimeString() : "");
      } catch (error) { console.error("Failed to fetch naval vessels:", error); }
    };
    fetchNaval();
    const interval = setInterval(fetchNaval, 20000);
    return () => clearInterval(interval);
  }, [activeLayers.navalVessels]);
  useEffect(() => {
    if (!activeLayers.wildfires) return;
    const fetchWildfires = async () => {
      try {
        setWildfiresLoading(true);
        const res = await axios.get("/api/wildfires");
        setWildfires(res.data?.fires || []);
      } catch (error) { console.error("Failed to fetch wildfires:", error); }
      finally { setWildfiresLoading(false); }
    };
    fetchWildfires();
    const interval = setInterval(fetchWildfires, 1800000);
    return () => clearInterval(interval);
  }, [activeLayers.wildfires]);
  useEffect(() => {
    if (!activeLayers.storms) return;
    const fetchStorms = async () => {
      try {
        setStormsLoading(true);
        const res = await axios.get("/api/storms");
        setStorms(res.data?.storms || []);
      } catch (error) { console.error("Failed to fetch storms:", error); }
      finally { setStormsLoading(false); }
    };
    fetchStorms();
    const interval = setInterval(fetchStorms, 900000);
    return () => clearInterval(interval);
  }, [activeLayers.storms]);
  useEffect(() => {
    if (!activeLayers.gpsJamming) return;
    const fetchGpsJamming = async () => {
      try {
        setGpsJamLoading(true);
        const res = await axios.get("/api/gps-jamming");
        setGpsJamHexes(res.data?.hexes || []);
      } catch (error) { console.error("Failed to fetch GPS jamming data:", error); }
      finally { setGpsJamLoading(false); }
    };
    fetchGpsJamming();
    const interval = setInterval(fetchGpsJamming, 3600000);
    return () => clearInterval(interval);
  }, [activeLayers.gpsJamming]);
  useEffect(() => {
    if (!activeLayers.fleetTracker) return;
    const fetchFleetTracker = async () => {
      try {
        setFleetLoading(true);
        const res = await axios.get("/api/fleet-tracker");
        setFleetGroups(res.data?.groups || []);
        setFleetSourceUrl(res.data?.sourceUrl || null);
        setFleetPublishedAt(res.data?.publishedAt || null);
        setFleetLastChecked(res.data?.lastUpdated ? new Date(res.data.lastUpdated).toLocaleTimeString() : "");
      } catch (error) { console.error("Failed to fetch fleet tracker:", error); }
      finally { setFleetLoading(false); }
    };
    fetchFleetTracker();
    const interval = setInterval(fetchFleetTracker, 3600000);
    return () => clearInterval(interval);
  }, [activeLayers.fleetTracker]);
  useEffect(() => {
    const stored = window.localStorage.getItem("dashboard-map-view-mode");
    if (stored === "2d" || stored === "3d") setMapViewMode(stored);
    const scan = window.localStorage.getItem("dashboard-scan-sweep");
    if (scan !== null) setScanEnabled(scan === "true");
    setMapPrefsReady(true);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compact = window.matchMedia("(max-width: 767px)");
    const updateMotion = () => setReducedMotion(motion.matches);
    const updateCompact = () => setCompactView(compact.matches);
    updateMotion();
    updateCompact();
    motion.addEventListener("change", updateMotion);
    compact.addEventListener("change", updateCompact);
    return () => {
      motion.removeEventListener("change", updateMotion);
      compact.removeEventListener("change", updateCompact);
    };
  }, []);
  useEffect(() => {
    if (!mapPrefsReady) return;
    window.localStorage.setItem("dashboard-map-view-mode", mapViewMode);
    window.localStorage.setItem("dashboard-scan-sweep", String(scanEnabled));
  }, [mapViewMode, scanEnabled, mapPrefsReady]);
  useEffect(() => {
    const fetchStaleFlags = async () => {
      try {
        const res = await axios.get("/api/country-staleness");
        setStaleCountryFlags(res.data?.flags || []);
      } catch (error) { console.error("Failed to fetch country staleness flags:", error); }
    };
    fetchStaleFlags();
    const interval = setInterval(fetchStaleFlags, 3600000);
    return () => clearInterval(interval);
  }, []);

  const events = useMemo(() => scopeReports(allEvents, { categories: activeCategories, hours: activeTimeRangeHours,
    verification, query: signalQuery, now: Date.now() }),
  [allEvents, activeCategories, activeTimeRangeHours, verification, signalQuery]);
  const groups = useMemo(() => groupIncidents(events), [events]);
  const selectedEvent = reportLocation ? events.find(event => event.id === reportLocation.snapshot.id) ||
    resolveReport(reportLocation.snapshot, allEvents).event : null;
  const mapEvents = useMemo(() => groupedReports ? groups.map(group =>
    group.reports.find(event => event.id === selectedEvent?.id) || group.latest) : events,
  [groupedReports, groups, selectedEvent?.id, events]);
  const reportGroupCounts = useMemo(() => Object.fromEntries(groups.flatMap(group =>
    group.reports.map(event => [event.id, group.reports.length]))), [groups]);
  const allOn = activeCategories.length === ALL_CATEGORIES.length;
  const scopeLabel = `${allOn ? "All categories" : `${activeCategories.length} selected categories`} · ${activeTimeRangeHours === null ? "any time" : `past ${activeTimeRangeHours} hours`} · ${verification === "all" ? "all source classifications" : `${verification} sources`}${signalQuery.trim() ? ` · search: ${signalQuery.trim()}` : ""}`;
  const clearSelection = () => {
    dispatchReport({ type: "close" }); setSelectedMilitaryBase(null); setSelectedFleetGroup(null);
    setSelectedPort(null); setSelectedCountry(null); setSelectedConflictZone(null); setSelectedCluster(null);
  };
  const handleEventSelect = (event: Event | null) => {
    clearSelection();
    if (event) dispatchReport({ type: "open", event });
  };
  const handleMilitaryBaseSelect = (base: MilitaryBaseData | null) => { clearSelection(); setSelectedMilitaryBase(base); };
  const handleFleetGroupSelect = (group: FleetGroup | null) => { clearSelection(); setSelectedFleetGroup(group); };
  const handlePortSelect = (port: PortData | null) => { clearSelection(); setSelectedPort(port); };
  const handleCountrySelect = (name: string) => { clearSelection(); setSelectedCountry({ name, details: COUNTRY_DETAILS[name] }); };
  const handleClusterSelect = (cluster: CorrelationCluster | null) => {
    clearSelection(); setSelectedCluster(cluster);
    if (cluster) setMobileView("map");
  };
  const toggleLayer = (layer: MapLayerKey) => {
    if (!activeLayers[layer]) {
      if (layer === "militaryBases") setMilitaryBaseFilter("major");
      if (layer === "ports") setPortFilter("major");
      if (layer === "fleetTracker") setFleetRegionFilter("all");
    }
    setActiveLayers((previous) => ({ ...previous, [layer]: !previous[layer] }));
  };
  const mapProps = {
    events: mapEvents, reportGroupCounts: groupedReports ? reportGroupCounts : {}, selectedEvent, onSelectEvent: handleEventSelect, activeLayers,
    layerData: layerData && (militaryBaseFilter !== "all" || portFilter !== "all") ? {
      ...layerData,
      militaryBases: militaryBaseFilter === "all" ? layerData.militaryBases : layerData.militaryBases.filter((base) => militaryBaseFilter === "major" ? base.isMajor : !base.isMajor),
      ports: portFilter === "all" ? layerData.ports : layerData.ports.filter((port) => portFilter === "major" ? port.isMajor : !port.isMajor),
    } : layerData,
    navalVessels: activeLayers.navalVessels ? navalVessels : [],
    wildfires: activeLayers.wildfires ? wildfires : [],
    storms: activeLayers.storms ? storms : [],
    gpsJamHexes: activeLayers.gpsJamming ? gpsJamHexes : [],
    fleetGroups: activeLayers.fleetTracker ? fleetRegionFilter === "all" ? fleetGroups : fleetGroups.filter((group) => group.id === fleetRegionFilter) : [],
    onSelectConflictZone: (zone: ConflictZoneData) => { clearSelection(); setSelectedConflictZone(zone); },
    selectedConflictZone, selectedMilitaryBase, onSelectMilitaryBase: handleMilitaryBaseSelect,
    selectedFleetGroup, onSelectFleetGroup: handleFleetGroupSelect,
    onSelectCountry: handleCountrySelect, selectedCountryName: selectedCountry?.name ?? null,
    mobileVisible: !compactView || mobileView === "map", selectedPort, onSelectPort: handlePortSelect,
    selectedCluster: selectedCluster ? { id: selectedCluster.id, lat: selectedCluster.centroid.lat, lng: selectedCluster.centroid.lng } : null,
    scanEnabled: scanEnabled && !reducedMotion,
    reducedMotion,
  };
  const layerStatusLabel = (key: MapLayerKey) => {
    if (!activeLayers[key]) return "";
    if (key === "navalVessels") return navalLoading ? "Scanning" : `${navalVessels.length}`;
    if (key === "wildfires") return wildfiresLoading ? "Loading" : `${wildfires.length}`;
    if (key === "storms") return stormsLoading ? "Loading" : `${storms.length}`;
    if (key === "gpsJamming") return gpsJamLoading ? "Loading" : `${gpsJamHexes.length}`;
    if (key === "fleetTracker") return fleetLoading ? "Loading" : `${fleetGroups.length}`;
    return "";
  };
  const panel = panels.find((item) => item.id === activeTab)!;
  const statusText = loading ? "Loading signals" : refreshing ? "Refreshing signals" : lastFetchError ? (lastUpdated ? "Update failed · cached reports" : "Signal feed unavailable") : `Updated ${lastUpdated}`;
  const selectedLayerCount = Object.values(activeLayers).filter(Boolean).length;
  const showMobileView = (view: typeof mobileView) => {
    setMobileView(view);
    if (view === "live") setLiveFeedCollapsed(false);
    if (view === "map") setPipDismissed(false);
  };

  return (
    <div className="desk-shell" style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <header className="desk-masthead">
        <button className="desk-brand" onClick={() => setDashboardActive(false)} aria-label="Sovereign Veil Analytics home">
          <span className="desk-monogram">SV<span>A</span></span>
          <span className="desk-brand-name">Sovereign Veil <span>Analytics</span></span>
        </button>
        <div className="desk-breadcrumb"><span>Workspace</span><span>/</span>Global overview</div>
        <div className="desk-masthead-actions">
          <span className={`desk-data-status${lastFetchError ? " is-error" : ""}`} role="status" title={lastFetchError || statusText}>
            <i />{statusText}
          </span>
          <AmbientAudio playing={ambientPlaying} onTogglePlaying={() => setAmbientPlaying((value) => !value)}
            volume={ambientVolume} onVolumeChange={setAmbientVolume} />
          <AuthWidget />
        </div>
      </header>

      <div className={`desk-stage mobile-${mobileView}`}>
        <nav className="desk-rail" aria-label="Analysis views">
          <div className="desk-rail-label">DESK</div>
          {panels.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`desk-rail-button${activeTab === id ? " is-active" : ""}`}
              onClick={() => setActiveTab(id)} aria-label={label} aria-current={activeTab === id ? "page" : undefined}>
              <Icon size={21} strokeWidth={1.6} /><span className="desk-rail-tooltip">{label}</span>
            </button>
          ))}
          <button className={`desk-rail-button desk-rail-live${!liveFeedCollapsed ? " is-active" : ""}`}
            onClick={() => setLiveFeedCollapsed((value) => !value)} aria-label="Toggle live broadcasts" aria-pressed={!liveFeedCollapsed}>
            <Tv size={20} strokeWidth={1.6} /><span className="desk-rail-tooltip">Live broadcasts</span>
          </button>
          <button className="desk-rail-button" onClick={() => setDashboardActive(false)} aria-label="Back to introduction">
            <ArrowLeft size={19} /><span className="desk-rail-tooltip">Introduction</span>
          </button>
        </nav>

        <aside className="desk-dock" aria-label="Analyst workspace">
          <div className="desk-dock-main">
            <header className="desk-dock-heading">
              <div><span className="desk-eyebrow">ANALYST WORKSPACE</span><h1>{panel.title}</h1><p>{panel.subtitle}</p></div>
              <div className="desk-heading-actions">
                <label className="desk-mobile-panel-select"><span className="sr-only">Analysis view</span>
                  <select aria-label="Analysis view" value={activeTab} onChange={(event) => setActiveTab(event.target.value as SidebarTab)}>
                    {panels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <button className="desk-icon-button" disabled={loading || refreshing} onClick={() => fetchEvents(true)} aria-label="Refresh signals" title="Refresh signals">
                  <RefreshCw size={17} className={refreshing ? "desk-refreshing" : ""} />
                </button>
              </div>
            </header>
            <div className="desk-panel-content">
              {activeTab === "events" && <EventList events={events} loading={loading} error={lastFetchError} onSelectEvent={handleEventSelect}
                selectedEvent={selectedEvent} verification={verification} onVerificationChange={setVerification}
                query={signalQuery} onQueryChange={setSignalQuery} groups={groups} grouped={groupedReports} onGroupedChange={setGroupedReports} quality={signalQuality} />}
              {activeTab === "news" && <NewsPanel />}
              {activeTab === "stocks" && <StockMarketPanel />}
              {activeTab === "analyst" && <AIAnalystPanel events={events} />}
              {activeTab === "patterns" && <PatternAlertsPanel onSelectCluster={handleClusterSelect} selectedClusterId={selectedCluster?.id ?? null} />}
            </div>
          </div>
          <div className="desk-broadcast-dock">
            <LiveBroadcasts collapsed={liveFeedCollapsed} onToggleCollapsed={() => setLiveFeedCollapsed((value) => !value)} onActiveChannelChange={setPipChannel} />
          </div>
        </aside>
        <div className="desk-resizer" onMouseDown={startDrag} role="separator" aria-label="Resize analyst workspace"
          aria-orientation="vertical" aria-valuemin={320} aria-valuemax={720} aria-valuenow={sidebarWidth} tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              setSidebarWidth((width) => Math.min(720, Math.max(320, width + (event.key === "ArrowLeft" ? -20 : 20))));
            }
          }} />

        <section className="desk-map-section" aria-label="Global map">
          <div className="desk-map-toolbar">
            <div className="desk-map-title"><Globe2 size={16} /><span>World view</span></div>
            <div className="desk-map-tools">
              <WorkspacePopover label={allOn ? "All categories" : `${activeCategories.length} categories`} title="Signal categories"
                icon={<ListFilter size={16} />} open={categoriesOpen} onOpenChange={(open) => { setCategoriesOpen(open); if (open) setLayersMenuOpen(false); }}>
                <div className="desk-filter-actions">
                  <button onClick={() => setAllCategories(ALL_CATEGORIES)}>Select all</button>
                  <button onClick={() => setAllCategories([])}>Clear</button>
                </div>
                <p className="desk-popover-note">Filter the map and signal ledger.</p>
                {ALL_CATEGORIES.map((category) => (
                  <label key={category} className="desk-option">
                    <input type="checkbox" checked={activeCategories.includes(category)} onChange={() => toggleCategory(category)} />
                    <i className="desk-category-key" style={{ background: categoryMeta[category].color }} />
                    <span>{categoryMeta[category].label}</span>
                    <button className="desk-only-button" onClick={() => setAllCategories([category])} aria-label={`Show only ${categoryMeta[category].label.toLowerCase()}`}>Only</button>
                  </label>
                ))}
                <label className="desk-select-label">Source verification
                  <select aria-label="Source verification" value={verification} onChange={(event) => setVerification(event.target.value as VerificationFilter)}>
                    <option value="all">All reports</option><option value="confirmed">Confirmed sources</option><option value="unconfirmed">Unconfirmed sources</option>
                  </select>
                </label>
              </WorkspacePopover>
              <label className="desk-time-select"><span className="sr-only">Signal time range</span>
                <select aria-label="Signal time range" value={activeTimeRangeHours ?? "all"} onChange={(event) => setActiveTimeRangeHours(event.target.value === "all" ? null : Number(event.target.value))}>
                  {TIME_RANGES.map((range) => <option key={range.label} value={range.hours ?? "all"}>{range.label}</option>)}
                </select><ChevronDown size={13} aria-hidden="true" />
              </label>
              <WorkspacePopover label={`Layers${selectedLayerCount ? ` · ${selectedLayerCount}` : ""}`} title="Map layers"
                icon={<Layers size={16} />} open={layersMenuOpen} onOpenChange={(open) => { setLayersMenuOpen(open); if (open) setCategoriesOpen(false); }}>
                <p className="desk-popover-note">Add geographic context. Each source has its own coverage and update cycle.</p>
                {mapLayerDefs.map(([key, label]) => (
                  <div className="desk-layer-row" key={key}>
                    <label className="desk-option">
                      <input type="checkbox" checked={activeLayers[key]} onChange={() => toggleLayer(key)} />
                      <span>{label}</span><small>{layerStatusLabel(key)}</small>
                    </label>
                    {key === "militaryBases" && activeLayers.militaryBases && (
                      <label className="desk-subfilter">Installations
                        <select aria-label="Installations" value={militaryBaseFilter} onChange={(event) => setMilitaryBaseFilter(event.target.value as typeof militaryBaseFilter)}>
                          <option value="all">All bases</option><option value="major">Major bases</option><option value="minor">Minor bases</option>
                        </select>
                      </label>
                    )}
                    {key === "ports" && activeLayers.ports && (
                      <label className="desk-subfilter">Seaports
                        <select aria-label="Seaports" value={portFilter} onChange={(event) => setPortFilter(event.target.value as typeof portFilter)}>
                          <option value="all">All ports</option><option value="major">Major ports</option><option value="minor">Minor ports</option>
                        </select>
                      </label>
                    )}
                    {key === "navalVessels" && activeLayers.navalVessels && <p className="desk-layer-note">{navalOutage ? "AIS provider unavailable. Retrying automatically." : "Daily cached AIS scan; sparse military and tanker coverage. Red markers identify sanctioned Russia-flagged vessels (FleetLeaks)."}{navalLastChecked && ` Checked ${navalLastChecked}.`}</p>}
                    {key === "storms" && activeLayers.storms && <p className="desk-layer-note">NOAA NHC: Atlantic and Eastern/Central Pacific only, not global coverage.</p>}
                    {key === "fleetTracker" && activeLayers.fleetTracker && <>
                      {fleetGroups.length > 0 && <label className="desk-subfilter">Region
                        <select aria-label="Fleet region" value={fleetRegionFilter} onChange={(event) => setFleetRegionFilter(event.target.value)}>
                          <option value="all">All regions</option>{fleetGroups.map((group) => <option key={group.id} value={group.id}>{group.region}</option>)}
                        </select>
                      </label>}
                      <p className="desk-layer-note">USNI weekly reporting. Approximate regions, not exact positions.{fleetLastChecked && ` Checked ${fleetLastChecked}.`}</p>
                    </>}
                  </div>
                ))}
                <label className="desk-option desk-scan-option"><input type="checkbox" checked={scanEnabled && !reducedMotion} disabled={reducedMotion} onChange={() => setScanEnabled((value) => !value)} /><span>Scan sweep</span></label>
                {reducedMotion && <p className="desk-layer-note">Motion is disabled by your device preference.</p>}
              </WorkspacePopover>
              <div className="desk-map-mode" aria-label="Map projection">
                <button aria-pressed={mapViewMode === "2d"} onClick={() => setMapViewMode("2d")}>2D</button>
                <button aria-pressed={mapViewMode === "3d"} onClick={() => setMapViewMode("3d")} title="3D globe (pre-alpha)">3D</button>
              </div>
            </div>
          </div>
          <div className="desk-map-viewport">
            {mapViewMode === "3d" ? <GlobeMap {...mapProps} /> : <WorldMap {...mapProps} />}
            {mapViewMode === "3d" && <span className="desk-globe-note">3D globe · pre-alpha</span>}
            {selectedCluster && <div className="desk-cluster-selection"><Network size={15} /><span>Pattern selected</span><button className="desk-icon-button" aria-label="Clear selected pattern" onClick={() => setSelectedCluster(null)}><X size={16} /></button></div>}
            {mobileView === "map" && pipChannel && !pipDismissed && !liveFeedCollapsed && (
              <div className="desk-pip">
                <div className="desk-pip-heading"><span>{pipChannel.name}</span><button aria-label="Close mini player" onClick={() => setPipDismissed(true)}><X size={15} /></button></div>
                <div className="desk-pip-video">
                  {pipChannel.hlsUrl ? <HlsVideo key={pipChannel.hlsUrl} src={pipChannel.hlsUrl} title={`${pipChannel.name} Live`} />
                    : pipChannel.directEmbedUrl ? <iframe src={pipChannel.directEmbedUrl} allow="autoplay; encrypted-media; picture-in-picture" title={`${pipChannel.name} Live`} />
                    : pipChannel.videoId ? <iframe src={`https://www.youtube.com/embed/${pipChannel.videoId}?autoplay=1&mute=1&controls=0&rel=0`} allow="autoplay; encrypted-media; picture-in-picture" title={`${pipChannel.name} Live`} /> : null}
                </div>
              </div>
            )}
          </div>
          <div className="desk-map-footer">
            <span><strong>{events.length}</strong> reports · {mapEvents.length} map entries</span>
            <span>Color indicates category, not severity</span>
            <span className="desk-footer-hint">Select a marker to explore</span>
          </div>
        </section>

        <div className={`desk-detail-host${reportLocation ? " has-report" : ""}${reportNavigation.entries.length > 1 ? " has-dossier" : ""}`}>
          {reportLocation && <EventDetailPanel key={reportNavigation.entries[0].key} navigation={reportNavigation} dispatch={dispatchReport}
            loadedEvents={allEvents} scopedEvents={events} groups={groups} scopeLabel={scopeLabel} feedError={lastFetchError} feedLoading={loading} />}
          <MilitaryBaseDetailPanel base={selectedMilitaryBase} onClose={() => setSelectedMilitaryBase(null)} />
          <FleetTrackerDetailPanel group={selectedFleetGroup} sourceUrl={fleetSourceUrl} publishedAt={fleetPublishedAt} onClose={() => setSelectedFleetGroup(null)} />
          <CountryDetailPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} />
          <PortDetailPanel port={selectedPort} onClose={() => setSelectedPort(null)} />
          <ConflictZoneDetailPanel zone={selectedConflictZone} onClose={() => setSelectedConflictZone(null)} />
        </div>
      </div>
      <footer className="desk-statusbar">
        <span className={lastFetchError ? "desk-error-text" : ""}>{loading ? "Requesting signal feed..." : lastFetchError ? statusText : `Last successful refresh: ${lastUpdated}`}</span>
        {staleCountryFlags.length > 0 && <WorkspacePopover label={`${staleCountryFlags.length} profile alerts`} title="Country profile alerts" icon={<Activity size={14} />}
          open={staleCountryPanelOpen} onOpenChange={setStaleCountryPanelOpen}>
          <p className="desk-popover-note">Recent reporting may contradict these curated profiles. Treat their details with caution until reviewed.</p>
          {staleCountryFlags.map((flag) => <div className="desk-profile-alert" key={flag.country}><strong>{flag.country}</strong><p>{flag.issue}</p></div>)}
        </WorkspacePopover>}
        <span className="desk-statusbar-note">Public-source reporting / assess before acting</span>
      </footer>
      <nav className="desk-mobile-nav" aria-label="Mobile workspace">
        {([{ id: "map", label: "Map", icon: Map }, { id: "panel", label: "Workspace", icon: Activity }, { id: "live", label: "Live", icon: Tv }] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} aria-current={mobileView === id ? "page" : undefined} onClick={() => showMobileView(id)}><Icon size={20} strokeWidth={1.6} /><span>{label}</span></button>
        ))}
      </nav>
    </div>
  );
}
