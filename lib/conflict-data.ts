/**
 * Curated reference dataset of current major active armed conflicts.
 *
 * Unlike the event feed (which geolocates news text and can mis-place stories),
 * this list ties each conflict to its real country border(s) so the map's
 * "Conflict Zones" layer reflects factual, named conflicts rather than a
 * derived guess. Country names must match the `name` property in the
 * world-countries GeoJSON boundary source used by /api/map-layers.
 *
 * Sourced from public conflict trackers (ACLED, UCDP, ICG) — update
 * periodically as conflicts evolve, end, or new ones emerge.
 */
export interface ConflictDefinition {
  id: string;
  name: string;
  /** Country names, must match world-countries GeoJSON `properties.name` */
  countries: string[];
  /** Parties/combatants involved */
  actors: string[];
  description: string;
  casualties: string;
  startYear: number;
  intensity: "high" | "medium" | "low";
  sources: string[];
}

export const CONFLICTS: ConflictDefinition[] = [
  {
    id: "ukraine-russia",
    name: "Russia-Ukraine War",
    countries: ["Ukraine"],
    actors: ["Armed Forces of Ukraine", "Russian Armed Forces", "Wagner/affiliated units"],
    description:
      "Full-scale war following Russia's 2022 invasion, with active frontlines in eastern and southern Ukraine, ongoing missile/drone strikes on infrastructure, and periodic negotiations over territory and security guarantees.",
    casualties: "Hundreds of thousands of military casualties (est.), tens of thousands of civilian deaths",
    startYear: 2022,
    intensity: "high",
    sources: ["ACLED", "UCDP", "ISW"],
  },
  {
    id: "israel-gaza",
    name: "Israel-Gaza War",
    countries: ["West Bank"],
    actors: ["Israel Defense Forces (IDF)", "Hamas", "Palestinian Islamic Jihad"],
    description:
      "Conflict centered on Gaza following the October 2023 Hamas attack on Israel, involving large-scale IDF operations, hostage negotiations, ceasefire attempts, and a severe humanitarian crisis.",
    casualties: "Tens of thousands killed, majority Palestinian civilians (est., disputed figures)",
    startYear: 2023,
    intensity: "high",
    sources: ["ACLED", "UCDP", "OCHA"],
  },
  {
    id: "israel-lebanon",
    name: "Israel-Hezbollah Border Conflict",
    countries: ["Lebanon"],
    actors: ["Israel Defense Forces (IDF)", "Hezbollah"],
    description:
      "Cross-border exchanges and Israeli strikes against Hezbollah positions in southern Lebanon, escalating alongside the Gaza war and periodically threatening to widen into broader regional conflict.",
    casualties: "Thousands killed since escalation (est.)",
    startYear: 2023,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "us-iran-war",
    name: "Iran-US/Israel War (Operation Epic Fury)",
    countries: ["Iran"],
    actors: ["United States Armed Forces", "Israel Defense Forces (IDF)", "Islamic Revolutionary Guard Corps (IRGC)", "Artesh (Iranian Army)"],
    description:
      "War that began Feb 28, 2026 with coordinated US/Israeli strikes on Iranian military and nuclear sites, " +
      "which killed Supreme Leader Ali Khamenei (succeeded by his son Mojtaba Khamenei) and senior IRGC commanders. " +
      "Iran retaliated with large-scale missile/drone strikes and closed the Strait of Hormuz to US/Israeli-linked " +
      "shipping. A partial ceasefire (April 2026, brokered by Pakistan) never fully held; fighting resumed at sea " +
      "in June-July 2026 after Iranian attacks on commercial vessels. As of August 2026, large-scale airstrikes " +
      "have paused for several weeks but a US-led naval blockade/confrontation continues in the Strait of Hormuz.",
    casualties: "Est. 9,000-18,000+ killed across all parties (military and civilian); millions displaced regionally",
    startYear: 2026,
    intensity: "high",
    sources: ["ISW", "ACLED", "Britannica", "GlobalSecurity.org"],
  },
  {
    id: "sudan-civil-war",
    name: "Sudan Civil War",
    countries: ["Sudan"],
    actors: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"],
    description:
      "Power struggle between the Sudanese military and the paramilitary RSF that erupted into nationwide civil war, producing one of the world's largest displacement and famine crises.",
    casualties: "Tens of thousands killed, millions displaced",
    startYear: 2023,
    intensity: "high",
    sources: ["ACLED", "UCDP", "OCHA"],
  },
  {
    id: "drc-m23",
    name: "Eastern DRC Conflict (M23)",
    countries: ["Democratic Republic of the Congo"],
    actors: ["Congolese Armed Forces (FARDC)", "M23 rebels", "regional militias"],
    description:
      "Renewed M23 rebel offensive in North and South Kivu, with allegations of foreign-backed support, alongside dozens of other armed groups active in the mineral-rich eastern provinces.",
    casualties: "Thousands killed, millions displaced over the conflict's history",
    startYear: 2021,
    intensity: "high",
    sources: ["ACLED", "UCDP", "UN Group of Experts"],
  },
  {
    id: "myanmar-civil-war",
    name: "Myanmar Civil War",
    countries: ["Myanmar"],
    actors: ["State Administration Council (military junta)", "People's Defence Forces", "ethnic armed organizations"],
    description:
      "Nationwide armed resistance against the military junta that seized power in the 2021 coup, with ethnic armed organizations and newly formed resistance forces controlling significant territory.",
    casualties: "Tens of thousands killed, millions displaced",
    startYear: 2021,
    intensity: "high",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "yemen-civil-war",
    name: "Yemen Civil War",
    countries: ["Yemen"],
    actors: ["Internationally Recognized Government", "Houthi movement (Ansar Allah)", "Southern Transitional Council"],
    description:
      "Protracted civil war between the internationally recognized government and the Houthi movement, with the Houthis also engaged in Red Sea shipping attacks tied to the Gaza war.",
    casualties: "Hundreds of thousands killed (direct and indirect, est.)",
    startYear: 2014,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "somalia-insurgency",
    name: "Somalia Insurgency",
    countries: ["Somalia"],
    actors: ["Federal Government of Somalia", "African Union forces (AUSSOM)", "Al-Shabaab"],
    description:
      "Long-running insurgency by the al-Qaeda-linked Al-Shabaab against the federal government, which is backed by African Union peacekeeping forces.",
    casualties: "Tens of thousands killed since 2006",
    startYear: 2006,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "sahel-mali",
    name: "Sahel Insurgency — Mali",
    countries: ["Mali"],
    actors: ["Malian Armed Forces", "JNIM (al-Qaeda-linked)", "ISGS (Islamic State Sahel Province)"],
    description:
      "Jihadist insurgency spanning the central Sahel, with Mali's military government (backed by Russian-linked forces) fighting JNIM and ISGS for control of large rural areas.",
    casualties: "Thousands killed annually across the tri-border region",
    startYear: 2012,
    intensity: "high",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "sahel-burkina-faso",
    name: "Sahel Insurgency — Burkina Faso",
    countries: ["Burkina Faso"],
    actors: ["Burkinabe Armed Forces", "JNIM (al-Qaeda-linked)", "ISGS (Islamic State Sahel Province)"],
    description:
      "One of the world's fastest-growing insurgencies, with jihadist groups controlling large swaths of territory and the military government relying on civilian defense militias.",
    casualties: "Thousands killed annually, among the highest fatality rates globally",
    startYear: 2015,
    intensity: "high",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "sahel-niger",
    name: "Sahel Insurgency — Niger",
    countries: ["Niger"],
    actors: ["Nigerien Armed Forces", "JNIM", "ISGS", "Boko Haram remnants"],
    description:
      "Multi-front jihadist insurgency along Niger's borders with Mali, Burkina Faso, and Nigeria, compounded by post-coup political instability since 2023.",
    casualties: "Thousands killed since insurgency escalated",
    startYear: 2015,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "nigeria-boko-haram",
    name: "Nigeria Insurgency (Boko Haram/ISWAP)",
    countries: ["Nigeria"],
    actors: ["Nigerian Armed Forces", "Boko Haram", "Islamic State West Africa Province (ISWAP)"],
    description:
      "Long-running insurgency in Nigeria's northeast, with Boko Haram splinter ISWAP now the dominant jihadist force, alongside intercommunal and banditry violence in central states.",
    casualties: "Over 40,000 killed since 2009, millions displaced",
    startYear: 2009,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "syria-conflict",
    name: "Syrian Conflict",
    countries: ["Syria"],
    actors: ["Transitional government forces", "Syrian Democratic Forces (SDF)", "ISIS remnants", "regional militias"],
    description:
      "Continuing instability and factional violence following the 2024 fall of the Assad government, with contested control in Kurdish-held northeast and periodic ISIS resurgence.",
    casualties: "Hundreds of thousands killed over the war's history",
    startYear: 2011,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "libya-conflict",
    name: "Libyan Conflict",
    countries: ["Libya"],
    actors: ["Government of National Unity (Tripoli)", "Libyan National Army (Benghazi)", "assorted militias"],
    description:
      "Fragile east-west political and military split persisting since the 2011 revolution, with periodic militia clashes over territory, oil revenue, and legitimacy.",
    casualties: "Thousands killed since 2011, sporadic militia clashes ongoing",
    startYear: 2014,
    intensity: "low",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "ethiopia-instability",
    name: "Ethiopia Internal Conflict",
    countries: ["Ethiopia"],
    actors: ["Federal Government of Ethiopia", "Fano militia (Amhara)", "Oromo Liberation Army (OLA)"],
    description:
      "Post-Tigray war instability, with active federal operations against Amhara Fano militias and the Oromo Liberation Army in separate regional conflicts.",
    casualties: "Tens of thousands killed across Tigray, Amhara, and Oromia conflicts combined",
    startYear: 2020,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "colombia-conflict",
    name: "Colombia Armed Conflict",
    countries: ["Colombia"],
    actors: ["Colombian Armed Forces", "ELN (National Liberation Army)", "FARC dissident factions"],
    description:
      "Residual armed conflict continuing after the 2016 FARC peace deal, with the ELN and FARC dissident groups still contesting territory, often tied to drug trafficking.",
    casualties: "Ongoing low-level fatalities, hundreds annually",
    startYear: 1964,
    intensity: "low",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "mexico-cartel-violence",
    name: "Mexican Cartel Violence",
    countries: ["Mexico"],
    actors: ["Mexican Armed Forces/National Guard", "Sinaloa Cartel", "Jalisco New Generation Cartel (CJNG)"],
    description:
      "Sustained high-intensity violence from cartel territorial wars and state security operations, classified by several conflict trackers as exceeding many recognized civil wars in fatalities.",
    casualties: "Tens of thousands killed annually (organized-crime related)",
    startYear: 2006,
    intensity: "high",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "haiti-gang-violence",
    name: "Haiti Gang Violence",
    countries: ["Haiti"],
    actors: ["Haitian National Police", "Multinational Security Support Mission", "Viv Ansanm gang coalition"],
    description:
      "Collapse of state authority in much of Port-au-Prince, with gang coalitions controlling large parts of the capital despite a Kenya-led multinational police support mission.",
    casualties: "Thousands killed since 2024 escalation, mass displacement",
    startYear: 2024,
    intensity: "high",
    sources: ["ACLED", "UN"],
  },
  {
    id: "pakistan-ttp",
    name: "Pakistan-TTP Insurgency",
    countries: ["Pakistan"],
    actors: ["Pakistani Armed Forces", "Tehrik-i-Taliban Pakistan (TTP)", "Baloch separatist groups"],
    description:
      "Resurgent insurgency along the Afghan border since the 2021 Taliban takeover of Afghanistan, alongside a separate Baloch separatist insurgency in the southwest.",
    casualties: "Hundreds killed annually in recent years",
    startYear: 2007,
    intensity: "medium",
    sources: ["ACLED", "UCDP"],
  },
  {
    id: "afghanistan-instability",
    name: "Afghanistan Post-Takeover Instability",
    countries: ["Afghanistan"],
    actors: ["Taliban government", "Islamic State Khorasan Province (ISIS-K)", "National Resistance Front"],
    description:
      "Continued low-level insurgency against Taliban rule, primarily from ISIS-K attacks and pockets of resistance in the Panjshir valley.",
    casualties: "Hundreds killed annually in insurgent attacks",
    startYear: 2021,
    intensity: "low",
    sources: ["ACLED", "UCDP"],
  },
];
