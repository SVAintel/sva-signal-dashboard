"use client";

import { ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import AuthWidget from "./AuthWidget";

export default function LandingPage() {
  const setDashboardActive = useStore((state) => state.setDashboardActive);

  return (
    <div className="entry-page">
      <header className="entry-masthead">
        <a href="/" className="desk-brand" aria-label="Sovereign Veil Analytics home">
          <span className="desk-monogram">SV<span>A</span></span>
          <span className="entry-brand-name">Sovereign Veil<br />Analytics</span>
        </a>
        <AuthWidget />
      </header>

      <section className="entry-main" aria-labelledby="entry-title">
        <div className="entry-copy">
          <h1 id="entry-title">A world of events.<br /><em>A clearer view.</em></h1>
          <p className="entry-eyebrow">An open-source intelligence workspace</p>
          <p className="entry-description">
            Sovereign Veil Analytics brings live reporting, infrastructure and open-source
            signals together on one map, so you can follow global developments in their
            geographic context.
          </p>
          <button className="entry-enter" onClick={() => setDashboardActive(true)}>
            Enter dashboard <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
        <figure className="entry-atlas">
          <img src="/world-reference.svg" alt="A globe of accurate world geography with illustrative submarine cable routes between major hubs." />
        </figure>
      </section>
    </div>
  );
}
