// Shared shape for a single USNI Fleet Tracker group, used by the scraper
// route, the historical persistence layer (lib/db.ts), and the frontend
// detail panel. Pulled out to its own file (rather than defined inline in the
// route) purely to avoid a route.ts <-> lib/db.ts circular import.
export interface FleetGroup {
  id: string;
  region: string;
  lat: number;
  lng: number;
  groupName: string | null;
  ships: string[];
  summary: string;
  capabilities: string;
  missionSet: string;
  outlook: string;
}
