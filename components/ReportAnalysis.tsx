"use client";

import { useEffect, useRef, useState } from "react";
import type { Event } from "@/lib/types";
import { categoryGuidance } from "@/lib/report-guidance";

interface ChatMessage { role: "user" | "assistant"; content: string; }
export interface ReportConversation { messages: ChatMessage[]; draft: string; error: string; }
export default function ReportAnalysis({ event, saved, onSave }: {
  event: Event; saved?: ReportConversation; onSave: (conversation: ReportConversation) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(saved?.messages || []);
  const [input, setInput] = useState(saved?.draft || "");
  const [error, setError] = useState(saved?.error || "");
  const [loading, setLoading] = useState(false);
  const request = useRef<AbortController | null>(null);
  const save = useRef(onSave);
  save.current = onSave;
  useEffect(() => { save.current({ messages, draft: input, error }); }, [messages, input, error]);
  useEffect(() => () => request.current?.abort(), []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: controller.signal, body: JSON.stringify({ event, messages: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "The analyst request failed.");
      if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("The analyst returned an empty response. Please try again.");
      if (!controller.signal.aborted && request.current === controller) {
        setMessages([...next, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      if (!controller.signal.aborted && request.current === controller) {
        setError(err instanceof Error ? err.message : "The analyst request failed.");
      }
    } finally {
      if (!controller.signal.aborted && request.current === controller) setLoading(false);
    }
  };
  return <div className="detail-content">
    <p className="dossier-intro">Question this report, not the whole feed. Answers use the selected report and this conversation; they are not independent verification.</p>
    <div className="report-chat" role="log" aria-label="Report analyst conversation" aria-live="polite" aria-busy={loading}>
      {messages.length === 0 && <p className="surface-muted">Ask what the report establishes, what is missing, or which claims need checking.</p>}
      {messages.map((message, index) => <div className="report-chat-message" key={index}>
        <strong>{message.role === "user" ? "You" : "SVA Analyst · AI"}</strong><p>{message.content}</p>
      </div>)}
      {loading && <p className="surface-muted">Preparing a response. Leaving this view cancels the request.</p>}
      {messages.at(-1)?.role === "user" && !loading && !error && <p className="surface-muted">No response was retained for the last question. You can ask it again.</p>}
    </div>
    <form className="report-chat-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
      <label htmlFor="report-question">Your question</label>
      <textarea id="report-question" data-report-focus="question" rows={3} value={input} onChange={(e) => setInput(e.target.value)} placeholder="What should I verify in the original reporting?" />
      {error && <p className="surface-error" role="alert">{error}</p>}
      <button className="surface-button" disabled={!input.trim() || loading} type="submit">{loading ? "Preparing response..." : "Ask about this report"}</button>
    </form>
    <p className="detail-disclaimer">AI responses may be incomplete or incorrect. Verify important claims against primary sources before acting.</p>
    <details className="detail-section">
      <summary className="detail-section-title">Category research prompts</summary>
      <p className="detail-disclaimer">Generic research prompts, not findings about this event or evidence that these developments occurred.</p>
      <ul className="dossier-prompts">{categoryGuidance(event.category).watchPoints.map((point) => <li key={point}>{point}</li>)}</ul>
    </details>
  </div>;
}
