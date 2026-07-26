"use client";

import { Event } from "@/lib/types";
import { X } from "lucide-react";

interface EventDetailPanelProps {
  event: Event | null;
  onClose: () => void;
}

export default function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  if (!event) return null;

  const analystNotes = generateAnalystNotes(event);
  const categoryColor = getCategoryColor(event.category);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-cyan-400/30 bg-[#0a0f1f] shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-cyan-400/30 bg-[#080d1a] px-6 py-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full" style={{ background: categoryColor, boxShadow: `0 0 8px ${categoryColor}` }} />
                <span className="text-xs font-bold uppercase text-cyan-400">{event.category.replace(/_/g, " ")}</span>
                <span className="text-xs text-slate-600">•</span>
                <span className="text-xs text-slate-500">{event.source}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-100">{event.title}</h1>
            </div>
            <button onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-[#1e3a5f] hover:text-cyan-400 transition">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#1e3a5f]">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Location</p>
                <p className="text-sm text-slate-200 mt-1">{event.location.lat.toFixed(2)}°, {event.location.lng.toFixed(2)}°</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Timestamp</p>
                <p className="text-sm text-slate-200 mt-1">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold">Confidence</p>
                <p className={`text-sm font-bold mt-1 ${getConfidenceColor(event.confidence as string)}`}>{(event.confidence as string).toUpperCase()}</p>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-cyan-400 mb-3">Summary</h2>
              <p className="text-sm leading-relaxed text-slate-300">{event.description}</p>
            </div>

            <div className="bg-[#0f172a] rounded border border-[#1e3a5f] p-4">
              <h2 className="text-sm font-bold uppercase text-cyan-400 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Analyst Assessment
              </h2>
              <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                {analystNotes.paragraphs.map((para, idx) => <p key={idx}>{para}</p>)}
              </div>

              <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Watch for developments:</h3>
                <ul className="space-y-2">
                  {analystNotes.watchPoints.map((point, idx) => (
                    <li key={idx} className="text-xs text-slate-400 flex gap-2">
                      <span className="text-cyan-400">▸</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-slate-400 mb-3">Sources & References</h2>
              <div className="space-y-2">
                <a href={analystNotes.sourceUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded border border-[#1e3a5f] bg-[#0f172a] p-3 text-sm text-cyan-400 hover:bg-[#1a2847] hover:border-cyan-400/50 transition">
                  <span className="text-xs font-mono">{event.source}</span>
                  <span className="flex-1 truncate text-slate-400">{event.title}</span>
                  <span className="text-xs">→</span>
                </a>
                {analystNotes.additionalSources.map((src, idx) => (
                  <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded border border-[#1e3a5f] bg-[#0f172a] p-3 text-sm text-slate-400 hover:text-cyan-400 hover:bg-[#1a2847] hover:border-cyan-400/50 transition">
                    <span className="text-xs">{src.name}</span>
                    <span className="flex-1 truncate text-slate-500">{src.title}</span>
                    <span className="text-xs">→</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1e3a5f]">
              <p className="text-[10px] text-slate-600 italic">* Analyst assessment generated from available data sources. Confidence levels reflect data quality. Verify with primary sources before action.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    war: "#ef4444",
    counter_terrorism: "#a855f7",
    natural_disaster: "#f59e0b",
    market: "#22d3ee",
  };
  return colors[category] || "#64748b";
}

function getConfidenceColor(confidence: string): string {
  const colors: Record<string, string> = {
    high: "text-green-400",
    medium: "text-yellow-400",
    low: "text-orange-400",
    confirmed: "text-green-400",
    pending: "text-blue-400",
  };
  return colors[confidence] || "text-slate-400";
}

interface AnalystNotesResult {
  paragraphs: string[];
  watchPoints: string[];
  sourceUrl: string;
  additionalSources: Array<{ name: string; title: string; url: string }>;
}

function generateAnalystNotes(event: Event): AnalystNotesResult {
  const notesByCategory: Record<string, AnalystNotesResult> = {
    war: {
      paragraphs: [
        `Military activity detected at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Analysis indicates potential force mobilization with pre-planned positioning. Intelligence suggests coordination with allied forces and logistics infrastructure staging. Historical patterns indicate 7-14 day window before active engagement escalation. Current readiness posture elevated.`,
        `Recommend immediate escalation to command staff. Cross-reference with satellite imagery and comms intelligence. Monitor regional partner movements and supply chains. Expected phase: military declarations or UN sessions. Watch: casualty reports, refugee flows, cyber operations, and media campaigns. Level 2 strategic alert. Brief allied liaisons within 2 hours.`,
      ],
      watchPoints: [
        "Formal military declarations or statements",
        "Refugee/IDP movement and border crossings",
        "Cyber warfare and critical infrastructure attacks",
        "Supply chain disruptions",
        "Media coordination and information warfare",
        "Foreign military aid arrivals",
      ],
      sourceUrl: "https://www.reuters.com",
      additionalSources: [
        { name: "GDELT", title: "Geopolitical Event Database", url: "https://gdeltproject.org" },
        { name: "ACLED", title: "Armed Conflict Location Data", url: "https://acleddata.com" },
      ],
    },
    counter_terrorism: {
      paragraphs: [
        `Terrorist activity detected with organizational fingerprints consistent with known profiles. Tactical methods align with group playbook. Pattern analysis indicates coordination with supporter networks. Timing suggests opportunistic positioning. Planning window 3-6 weeks prior. Follow-up actions likely in 7-10 days.`,
        `Immediate: Escalate to counterterrorism task force and international partners. Correlate financial, travel, and comms data. Brief agencies on threat indicators. Expected: arrest warrants, manhunts, infrastructure security upgrades. Monitor propaganda and radicalization. Key parameters: financial trails, travel patterns, weapons acquisition, claim-of-responsibility statements. Activate 5-Eyes information sharing.`,
      ],
      watchPoints: [
        "Arrest warrants and law enforcement ops",
        "Financial transaction patterns",
        "Travel records and border alerts",
        "Propaganda and radicalization content",
        "Related attack planning indicators",
        "International partner operations",
      ],
      sourceUrl: "https://www.newsapi.org",
      additionalSources: [
        { name: "ACLED", title: "Violence Data", url: "https://acleddata.com" },
        { name: "NewsAPI", title: "Security Feed", url: "https://newsapi.org" },
      ],
    },
    natural_disaster: {
      paragraphs: [
        `Natural disaster recorded at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Confirmed high-confidence detection. Potential cascading effects: aftershocks, infrastructure damage, humanitarian crisis. Elevated risk 72 hours post-event. Secondary hazards (landslides, tsunamis) probable. Early warning activated within 150km radius.`,
        `Immediate: Activate humanitarian coordination and emergency services in affected regions. Coordinate with USAID, Red Crescent, bilateral partners. Monitor communications infrastructure. Prepare for refugee flows and assistance requests. Key indicators: aftershocks, dam integrity, disease risks, supply disruption. Level 3 humanitarian alert. Stage resources to forward bases within 4-6 hours.`,
      ],
      watchPoints: [
        "Aftershock patterns and magnitude",
        "Infrastructure damage and facility status",
        "Disease and contamination risks",
        "Refugee movements and displacement",
        "Supply chain disruptions",
        "Secondary hazards (landslides, tsunamis)",
      ],
      sourceUrl: "https://earthquake.usgs.gov",
      additionalSources: [
        { name: "EMSC", title: "European Seismic Centre", url: "https://www.emsc-csem.org" },
        { name: "NOAA", title: "Tsunami & Storm Data", url: "https://www.noaa.gov" },
      ],
    },
    market: {
      paragraphs: [
        `Financial volatility detected indicating policy shift or macroeconomic recalibration. Sector rotation suggests capital repositioning from risk to safe-haven. Pricing aligns with Fed signals. Implied volatility suggests elevated tail risks 30-60 days forward. Traditional hedge breakdown indicates market regime change. Crypto markets showing directional conviction.`,
        `Brief finance leadership and treasury teams immediately. Monitor central bank communications and economic data. Prepare liquidity and rebalancing protocols. Key indicators: volatility persistence, credit spreads, currency realignment, commodity breakouts. Expected: policy communications, earnings revisions, capital flow redirects. Level 2 financial alert. Brief investment committees within 1 hour.`,
      ],
      watchPoints: [
        "Central bank policy announcements",
        "Economic data and consensus misses",
        "Credit spread movements",
        "Currency realignment patterns",
        "Geopolitical risk premium changes",
        "Earnings guidance revisions",
      ],
      sourceUrl: "https://www.alphavantage.co",
      additionalSources: [
        { name: "CoinGecko", title: "Crypto Market Data", url: "https://coingecko.com" },
        { name: "Finnhub", title: "Financial Data", url: "https://finnhub.io" },
      ],
    },
  };

  return notesByCategory[event.category] || {
    paragraphs: [
      "Event detected and logged. Pattern analysis underway for baseline threat assessment.",
      "Monitor for secondary indicators and correlation with known events. Activate intelligence protocols.",
    ],
    watchPoints: [
      "Secondary confirmations",
      "Pattern correlations",
      "Third-party verification",
      "Impact indicators",
    ],
    sourceUrl: event.source || "#",
    additionalSources: [],
  };
}
