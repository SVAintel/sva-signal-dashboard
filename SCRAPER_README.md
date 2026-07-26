# SVA Signal Dashboard — Daily Scraper

Daily automated scraper that collects global events, categorizes them, enriches with AI analyst notes, and exposes via API.

## Architecture

```
scrapers/
  ├── newsapi_scraper.py     # Geopolitical/military events
  ├── market_scraper.py      # Financial market events
  └── geo_scraper.py         # Natural disaster/weather events

services/
  ├── categorizer.py         # Classify events by type
  ├── enricher.py            # Generate AI analyst notes
  └── filter.py              # Profile-based visibility

api/
  └── server.py              # Flask API endpoint

data/
  ├── mock_events/           # Daily snapshots (YYYY-MM-DD.json)
  └── events.json            # Latest 100 events for dashboard

scraper.py                    # Main orchestration script
```

## Event Format

Each event is structured as:

```json
{
  "id": "news-001",
  "source": "NewsAPI",
  "timestamp": "2026-07-26T10:30:00Z",
  "title": "Military movements detected near border",
  "description": "Reports of unconfirmed military activity",
  "location": {"lat": 50.08, "lng": 14.44},
  "category": "war",
  "profiles": ["osint", "military"],
  "enrichment": {
    "known_knowns": ["Established military deployment pattern"],
    "known_unknowns": ["Intent of force deployment unclear", "Casualty estimates highly uncertain"],
    "unknown_unknowns": ["Unexpected alliance shifts"],
    "confidence": "high"
  }
}
```

## Event Categories

- **war**: Military movements, conflicts, strategic alliances
- **counter_terrorism**: Terrorist attacks, extremist activities, security incidents
- **natural_disaster**: Earthquakes, hurricanes, floods, climate events
- **market**: Stock volatility, policy announcements, economic signals

## User Profiles

- **osint**: OSINT Analysts (sees war + counter_terrorism)
- **finance**: Finance professionals (sees market data)
- **military**: Military intelligence (sees war + counter_terrorism)
- **All profiles** see natural disasters

## Setup

### Prerequisites

- Python 3.8+
- Flask (for API server)

### Installation

```bash
pip install flask
```

### Running the Scraper

```bash
python scraper.py
```

This will:
1. Fetch mock events from all scrapers
2. Categorize events
3. Enrich with analyst notes
4. Filter by user profile
5. Save daily snapshot to `data/mock_events/YYYY-MM-DD.json`
6. Update `data/events.json` with latest 100 events

### Running the API Server

```bash
python api/server.py
```

Server listens on `http://localhost:5000`

### API Endpoints

**GET /api/events**

Query parameters:
- `profile`: `osint | finance | military` (optional)
- `category`: `war | counter_terrorism | natural_disaster | market` (optional)
- `limit`: max results (default 100)

Example:
```bash
# Get all war events visible to OSINT analysts
curl "http://localhost:5000/api/events?profile=osint&category=war"

# Get all market events for finance professionals
curl "http://localhost:5000/api/events?profile=finance"
```

**GET /api/health**

Health check endpoint.

## Data Flow

1. **Scraper** runs daily (via cron or scheduled task)
2. Fetches from NewsAPI, Market APIs, Geo/Disaster feeds
3. Categorizes each event
4. Enriches with AI analyst notes
5. Filters by user profile
6. Saves to `data/events.json`
7. **Dashboard** fetches latest events from `/api/events`
8. **Frontend** displays with world map + event list by profile

## Future Enhancements

- Replace mock scrapers with real APIs (NewsAPI, Alpha Vantage, USGS)
- Upgrade file storage to PostgreSQL/MongoDB
- Replace hardcoded enrichment with real LLM calls (OpenAI, Anthropic)
- Add real-time WebSocket updates instead of 1-minute polling
- Implement event deduplication across sources
- Add historical event search and filtering
- Deploy scraper to cloud (AWS Lambda, Google Cloud Functions)
