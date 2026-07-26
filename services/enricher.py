"""Event enrichment engine - generates AI analyst notes."""

import random


class Enricher:
    """Enriches events with AI-style analyst notes (Known-Knowns, Known-Unknowns, Unknown-Unknowns)."""
    
    def __init__(self):
        self.known_knowns_templates = {
            "war": [
                "Established military deployment pattern",
                "Historical precedent for similar activity",
                "Confirmed unit movements",
                "Previous intelligence indicates likely scenario",
            ],
            "counter_terrorism": [
                "Organization fingerprints detected",
                "Tactical method consistent with group profile",
                "Known supporter networks activated",
                "Typical timeframe and location for cell activity",
            ],
            "natural_disaster": [
                "Geological patterns align with historical data",
                "Seismic zone activity detected",
                "Weather model predictions confirmed",
                "Elevation and topography factor in expected impact",
            ],
            "market": [
                "Policy signals align with economic theory",
                "Sector rotation follows historical patterns",
                "Technical indicators confirm trend shift",
                "Analyst consensus matches observed movement",
            ],
        }
        
        self.known_unknowns_templates = {
            "war": [
                "Intent of force deployment unclear",
                "Casualty estimates highly uncertain",
                "Third-party involvement possible but unconfirmed",
                "Duration and escalation potential unknown",
            ],
            "counter_terrorism": [
                "Exact target and timeline unclear",
                "Potential accomplices not yet identified",
                "Motivation and demands uncertain",
                "Secondary cells may be active",
            ],
            "natural_disaster": [
                "Secondary effects (aftershocks, floods) unpredictable",
                "Humanitarian impact still being assessed",
                "Infrastructure damage extent unknown",
                "Casualty numbers pending full assessment",
            ],
            "market": [
                "Exact magnitude of policy impact uncertain",
                "Spillover effects into other sectors unclear",
                "Duration of volatility unpredictable",
                "Correlation with geopolitical events unclear",
            ],
        }
        
        self.unknown_unknowns_templates = {
            "war": [
                "Unexpected alliance shifts",
                "Undisclosed weapons deployments",
                "Covert support from other nations",
                "Non-state actor involvement",
            ],
            "counter_terrorism": [
                "Cyber component to attack",
                "Supply chain compromises",
                "Insider threats not yet detected",
                "Coordinated multi-stage operations",
            ],
            "natural_disaster": [
                "Cascading infrastructure failures",
                "Unexpected climate feedback loops",
                "Misinformation affecting response",
                "Geomagnetic storm interference",
            ],
            "market": [
                "Black swan financial instrument discovery",
                "Regulatory surprises",
                "Macro policy reversals",
                "Systemic interconnection failures",
            ],
        }
    
    def enrich(self, event):
        """Generate enrichment data for an event."""
        category = event.get("category", "war")
        
        return {
            "known_knowns": [
                random.choice(self.known_knowns_templates.get(category, self.known_knowns_templates["war"]))
            ],
            "known_unknowns": [
                random.choice(self.known_unknowns_templates.get(category, self.known_unknowns_templates["war"])),
                random.choice(self.known_unknowns_templates.get(category, self.known_unknowns_templates["war"])),
            ],
            "unknown_unknowns": [
                random.choice(self.unknown_unknowns_templates.get(category, self.unknown_unknowns_templates["war"])),
            ],
            "confidence": random.choice(["high", "medium", "low"]),
        }
