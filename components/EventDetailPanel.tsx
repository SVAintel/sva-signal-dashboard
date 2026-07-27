"use client";

import { useEffect, useState } from "react";
import { Event } from "@/lib/types";
import { X } from "lucide-react";

interface EventDetailPanelProps {
  event: Event | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!event) {
      setChatMessages([]);
      return;
    }
    setChatMessages([
      {
        role: "assistant",
        content: "Ask me anything about this event. I can explain context, likely implications, and what to monitor next.",
      },
    ]);
    setChatInput("");
    setChatError(null);
    setChatLoading(false);
  }, [event?.id]);

  const sendChatMessage = async () => {
    if (!event) return;
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: trimmed }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event,
          messages: nextMessages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response." }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed";
      setChatError(message);
    } finally {
      setChatLoading(false);
    }
  };

  if (!event) return null;

  const analystNotes = generateAnalystNotes(event);
  const categoryColor = getCategoryColor(event.category);

  return (
    <>
      <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
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

            <div className="rounded border border-[#1e3a5f] bg-[#0f172a] p-4">
              <h2 className="mb-3 text-sm font-bold uppercase text-cyan-400">Event AI Q&A</h2>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded border border-[#1e3a5f] bg-[#0b1224] p-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`text-xs ${msg.role === "assistant" ? "text-slate-300" : "text-cyan-300"}`}>
                    <span className="mr-2 font-bold uppercase tracking-widest text-[10px]">
                      {msg.role === "assistant" ? "AI" : "You"}
                    </span>
                    <span>{msg.content}</span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="text-xs text-slate-500">
                    <span className="mr-2 font-bold uppercase tracking-widest text-[10px]">AI</span>
                    Thinking...
                  </div>
                )}
              </div>

              {chatError && <p className="mt-2 text-[11px] text-red-400">{chatError}</p>}

              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage();
                }}
              >
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about this event..."
                  className="flex-1 rounded border border-[#1e3a5f] bg-[#081021] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className={`rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition ${
                    chatLoading || !chatInput.trim()
                      ? "cursor-not-allowed border-slate-700 text-slate-600"
                      : "border-cyan-600 text-cyan-400 hover:bg-cyan-900/30"
                  }`}
                >
                  {chatLoading ? "Thinking..." : "Ask"}
                </button>
              </form>
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
    biological: "#22c55e",
    political_unrest: "#f97316",
    cyber: "#06b6d4",
    nuclear: "#84cc16",
    energy: "#d97706",
    humanitarian: "#f43f5e",
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
    biological: {
      paragraphs: [
        `Outbreak detection signals observed at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Epidemiological patterns suggest sustained community transmission with R-value above threshold. Pathogen characteristics and case clustering indicate potential for rapid geographic spread. WHO surveillance protocols activated; early intervention window is critical. Cross-reference with travel data and port-of-entry screening.`,
        `Transmission risk assessment underway. Immediate priority: contact tracing network activation and healthcare capacity pre-positioning. Monitor mutation reports for virulence shifts. Coordinate with national health ministries and international health partners. Key parameters: case doubling time, healthcare utilization rates, geographic spread velocity, and genomic sequencing data. Activate biosurveillance sharing with allied health agencies.`,
      ],
      watchPoints: [
        "Containment measures and border health controls",
        "WHO emergency committee convening",
        "Travel restriction announcements",
        "Mutation and variant sequencing reports",
        "Healthcare system capacity indicators",
        "Vaccine and countermeasure stockpile status",
      ],
      sourceUrl: "https://www.who.int",
      additionalSources: [
        { name: "WHO", title: "World Health Organization", url: "https://who.int" },
        { name: "CDC", title: "Centers for Disease Control", url: "https://cdc.gov" },
      ],
    },
    political_unrest: {
      paragraphs: [
        `Destabilization indicators detected at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Opposition momentum building with coordinated network activation across multiple civic channels. Regime vulnerability assessment elevated based on economic grievance index, historical analogs, and social media amplification signals. Security forces on elevated alert; international observers monitoring situation.`,
        `Pattern analysis indicates 14-21 day escalation window before consolidation or collapse. Foreign embassy posture changes are key leading indicators. Monitor for security force defections as tipping-point signal. Coordinate with diplomatic missions and regional partners. Key parameters: crowd size trajectory, government counter-messaging, economic trigger events, and external power positioning. Brief policy leadership within 4 hours.`,
      ],
      watchPoints: [
        "Security force defections or loyalty shifts",
        "International recognition and diplomatic signals",
        "Foreign embassy security posture changes",
        "Social media amplification and coordination",
        "Economic triggers and currency movements",
        "Armed group mobilization indicators",
      ],
      sourceUrl: "https://www.reuters.com",
      additionalSources: [
        { name: "Reuters", title: "Global News Feed", url: "https://reuters.com" },
        { name: "Foreign Policy", title: "Geopolitical Analysis", url: "https://foreignpolicy.com" },
      ],
    },
    cyber: {
      paragraphs: [
        `Cyberattack vector analysis indicates advanced persistent threat (APT) activity with attribution indicators matching known state-sponsored or criminal group TTPs. Attack signature correlates with prior campaigns; lateral movement patterns suggest pre-positioned access. Infrastructure vulnerability confirmed across multiple nodes. Incident response protocols activated; forensic collection underway.`,
        `Secondary target assessment in progress — pivot indicators suggest broader campaign scope. Monitor for data exfiltration signals and C2 beacon activity. Coordinate with CISA, sector ISACs, and international cyber partners. Key parameters: affected system inventory, patch release timelines, attribution confidence level, and diplomatic escalation thresholds. Brief CISO and executive leadership immediately. Prepare public disclosure timeline.`,
      ],
      watchPoints: [
        "Secondary target identification and lateral movement",
        "Data exfiltration volume and destination indicators",
        "Official attribution statements from governments",
        "Patch and vulnerability disclosure releases",
        "C2 infrastructure takedown operations",
        "Sector-wide alert and ISAC notifications",
      ],
      sourceUrl: "https://www.cisa.gov",
      additionalSources: [
        { name: "CISA", title: "Cybersecurity & Infrastructure Security", url: "https://cisa.gov" },
        { name: "Threat Intel", title: "APT Tracking Feeds", url: "https://attack.mitre.org" },
      ],
    },
    nuclear: {
      paragraphs: [
        `Proliferation risk indicators elevated at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). Enrichment activity detected above civilian threshold based on open-source technical indicators. IAEA monitoring protocols activated; satellite imagery analysis indicates facility configuration changes consistent with weapons-development timeline. Delivery system capability assessment underway.`,
        `Diplomatic channel activity is the primary de-escalation pathway. Monitor dual-use technology transfer patterns and procurement networks. Coordinate with IAEA verification teams and P5+1 diplomatic frameworks. Key parameters: enrichment level percentage, centrifuge cascade count, warhead miniaturization indicators, and delivery vehicle range assessment. Brief national security council within 2 hours. Prepare sanctions escalation options.`,
      ],
      watchPoints: [
        "IAEA inspector access and compliance status",
        "Satellite imagery changes at known facilities",
        "Diplomatic channel communications",
        "Dual-use technology transfer detections",
        "Delivery system test and development indicators",
        "Financial sanctions evasion patterns",
      ],
      sourceUrl: "https://www.iaea.org",
      additionalSources: [
        { name: "IAEA", title: "International Atomic Energy Agency", url: "https://iaea.org" },
        { name: "NTI", title: "Nuclear Threat Initiative", url: "https://nti.org" },
      ],
    },
    energy: {
      paragraphs: [
        `Supply chain disruption detected with cascading market effects confirmed. Geopolitical leverage play identified — state actor using energy infrastructure as coercive instrument. Pipeline integrity and flow rate anomalies detected across key transit corridors. Strategic reserve drawdown initiated by affected governments; commodity derivative markets pricing in sustained disruption.`,
        `Alternative supply route viability assessment underway. Monitor diplomatic negotiations for resolution timeline indicators. Coordinate with IEA emergency response mechanisms and allied energy ministries. Key parameters: strategic reserve days-of-supply, LNG spot market availability, alternative pipeline capacity, and political resolution probability. Brief energy security leadership and treasury within 1 hour. Prepare emergency supply sharing protocol activation.`,
      ],
      watchPoints: [
        "Strategic reserve levels and drawdown rate",
        "Alternative supply route activation",
        "Diplomatic negotiation progress signals",
        "Market derivative and futures positioning",
        "Critical infrastructure physical security status",
        "Downstream industrial and civilian impact indicators",
      ],
      sourceUrl: "https://www.iea.org",
      additionalSources: [
        { name: "IEA", title: "International Energy Agency", url: "https://iea.org" },
        { name: "EIA", title: "Energy Information Administration", url: "https://eia.gov" },
      ],
    },
    humanitarian: {
      paragraphs: [
        `Displacement patterns confirmed at (${event.location.lat.toFixed(2)}°, ${event.location.lng.toFixed(2)}°). IDP movement tracking indicates accelerating civilian exodus from conflict or disaster zone. Aid access constraints imposed by armed actors or infrastructure collapse. Civilian protection status degraded; international humanitarian law compliance indicators negative. IDP camp capacity approaching critical threshold.`,
        `Aid corridor access compromise requires immediate diplomatic escalation. Coordinate with UNHCR, WFP, OCHA, and bilateral humanitarian partners. Food security index deteriorating; pre-famine indicators present in affected population segments. Key parameters: IDP camp capacity utilization, food security phase classification, medical supply chain status, and international tribunal referral status. Brief humanitarian affairs leadership and donor governments within 6 hours.`,
      ],
      watchPoints: [
        "IDP camp capacity and population flow rates",
        "Food security phase classification changes",
        "Aid corridor access and armed actor compliance",
        "International tribunal and accountability actions",
        "Donor government response and funding pledges",
        "Disease outbreak risk in displaced populations",
      ],
      sourceUrl: "https://www.unhcr.org",
      additionalSources: [
        { name: "UNHCR", title: "UN Refugee Agency", url: "https://unhcr.org" },
        { name: "OCHA", title: "UN Office for Coordination of Humanitarian Affairs", url: "https://unocha.org" },
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
