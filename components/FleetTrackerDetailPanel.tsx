"use client";

import { useEffect, useState } from "react";
import DetailFrame from "./DetailFrame";
import type { FleetGroup } from "@/lib/data/fleet-group-type";
export type { FleetGroup } from "@/lib/data/fleet-group-type";

interface FleetTrackerDetailPanelProps {
  group: FleetGroup | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  onClose: () => void;
}

interface RegionBriefResponse {
  brief: string;
  eventCount: number;
  fleetMatchCount: number;
  windowDays: number;
}

export default function FleetTrackerDetailPanel({ group, sourceUrl, publishedAt, onClose }: FleetTrackerDetailPanelProps) {
  const [brief, setBrief] = useState<RegionBriefResponse | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  useEffect(() => {
    setBrief(null);
    setBriefError(null);
    setBriefLoading(false);
  }, [group?.id]);

  if (!group) return null;

  const publishedLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
    : null;

  const generateBrief = async () => {
    if (briefLoading) return;
    setBriefLoading(true);
    setBriefError(null);
    try {
      const res = await fetch(`/api/region-brief?region=${encodeURIComponent(group.region)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Brief request failed");
      setBrief(data);
    } catch (err) {
      setBriefError(err instanceof Error ? err.message : "Brief request failed");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <DetailFrame title={group.region} eyebrow={"US fleet tracker / " + (group.groupName || "Regional report")} onClose={onClose}>
        <div className="detail-content">
          <div className="detail-section">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-medium text-sky-400">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                7-Day Regional Brief
              </h2>
              <button
                onClick={generateBrief}
                disabled={briefLoading}
                className={`shrink-0 rounded border px-3 py-1.5 text-[11px] font-medium transition ${
                  briefLoading
                    ? "cursor-not-allowed border-slate-700 text-[color:var(--desk-muted)]"
                    : "border-sky-500 text-sky-400 hover:bg-sky-950/40"
                }`}
              >
                {briefLoading ? "Generating..." : brief ? "Regenerate" : "Generate"}
              </button>
            </div>

            {briefError && <p className="text-[11px] text-red-400">{briefError}</p>}

            {brief ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--desk-text)]">{brief.brief}</p>
                <p className="mt-3 text-[11px] text-[color:var(--desk-muted)]">
                  Synthesized from {brief.eventCount} tracked event{brief.eventCount === 1 ? "" : "s"}
                  {brief.fleetMatchCount > 0
                    ? ` and ${brief.fleetMatchCount} nearby fleet group${brief.fleetMatchCount === 1 ? "" : "s"}`
                    : ""}{" "}
                  captured over the last {brief.windowDays} days — analytical synthesis, not a primary source.
                </p>
              </>
            ) : (
              !briefLoading && (
                <p className="text-sm leading-relaxed text-slate-400">
                  Generate an AI-synthesized summary of tracked events and fleet activity near this region over the
                  last 7 days.
                </p>
              )
            )}
          </div>

          <div className="detail-section">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
              <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
              Ships On Station
            </h2>
            {group.ships.length > 0 ? (
              <ul className="space-y-2">
                {group.ships.map((ship) => (
                  <li key={ship} className="flex gap-2 text-sm text-[color:var(--desk-text)]">
                    <span className="text-[color:var(--desk-accent)]">▸</span>
                    <span>{ship}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No individually named hulls parsed for this section.</p>
            )}
          </div>

          {group.missionSet && (
            <div className="detail-section">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--desk-accent)]">
                <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
                Mission Set
              </h2>
              <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{group.missionSet}</p>
            </div>
          )}

          {group.capabilities && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-[color:var(--desk-accent)]">Ship Capabilities</h2>
              <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{group.capabilities}</p>
            </div>
          )}

          {group.outlook && (
            <div className="detail-section">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Potential Headings / Outlook
              </h2>
              <p className="text-sm leading-relaxed text-[color:var(--desk-text)]">{group.outlook}</p>
              <p className="mt-2 text-[11px] italic text-[color:var(--desk-muted)]">
                Analytical judgment based on ship composition, region, and current dashboard signals — not
                confirmed movement or intent.
              </p>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-[color:var(--desk-muted)]">
            Approximate region only — USNI News reports named sea/operating areas, not exact
            coordinates, for operational-security reasons.
            {publishedLabel ? ` Published ${publishedLabel}` : ""}
            {sourceUrl ? (
              <>
                {" — "}
                <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-[color:var(--desk-accent)] underline">
                  source (USNI News)
                </a>
              </>
            ) : null}
            . Updated roughly weekly.
          </p>
        </div>
    </DetailFrame>
  );
}
