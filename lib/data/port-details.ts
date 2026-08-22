// Curated detail data for a hand-picked subset of major, strategically
// significant world ports. The live World Port Index (WPI) feed used by
// /api/map-layers only carries name/country/lat/lng/harbor-size — no
// throughput, cargo, or chokepoint metadata — so richer context for a
// well-known subset is layered on here using general public/unclassified
// information. Figures are approximate.
//
// Keyed by the exact, uppercase PORT_NAME string as it appears in the WPI
// GeoJSON feed (e.g. "KEPPEL - (EAST SINGAPORE)", "MINA JABAL ALI"), so the
// enrichment can be attached server-side in app/api/map-layers/route.ts by
// exact-matching the raw feed name. A friendlier `displayName` is shown in
// the UI instead of the raw WPI facility name.
export interface PortDetail {
  displayName: string;
  chokepoint: string | null;
  primaryCargo: string[];
  annualThroughput: string;
  strategicNotes: string;
}

export const PORT_DETAILS: Record<string, PortDetail> = {
  ROTTERDAM: {
    displayName: "Rotterdam",
    chokepoint: null,
    primaryCargo: ["Containers", "Crude oil", "Refined products", "Bulk chemicals"],
    annualThroughput: "~14.5M TEU; ~440M tonnes total cargo/year",
    strategicNotes:
      "Europe's largest port and its primary energy/refining hub on the North Sea, gateway for Rhine barge traffic deep into Germany and Central Europe.",
  },
  ANTWERPEN: {
    displayName: "Antwerp",
    chokepoint: null,
    primaryCargo: ["Containers", "Chemicals", "Vehicles", "Break-bulk"],
    annualThroughput: "~13M TEU/year",
    strategicNotes: "Second-largest European port and the world's largest integrated chemical cluster by tonnage.",
  },
  HAMBURG: {
    displayName: "Hamburg",
    chokepoint: null,
    primaryCargo: ["Containers", "Bulk cargo"],
    annualThroughput: "~8M TEU/year",
    strategicNotes: "Germany's largest port, a key hub for Baltic and Central/Eastern European trade via the Elbe.",
  },
  SHANGHAI: {
    displayName: "Shanghai",
    chokepoint: null,
    primaryCargo: ["Containers", "Bulk cargo", "Automobiles"],
    annualThroughput: "~47M TEU/year — busiest container port in the world",
    strategicNotes: "World's busiest container port, anchoring China's export economy along the Yangtze River delta.",
  },
  "QINGDAO GANG": {
    displayName: "Qingdao",
    chokepoint: null,
    primaryCargo: ["Containers", "Iron ore", "Crude oil"],
    annualThroughput: "~28M TEU/year",
    strategicNotes: "Major North China container and bulk hub, a key crude-oil import terminal for Chinese refiners.",
  },
  "TIANJIN XIN GANG": {
    displayName: "Tianjin",
    chokepoint: null,
    primaryCargo: ["Containers", "Bulk cargo"],
    annualThroughput: "~21M TEU/year",
    strategicNotes: "Principal seaport serving Beijing and northern China's industrial belt.",
  },
  "KEPPEL - (EAST SINGAPORE)": {
    displayName: "Singapore (Keppel Terminal)",
    chokepoint: "Strait of Malacca",
    primaryCargo: ["Containers", "Transshipment cargo", "Bunker fuel"],
    annualThroughput: "~37M TEU/year (Port of Singapore, all terminals)",
    strategicNotes:
      "One of the world's busiest transshipment hubs and bunkering ports, sitting directly on the Strait of Malacca chokepoint through which roughly a quarter of global seaborne trade passes.",
  },
  "MINA JABAL ALI": {
    displayName: "Jebel Ali (Dubai)",
    chokepoint: "Strait of Hormuz",
    primaryCargo: ["Containers", "Re-export cargo", "Crude/refined products"],
    annualThroughput: "~13M TEU/year — largest man-made harbor in the world",
    strategicNotes:
      "The Middle East's busiest container port and a critical logistics/re-export hub for the Gulf region; its access route runs past the Strait of Hormuz chokepoint.",
  },
  PUSAN: {
    displayName: "Busan",
    chokepoint: "Korea Strait",
    primaryCargo: ["Containers", "Automobiles"],
    annualThroughput: "~23M TEU/year",
    strategicNotes: "South Korea's largest port and a major East Asian transshipment hub.",
  },
  "LOS ANGELES": {
    displayName: "Los Angeles",
    chokepoint: null,
    primaryCargo: ["Containers", "Consumer goods"],
    annualThroughput: "~9.5M TEU/year — busiest US container port",
    strategicNotes: "Together with adjacent Long Beach, handles roughly a third of all US containerized imports.",
  },
  HOUSTON: {
    displayName: "Houston",
    chokepoint: null,
    primaryCargo: ["Crude oil", "Refined petroleum products", "Petrochemicals"],
    annualThroughput: "~285M tonnes/year — largest US port by foreign waterborne tonnage",
    strategicNotes: "The hub of the US Gulf Coast refining/petrochemical complex and a top US crude export terminal.",
  },
  "NEW YORK CITY": {
    displayName: "Port of New York/New Jersey",
    chokepoint: null,
    primaryCargo: ["Containers", "Automobiles", "Break-bulk"],
    annualThroughput: "~8.5M TEU/year — largest port on the US East Coast",
    strategicNotes: "Primary container gateway for the US Northeast/Mid-Atlantic population centers.",
  },
  "AS SUWAYS": {
    displayName: "Suez",
    chokepoint: "Suez Canal",
    primaryCargo: ["Transiting containers, tankers, and bulk carriers"],
    annualThroughput: "Suez Canal: ~24,000 vessel transits/year, ~12% of global trade volume",
    strategicNotes:
      "Southern anchor of the Suez Canal, the shortest sea link between Europe/the Mediterranean and Asia/the Indian Ocean; closures or Red Sea threats here force costly re-routing around the Cape of Good Hope.",
  },
  "BUR SAID (PORT SAID)": {
    displayName: "Port Said",
    chokepoint: "Suez Canal",
    primaryCargo: ["Transshipment containers"],
    annualThroughput: "Northern Suez Canal gateway port",
    strategicNotes: "Northern (Mediterranean-side) anchor of the Suez Canal and a regional transshipment hub.",
  },
  PIRAIEVS: {
    displayName: "Piraeus",
    chokepoint: null,
    primaryCargo: ["Containers", "Passenger/ferry traffic"],
    annualThroughput: "~5.4M TEU/year",
    strategicNotes: "Greece's largest port and a Chinese-invested (COSCO) gateway into Southeastern Europe.",
  },
  "PORT KLANG": {
    displayName: "Port Klang",
    chokepoint: "Strait of Malacca",
    primaryCargo: ["Containers", "Palm oil", "Transshipment cargo"],
    annualThroughput: "~13.5M TEU/year",
    strategicNotes: "Malaysia's busiest port, sitting on the opposite shore of the Strait of Malacca from Singapore.",
  },
  "MUMBAI (BOMBAY)": {
    displayName: "Mumbai",
    chokepoint: null,
    primaryCargo: ["Containers", "Crude oil", "Bulk cargo"],
    annualThroughput: "Major Indian west-coast container and crude-import gateway",
    strategicNotes: "India's principal west-coast port complex, a key node for Arabian Sea/Gulf-origin energy imports.",
  },
  VLADIVOSTOK: {
    displayName: "Vladivostok",
    chokepoint: null,
    primaryCargo: ["Containers", "Fish/seafood", "Coal"],
    annualThroughput: "Russia's principal Pacific-coast commercial and naval port",
    strategicNotes: "Home port of Russia's Pacific Fleet as well as a commercial gateway to Northeast Asia.",
  },
  ISTANBUL: {
    displayName: "Istanbul",
    chokepoint: "Bosphorus Strait",
    primaryCargo: ["Containers", "Tanker traffic transiting the Bosphorus"],
    annualThroughput: "Bosphorus: ~40,000+ vessel transits/year",
    strategicNotes:
      "Sits on the Bosphorus Strait, the sole sea route between the Black Sea and the Mediterranean — a critical chokepoint for Russian and Ukrainian grain/energy exports.",
  },
};
