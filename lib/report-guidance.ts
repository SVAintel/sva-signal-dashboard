interface CategoryGuidance {
  watchPoints: string[];
  additionalSources: Array<{ name: string; title: string; url: string }>;
}
export function categoryGuidance(category: string): CategoryGuidance {
  const notesByCategory: Record<string, CategoryGuidance> = {
    war: {
      watchPoints: [
        "Formal military declarations or statements",
        "Refugee/IDP movement and border crossings",
        "Cyber warfare and critical infrastructure attacks",
        "Supply chain disruptions",
        "Media coordination and information warfare",
        "Foreign military aid arrivals",
      ],
      additionalSources: [
        { name: "GDELT", title: "Geopolitical Event Database", url: "https://gdeltproject.org" },
        { name: "ACLED", title: "Armed Conflict Location Data", url: "https://acleddata.com" },
      ],
    },
    counter_terrorism: {
      watchPoints: [
        "Arrest warrants and law enforcement ops",
        "Financial transaction patterns",
        "Travel records and border alerts",
        "Propaganda and radicalization content",
        "Related attack planning indicators",
        "International partner operations",
      ],
      additionalSources: [
        { name: "ACLED", title: "Violence Data", url: "https://acleddata.com" },
        { name: "NewsAPI", title: "Security Feed", url: "https://newsapi.org" },
      ],
    },
    natural_disaster: {
      watchPoints: [
        "Aftershock patterns and magnitude",
        "Infrastructure damage and facility status",
        "Disease and contamination risks",
        "Refugee movements and displacement",
        "Supply chain disruptions",
        "Secondary hazards (landslides, tsunamis)",
      ],
      additionalSources: [
        { name: "EMSC", title: "European Seismic Centre", url: "https://www.emsc-csem.org" },
        { name: "NOAA", title: "Tsunami & Storm Data", url: "https://www.noaa.gov" },
      ],
    },
    market: {
      watchPoints: [
        "Central bank policy announcements",
        "Economic data and consensus misses",
        "Credit spread movements",
        "Currency realignment patterns",
        "Geopolitical risk premium changes",
        "Earnings guidance revisions",
      ],
      additionalSources: [
        { name: "CoinGecko", title: "Crypto Market Data", url: "https://coingecko.com" },
        { name: "Finnhub", title: "Financial Data", url: "https://finnhub.io" },
      ],
    },
    biological: {
      watchPoints: [
        "Containment measures and border health controls",
        "WHO emergency committee convening",
        "Travel restriction announcements",
        "Mutation and variant sequencing reports",
        "Healthcare system capacity indicators",
        "Vaccine and countermeasure stockpile status",
      ],
      additionalSources: [
        { name: "WHO", title: "World Health Organization", url: "https://who.int" },
        { name: "CDC", title: "Centers for Disease Control", url: "https://cdc.gov" },
      ],
    },
    political_unrest: {
      watchPoints: [
        "Security force defections or loyalty shifts",
        "International recognition and diplomatic signals",
        "Foreign embassy security posture changes",
        "Social media amplification and coordination",
        "Economic triggers and currency movements",
        "Armed group mobilization indicators",
      ],
      additionalSources: [
        { name: "Reuters", title: "Global News Feed", url: "https://reuters.com" },
        { name: "Foreign Policy", title: "Geopolitical Analysis", url: "https://foreignpolicy.com" },
      ],
    },
    cyber: {
      watchPoints: [
        "Secondary target identification and lateral movement",
        "Data exfiltration volume and destination indicators",
        "Official attribution statements from governments",
        "Patch and vulnerability disclosure releases",
        "C2 infrastructure takedown operations",
        "Sector-wide alert and ISAC notifications",
      ],
      additionalSources: [
        { name: "CISA", title: "Cybersecurity & Infrastructure Security", url: "https://cisa.gov" },
        { name: "Threat Intel", title: "APT Tracking Feeds", url: "https://attack.mitre.org" },
      ],
    },
    nuclear: {
      watchPoints: [
        "IAEA inspector access and compliance status",
        "Satellite imagery changes at known facilities",
        "Diplomatic channel communications",
        "Dual-use technology transfer detections",
        "Delivery system test and development indicators",
        "Financial sanctions evasion patterns",
      ],
      additionalSources: [
        { name: "IAEA", title: "International Atomic Energy Agency", url: "https://iaea.org" },
        { name: "NTI", title: "Nuclear Threat Initiative", url: "https://nti.org" },
      ],
    },
    energy: {
      watchPoints: [
        "Strategic reserve levels and drawdown rate",
        "Alternative supply route activation",
        "Diplomatic negotiation progress signals",
        "Market derivative and futures positioning",
        "Critical infrastructure physical security status",
        "Downstream industrial and civilian impact indicators",
      ],
      additionalSources: [
        { name: "IEA", title: "International Energy Agency", url: "https://iea.org" },
        { name: "EIA", title: "Energy Information Administration", url: "https://eia.gov" },
      ],
    },
    humanitarian: {
      watchPoints: [
        "IDP camp capacity and population flow rates",
        "Food security phase classification changes",
        "Aid corridor access and armed actor compliance",
        "International tribunal and accountability actions",
        "Donor government response and funding pledges",
        "Disease outbreak risk in displaced populations",
      ],
      additionalSources: [
        { name: "UNHCR", title: "UN Refugee Agency", url: "https://unhcr.org" },
        { name: "OCHA", title: "UN Office for Coordination of Humanitarian Affairs", url: "https://unocha.org" },
      ],
    },
  };
  return notesByCategory[category] || {
    watchPoints: [
      "Secondary confirmations",
      "Pattern correlations",
      "Third-party verification",
      "Impact indicators",
    ],
    additionalSources: [],
  };
}
