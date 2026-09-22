"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { categoryMeta } from "@/lib/categories";

export interface CorrelationClusterMember {
  title: string; category: string; source: string; url: string | null; lat: number; lng: number; timestamp: string;
}
export interface CorrelationCluster {
  id: string; place: string; centroid: { lat: number; lng: number }; categories: string[];
  memberCount: number; earliestAt: string; latestAt: string; members: CorrelationClusterMember[]; severity: number; summary?: string;
}

// These are existing cut points of an open-ended composite, not a calibrated risk scale.
function severityStyle(severity: number) {
  if (severity >= 9) return { label: "High", className: "bg-red-950 text-red-400 border-red-800" };
  if (severity >= 6) return { label: "Medium", className: "bg-amber-950 text-amber-400 border-amber-800" };
  return { label: "Low", className: "bg-slate-800 text-slate-300 border-slate-700" };
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
        setError(err instanceof Error ? err.message : "Failed to fetch patterns");
      } finally { setLoading(false); }
    };
    fetchClusters();
    const interval = setInterval(fetchClusters, 900000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="surface-panel">
      <div className="surface-toolbar">
        <p className="surface-muted">Different report categories converging near the same place within approximately 24 hours. Proximity is not proof of a connection.</p>
        {error && <p className="surface-error" role="alert">Update failed{lastUpdated ? "; previous results retained" : ""}: {error}</p>}
        {lastUpdated && <p className="surface-updated">Fetched {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {clusters.length} patterns</p>}
      </div>
      <div className="surface-scroll">
        {loading ? <p className="surface-muted p-5" role="status">Looking for patterns...</p> : clusters.length === 0 ? (
          <p className="surface-muted p-5">{error ? "Pattern data is unavailable." : "No cross-category patterns detected in this window."}</p>
        ) : clusters.map((cluster) => {
          const selected = selectedClusterId === cluster.id;
          const severity = severityStyle(cluster.severity);
          return (
            <article key={cluster.id} className={`pattern-row ${selected ? "is-selected" : ""}`}>
              <button className="pattern-select" onClick={() => onSelectCluster(selected ? null : cluster)} aria-expanded={selected} aria-label={`Explore pattern in ${cluster.place}`}>
                <div className="pattern-title"><MapPin size={16} /><h3>{cluster.place}</h3><span className={`pattern-score ${severity.className}`} title={`Composite score: ${cluster.severity}`}>{severity.label}</span></div>
                <div className="pattern-categories">{cluster.categories.map((category) => <span key={category}>{categoryMeta[category]?.label || category}</span>)}</div>
                {cluster.summary && <p>{cluster.summary}</p>}
                <div className="pattern-meta">{cluster.memberCount} reports · Latest {new Date(cluster.latestAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              </button>
              {selected && <div className="pattern-members">
                {cluster.members.slice(0, 8).map((member, index) => member.url ? (
                  <a key={index} href={member.url} target="_blank" rel="noopener noreferrer">{member.title}<span className="report-meta">{member.source} · {categoryMeta[member.category]?.label || member.category}</span></a>
                ) : <p key={index}>{member.title}<span className="report-meta">{member.source} · Source link unavailable</span></p>)}
              </div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
