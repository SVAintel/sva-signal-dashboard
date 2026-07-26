"""Mock market data scraper."""

import random
from datetime import datetime, timedelta


class MarketScraper:
    """Fetches and normalizes market data events from mock data."""
    
    def __init__(self):
        self.mock_events = [
            {
                "title": "Unusual trading volume in Asian markets",
                "description": "Spike in volatility detected on Tokyo and Hong Kong exchanges",
                "location": {"lat": 35.6762, "lng": 139.6503},  # Tokyo
            },
            {
                "title": "Central Bank signals rate changes",
                "description": "Unexpected policy announcement affecting global markets",
                "location": {"lat": 52.52, "lng": 13.40},  # Berlin (ECB area)
            },
            {
                "title": "Tech sector sell-off continues",
                "description": "Major stock indices decline amid economic concerns",
                "location": {"lat": 37.7749, "lng": -122.4194},  # San Francisco
            },
        ]
    
    def fetch(self):
        """Fetch mock market events."""
        events = []
        for i, event_data in enumerate(self.mock_events):
            event_id = f"market-{i+1:03d}"
            timestamp = datetime.utcnow() - timedelta(hours=random.randint(0, 4))
            
            events.append({
                "id": event_id,
                "source": "Bloomberg/AlphaVantage",
                "timestamp": timestamp.isoformat() + "Z",
                "title": event_data["title"],
                "description": event_data["description"],
                "location": event_data["location"],
                "category": None,
                "profiles": [],
                "enrichment": {},
            })
        
        return events
