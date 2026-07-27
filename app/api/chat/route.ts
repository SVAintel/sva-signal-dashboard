import { NextResponse } from "next/server";
import { Event } from "@/lib/types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  event: Event;
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
  const messages = Array.isArray(body?.messages) ? body.messages : [];

  if (!event || !event.title || !event.category || !event.description) {
    return NextResponse.json({ error: "Missing event context." }, { status: 400 });
  }

  const systemContext =
    `You are an intelligence analyst assistant for Sovereign Veil Analytics. ` +
    `Answer using the event context below PLUS your own general knowledge of the region, actors, and ` +
    `historical/geopolitical background involved — do not ask the user to supply information themselves. ` +
    `If something falls outside both the event context and your knowledge, briefly note that in passing rather ` +
    `than blocking on it. Keep responses practical and analyst-style.\n\n` +
    `Event context:\n` +
    `- Title: ${event.title}\n` +
    `- Category: ${event.category.replace(/_/g, " ")}\n` +
    `- Description: ${event.description}\n` +
    `- Source: ${event.source}\n` +
    `- Location: ${event.location.lat.toFixed(2)}, ${event.location.lng.toFixed(2)}\n` +
    `- Timestamp: ${event.timestamp}\n` +
    `- Confidence: ${event.confidence}\n`;

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
                    `${chatTranscript || "User: Provide a brief initial assessment of this event."}\n\n` +
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
