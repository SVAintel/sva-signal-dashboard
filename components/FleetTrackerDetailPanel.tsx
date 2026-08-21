"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
    <div className="absolute inset-y-0 right-0 z-[1200] flex w-full max-w-full sm:max-w-[420px] pointer-events-none">
      <div className="pointer-events-auto flex h-full w-full flex-col overflow-y-auto border-l border-[#d4b36a]/30 bg-[#0e0e0ef5] shadow-2xl backdrop-blur-sm">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d4b36a]/30 bg-[#0f0f0f] px-5 py-4">
          <div className="flex-1 pr-2">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }} />
              <span className="text-xs font-bold uppercase text-[#d4b36a]">
                US Fleet Tracker{group.groupName ? ` • ${group.groupName}` : ""}
              </span>
            </div>
            <h1 className="text-lg font-bold leading-snug text-slate-100">🇺🇸⚓ {group.region}</h1>
          </div>
          <button onClick={onClose} className="shrink-0 rounded p-2 text-slate-400 transition hover:bg-[#262626] hover:text-[#d4b36a]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded border border-sky-700/40 bg-sky-950/10 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase text-sky-400">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                7-Day Regional Brief
              </h2>
              <button
                onClick={generateBrief}
                disabled={briefLoading}
                className={`shrink-0 rounded border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition ${
                  briefLoading
                    ? "cursor-not-allowed border-slate-700 text-slate-600"
                    : "border-sky-500 text-sky-400 hover:bg-sky-950/40"
                }`}
              >
                {briefLoading ? "Generating..." : brief ? "Regenerate" : "Generate"}
              </button>
            </div>

            {briefError && <p className="text-[11px] text-red-400">{briefError}</p>}

            {brief ? (
              <>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{brief.brief}</p>
                <p className="mt-3 text-[10px] text-slate-500">
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

          <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
              <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
              Ships On Station
            </h2>
            {group.ships.length > 0 ? (
              <ul className="space-y-2">
                {group.ships.map((ship) => (
                  <li key={ship} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-[#d4b36a]">▸</span>
                    <span>{ship}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No individually named hulls parsed for this section.</p>
            )}
          </div>

          {group.missionSet && (
            <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
                Mission Set
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">{group.missionSet}</p>
            </div>
          )}

          {group.capabilities && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Ship Capabilities</h2>
              <p className="text-sm leading-relaxed text-slate-300">{group.capabilities}</p>
            </div>
          )}

          {group.outlook && (
            <div className="rounded border border-amber-700/40 bg-amber-950/10 p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Potential Headings / Outlook
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">{group.outlook}</p>
              <p className="mt-2 text-[10px] italic text-slate-500">
                Analytical judgment based on ship composition, region, and current dashboard signals — not
                confirmed movement or intent.
              </p>
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-slate-600">
            Approximate region only — USNI News reports named sea/operating areas, not exact
            coordinates, for operational-security reasons.
            {publishedLabel ? ` Published ${publishedLabel}` : ""}
            {sourceUrl ? (
              <>
                {" — "}
                <a href={sourceUrl} target="_blank" rel="noreferrer" className="text-[#d4b36a] underline">
                  source (USNI News)
                </a>
              </>
            ) : null}
            . Updated roughly weekly.
          </p>
        </div>
      </div>
    </div>
  );
}
