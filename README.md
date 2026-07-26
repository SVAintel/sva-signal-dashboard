# SVA Signal Dashboard

Real-time global intelligence dashboard with AI analyst insights.

## Features

- **World Map**: Interactive map showing real-time events by location
- **Event Categorization**: War, Counter-Terrorism, Natural Disasters, Market Data
- **User Profiles**: OSINT Analyst, Finance, Military Intelligence
- **AI Analyst Notes**: Structured intelligence (Known-Knowns, Known-Unknowns, Unknown-Unknowns)
- **Real-time Updates**: Refreshes every minute from the scraper API

## Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + React-Leaflet
- **State Management**: Zustand
- **API Client**: Axios
- **Deployment**: Vercel (Hobby Plan)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
SCRAPER_API_URL=https://your-scraper-api.com
```

## Project Structure

```
app/
  ├── page.tsx           # Main entry point
  ├── layout.tsx         # Root layout
  ├── globals.css        # Global styles
  └── api/
      └── events/route.ts  # Events API (TODO: connect to scraper)
components/
  ├── Dashboard.tsx      # Main dashboard component
  ├── WorldMap.tsx       # Interactive map
  ├── EventList.tsx      # Event sidebar
  └── ProfileSelector.tsx # User profile selection
store/
  └── useStore.ts        # Zustand state management
```

## API Endpoints

### GET /api/events

Query parameters:
- `profile`: osint | finance | military (optional)
- `category`: war | counter_terrorism | natural_disaster | market (optional)

Returns:
```json
[
  {
    "id": "1",
    "title": "Event Title",
    "category": "war",
    "location": { "lat": 0, "lng": 0 },
    "source": "Reuters",
    "timestamp": "2024-07-26T00:00:00Z",
    "description": "Event description",
    "profiles": ["osint", "military"],
    "aiNotes": "Analysis notes",
    "confidence": "high"
  }
]
```

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Deployment

Deploy to Vercel:

```bash
npm install -g vercel
vercel --prod
```

## Notes

- Events are currently mocked in `/app/api/events/route.ts`
- TODO: Replace with actual scraper API connection
- The dashboard pulls fresh data every 60 seconds
- User profile selection persists in Zustand store

## Next Steps

1. Connect to daily scraper workflow for live event data
2. Add event filtering by category
3. Implement search functionality
4. Add historical event timeline
5. Enhance AI analyst notes with real intelligence
