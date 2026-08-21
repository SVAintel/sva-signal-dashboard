// Rough capability/role summaries for the U.S. Navy/Marine Corps hull-type
// prefixes that show up in USNI's weekly Fleet and Marine Tracker (e.g. "USS
// Gonzalez (DDG-66)" → hull prefix "DDG"). Used to build a factual, rule-based
// "capabilities" rollup for a fleet-tracker group without depending on an AI
// call for basic, well-known ship-class facts.
export const SHIP_CLASS_INFO: Record<string, { className: string; role: string; capabilities: string }> = {
  CVN: {
    className: "Nimitz/Ford-class nuclear-powered aircraft carrier",
    role: "power projection / sea control flagship",
    capabilities:
      "Embarks a full carrier air wing (~60-70 F/A-18E/F Super Hornet and F-35C strike fighters plus E-2D airborne early warning, EA-18G electronic attack, and helicopters), giving it sustained long-range strike, air superiority, and ISR reach independent of local basing.",
  },
  DDG: {
    className: "Arleigh Burke-class Aegis guided-missile destroyer",
    role: "multi-mission air/missile defense and strike escort",
    capabilities:
      "Aegis combat system with SPY radar and 90-96 VLS cells firing SM-2/SM-6 (air and anti-ship defense) and Tomahawk land-attack cruise missiles; many hulls are also ballistic-missile-defense (BMD) capable, plus ASW torpedoes and a 5-inch gun.",
  },
  CG: {
    className: "Ticonderoga-class Aegis guided-missile cruiser",
    role: "strike group air-defense commander",
    capabilities:
      "Aegis air-defense command ship for a carrier/amphibious group, with 122 VLS cells for SM-2/SM-6 and Tomahawk, layered area air and missile defense, and command-and-control space for the group's air-defense commander.",
  },
  LHD: {
    className: "Wasp-class amphibious assault ship",
    role: "amphibious flagship / aviation strike platform",
    capabilities:
      "Full flight deck operating AV-8B/F-35B jets, MV-22 tiltrotors, and helicopters, plus a well deck for landing craft; embarks a Marine Expeditionary Unit (~2,000 Marines) with vehicles and equipment for amphibious assault or crisis response.",
  },
  LHA: {
    className: "America-class amphibious assault ship",
    role: "amphibious flagship / aviation strike platform",
    capabilities:
      "Enlarged aviation-focused flight deck and hangar for F-35B and MV-22 operations (early hulls omit a well deck), embarking a Marine Expeditionary Unit for sustained fixed-wing/rotary strike and assault support.",
  },
  LPD: {
    className: "San Antonio-class amphibious transport dock",
    role: "amphibious lift / troop and vehicle transport",
    capabilities:
      "Well deck and flight deck carrying Marines, armored vehicles, and landing craft/air-cushion (LCAC) for over-the-horizon amphibious assault, plus command-and-control facilities.",
  },
  LSD: {
    className: "Whidbey Island/Harpers Ferry-class dock landing ship",
    role: "amphibious lift support",
    capabilities:
      "Large well deck optimized for landing craft and air-cushion vehicles (LCACs), rounding out an Amphibious Ready Group's lift capacity for Marine vehicles and equipment alongside the LPD/LHD.",
  },
  LCS: {
    className: "Freedom/Independence-class littoral combat ship",
    role: "presence / partner engagement in contested littorals",
    capabilities:
      "Fast, shallow-draft, modular surface combatant reconfigurable for surface warfare, mine countermeasures, or anti-submarine missions; used heavily for forward presence, freedom-of-navigation activity, and partner-nation engagement.",
  },
  SSN: {
    className: "Los Angeles/Virginia-class nuclear-powered attack submarine",
    role: "undersea strike / intelligence, surveillance and reconnaissance",
    capabilities:
      "Torpedoes and vertical-launch Tomahawk land-attack missiles, covert ISR collection, and anti-submarine/anti-surface warfare — presence is rarely confirmed publicly for OPSEC reasons.",
  },
  FFG: {
    className: "Constellation-class guided-missile frigate",
    role: "multi-mission escort",
    capabilities:
      "Smaller, more affordable Aegis-derived combatant for air defense, ASW, and surface warfare escort duties, supplementing destroyers/cruisers in a strike group or independent deployment.",
  },
};

/**
 * Extracts the hull-type prefix (e.g. "DDG" from "DDG-80") from a ship string
 * like "USS Gonzalez (DDG-66)".
 */
export function extractHullPrefix(shipLabel: string): string | null {
  const match = shipLabel.match(/\(([A-Z]{1,4})-?\d{1,4}\)/);
  return match ? match[1] : null;
}

/**
 * Builds a plain-English capability rollup for a fleet-tracker group's ship
 * list — one short paragraph per distinct hull class present, so the reader
 * understands what each named ship can actually do without looking it up.
 */
export function summarizeShipCapabilities(ships: string[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const ship of ships) {
    const prefix = extractHullPrefix(ship);
    if (!prefix || seen.has(prefix)) continue;
    const info = SHIP_CLASS_INFO[prefix];
    if (!info) continue;
    seen.add(prefix);
    parts.push(`${info.className} (${info.role}): ${info.capabilities}`);
  }
  return parts.join(" ");
}
