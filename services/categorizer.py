"""Event categorization engine."""


class Categorizer:
    """Categorizes events into: war, counter_terrorism, natural_disaster, market."""
    
    def categorize(self, event):
        """Determine event category based on title and description."""
        text = (event.get("title", "") + " " + event.get("description", "")).lower()
        source = event.get("source", "").lower()
        
        # Market indicators
        if any(word in text for word in ["market", "trading", "volatility", "stock", "exchange", "rate", "sell-off"]):
            return "market"
        
        # War/military indicators
        if any(word in text for word in ["military", "border", "clashes", "alliance", "defense", "war", "strategic"]):
            return "war"
        
        # Counter-terrorism indicators
        if any(word in text for word in ["terrorist", "attack", "extremist", "responsibility", "security"]):
            return "counter_terrorism"
        
        # Natural disaster indicators
        if any(word in text for word in ["earthquake", "seismic", "hurricane", "flooding", "disaster", "storm", "weather", "magnitude"]):
            return "natural_disaster"
        
        # Default based on source
        if "usgs" in source or "noaa" in source:
            return "natural_disaster"
        if "bloomberg" in source or "alphavantage" in source:
            return "market"
        if "newsapi" in source:
            return "war"
        
        return "war"  # Default fallback
