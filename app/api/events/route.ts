import { generateMockEvents } from "@/lib/event-generator";

// Underlying external APIs (NewsAPI especially) have strict daily quotas, so this
// route relies on fetch-level revalidation inside event-generator.ts rather than
// force-dynamic — it stays "live" on a rolling window without exhausting quotas.
// This outer window just controls how often the aggregation re-runs; the
// individual source fetches carry their own longer, quota-safe cache windows.
export const revalidate = 900;

export async function GET() {
  try {
    const events = await generateMockEvents();
    return Response.json(events);
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
