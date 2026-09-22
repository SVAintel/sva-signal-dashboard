"use client";

import { ArrowDownRight, ArrowRight } from "lucide-react";
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
        <span className="entry-edition">An open-source intelligence workspace</span>
        <AuthWidget />
      </header>

      <section className="entry-main" aria-labelledby="entry-title">
        <div className="entry-copy">
          <p className="entry-eyebrow"><span /> The signal. The source. The wider picture.</p>
          <h1 id="entry-title">A world of events.<br /><em>A clearer view.</em></h1>
          <p className="entry-description">
            Follow global developments in their geographic context.
            Bring reporting, infrastructure and analysis into one considered workspace.
          </p>
          <button className="entry-enter" onClick={() => setDashboardActive(true)}>
            Enter dashboard <ArrowRight size={20} aria-hidden="true" />
          </button>
          <p className="entry-access">Explore without an account. Sign in to save your workspace preferences.</p>
          <div className="entry-index">
            <span className="entry-index-number">01 /</span>
            <div><strong>Context before conclusions.</strong><p>Start with the map. Follow the sources. Form your own assessment.</p></div>
            <ArrowDownRight size={24} aria-hidden="true" />
          </div>
        </div>
        <figure className="entry-atlas">
          <div className="entry-atlas-caption"><span>THE CONNECTED WORLD</span><span>Reference atlas / 01</span></div>
          <img src="/world-reference.svg" alt="World geography with selected submarine cable routes drawn from the dashboard's reference dataset." />
          <figcaption><span className="entry-map-key" />Submarine cable routes<span>Reference geography, not a live feed</span></figcaption>
        </figure>
      </section>

      <section className="entry-bottom" aria-label="About the workspace">
        <div className="entry-bottom-label">Built for the<br /><strong>wider picture.</strong></div>
        <p>Move between the signal ledger, policy insights, markets and spatial patterns without losing your place on the map.</p>
        <p className="entry-source-note">Public sources. Visible provenance.<br />Source quality and update frequency vary. AI-assisted analysis is a starting point, not a conclusion.</p>
      </section>
      <footer className="entry-footer"><span>SOVEREIGN VEIL ANALYTICS</span><span>Independent perspective. Geographic context.</span></footer>
    </div>
  );
}
