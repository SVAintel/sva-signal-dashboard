// Approximate centroid coordinates for the named seas/regions/ports that
// USNI News' weekly "Fleet and Marine Tracker" article uses to describe
// carrier strike group / amphibious ready group locations (e.g. "In the
// Arabian Sea", "In Sasebo, Japan"). USNI deliberately reports only a named
// region — never precise coordinates — for operational-security reasons, so
// these are broad regional centroids, not real-time ship positions.
//
// Keys are lowercase, matched via substring against the (lowercased,
// "In "-stripped) section heading from the article. Longer/more specific
// keys are checked first so e.g. "central caribbean sea" wins over "caribbean".
export const FLEET_REGION_COORDS: Record<string, [number, number]> = {
  // Named seas / oceans
  "south china sea": [12, 114],
  "east china sea": [28, 125],
  "sea of japan": [40, 135],
  "philippine sea": [18, 135],
  "coral sea": [-16, 152],
  "timor sea": [-11, 128],
  "arabian sea": [15, 65],
  "red sea": [20, 38],
  "black sea": [43, 34],
  "baltic sea": [58, 19],
  "adriatic sea": [42, 16],
  "aegean sea": [38, 25],
  "mediterranean sea": [35, 18],
  "north sea": [56, 3],
  "english channel": [50, 0],
  "persian gulf": [26, 52],
  "arabian gulf": [26, 52],
  "gulf of oman": [24.5, 58.5],
  "gulf of aden": [12, 47],
  "gulf of mexico": [25, -90],
  "bab-el-mandeb": [12.6, 43.3],
  "strait of hormuz": [26.6, 56.3],
  "indian ocean": [-10, 75],
  "atlantic ocean": [20, -40],
  "north atlantic": [45, -30],
  "western atlantic": [32, -65],
  "eastern atlantic": [30, -25],
  "atlantic": [25, -45],
  "central caribbean sea": [15, -75],
  "eastern caribbean sea": [15, -63],
  "western caribbean sea": [17, -83],
  "caribbean sea": [15, -75],
  "caribbean": [15, -75],
  "eastern pacific": [10, -100],
  "western pacific": [15, 145],
  "central pacific": [10, -160],

  // Frequently mentioned ports / homeports / operating areas
  "sasebo, japan": [33.16, 129.72],
  "sasebo": [33.16, 129.72],
  "yokosuka, japan": [35.29, 139.67],
  "yokosuka": [35.29, 139.67],
  "singapore": [1.29, 103.85],
  "guam": [13.44, 144.79],
  "manama, bahrain": [26.24, 50.6],
  "bahrain": [26.24, 50.6],
  "rota, spain": [36.62, -6.35],
  "rota": [36.62, -6.35],
  "norfolk, va": [36.85, -76.3],
  "norfolk": [36.85, -76.3],
  "san diego, calif": [32.72, -117.17],
  "san diego": [32.72, -117.17],
  "mayport, fla": [30.4, -81.42],
  "mayport": [30.4, -81.42],
  "pearl harbor, hawaii": [21.35, -157.97],
  "pearl harbor": [21.35, -157.97],
  "djibouti": [11.6, 43.15],
  "souda bay, greece": [35.48, 24.13],
  "souda bay": [35.48, 24.13],
  "naples, italy": [40.85, 14.27],
  "naples": [40.85, 14.27],
};

// Ordered longest-key-first so more specific phrases (e.g. "central
// caribbean sea") are tried before shorter ones (e.g. "caribbean").
const SORTED_KEYS = Object.keys(FLEET_REGION_COORDS).sort((a, b) => b.length - a.length);

/**
 * Matches a free-text region heading (already stripped of a leading "In "/
 * "In the ") against the known region dictionary via case-insensitive
 * substring search. Returns null if no known region is mentioned anywhere
 * in the heading.
 */
export function lookupFleetRegionCoords(heading: string): [number, number] | null {
  const normalized = heading.toLowerCase().trim();
  for (const key of SORTED_KEYS) {
    if (normalized.includes(key)) {
      return FLEET_REGION_COORDS[key];
    }
  }
  return null;
}

// Keyword sets used to pull relevant live dashboard events for a given fleet
// region — broader/thematic than a literal name match, since the region a
// carrier/ARG operates in often correlates with a different but related
// flashpoint (e.g. "Red Sea" ↔ Houthi/Yemen shipping-attack coverage,
// "Arabian Sea" ↔ Iran, "South China Sea" ↔ China/Taiwan/Philippines).
export const FLEET_REGION_EVENT_KEYWORDS: Record<string, string[]> = {
  "South China Sea": ["south china sea", "china", "taiwan", "philippines", "spratly", "scarborough"],
  "East China Sea": ["east china sea", "china", "japan", "senkaku", "diaoyu"],
  Singapore: ["singapore", "malacca", "south china sea"],
  "Sasebo, Japan": ["japan", "china", "korea", "senkaku"],
  "Eastern Pacific": ["mexico", "central america", "pacific", "cartel", "drug"],
  Caribbean: ["venezuela", "caribbean", "cartel", "drug", "colombia", "haiti"],
  "Mediterranean Sea": ["syria", "israel", "lebanon", "turkey", "libya", "mediterranean"],
  "Red Sea": ["houthi", "yemen", "red sea", "bab-el-mandeb", "shipping attack"],
  "Arabian Sea": ["iran", "arabian sea", "gulf", "strait of hormuz", "pakistan"],
  "Indian Ocean": ["india", "pakistan", "indian ocean", "china", "somalia", "piracy"],
  "San Diego": ["pacific", "china", "north korea"],
  "Western Atlantic": ["atlantic", "russia", "venezuela"],
  "Persian Gulf": ["iran", "gulf", "strait of hormuz", "iraq"],
  "Black Sea": ["russia", "ukraine", "black sea", "crimea"],
};

/**
 * Finds the closest known region-keyword entry for a free-text region label
 * (e.g. matches "Central Caribbean Sea" to the "Caribbean" keyword set).
 */
export function lookupFleetRegionEventKeywords(region: string): string[] {
  const normalized = region.toLowerCase();
  for (const [key, keywords] of Object.entries(FLEET_REGION_EVENT_KEYWORDS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return keywords;
    }
  }
  return [];
}
