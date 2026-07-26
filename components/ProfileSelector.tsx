"use client";

import { useState } from "react";
import { UserProfile } from "@/store/useStore";

const profiles: { id: UserProfile; label: string; description: string }[] = [
  {
    id: "osint",
    label: "OSINT Analyst",
    description: "Military & geopolitical events",
  },
  {
    id: "finance",
    label: "Finance Professional",
    description: "Market volatility & economic signals",
  },
  {
    id: "military",
    label: "Military Intelligence",
    description: "Defense & strategic movements",
  },
];

export default function ProfileSelector({
  onSelect,
}: {
  onSelect: (profile: UserProfile) => void;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-4xl font-bold text-white">
          SVA Signal
        </h1>
        <p className="mb-8 text-center text-slate-400">
          Global Intelligence Dashboard
        </p>

        <div className="space-y-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onSelect(profile.id)}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-left transition hover:from-blue-500 hover:to-blue-600"
            >
              <div className="font-semibold text-white">{profile.label}</div>
              <div className="text-sm text-blue-100">{profile.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
