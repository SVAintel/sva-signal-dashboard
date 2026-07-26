"use client";

import { useStore } from "@/store/useStore";

export default function LandingPage() {
  const { setDashboardActive } = useStore();

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-[#060a14] via-[#0a0f1f] to-[#0d1428] text-center">
      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, 0.05) 25%, rgba(6, 182, 212, 0.05) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, 0.05) 75%, rgba(6, 182, 212, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, 0.05) 25%, rgba(6, 182, 212, 0.05) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, 0.05) 75%, rgba(6, 182, 212, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl px-6">
        {/* Logo/Branding */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-400">SVA</span>
            <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />
          </div>
        </div>

        {/* Main Title */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-slate-100">
          Sovereign Veil
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Analytics
          </span>
        </h1>

        {/* Tagline */}
        <p className="mb-12 text-xl font-light text-slate-400 tracking-wide">
          Bring signal to the noise
        </p>

        {/* Description */}
        <p className="mb-8 text-sm text-slate-500 leading-relaxed">
          Real-time global intelligence aggregation platform.
          <br />
          Geopolitical analysis • Market signals • Disaster tracking • Conflict intelligence
        </p>

        {/* Enter Button */}
        <button
          onClick={() => setDashboardActive(true)}
          className="group relative inline-block px-8 py-3 font-bold uppercase tracking-widest text-black"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 blur-lg group-hover:opacity-100 transition duration-500" />
          
          {/* Button */}
          <div className="relative rounded bg-cyan-400 px-8 py-3 text-sm font-bold uppercase tracking-widest text-black transition group-hover:scale-105 group-hover:bg-cyan-300">
            Enter Dashboard
          </div>
        </button>

        {/* Bottom detail text */}
        <div className="mt-16 space-y-2 text-[10px] text-slate-600 uppercase tracking-wider">
          <p>Data Sources: NewsAPI • Alpha Vantage • USGS • GDELT • ACLED • CoinGecko • EMSC</p>
          <p>Updating: Real-time • Profiles: OSINT • Finance • Military</p>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl" />
    </div>
  );
}
