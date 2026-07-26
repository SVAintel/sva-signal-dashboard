#!/usr/bin/env python3
"""
SVA Signal Dashboard — Daily Event Scraper

Orchestrates fetching, categorizing, enriching, and filtering global events
for real-time intelligence dashboard.
"""

import json
import os
from datetime import datetime
from pathlib import Path

from scrapers.newsapi_scraper import NewsAPIScraper
from scrapers.market_scraper import MarketScraper
from scrapers.geo_scraper import GeoScraper
from services.categorizer import Categorizer
from services.enricher import Enricher
from services.filter import ProfileFilter


def ensure_data_dir():
    """Create data directories if they don't exist."""
    Path("data/mock_events").mkdir(parents=True, exist_ok=True)


def run_daily_scrape():
    """Execute full scraping and processing pipeline."""
    print("🔄 SVA Signal Dashboard — Daily Scraper Started")
    
    ensure_data_dir()
    
    # Initialize scrapers
    news = NewsAPIScraper()
    market = MarketScraper()
    geo = GeoScraper()
    
    # Fetch raw events
    print("📰 Fetching news events...")
    news_events = news.fetch()
    
    print("💹 Fetching market data...")
    market_events = market.fetch()
    
    print("🌍 Fetching geo/disaster data...")
    geo_events = geo.fetch()
    
    # Combine all events
    all_events = news_events + market_events + geo_events
    print(f"📊 Total events collected: {len(all_events)}")
    
    # Categorize
    categorizer = Categorizer()
    for event in all_events:
        event["category"] = categorizer.categorize(event)
    
    # Enrich with AI analyst notes
    enricher = Enricher()
    for event in all_events:
        event["enrichment"] = enricher.enrich(event)
    
    # Apply profile filters and determine visibility
    profile_filter = ProfileFilter()
    for event in all_events:
        event["profiles"] = profile_filter.get_visible_profiles(event)
    
    # Save daily snapshot
    today = datetime.utcnow().strftime("%Y-%m-%d")
    daily_file = f"data/mock_events/{today}.json"
    
    with open(daily_file, "w") as f:
        json.dump(all_events, f, indent=2)
    print(f"✅ Saved daily snapshot: {daily_file}")
    
    # Update latest events (keep last 100 across all time for dashboard)
    _update_latest_events(all_events)
    
    print("✅ Scraper pipeline complete!")
    return all_events


def _update_latest_events(new_events):
    """Update data/events.json with latest events."""
    try:
        with open("data/events.json", "r") as f:
            existing = json.load(f)
    except FileNotFoundError:
        existing = []
    
    # Combine and sort by timestamp (newest first), keep top 100
    combined = new_events + existing
    combined_sorted = sorted(
        combined, 
        key=lambda e: e.get("timestamp", ""), 
        reverse=True
    )[:100]
    
    with open("data/events.json", "w") as f:
        json.dump(combined_sorted, f, indent=2)
    print(f"✅ Updated latest events: data/events.json ({len(combined_sorted)} total)")


if __name__ == "__main__":
    run_daily_scrape()
