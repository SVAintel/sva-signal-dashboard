"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import ProfileSelector from "@/components/ProfileSelector";
import { useStore } from "@/store/useStore";

export default function Home() {
  const { userProfile, setUserProfile } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-900">
      {!userProfile ? (
        <ProfileSelector onSelect={setUserProfile} />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}
