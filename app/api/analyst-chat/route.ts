import { NextResponse } from "next/server";

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
  const events = Array.isArray(body?.events) ? body.events.slice(0, 12) : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  const feedSummary = events
    .map(
      (e, i) =>
        `${i + 1}. [${e.category}] ${e.title} | ${e.source} | ${e.confidence} | ` +
        `${new Date(e.timestamp).toISOString()} | (${e.location.lat.toFixed(2)}, ${e.location.lng.toFixed(2)})`
    )
    .join("\n");

  const transcript = messages
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  const prompt =
    `You are the AI Analyst for Sovereign Veil Analytics.` +
    ` Use concise, actionable intelligence language for analysts.` +
    ` Do not fabricate facts. If uncertain, say so and state what to verify.\n\n` +
    `Current signal feed snapshot:\n${feedSummary || "No active signals available."}\n\n` +
    `Conversation:\n${transcript}\n\n` +
    `Now provide the assistant response.`;

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
