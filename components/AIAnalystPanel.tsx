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
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#d4b36a]">AI Analyst</h2>
        <span className="text-[10px] text-slate-500">{events.length} active signals</span>
      </div>

      <div className="flex-1 overflow-y-auto rounded border border-[#3a3a3a] bg-[#0f0f0f] p-3 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`text-xs ${msg.role === "assistant" ? "text-slate-300" : "text-[#e2c98b]"}`}>
            <span className="mr-2 text-[10px] font-bold uppercase tracking-widest">
              {msg.role === "assistant" ? "AI" : "You"}
            </span>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-500">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-widest">AI</span>
            Thinking...
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the analyst..."
          className="flex-1 rounded border border-[#3a3a3a] bg-[#0c0c0c] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-[#d4b36a] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition ${
            loading || !input.trim()
              ? "cursor-not-allowed border-slate-700 text-slate-600"
              : "border-[#d4b36a] text-[#d4b36a] hover:bg-[#2a2a2a]"
          }`}
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>
    </div>
  );
}

