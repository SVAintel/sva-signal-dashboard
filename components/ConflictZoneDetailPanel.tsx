"use client";

import { X } from "lucide-react";

export interface ConflictZoneData {
  id: string;
  name: string;
  countries: string[];
  actors: string[];
  description: string;
  casualties: string;
  startYear: number;
  intensity: "high" | "medium" | "low";
  sources: string[];
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}

interface ConflictZoneDetailPanelProps {
  zone: ConflictZoneData | null;
  onClose: () => void;
}

const intensityColor: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#84cc16",
};

export default function ConflictZoneDetailPanel({ zone, onClose }: ConflictZoneDetailPanelProps) {
  if (!zone) return null;

  const color = intensityColor[zone.intensity] || "#d4b36a";

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-[#d4b36a]/30 bg-[#0e0e0e] shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-[#d4b36a]/30 bg-[#0f0f0f] px-6 py-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="text-xs font-bold uppercase text-[#d4b36a]">
                  Conflict Zone • {zone.intensity} intensity
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-100">{zone.name}</h1>
            </div>
            <button onClick={onClose} className="rounded p-2 text-slate-400 transition hover:bg-[#262626] hover:text-[#d4b36a]">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid grid-cols-2 gap-4 border-b border-[#3a3a3a] pb-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Country / Region</p>
                <p className="mt-1 text-sm text-slate-200">{zone.countries.join(", ")}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Active Since</p>
                <p className="mt-1 text-sm text-slate-200">{zone.startYear}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-600">Estimated Casualties</p>
                <p className="mt-1 text-sm text-slate-200">{zone.casualties}</p>
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold uppercase text-[#d4b36a]">Summary</h2>
              <p className="text-sm leading-relaxed text-slate-300">{zone.description}</p>
            </div>

            <div className="rounded border border-[#3a3a3a] bg-[#111111] p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-[#d4b36a]">
                <span className="h-2 w-2 rounded-full bg-[#d4b36a]" />
                Who's Involved
              </h2>
              <ul className="space-y-2">
                {zone.actors.map((actor, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-[#d4b36a]">▸</span>
                    <span>{actor}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-2 text-sm font-bold uppercase text-[#d4b36a]">Sources & References</h2>
              <div className="flex flex-wrap gap-2">
                {zone.sources.map((source, idx) => (
                  <span key={idx} className="rounded border border-[#3a3a3a] bg-[#111111] px-2 py-1 text-xs text-slate-400">
                    {source}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
