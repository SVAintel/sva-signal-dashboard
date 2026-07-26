"""Mock NewsAPI scraper that returns normalized events."""

import random
from datetime import datetime, timedelta


class NewsAPIScraper:
    """Fetches and normalizes news events from mock data."""
    
    def __init__(self):
        self.mock_headlines = [
            {
                "title": "Military movements detected near border",
                "description": "Reports of unconfirmed military activity",
                "location": {"lat": 50.08, "lng": 14.44},
                "category_hint": "war",
            },
            {
                "title": "Terrorist organization claims responsibility",
                "description": "Alleged attack linked to known extremist group",
                "location": {"lat": 48.86, "lng": 2.35},
                "category_hint": "counter_terrorism",
            },
            {
                "title": "Strategic alliance strengthens defenses",
                "description": "New military cooperation agreement announced",
                "location": {"lat": 51.51, "lng": -0.13},
                "category_hint": "war",
            },
        ]
    
    def fetch(self):
        """Fetch mock news events."""
        events = []
        for i, headline in enumerate(self.mock_headlines):
            event_id = f"news-{i+1:03d}"
            timestamp = datetime.utcnow() - timedelta(hours=random.randint(1, 12))
            
            events.append({
                "id": event_id,
                "source": "NewsAPI",
                "timestamp": timestamp.isoformat() + "Z",
                "title": headline["title"],
                "description": headline["description"],
                "location": headline["location"],
                "category": None,
                "profiles": [],
                "enrichment": {},
            })
        
        return events
