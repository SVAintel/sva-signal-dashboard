"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

interface NewsItem {
  title: string; description: string; url: string; image?: string; source: string; publishedAt: string;
}

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data: NewsItem[] = await response.json();
        setNews(data.slice(0, 30));
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error("Failed to fetch news:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch news");
      } finally { setLoading(false); }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return news.filter((item) => !term || [item.title, item.description, item.source].some((value) => value?.toLowerCase().includes(term)));
  }, [news, query]);

  return (
    <div className="surface-panel">
      <div className="surface-toolbar">
        <p className="surface-muted mb-3">Policy research and reporting from think tanks. Read the original for full context.</p>
        <div className="ledger-search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search insight reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these reports" />
          {query && <button onClick={() => setQuery("")} aria-label="Clear report search"><X size={15} /></button>}
        </div>
        {error && <p className="surface-error" role="alert">Update failed{lastUpdated ? "; previous reports retained" : ""}: {error}</p>}
        {lastUpdated && <p className="surface-updated">Fetched {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {filtered.length} reports</p>}
      </div>
      <div className="surface-scroll">
        {loading ? <p className="surface-muted p-5" role="status">Loading reports...</p> : filtered.length === 0 ? (
          <p className="surface-muted p-5">{query ? "No reports match this search." : error ? "Reports are unavailable. An update will be retried automatically." : "No reports are available."}</p>
        ) : filtered.map((item, index) => (
          <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noopener noreferrer" className="report-row">
            <div className="report-row-top">
              <h3>{item.title}</h3>
              {item.image && <img src={item.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
            </div>
            <p className="line-clamp-2">{item.description}</p>
            <div className="report-meta"><span>{item.source}</span><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</time></div>
          </a>
        ))}
      </div>
    </div>
  );
}
