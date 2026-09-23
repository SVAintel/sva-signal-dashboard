import { categoryMeta } from "./categories";

export interface MapSymbol {
  html: string;
  size: number;
  anchor: [number, number];
  color: string;
}

export type InfrastructureKind = "port" | "military" | "cable";
export type VesselKind = "military" | "tanker" | "sanctioned" | "fleet";

const TARGET_SIZE = 24;
const OUTLINE = "#e0ded0";

function safeColor(color: string | undefined, fallback: string): string {
  return color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
}

// Callers attach labels through DOM text/attributes, never through this SVG.
function symbol(color: string, artwork: string, selected = false): MapSymbol {
  return {
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${TARGET_SIZE}" height="${TARGET_SIZE}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="display:block;pointer-events:none;overflow:visible">${selected ? `<circle cx="12" cy="12" r="10" fill="none" stroke="${OUTLINE}" stroke-width="1.5"/>` : ""}${artwork}</svg>`,
    size: TARGET_SIZE,
    anchor: [TARGET_SIZE / 2, TARGET_SIZE / 2],
    color,
  };
}

/** A small report circle with a bounded, static selection ring. */
export function reportSymbol({
  category,
  color,
  selected = false,
}: {
  category: string;
  color?: string;
  selected?: boolean;
}): MapSymbol {
  const fill = safeColor(color, safeColor(categoryMeta[category]?.color, categoryMeta.general.color));
  return symbol(fill, `<circle cx="12" cy="12" r="${selected ? 6 : 4}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1"/>`, selected);
}

/** Fixed infrastructure: square ports, shield bases, and linked cable nodes. */
export function infrastructureSymbol({
  kind,
  major = false,
  selected = false,
}: {
  kind: InfrastructureKind;
  major?: boolean;
  selected?: boolean;
}): MapSymbol {
  const color = kind === "port"
    ? major ? "#1e3a8a" : "#93c5fd"
    : kind === "military"
      ? major ? "#1f3d1a" : "#6b7d3d"
      : "#22d3ee";
  const shape = kind === "port"
    ? `<rect x="6.5" y="6.5" width="11" height="11" rx="1" fill="${color}" stroke="${OUTLINE}" stroke-width="1.2"/><path d="M9 12h6M12 9v6" stroke="${OUTLINE}" stroke-width="1"/>`
    : kind === "military"
      ? `<path d="M6.5 6.5h11v7L12 18l-5.5-4.5z" fill="${color}" stroke="${OUTLINE}" stroke-width="1.2"/>`
      : `<path d="M7 12h10" stroke="${color}" stroke-width="2"/><rect x="4" y="9" width="6" height="6" fill="${color}" stroke="${OUTLINE}"/><rect x="14" y="9" width="6" height="6" fill="${color}" stroke="${OUTLINE}"/>`;
  return symbol(color, major ? shape : `<g transform="translate(12 12) scale(.82) translate(-12 -12)">${shape}</g>`, selected);
}

/** AIS course is clockwise from north; 360 denotes an unavailable heading. */
export function vesselSymbol({
  kind,
  course,
  selected = false,
}: {
  kind: VesselKind;
  course?: number | null;
  selected?: boolean;
}): MapSymbol {
  const color = kind === "tanker" ? "#eab308" : kind === "sanctioned" ? "#dc2626" : kind === "fleet" ? "#38bdf8" : "#7dd3fc";
  const heading = typeof course === "number" && Number.isFinite(course) && course >= 0 && course < 360 ? course : null;
  const shape = heading !== null
    ? `<path d="M12 4.5l5 14-5-3-5 3z" transform="rotate(${heading} 12 12)" fill="${color}" stroke="${OUTLINE}" stroke-width="1" stroke-linejoin="round"/>`
    : kind === "fleet"
      ? `<path d="M12 5l7 7-7 7-7-7z" fill="${color}" stroke="${OUTLINE}" stroke-width="1.2"/>`
      : `<rect x="7" y="7" width="10" height="10" rx="1" fill="${color}" stroke="${OUTLINE}" stroke-width="1.2"/>`;
  return symbol(color, shape, selected);
}

/** Fire radiative power retains the existing bounded square-root size scale. */
export function fireSymbol({ magnitude }: { magnitude: number }): MapSymbol {
  const power = Number.isFinite(magnitude) ? Math.max(0, magnitude) : 0;
  const size = Math.min(18, Math.max(6, 6 + Math.sqrt(power) / 4));
  const color = power > 200 ? "#f97316" : "#fca5a5";
  const scale = size / 18;
  return symbol(color, `<g transform="translate(12 12) scale(${scale}) translate(-12 -12)"><path d="M13 3c1 5-4 6-3 10-2-1-3-3-3-5-4 5-3 13 5 13 7 0 10-7 6-12 0 3-2 3-2 3 1-4-1-7-3-9z" fill="${color}" stroke="#b91c1c" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 13c-4 4-2 6 0 6 3 0 4-3 2-5 0 2-1 2-1 2z" fill="#facc15"/></g>`);
}

export function stormSymbol({ classification }: { classification: string }): MapSymbol {
  const color = classification === "HU" ? "#ef4444" : classification === "TS" ? "#f97316" : "#facc15";
  return symbol(color, `<g fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M9 12C4 10 6 4 13 4M15 12c5 2 3 8-4 8M12 9c2-5 8-3 8 4M12 15c-2 5-8 3-8-4"/></g>`);
}
