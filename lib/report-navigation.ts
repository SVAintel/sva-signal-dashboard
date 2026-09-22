import type { Event } from "./types";
import { resolveReport, type Relation } from "./report-context";

export type ReportView = "brief" | "sources" | "related" | "source" | "analysis" | "incident";
export const reportViewLabels: Record<ReportView, string> = {
  brief: "Report brief", sources: "Sources & evidence", related: "Related reporting",
  source: "Source reporting", analysis: "Analysis & questions",
  incident: "Incident chronology",
};
export interface ReportPosition { scrollTop: number; focusId: string | null; }
export interface ReportLocation extends ReportPosition {
  key: number;
  snapshot: Event;
  view: ReportView;
  relation: Relation;
}
export interface ReportNavigation { entries: ReportLocation[]; nextKey: number; }
export const initialReportNavigation: ReportNavigation = { entries: [], nextKey: 1 };
export type ReportNavigationAction =
  | { type: "open"; event: Event }
  | { type: "close" }
  | { type: "push"; event: Event; view: ReportView; position: ReportPosition }
  | { type: "back" }
  | { type: "jump"; key: number }
  | { type: "refresh"; events: readonly Event[] }
  | { type: "relation"; relation: Relation };

export function reportNavigationReducer(state: ReportNavigation, action: ReportNavigationAction): ReportNavigation {
  const entry = (event: Event, view: ReportView): ReportLocation => ({
    key: state.nextKey, snapshot: event, view, relation: "all", scrollTop: 0, focusId: null,
  });
  switch (action.type) {
    case "open": return { entries: [entry(action.event, "brief")], nextKey: state.nextKey + 1 };
    case "close": return { ...state, entries: [] };
    case "push": {
      if (!state.entries.length) return { entries: [entry(action.event, "brief")], nextKey: state.nextKey + 1 };
      const entries = state.entries.map((location, index) => index === state.entries.length - 1
        ? { ...location, ...action.position } : location);
      return { entries: [...entries, entry(action.event, action.view)], nextKey: state.nextKey + 1 };
    }
    case "back": return { ...state, entries: state.entries.slice(0, -1) };
    case "jump": {
      const index = state.entries.findIndex((location) => location.key === action.key);
      return index < 0 ? state : { ...state, entries: state.entries.slice(0, index + 1) };
    }
    case "relation": return { ...state, entries: state.entries.map((location, index) => index === state.entries.length - 1
      ? { ...location, relation: action.relation } : location) };
    case "refresh": return { ...state, entries: state.entries.map((location) => ({
      ...location, snapshot: resolveReport(location.snapshot, action.events).event,
    })) };
  }
}
