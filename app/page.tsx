"use client";

import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import LandingPage from "@/components/LandingPage";
import { useStore } from "@/store/useStore";

export default function Home() {
  const { dashboardActive } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-900">
      {!dashboardActive ? <LandingPage /> : <Dashboard />}
    </main>
  );
}
