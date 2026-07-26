export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profile = searchParams.get("profile") || "all";
    const category = searchParams.get("category");

    // TODO: Replace with actual data from scraper storage
    // For now, return mock events
    const mockEvents = [
      {
        id: "1",
        title: "Military Activity - Eastern Europe",
        category: "war",
        location: { lat: 50.08, lng: 14.44 },
        source: "Reuters",
        timestamp: new Date().toISOString(),
        description: "Reported military movements",
        profiles: ["osint", "military"],
        aiNotes: "Known activity pattern detected.",
        confidence: "high",
      },
      {
        id: "2",
        title: "Market Volatility - Asian Markets",
        category: "market",
        location: { lat: 35.6762, lng: 139.6503 },
        source: "Bloomberg",
        timestamp: new Date().toISOString(),
        description: "Unusual trading volume",
        profiles: ["finance"],
        aiNotes: "Known market driver - Fed policy shift.",
        confidence: "medium",
      },
      {
        id: "3",
        title: "Seismic Event - Pacific Ring",
        category: "natural_disaster",
        location: { lat: 37.3382, lng: 141.0361 },
        source: "USGS",
        timestamp: new Date().toISOString(),
        description: "Magnitude 6.2 earthquake detected",
        profiles: ["all"],
        aiNotes: "Unknown unknowns - potential secondary effects.",
        confidence: "confirmed",
      },
    ];

    let filtered = mockEvents;

    if (profile !== "all") {
      filtered = filtered.filter((event) =>
        event.profiles.includes(profile)
      );
    }

    if (category) {
      filtered = filtered.filter((event) => event.category === category);
    }

    return Response.json(filtered);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
