import { generateMockEvents } from "@/lib/event-generator";

// Force this route to run fresh on every request instead of being
// statically pre-rendered at build time — signals must be live per pull.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
