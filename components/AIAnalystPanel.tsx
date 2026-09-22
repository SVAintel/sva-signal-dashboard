"use client";

import { useEffect, useMemo, useState } from "react";
import { Event } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIAnalystPanelProps {
  events: Event[];
}

export default function AIAnalystPanel({ events }: AIAnalystPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSnapshot = useMemo(
    () =>
      events.slice(0, 60).map((e) => ({
        title: e.title,
        category: e.category,
        source: e.source,
        timestamp: e.timestamp,
        location: e.location,
        confidence: e.confidence,
        description: e.description,
      })),
    [events]
  );

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "I’m your AI analyst. Ask for a situational brief, category trends, risk hotspots, or what to monitor next.",
      },
    ]);
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/analyst-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          events: eventSnapshot,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Analyst request failed");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply || "No response." }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyst request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-panel">
      <div className="analyst-context">{eventSnapshot.length} reports in context · AI-assisted interpretation</div>

      <div className="analyst-messages" role="log" aria-label="Analyst conversation" aria-live="polite">
        {messages.map((msg, idx) => (
          <div key={idx} className="analyst-message">
            <strong>{msg.role === "assistant" ? "SVA Analyst · AI" : "You"}</strong>
            <div className="space-y-2 leading-relaxed">
              {msg.content
                .split(/\n\s*\n/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((para, pIdx) => (
                  <p key={pIdx} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
            </div>
          </div>
        ))}
        {loading && (
          <p className="surface-muted" role="status">Preparing a response...</p>
        )}
      </div>

      {messages.length === 1 && <div className="analyst-prompts">
        {["Summarize the current situation.", "Which reports need closer scrutiny?"].map((prompt) => (
          <button key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>
        ))}
      </div>}
      <div className="analyst-composer">
      {error && <p className="surface-error" role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          aria-label="Ask the analyst"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the analyst..."
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="surface-button"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>
      <p>Answers may be incomplete or incorrect. Check original reporting before drawing conclusions.</p>
      </div>
    </div>
  );
}
