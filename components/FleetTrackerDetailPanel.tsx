"use client";

import { X } from "lucide-react";

export interface FleetGroup {
  id: string;
  region: string;
  lat: number;
  lng: number;
  groupName: string | null;
  ships: string[];
  summary: string;
  capabilities: string;
  missionSet: string;
  outlook: string;
}

interface FleetTrackerDetailPanelProps {
  group: FleetGroup | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  onClose: () => void;
}

export default function FleetTrackerDetailPanel({ group, sourceUrl, publishedAt, onClose }: FleetTrackerDetailPanelProps) {
  if (!group) return null;

  const publishedLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
    : null;

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
