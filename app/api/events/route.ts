import { generateMockEvents, filterByProfile, filterByCategory } from "@/lib/event-generator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profile = searchParams.get("profile") || "osint";
    const category = searchParams.get("category");

    // Generate events from scraper logic
    let events = await generateMockEvents();

    // Apply profile filter
    events = filterByProfile(events, profile);

    // Apply category filter if specified
    if (category) {
      events = filterByCategory(events, category);
    }

    return Response.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
