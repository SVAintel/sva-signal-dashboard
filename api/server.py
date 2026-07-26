"""Simple Flask API server for serving events to the dashboard."""

from flask import Flask, jsonify, request
import json
import os

app = Flask(__name__)


def load_events():
    """Load latest events from data/events.json."""
    try:
        with open("data/events.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


@app.route("/api/events", methods=["GET"])
def get_events():
    """
    GET /api/events?profile=osint&category=war
    
    Query parameters:
    - profile: osint | finance | military (optional)
    - category: war | counter_terrorism | natural_disaster | market (optional)
    - limit: max results (default 100)
    
    Returns: JSON array of filtered events
    """
    profile = request.args.get("profile")
    category = request.args.get("category")
    limit = int(request.args.get("limit", 100))
    
    events = load_events()
    
    # Filter by profile
    if profile:
        events = [e for e in events if profile in e.get("profiles", [])]
    
    # Filter by category
    if category:
        events = [e for e in events if e.get("category") == category]
    
    # Apply limit
    events = events[:limit]
    
    return jsonify(events)


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "sva-signal-api"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
