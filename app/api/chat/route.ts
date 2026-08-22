import { NextResponse } from "next/server";
import { Event } from "@/lib/types";
import type { MilitaryBaseData } from "@/components/MilitaryBaseDetailPanel";
import type { CountryData } from "@/components/CountryDetailPanel";
import { ANALYTIC_TRADECRAFT_GUIDANCE } from "@/lib/analyst-guidance";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash-lite";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  event?: Event;
  militaryBase?: MilitaryBaseData;
  country?: CountryData;
  messages: ChatMessage[];
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
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  if (
    (!event || !event.title || !event.category || !event.description) &&
    (!militaryBase || !militaryBase.name) &&
    (!country || !country.name)
  ) {
    return NextResponse.json({ error: "Missing event, military base, or country context." }, { status: 400 });
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
                    `${chatTranscript || `User: Provide a brief initial assessment of this ${event ? "event" : militaryBase ? "installation" : "country"}.`}\n\n` +
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
