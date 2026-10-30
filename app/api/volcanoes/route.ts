import { NextResponse } from "next/server";

// Smithsonian Institution Global Volcanism Program: a free, no-API-key WFS
// GeoServer covering every Holocene-epoch volcano (1,200+) with per-volcano
// eruption history. The full inventory includes long-dormant volcanoes with
// only ancient evidence, so this route filters server-side (CQL_FILTER) to
// volcanoes with eruptive activity in the last two calendar years — a
// "currently/recently active" view rather than the full historical catalog.
const GVP_BASE_URL = "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/ows";

// Eruption records update as new activity is confirmed, but not minute to
// minute; an hour is plenty fresh for this.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface Volcano {
  id: number;
  name: string;
  type: string | null;
  country: string | null;
  region: string | null;
  lat: number;
  lng: number;
  elevation: number | null;
  lastEruptionYear: number | null;
  summary: string | null;
}

export async function GET() {
  try {
    const currentYear = new Date().getUTCFullYear();
    const cutoff = currentYear - 1;
    const params = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName: "GVP-VOTW:Smithsonian_VOTW_Holocene_Volcanoes",
      outputFormat: "application/json",
      CQL_FILTER: `Last_Eruption_Year>=${cutoff}`,
      maxFeatures: "500",
    });
    const res = await fetch(`${GVP_BASE_URL}?${params.toString()}`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ volcanoes: [], note: `GVP fetch failed: ${res.status}` });
    }
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    const volcanoes: Volcano[] = features
      .map((feature: any): Volcano | null => {
        const props = feature?.properties;
        const lat = Number(props?.Latitude);
        const lng = Number(props?.Longitude);
        if (!props || isNaN(lat) || isNaN(lng)) return null;
        const summary = typeof props.Geological_Summary === "string" ? props.Geological_Summary : null;
        return {
          id: Number(props.Volcano_Number) || 0,
          name: String(props.Volcano_Name || "Unknown volcano"),
          type: props.Primary_Volcano_Type || null,
          country: props.Country || null,
          region: props.Region || null,
          lat,
          lng,
          elevation: typeof props.Elevation === "number" ? props.Elevation : null,
          lastEruptionYear: typeof props.Last_Eruption_Year === "number" ? props.Last_Eruption_Year : null,
          summary: summary ? (summary.length > 320 ? `${summary.slice(0, 320).trimEnd()}…` : summary) : null,
        };
      })
      .filter((v: Volcano | null): v is Volcano => v !== null);

    return NextResponse.json({ volcanoes });
  } catch (error) {
    console.error("volcanoes error:", error);
    return NextResponse.json({ volcanoes: [] });
  }
}
