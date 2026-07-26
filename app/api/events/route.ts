import { generateMockEvents, filterByProfile, filterByCategory } from "@/lib/event-generator";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profile = searchParams.get("profile") || "osint";
    const category = searchParams.get("category");

    // Fetch events from real APIs
    let events = await generateMockEvents();

    // Apply profile filtering
    if (profile && profile !== "all") {
      events = filterByProfile(events, profile);
    }

    // Apply category filtering
    if (category) {
      events = filterByCategory(events, category);
    }

    return Response.json(events);
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
