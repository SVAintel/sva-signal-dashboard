const NEWS_API_KEY = process.env.NEXT_PUBLIC_NEWS_API_KEY || "";

export async function GET() {
  if (!NEWS_API_KEY) {
    return Response.json([]);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=general&sortBy=publishedAt&language=en&pageSize=8&apiKey=${NEWS_API_KEY}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    const data = await res.json();

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
