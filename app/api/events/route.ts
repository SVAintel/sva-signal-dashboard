import { generateMockEvents } from "@/lib/event-generator";

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
