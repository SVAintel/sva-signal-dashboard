"""Mock geo/disaster data scraper."""

import random
from datetime import datetime, timedelta


class GeoScraper:
    """Fetches and normalizes geo/disaster events from mock data."""
    
    def __init__(self):
        self.mock_events = [
            {
                "title": "Significant seismic activity recorded",
                "description": "Magnitude 6.2 earthquake detected in Pacific Ring of Fire",
                "location": {"lat": 37.3382, "lng": 141.0361},  # Japan
            },
            {
                "title": "Hurricane system developing",
                "description": "Tropical storm expected to intensify into hurricane",
                "location": {"lat": 20.0, "lng": -75.0},  # Caribbean
            },
            {
                "title": "Flooding reported in multiple regions",
                "description": "Heavy rainfall triggers flooding and mudslides",
                "location": {"lat": -23.55, "lng": -46.63},  # São Paulo
            },
        ]
    
    def fetch(self):
        """Fetch mock geo events."""
        events = []
        for i, event_data in enumerate(self.mock_events):
            event_id = f"geo-{i+1:03d}"
            timestamp = datetime.utcnow() - timedelta(hours=random.randint(0, 6))
            
            events.append({
                "id": event_id,
                "source": "USGS/NOAA",
                "timestamp": timestamp.isoformat() + "Z",
                "title": event_data["title"],
                "description": event_data["description"],
                "location": event_data["location"],
                "category": None,
                "profiles": [],
                "enrichment": {},
            })
        
        return events
