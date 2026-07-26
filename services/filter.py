"""Profile-based event filtering."""


class ProfileFilter:
    """Determines which user profiles can see each event."""
    
    # Define which profiles should see which event categories
    PROFILE_CATEGORIES = {
        "osint": ["war", "counter_terrorism"],
        "finance": ["market"],
        "military": ["war", "counter_terrorism"],
    }
    
    # Events can always be seen by all profiles (no category restrictions)
    ALWAYS_VISIBLE = ["natural_disaster"]
    
    def get_visible_profiles(self, event):
        """Determine which user profiles should see this event."""
        category = event.get("category", "war")
        visible = []
        
        # Natural disasters visible to all
        if category in self.ALWAYS_VISIBLE:
            return ["osint", "finance", "military"]
        
        # Check category-specific visibility
        for profile, categories in self.PROFILE_CATEGORIES.items():
            if category in categories:
                visible.append(profile)
        
        return visible if visible else ["osint"]  # Default to osint if no match
