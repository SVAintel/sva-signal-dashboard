"use client";

import { useEffect, useMemo, useState } from "react";
import { Landmark, Search, X } from "lucide-react";

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image?: string;
  source: string;
  publishedAt: string;
}

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastFetchError, setLastFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setNews(data.slice(0, 30));
        setLastUpdated(new Date());
        setLastFetchError(null);
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setLastFetchError(
          error instanceof Error ? error.message : "Failed to fetch news"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const filteredNews = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return news;
    return news.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.source?.toLowerCase().includes(q)
    );
  }, [news, query]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a] border-l border-[#3a3a3a]">
      {/* Header */}
      <div className="border-b border-[#3a3a3a] bg-[#0e0e0e] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Landmark size={16} className="text-[#d4b36a]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Insights</h2>
          </div>
          <div className="relative w-[140px] shrink-0">
            <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports..."
              className="w-full rounded border border-[#3a3a3a] bg-[#111111] py-1 pl-7 pr-7 text-[10px] text-slate-200 placeholder:text-slate-600 focus:border-[#d4b36a]/50 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">Think Tank Reports & Policy Analysis</p>
        {lastFetchError ? (
          <p className="text-[10px] text-red-500 mt-1">
            Update failed{lastUpdated ? ` — showing data from ${lastUpdated.toLocaleTimeString()}` : ""}: {lastFetchError}
          </p>
        ) : lastUpdated ? (
          <p className="text-[10px] text-slate-700 mt-1">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        ) : null}
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Loading...
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center text-slate-600 text-xs">
            {query ? "No matching reports" : "No news available"}
          </div>
        ) : (
          filteredNews.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded border border-[#3a3a3a] bg-[#111111] hover:bg-[#2a2a2a] transition hover:border-[#d4b36a]/50 group"
            >
              {item.image && (
                <div className="mb-2 h-20 w-full overflow-hidden rounded bg-[#3a3a3a]">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                    onError={(e) => {
                      // Some scraped/og:image URLs 403 or expire — hide the
                      // broken image box instead of showing a broken-icon.
                      (e.currentTarget.closest("div") as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 group-hover:text-[#d4b36a] transition">
                {item.title}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[9px] text-[#d4b36a] font-mono">{item.source}</span>
                <span className="text-[9px] text-slate-600">
                  {new Date(item.publishedAt).toLocaleTimeString()}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}

