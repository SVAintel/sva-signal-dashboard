export interface Event {
  id: string;
  title: string;
  category: string;
  location: { lat: number; lng: number };
  source: string;
  url?: string;
  timestamp: string;
  description: string;
  aiNotes: string;
  confidence: string;
}
