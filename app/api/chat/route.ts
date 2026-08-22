import { NextResponse } from "next/server";
import { Event } from "@/lib/types";
import type { MilitaryBaseData } from "@/components/MilitaryBaseDetailPanel";
import type { CountryData } from "@/components/CountryDetailPanel";
import type { PortData } from "@/components/PortDetailPanel";
import { ANALYTIC_TRADECRAFT_GUIDANCE } from "@/lib/analyst-guidance";
import { getRecentEvents, type EventHistoryRow } from "@/lib/db";
import { eventsForRegion } from "@/lib/region-match";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
// How far back to look for live-feed signals to ground country/base chat
// answers in what's actually happening right now, on top of the static
// curated context and the model's own general knowledge.
const LIVE_SIGNAL_WINDOW_DAYS = 14;
const MAX_LIVE_SIGNALS = 12;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  event?: Event;
  militaryBase?: MilitaryBaseData;
  country?: CountryData;
  port?: PortData;
  messages: ChatMessage[];
}

// Renders a "what's actually being tracked right now" block from the
// historical event feed, scoped to a region/country/base by name. Best-effort
// — getRecentEvents() already swallows DB errors and returns [], so this
// degrades to an empty string (i.e. rely on curated context + general
// knowledge) rather than failing the chat request.
function formatLiveSignals(events: EventHistoryRow[]): string {
  if (events.length === 0) return "";
  const lines = events
    .slice(0, MAX_LIVE_SIGNALS)
    .map((e) => `- [${e.category.replace(/_/g, " ")}] ${e.title} (${e.source}, first tracked ${e.firstSeenAt})`)
    .join("\n");
  return (
    `Recent live signals tracked by the dashboard (last ${LIVE_SIGNAL_WINDOW_DAYS} days — may be incomplete or ` +
    `unverified; weigh alongside the curated context above and your own knowledge, and don't treat this list as ` +
    `exhaustive):\n${lines}\n\n`
  );
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const event = body?.event;
  const militaryBase = body?.militaryBase;
  const country = body?.country;
  const port = body?.port;
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  if (
    (!event || !event.title || !event.category || !event.description) &&
    (!militaryBase || !militaryBase.name) &&
    (!country || !country.name) &&
    (!port || !port.name)
  ) {
    return NextResponse.json({ error: "Missing event, military base, country, or port context." }, { status: 400 });
  }

  // Ground country/base/port answers in what's currently being tracked, not
  // just the static curated context. Skipped for the single-event branch
  // since that event *is* the live signal already.
  let liveSignalsBlock = "";
  const regionName = country?.name || militaryBase?.country || port?.country;
  if (!event && regionName) {
    const recentEvents = await getRecentEvents(LIVE_SIGNAL_WINDOW_DAYS);
    const matched = eventsForRegion(recentEvents, regionName);
    liveSignalsBlock = formatLiveSignals(matched);
  }

  const systemContext = event
    ? `You are an intelligence analyst assistant for Sovereign Veil Analytics. ` +
      `Answer using the event context below PLUS your own general knowledge of the region, actors, and ` +
      `historical/geopolitical background involved — do not ask the user to supply information themselves. ` +
      `If something falls outside both the event context and your knowledge, briefly note that in passing rather ` +
      `than blocking on it. Keep responses practical and analyst-style, and prioritize specific, concrete ` +
      `details — cite named actors, locations, dates, and figures rather than vague generalities. Formatting: ` +
      `separate distinct topics/ideas into their own paragraphs with a blank line between them so the answer is ` +
      `easy to scan. Let the number of paragraphs vary naturally with the length and complexity of the answer — ` +
      `a quick factual question may only need one short paragraph, while a broader question may need several. ` +
      `Do NOT pad with extra paragraph breaks just to hit a target count, and do NOT shorten or omit substantive ` +
      `details to fit a paragraph.\n\n` +
      ANALYTIC_TRADECRAFT_GUIDANCE +
      `Event context:\n` +
      `- Title: ${event.title}\n` +
      `- Category: ${event.category.replace(/_/g, " ")}\n` +
      `- Description: ${event.description}\n` +
      `- Source: ${event.source}\n` +
      `- Location: ${event.location.lat.toFixed(2)}, ${event.location.lng.toFixed(2)}\n` +
      `- Timestamp: ${event.timestamp}\n` +
      `- Confidence: ${event.confidence}\n`
    : militaryBase
    ? `You are an intelligence analyst assistant for Sovereign Veil Analytics. ` +
      `Answer using the military installation context below PLUS your own general knowledge of the branch, ` +
      `region, and historical/strategic background involved — do not ask the user to supply information ` +
      `themselves. Figures given are public/unclassified approximations, not an authoritative order-of-battle ` +
      `source; note that if relevant. If something falls outside both the given context and your knowledge, ` +
      `briefly note that in passing rather than blocking on it. Keep responses practical and analyst-style, and ` +
      `prioritize specific, concrete details — cite named units, branches, and figures rather than vague ` +
      `generalities. Formatting: separate distinct topics/ideas into their own paragraphs with a blank line ` +
      `between them so the answer is easy to scan. Let the number of paragraphs vary naturally with the length ` +
      `and complexity of the answer — a quick factual question may only need one short paragraph, while a ` +
      `broader question may need several. Do NOT pad with extra paragraph breaks just to hit a target count, ` +
      `and do NOT shorten or omit substantive details to fit a paragraph.\n\n` +
      ANALYTIC_TRADECRAFT_GUIDANCE +
      liveSignalsBlock +
      `Military installation context:\n` +
      `- Name: ${militaryBase!.name}\n` +
      `- Branch/Operator: ${militaryBase!.details?.branch || militaryBase!.operator || "Unknown"}\n` +
      `- Country/Region: ${militaryBase!.country || "N/A"}\n` +
      `- Est. Population: ${militaryBase!.details?.population || "Not publicly available"}\n` +
      `- Location: ${militaryBase!.lat.toFixed(2)}, ${militaryBase!.lng.toFixed(2)}\n` +
      (militaryBase!.details
        ? `- Summary: ${militaryBase!.details.description}\n` +
          `- Major Units: ${militaryBase!.details.majorUnits.join("; ")}\n` +
          `- Mission Set: ${militaryBase!.details.missions.join("; ")}\n`
        : `- Detailed unit/mission data is not curated for this installation; rely on general knowledge.\n`)
    : port
    ? `You are an intelligence analyst assistant for Sovereign Veil Analytics. ` +
      `Answer using the seaport context below PLUS your own general knowledge of global shipping, trade flows, and ` +
      `maritime chokepoints — do not ask the user to supply information themselves. Figures given are ` +
      `public/unclassified approximations, not an authoritative maritime traffic source; note that if relevant. ` +
      `If something falls outside both the given context and your knowledge, briefly note that in passing rather ` +
      `than blocking on it. Keep responses practical and analyst-style, and prioritize specific, concrete ` +
      `details — cite named chokepoints, trade lanes, cargo types, and figures rather than vague generalities. ` +
      `Formatting: separate distinct topics/ideas into their own paragraphs with a blank line between them so the ` +
      `answer is easy to scan. Let the number of paragraphs vary naturally with the length and complexity of the ` +
      `answer — a quick factual question may only need one short paragraph, while a broader question may need ` +
      `several. Do NOT pad with extra paragraph breaks just to hit a target count, and do NOT shorten or omit ` +
      `substantive details to fit a paragraph.\n\n` +
      ANALYTIC_TRADECRAFT_GUIDANCE +
      liveSignalsBlock +
      `Seaport context:\n` +
      `- Name: ${port!.displayName || port!.name}\n` +
      `- Country: ${port!.country || "N/A"}\n` +
      `- Harbor size: ${port!.size}\n` +
      `- Location: ${port!.lat.toFixed(2)}, ${port!.lng.toFixed(2)}\n` +
      (port!.details
        ? `- Chokepoint: ${port!.details.chokepoint || "None"}\n` +
          `- Primary cargo: ${port!.details.primaryCargo.join("; ")}\n` +
          `- Annual throughput: ${port!.details.annualThroughput}\n` +
          `- Summary: ${port!.details.strategicNotes}\n`
        : `- Detailed cargo/throughput/chokepoint data is not curated for this port; rely on general knowledge.\n`)
    : `You are an intelligence analyst assistant for Sovereign Veil Analytics. ` +
      `Answer using the country context below PLUS your own general knowledge of its politics, economy, military, ` +
      `and regional relationships — do not ask the user to supply information themselves. Figures given are ` +
      `public/unclassified approximations, not an authoritative statistical or classified source; note that if ` +
      `relevant. If something falls outside both the given context and your knowledge, briefly note that in ` +
      `passing rather than blocking on it. Keep responses practical and analyst-style, and prioritize specific, ` +
      `concrete details — cite named leaders, parties, figures, and events rather than vague generalities. ` +
      `Formatting: separate distinct topics/ideas into their own paragraphs with a blank line between them so the ` +
      `answer is easy to scan. Let the number of paragraphs vary naturally with the length and complexity of the ` +
      `answer — a quick factual question may only need one short paragraph, while a broader question may need ` +
      `several. Do NOT pad with extra paragraph breaks just to hit a target count, and do NOT shorten or omit ` +
      `substantive details to fit a paragraph.\n\n` +
      ANALYTIC_TRADECRAFT_GUIDANCE +
      liveSignalsBlock +
      `Country context:\n` +
      `- Name: ${country!.name}\n` +
      (country!.details
        ? `- Region: ${country!.details.region}\n` +
          `- Capital: ${country!.details.capital}\n` +
          `- Population: ${country!.details.population}\n` +
          `- Government: ${country!.details.governmentType}\n` +
          `- Ruling parties: ${country!.details.rulingParties}\n` +
          `- GDP: ${country!.details.gdp}\n` +
          `- Major exports: ${country!.details.majorExports.join("; ")}\n` +
          `- Top trade partners: ${country!.details.topTradePartners.join("; ")}\n` +
          `- Military branches: ${country!.details.militaryBranches.join("; ")}\n` +
          `- Active personnel: ${country!.details.activePersonnel}\n` +
          `- Defense budget: ${country!.details.defenseBudget}\n` +
          `- Alliances/partners: ${country!.details.alliances.join("; ")}\n` +
          `- Summary: ${country!.details.summary}\n`
        : `- Detailed political/economic/military data is not curated for this country yet; rely on general knowledge.\n`);

  const chatTranscript = messages
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    `${systemContext}\n\nConversation so far:\n` +
                    `${chatTranscript || `User: Provide a brief initial assessment of this ${event ? "event" : militaryBase ? "installation" : port ? "port" : "country"}.`}\n\n` +
                    `Now provide the assistant response.`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Gemini request failed." },
        { status: geminiResponse.status }
      );
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ error: "No response text returned from Gemini." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "Failed to contact Gemini API." }, { status: 500 });
  }
}
