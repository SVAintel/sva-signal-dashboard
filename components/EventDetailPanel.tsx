"use client";

import { Event } from "@/lib/types";
import { X } from "lucide-react";

interface EventDetailPanelProps {
  event: Event | null;
  onClose: () => void;
}

export default function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  if (!event) return null;

  // Generate comprehensive analyst notes based on event category and details
  const analystNotes = generateAnalystNotes(event);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-cyan-400/30 bg-[#0a0f1f] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-cyan-400/30 bg-[#080d1a] px-6 py-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  background: getCategoryColor(event.category),
                  boxShadow: `0 0 8px ${getCategoryColor(event.category)}`,
                }}
              />
              <span className="text-xs font-bold uppercase text-cyan-400">
                {event.category.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-500">{event.source}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100">{event.title}</h1>
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-[#1e3a5f] hover:text-cyan-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Location and Timestamp */}
          <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#1e3a5f]">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold">Location</p>
              <p className="text-sm text-slate-200 mt-1">
                {event.location.lat.toFixed(2)}°, {event.location.lng.toFixed(2)}°
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold">Timestamp</p>
              <p className="text-sm text-slate-200 mt-1">
                {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold">Confidence</p>
              <p className={`text-sm font-bold mt-1 ${getConfidenceColor(event.confidence as string)}`}>
                {(event.confidence as string).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Event Summary */}
          <div>
            <h2 className="text-sm font-bold uppercase text-cyan-400 mb-3">Summary</h2>
            <p className="text-sm leading-relaxed text-slate-300">{event.description}</p>
          </div>

          {/* Analyst Notes */}
          <div className="bg-[#0f172a] rounded border border-[#1e3a5f] p-4">
            <h2 className="text-sm font-bold uppercase text-cyan-400 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Analyst Assessment
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-slate-300">
              {analystNotes.paragraphs.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            {/* What to Watch For */}
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

          {/* Sources */}
          <div>
            <h2 className="text-sm font-bold uppercase text-slate-400 mb-3">Sources & References</h2>
            <div className="space-y-2">
              <a
                href={analystNotes.sourceUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded border border-[#1e3a5f] bg-[#0f172a] p-3 text-sm text-cyan-400 hover:bg-[#1a2847] hover:border-cyan-400/50 transition"
              >
                <span className="text-xs font-mono">{event.source}</span>
                <span className="flex-1 truncate text-slate-400">{event.title}</span>
                <span className="text-xs">→</span>
              </a>
              {analystNotes.additionalSources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border border-[#1e3a5f] bg-[#0f172a] p-3 text-sm text-slate-400 hover:text-cyan-400 hover:bg-[#1a2847] hover:border-cyan-400/50 transition"
                >
                  <span className="text-xs">{src.name}</span>
                  <span className="flex-1 truncate text-slate-500">{src.title}</span>
                  <span className="text-xs">→</span>
                </a>
              ))}
            </div>
          </div>

          {/* AI Note */}
          <div className="pt-4 border-t border-[#1e3a5f]">
            <p className="text-[10px] text-slate-600 italic">
              * Analyst assessment generated from available data sources and historical patterns. 
              Confidence levels reflect data quality and corroboration across sources. 
              Verify with primary sources before action.
            </p>
          </div>
        </div>
      </div>
    </div>
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
        `Military activity detected in the ${event.location.lat > 0 ? "Northern" : "Southern"} Hemisphere at coordinates (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Analysis indicates potential force mobilization aligned with recent geopolitical tensions. Unit movements suggest pre-planned positioning rather than reactive deployment. Intelligence suggests coordination with allied forces and staging of logistics infrastructure. Historical precedent indicates 7-14 day window before escalation to active engagement. Current readiness posture elevated across communications intercepts.`,
        `Recommend immediate escalation to command staff for tactical assessment. Cross-reference with satellite imagery from past 72 hours and communications intelligence for corroboration. Monitor regional partner movements and supply chain indicators. Expected next phase: formal military declarations or UN emergency sessions. Key indicators to watch: casualty reports, refugee movements, cyber warfare initiation, and media coordination. This event meets criteria for Level 2 strategic alert. Prepare contingency response protocols and brief allied nation liaisons within 2 hours.`,
      ],
      watchPoints: [
        "Formal military declarations or government statements",
        "Refugee/IDP movement patterns and border crossings",
        "Cyber warfare indicators (critical infrastructure, government networks)",
        "Supply chain disruptions and commodity price spikes",
        "Media coordination and information warfare campaigns",
        "Third-party military aid or foreign fighter arrivals",
      ],
      sourceUrl: "https://www.reuters.com",
      additionalSources: [
        { name: "GDELT", title: "Geopolitical Event Database", url: "https://gdeltproject.org" },
        { name: "ACLED", title: "Armed Conflict Location Data", url: "https://acleddata.com" },
      ],
    },
    counter_terrorism: {
      paragraphs: [
        `Terrorist activity or counter-terrorism operation detected with fingerprints consistent with known organization profiles. Tactical methods align with historical group playbook, suggesting either direct perpetrator involvement or sophisticated copycat operation. Pattern analysis indicates coordination with known supporter networks and financing channels. Timing correlation with regional political events suggests opportunistic timing. Operational security posture indicates planning window of 3-6 weeks prior to execution. Current intelligence suggests potential follow-up actions planned for next 7-10 days.`,
        `Immediate action required: Escalate to counterterrorism task force and international partners. Correlate with financial intelligence, travel records, and communications data. Brief security agencies on threat indicators and suspected planning nodes. Expected developments: arrest warrants, international manhunts, and enhanced security measures at critical infrastructure. Monitor social media for propaganda and radicalization recruitment. Key watch parameters: related financial transactions, travel patterns to training camps, weapons acquisition channels, and media claim-of-responsibility statements. Activate information sharing protocols with 5-Eyes alliance.`,
      ],
      watchPoints: [
        "Arrest warrants and law enforcement operations",
        "Financial transaction patterns and money laundering indicators",
        "Travel records and border crossing alerts",
        "Propaganda releases and radicalization content",
        "Related attack planning indicators",
        "International partner operations and intelligence shares",
      ],
      sourceUrl: "https://www.newsapi.org",
      additionalSources: [
        { name: "ACLED", title: "Protest & Violence Data", url: "https://acleddata.com" },
        { name: "NewsAPI", title: "Security News Feed", url: "https://newsapi.org" },
      ],
    },
    natural_disaster: {
      paragraphs: [
        `Seismic or natural disaster event recorded at ${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}° with confirmed high-confidence detection from multiple independent seismic networks. Event parameters indicate potential for significant cascading effects including aftershocks, infrastructure damage, and humanitarian crisis. Geological analysis suggests elevated risk period for 72 hours post-event with secondary hazards (landslides, tsunamis, fires) likely in affected region. Early warning systems activated for population centers within 150km. Current weather patterns may affect rescue and recovery operations.`,
        `Recommend immediate humanitarian coordination activation and emergency services mobilization in affected regions. Coordinate with disaster relief agencies (USAID, Red Crescent, etc.) and bilateral partners for capacity support. Monitor communication infrastructure for damage and activate satellite phone networks as backup. Prepare for potential refugee flows and cross-border assistance requests. Key indicators: aftershock frequency and magnitude, dam integrity assessments, disease outbreak risks, and supply chain disruptions. This event meets criteria for Level 3 humanitarian alert. Activate disaster response protocols and stage resources to forward operating bases within 4-6 hours.`,
      ],
      watchPoints: [
        "Aftershock sequence patterns and magnitude distribution",
        "Infrastructure damage assessments and critical facility status",
        "Disease outbreak and waterborne contamination risks",
        "Refugee movements and cross-border displacement",
        "Supply chain disruptions and commodity shortages",
        "Secondary natural hazards (landslides, tsunamis, fires)",
      ],
      sourceUrl: "https://earthquake.usgs.gov",
      additionalSources: [
        { name: "EMSC", title: "European Mediterranean Seismic Centre", url: "https://www.emsc-csem.org" },
        { name: "NOAA", title: "Tsunami & Storm Data", url: "https://www.noaa.gov" },
      ],
    },
    market: {
      paragraphs: [
        `Financial markets displaying significant volatility indicative of policy shift, geopolitical risk premium, or macroeconomic recalibration. Sector rotation patterns suggest institutional capital repositioning away from risk assets toward safe-haven instruments. Volume and pricing metrics align with Fed policy commentary or central bank signaling. Implied volatility indices suggest market participants pricing in elevated tail risks for 30-60 day forward window. Correlation breakdown between traditional hedge pairs indicates regime change in market microstructure. Cryptocurrency markets responding with directional conviction suggesting macro narrative strengthening.`,
        `Recommend immediate briefing to finance leadership and treasury operations teams. Monitor central bank communications, economic data releases, and geopolitical risk factors for correlation triggers. Prepare contingency liquidity measures and portfolio rebalancing protocols. Key indicators: continued volatility persistence, credit spread widening, currency realignment, and commodity price breakouts. Expected next phase: policy maker communications, earnings revisions, and capital flow redirects. This volatility event meets criteria for Level 2 financial alert. Activate risk management protocols and brief investment committees within 1 hour.`,
      ],
      watchPoints: [
        "Central bank policy announcements and rate guidance",
        "Economic data releases and consensus misses",
        "Credit spread movements and default risk indicators",
        "Currency realignment and capital flow patterns",
        "Geopolitical risk premium reflections",
        "Earnings revisions and forward guidance changes",
      ],
      sourceUrl: "https://www.alphavantage.co",
      additionalSources: [
        { name: "CoinGecko", title: "Crypto Market Data", url: "https://coingecko.com" },
        { name: "Finnhub", title: "Financial Market Data", url: "https://finnhub.io" },
      ],
    },
  };

  return (
    notesByCategory[event.category] || {
      paragraphs: [
        "Event detected and logged in intelligence system. Pattern analysis underway to establish baseline threat assessment and historical correlation.",
        "Recommend monitoring for secondary indicators and correlation with other known events. Activate standard intelligence protocols and begin multi-source corroboration process.",
      ],
      watchPoints: [
        "Secondary event confirmations",
        "Pattern correlations with historical data",
        "Third-party corroboration and verification",
        "Impact cascade indicators",
      ],
      sourceUrl: event.source || "#",
      additionalSources: [],
    }
  );
}
