"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, MapPin } from "lucide-react";

export interface CorrelationClusterMember {
  title: string;
  category: string;
  source: string;
  url: string | null;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface CorrelationCluster {
  id: string;
  place: string;
  centroid: { lat: number; lng: number };
  categories: string[];
  memberCount: number;
  earliestAt: string;
  latestAt: string;
  members: CorrelationClusterMember[];
  severity: number;
  summary?: string;
}

// Category -> display label/color, reusing the same short tags used
// elsewhere in the app (EventList/legend) so this panel feels consistent
// rather than introducing a new vocabulary.
const CATEGORY_LABELS: Record<string, string> = {
  war: "WAR",
  market: "MKT",
  energy: "NRG",
  natural_disaster: "DISASTER",
  humanitarian: "HUMANITARIAN",
  political_unrest: "UNREST",
  counter_terrorism: "TERROR",
  biological: "BIO",
  nuclear: "NUCLEAR",
  cyber: "CYBER",
  general: "GENERAL",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.toUpperCase();
}

// Severity is an open-ended composite score (category weight + recency +
// density — see lib/correlation.ts) rather than a fixed 0-10 scale, so
// thresholds here are just practical cut points observed from real output,
// not a calibrated scale.
function severityStyle(severity: number): { label: string; className: string } {
  if (severity >= 9) return { label: "HIGH", className: "bg-red-950 text-red-400 border-red-800" };
  if (severity >= 6) return { label: "MED", className: "bg-amber-950 text-amber-400 border-amber-800" };
  return { label: "LOW", className: "bg-slate-800 text-slate-400 border-slate-700" };
}

interface PatternAlertsPanelProps {
  onSelectCluster: (cluster: CorrelationCluster | null) => void;
  selectedClusterId: string | null;
}

export default function PatternAlertsPanel({ onSelectCluster, selectedClusterId }: PatternAlertsPanelProps) {
  const [clusters, setClusters] = useState<CorrelationCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const response = await fetch("/api/correlations");
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        setClusters(data.clusters || []);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error("Failed to fetch correlations:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch pattern alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
    // Matches the route's own revalidate window — no point polling faster
    // than the underlying data can change.
    const interval = setInterval(fetchClusters, 900000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] border-l border-[#3a3a3a]">
      <div className="border-b border-[#3a3a3a] bg-[#0e0e0e] px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#d4b36a]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Pattern Alerts</h2>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          Signals of different types converging on the same place within ~24h
        </p>
        {error ? (
          <p className="text-[10px] text-red-500 mt-1">Update failed: {error}</p>
        ) : lastUpdated ? (
          <p className="text-[10px] text-slate-700 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">Loading...</div>
        ) : clusters.length === 0 ? (
          <div className="text-center text-slate-600 text-xs mt-4">
            No cross-category patterns detected right now.
          </div>
        ) : (
          clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => onSelectCluster(selectedClusterId === cluster.id ? null : cluster)}
              className={`block w-full text-left p-2 rounded border transition ${
                selectedClusterId === cluster.id
                  ? "border-[#d4b36a] bg-[#2a2a2a]"
                  : "border-[#3a3a3a] bg-[#111111] hover:bg-[#2a2a2a] hover:border-[#d4b36a]/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-[#d4b36a] shrink-0" />
                <h3 className="text-xs font-semibold text-slate-200 flex-1">{cluster.place}</h3>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${severityStyle(cluster.severity).className}`}
                  title={`Severity score: ${cluster.severity}`}
                >
                  {severityStyle(cluster.severity).label}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {cluster.categories.map((c) => (
                  <span
                    key={c}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3a3a3a] text-[#d4b36a]"
                  >
                    {categoryLabel(c)}
                  </span>
                ))}
              </div>
              {cluster.summary && (
                <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">{cluster.summary}</p>
              )}
              <p className="text-[10px] text-slate-500 mt-1.5">
                {cluster.memberCount} signals · {new Date(cluster.latestAt).toLocaleString()}
              </p>
              {selectedClusterId === cluster.id && (
                <div className="mt-2 space-y-1 border-t border-[#3a3a3a] pt-2">
                  {cluster.members.slice(0, 8).map((m, idx) => (
                    <a
                      key={idx}
                      href={m.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block text-[10px] text-slate-400 hover:text-[#d4b36a] line-clamp-1"
                    >
                      <span className="text-[#d4b36a]/70 font-mono">[{categoryLabel(m.category)}]</span> {m.title}
                    </a>
                  ))}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
