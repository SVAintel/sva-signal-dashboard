"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";

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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        const data = await response.json();
        setNews(data.slice(0, 8));
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col bg-[#090506] border-l border-[#3a1d24]">
      {/* Header */}
      <div className="border-b border-[#3a1d24] bg-[#12090b] px-4 py-3">
        <div className="flex items-center gap-2">
          <Newspaper size={16} className="text-[#d4b36a]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4b36a]">Live News</h2>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">Global Intelligence Feed</p>
      </div>

      {/* News Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Loading...
          </div>
        ) : news.length === 0 ? (
          <div className="text-center text-slate-600 text-xs">No news available</div>
        ) : (
          news.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2 rounded border border-[#3a1d24] bg-[#140b0f] hover:bg-[#2b171d] transition hover:border-[#d4b36a]/50 group"
            >
              {item.image && (
                <div className="mb-2 h-20 w-full overflow-hidden rounded bg-[#3a1d24]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
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
