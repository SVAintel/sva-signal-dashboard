"use client";

import { UserProfile } from "@/store/useStore";

const profiles: { id: UserProfile; label: string; description: string; code: string }[] = [
  { id: "osint",    label: "OSINT Analyst",         description: "Military & geopolitical events", code: "OS-INT" },
  { id: "finance",  label: "Finance Professional",   description: "Market volatility & economic signals", code: "FIN-INT" },
  { id: "military", label: "Military Intelligence",  description: "Defense & strategic movements", code: "MIL-INT" },
];

export default function ProfileSelector({
  onSelect,
}: {
  onSelect: (profile: UserProfile) => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#060a14]">
      {/* Scanline effect */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)]" />

      <div className="relative w-full max-w-sm px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-500">
            SVA · INTELLIGENCE · SYSTEMS
          </div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-white">
            SVA Signal
          </h1>
          <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-slate-600">
            Global Intelligence Dashboard
          </div>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        </div>

        {/* Profile Select */}
        <div className="mb-6 text-center text-[10px] uppercase tracking-widest text-slate-600">
          Select Access Profile
        </div>

        <div className="space-y-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className="group w-full border border-[#1e3a5f] bg-[#080d1a] p-4 text-left transition hover:border-cyan-500 hover:bg-[#0a1525]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-600 group-hover:text-cyan-400">
                    {profile.code}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {profile.label}
                  </div>
                  <div className="text-[11px] text-slate-600">{profile.description}</div>
                </div>
                <div className="text-slate-700 group-hover:text-cyan-500 transition text-lg">›</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center text-[9px] uppercase tracking-widest text-slate-800">
          Authorized Access Only · SVA Intel
        </div>
      </div>
    </div>
  );
}
