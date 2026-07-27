import { NextResponse } from "next/server";
import { CONFLICTS } from "@/lib/conflict-data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface EventSnapshot {
  title: string;
  category: string;
  source: string;
  timestamp: string;
  location: { lat: number; lng: number };
  confidence: string;
  description: string;
}

interface AnalystChatBody {
  messages: ChatMessage[];
  events: EventSnapshot[];
}

export async function POST(req: Request) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini API key is not configured." }, { status: 500 });
  }

  let body: AnalystChatBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const events = Array.isArray(body?.events) ? body.events.slice(0, 60) : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const feedSummary = events
    .map(
      (e, i) =>
        `${i + 1}. [${e.category}] ${e.title} | ${e.source} | ${e.confidence} | ` +
        `${new Date(e.timestamp).toISOString()} | (${e.location.lat.toFixed(2)}, ${e.location.lng.toFixed(2)}) | ${e.description}`
    )
    .join("\n");

  const conflictSummary = CONFLICTS.map(
    (c) =>
      `- ${c.name} (${c.countries.join("/")}, active since ${c.startYear}, ${c.intensity} intensity): ` +
      `${c.actors.join(" vs ")}. ${c.description}`
  ).join("\n");

  const transcript = messages
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  const prompt =
    `You are the AI Analyst for Sovereign Veil Analytics, a geopolitical/market intelligence platform.\n\n` +
    `You have three sources of information available to you, all of which you should draw on freely without ` +
    `asking the user to supply anything:\n` +
    `1. Your own general knowledge of geopolitics, history, markets, military affairs, and current events.\n` +
    `2. The reference list of ongoing armed conflicts below.\n` +
    `3. The live signal feed snapshot below (breaking news-style events currently on the dashboard).\n\n` +
    `Answer the user's question directly using whichever of these sources is relevant. If the live feed doesn't ` +
    `mention something the user asks about, do NOT tell the user to provide data — instead answer from your own ` +
    `knowledge and the conflict reference list, and simply note that it isn't currently reflected in the live feed. ` +
    `Only flag uncertainty briefly, in passing — never make the user go fetch information for you. ` +
    `Use concise, actionable intelligence-analyst language.\n\n` +
    `Reference: ongoing armed conflicts —\n${conflictSummary}\n\n` +
    `Live signal feed snapshot (${events.length} of the dashboard's active signals):\n${feedSummary || "No active signals currently loaded."}\n\n` +
    `Conversation so far:\n${transcript}\n\n` +
    `Now provide the assistant's next response.`;

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
          contents: [{ parts: [{ text: prompt }] }],
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
