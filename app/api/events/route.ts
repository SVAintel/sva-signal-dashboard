import { generateMockEvents } from "@/lib/event-generator";

// Underlying external APIs (NewsAPI especially) have strict daily quotas, so the
// individual source fetches inside event-generator.ts carry their own longer,
// quota-safe `next: { revalidate }` windows via Vercel's Data Cache. This route
// itself has no dynamic API usage (no cookies/headers/searchParams), which means
// Next.js would otherwise treat it as a STATIC route handler prerendered once at
// build time — relying entirely on ISR background revalidation to refresh, which
// isn't reliably triggering on this deployment and was serving a stale build-time
// snapshot indefinitely. force-dynamic makes the handler itself run per-request
// while the inner fetches still respect their quota-safe cache windows.
export const dynamic = "force-dynamic";
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
