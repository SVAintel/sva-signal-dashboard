const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";

// NewsAPI's free tier caps out at 100 requests/24h. Rather than re-fetching on
// every single page load (force-dynamic), cache the upstream call for 10 minutes
// so the whole user base shares one fetch per window — still "live", just quota-safe.
export const revalidate = 600;

export async function GET() {
  if (!NEWS_API_KEY) {
    return Response.json([]);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=general&sortBy=publishedAt&language=en&pageSize=30&apiKey=${NEWS_API_KEY}`,
      { signal: controller.signal, next: { revalidate: 600 } }
    );
    clearTimeout(timeout);

    const data = await res.json();

    if (data.status === "error") {
      console.error("News API error response:", data.code, data.message);
      return Response.json([]);
    }

    return Response.json(
      (data.articles || []).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
      }))
    );
  } catch (e) {
    console.error("News API error:", e);
    return Response.json([]);
  }
}
