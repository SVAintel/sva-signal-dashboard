// Curated country intelligence profiles. Keyed by the "ADMIN" property from the
// Natural Earth 110m admin-0 countries GeoJSON (the same dataset used for the
// clickable country border overlay), so lookups from the map layer are a direct
// key match. Figures (population, GDP, defense spend, personnel) are rounded
// public/unclassified approximations for situational awareness, not an
// authoritative statistical or classified source — treat them as illustrative.
//
// Coverage: Europe, North America, South America, Africa, the Middle East,
// Asia, and Oceania (~175 countries/territories rendered by the border
// overlay) — essentially the full Natural Earth 110m country set.

export interface CountryDetail {
  region: string;
  capital: string;
  population: string;
  governmentType: string;
  rulingParties: string;
  gdp: string;
  majorExports: string[];
  topTradePartners: string[];
  militaryBranches: string[];
  activePersonnel: string;
  defenseBudget: string;
  alliances: string[];
  summary: string;
}

export const COUNTRY_DETAILS: Record<string, CountryDetail> = {
  "United Kingdom": {
    region: "Europe",
    capital: "London",
    population: "~68 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "Labour Party government under PM Keir Starmer, since the July 2024 general election.",
    gdp: "~$3.3 trillion (nominal)",
    majorExports: ["Machinery & vehicles", "Pharmaceuticals", "Crude oil & refined products", "Financial services"],
    topTradePartners: ["United States", "Germany", "Netherlands", "Ireland", "China"],
    militaryBranches: ["British Army", "Royal Navy", "Royal Air Force"],
    activePersonnel: "~150,000",
    defenseBudget: "~$75 billion (~2.3% of GDP)",
    alliances: ["NATO", "Five Eyes", "AUKUS", "UN Security Council (permanent member)"],
    summary:
      "A nuclear-armed permanent UN Security Council member and one of NATO's largest European militaries. " +
      "Retains a global naval and intelligence footprint (Five Eyes, AUKUS) and has been a leading arms/financial " +
      "backer of Ukraine since 2022.",
  },
  France: {
    region: "Europe",
    capital: "Paris",
    population: "~68.5 million",
    governmentType: "Semi-presidential republic",
    rulingParties:
      "President Emmanuel Macron (centrist, Renaissance); National Assembly has been fragmented and " +
      "coalition-dependent since the 2024 snap elections, producing frequent government turnover.",
    gdp: "~$3.1 trillion (nominal)",
    majorExports: ["Aircraft & aerospace", "Machinery", "Pharmaceuticals", "Wine & luxury goods"],
    topTradePartners: ["Germany", "United States", "Italy", "Spain", "Belgium"],
    militaryBranches: ["Armée de Terre (Army)", "Marine Nationale (Navy)", "Armée de l'Air et de l'Espace (Air & Space Force)"],
    activePersonnel: "~205,000",
    defenseBudget: "~$61 billion",
    alliances: ["NATO", "European Union", "UN Security Council (permanent member)"],
    summary:
      "An independent nuclear power and permanent UN Security Council member with a global expeditionary military " +
      "footprint (West Africa, Indo-Pacific territories). Domestic politics have been unstable since 2024, " +
      "complicating budget and coalition-building.",
  },
  Germany: {
    region: "Europe",
    capital: "Berlin",
    population: "~84.5 million",
    governmentType: "Federal parliamentary republic",
    rulingParties:
      "CDU/CSU–SPD coalition under Chancellor Friedrich Merz, formed after the February 2025 federal election.",
    gdp: "~$4.6 trillion (nominal — largest economy in Europe)",
    majorExports: ["Motor vehicles", "Machinery", "Chemicals & pharmaceuticals", "Electrical equipment"],
    topTradePartners: ["United States", "China", "France", "Netherlands", "Poland"],
    militaryBranches: ["Heer (Army)", "Marine (Navy)", "Luftwaffe (Air Force)", "Cyber and Information Domain Service"],
    activePersonnel: "~185,000",
    defenseBudget: "~$90+ billion (major post-2022 'Zeitenwende' buildup)",
    alliances: ["NATO", "European Union"],
    summary:
      "Europe's largest economy, undergoing the most significant military rearmament since the Cold War " +
      "(Zeitenwende) in response to Russia's invasion of Ukraine, including a dedicated special fund and rising " +
      "defense spending toward NATO's 2%+ target.",
  },
  Italy: {
    region: "Europe",
    capital: "Rome",
    population: "~59 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Giorgia Meloni (Brothers of Italy) coalition with Lega and Forza Italia, since October 2022.",
    gdp: "~$2.3 trillion (nominal)",
    majorExports: ["Machinery", "Motor vehicles", "Pharmaceuticals", "Fashion & luxury goods", "Food & wine"],
    topTradePartners: ["Germany", "France", "United States", "Spain", "Switzerland"],
    militaryBranches: ["Esercito Italiano (Army)", "Marina Militare (Navy)", "Aeronautica Militare (Air Force)", "Carabinieri"],
    activePersonnel: "~165,000",
    defenseBudget: "~$32 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "A founding NATO member hosting major U.S. installations (Aviano, Naples/6th Fleet, Sigonella). Meloni's " +
      "government has combined firm pro-NATO/Ukraine positioning with a harder domestic line on migration.",
  },
  Spain: {
    region: "Europe",
    capital: "Madrid",
    population: "~48.6 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Pedro Sánchez (PSOE) minority coalition with Sumar, reliant on regional-party support in parliament.",
    gdp: "~$1.6 trillion (nominal)",
    majorExports: ["Motor vehicles", "Machinery", "Agricultural products", "Pharmaceuticals"],
    topTradePartners: ["France", "Germany", "Portugal", "Italy", "United States"],
    militaryBranches: ["Ejército de Tierra (Army)", "Armada (Navy)", "Ejército del Aire y del Espacio (Air & Space Force)"],
    activePersonnel: "~120,000",
    defenseBudget: "~$20 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "Hosts key U.S./NATO naval and air facilities (Rota, Morón) supporting Mediterranean, Atlantic, and African " +
      "operations. Political stability has been strained by a fragile minority government and Catalonia-related tensions.",
  },
  Portugal: {
    region: "Europe",
    capital: "Lisbon",
    population: "~10.5 million",
    governmentType: "Semi-presidential parliamentary republic",
    rulingParties: "PM Luís Montenegro (PSD-led 'Democratic Alliance') minority government, since 2024.",
    gdp: "~$300 billion (nominal)",
    majorExports: ["Machinery & vehicle parts", "Textiles & footwear", "Cork", "Wine"],
    topTradePartners: ["Spain", "Germany", "France", "United Kingdom"],
    militaryBranches: ["Exército (Army)", "Marinha (Navy)", "Força Aérea (Air Force)"],
    activePersonnel: "~27,000",
    defenseBudget: "~$4.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "A founding NATO member whose Lajes Field air base in the Azores has long been strategically valued for " +
      "trans-Atlantic reach; politics have been marked by minority-government instability in recent years.",
  },
  Netherlands: {
    region: "Europe",
    capital: "Amsterdam (seat of government: The Hague)",
    population: "~18 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties:
      "Coalition government formed after the 2023 election in which the PVV (Geert Wilders) won a plurality; " +
      "governing arrangement has since been renegotiated amid coalition instability.",
    gdp: "~$1.1 trillion (nominal)",
    majorExports: ["Machinery & electronics (incl. ASML semiconductor equipment)", "Agricultural products", "Chemicals", "Refined petroleum"],
    topTradePartners: ["Germany", "Belgium", "United States", "United Kingdom", "France"],
    militaryBranches: ["Koninklijke Landmacht (Army)", "Koninklijke Marine (Navy)", "Koninklijke Luchtmacht (Air Force)", "Koninklijke Marechaussee"],
    activePersonnel: "~42,000",
    defenseBudget: "~$22 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "Home to a globally critical semiconductor-equipment industry (ASML) and hosts key NATO/EU institutions. " +
      "Coalition politics remain volatile following the 2023 far-right electoral breakthrough.",
  },
  Belgium: {
    region: "Europe",
    capital: "Brussels",
    population: "~11.8 million",
    governmentType: "Federal parliamentary constitutional monarchy",
    rulingParties: "PM Bart De Wever (N-VA) leads the 'Arizona coalition' formed in 2025.",
    gdp: "~$660 billion (nominal)",
    majorExports: ["Chemicals & pharmaceuticals", "Machinery", "Diamonds", "Motor vehicles"],
    topTradePartners: ["Germany", "France", "Netherlands", "United Kingdom", "United States"],
    militaryBranches: ["Land Component", "Naval Component", "Air Component", "Medical Component"],
    activePersonnel: "~24,000",
    defenseBudget: "~$6 billion",
    alliances: ["NATO (headquarters)", "European Union (headquarters)"],
    summary:
      "Hosts NATO's political headquarters and SHAPE, plus core EU institutions, giving it outsized diplomatic " +
      "weight relative to its military size. Federal coalition-building is often protracted due to linguistic/regional splits.",
  },
  Switzerland: {
    region: "Europe",
    capital: "Bern",
    population: "~8.9 million",
    governmentType: "Federal directorial republic; permanent armed neutrality",
    rulingParties:
      "Federal Council power-sharing ('magic formula') among SVP/UDC, SP/PS, FDP, and Die Mitte — no single ruling party.",
    gdp: "~$880 billion (nominal)",
    majorExports: ["Pharmaceuticals", "Precision instruments & watches", "Machinery", "Gold & financial services"],
    topTradePartners: ["Germany", "United States", "China", "Italy", "France"],
    militaryBranches: ["Swiss Armed Forces (militia-based Army and Air Force)"],
    activePersonnel: "~150,000 (predominantly militia/reserve; small permanent cadre)",
    defenseBudget: "~$6.5 billion",
    alliances: ["Neutral — not NATO or EU; NATO Partnership for Peace"],
    summary:
      "Maintains strict armed neutrality with a militia-conscription defense model. A global financial and " +
      "diplomatic hub (Geneva) despite staying outside NATO and the EU.",
  },
  Austria: {
    region: "Europe",
    capital: "Vienna",
    population: "~9.1 million",
    governmentType: "Federal parliamentary republic",
    rulingParties:
      "Coalition of ÖVP, SPÖ, and NEOS under Chancellor Christian Stocker (2025), after the far-right FPÖ won a " +
      "plurality but was excluded from government formation.",
    gdp: "~$530 billion (nominal)",
    majorExports: ["Machinery", "Motor vehicle parts", "Chemicals", "Iron & steel"],
    topTradePartners: ["Germany", "Italy", "United States", "Switzerland"],
    militaryBranches: ["Bundesheer (unified Army/Air Force)"],
    activePersonnel: "~22,000 (conscript-based)",
    defenseBudget: "~$4 billion",
    alliances: ["European Union; constitutionally neutral, NATO Partnership for Peace"],
    summary:
      "Constitutionally neutral since 1955, Austria stays outside NATO while participating in EU security " +
      "cooperation. Coalition politics have been reshaped by the far right's rising vote share.",
  },
  Poland: {
    region: "Europe",
    capital: "Warsaw",
    population: "~37.6 million",
    governmentType: "Parliamentary republic",
    rulingParties:
      "PM Donald Tusk (Civic Coalition) governs with Third Way and The Left since December 2023; President " +
      "Karol Nawrocki (PiS-aligned, since 2025) creates a cohabitation dynamic with the government.",
    gdp: "~$850 billion (nominal)",
    majorExports: ["Machinery", "Motor vehicle parts", "Furniture", "Food products"],
    topTradePartners: ["Germany", "Czechia", "France", "United Kingdom", "Netherlands"],
    militaryBranches: ["Wojska Lądowe (Army)", "Marynarka Wojenna (Navy)", "Siły Powietrzne (Air Force)", "Wojska Obrony Terytorialnej (Territorial Defense)"],
    activePersonnel: "~216,000 (expansion underway toward a 300,000 target)",
    defenseBudget: "~$32 billion (~4% of GDP — highest share in NATO)",
    alliances: ["NATO", "European Union"],
    summary:
      "A frontline NATO state bordering both Ukraine and Kaliningrad, undergoing the fastest military buildup " +
      "in Europe and hosting substantial rotational U.S./NATO forces plus major arms imports (Abrams, HIMARS, K2 tanks).",
  },
  Czechia: {
    region: "Europe",
    capital: "Prague",
    population: "~10.9 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Coalition led by ANO (Andrej Babiš), forming government with SPD and Motoristé after the October 2025 election.",
    gdp: "~$340 billion (nominal)",
    majorExports: ["Motor vehicles & parts", "Machinery", "Electronics"],
    topTradePartners: ["Germany", "Slovakia", "Poland", "France"],
    militaryBranches: ["Pozemní síly (Army)", "Vzdušné síly (Air Force)"],
    activePersonnel: "~28,000",
    defenseBudget: "~$8.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "A major European automotive-manufacturing hub. The 2025 election brought Eurosceptic-leaning ANO back to " +
      "power, raising questions about continuity of prior governments' strong pro-Ukraine posture.",
  },
  Slovakia: {
    region: "Europe",
    capital: "Bratislava",
    population: "~5.4 million",
    governmentType: "Parliamentary republic",
    rulingParties:
      "PM Robert Fico (SMER-SD) coalition with Hlas-SD and SNS, since October 2023 — notably more skeptical of " +
      "further Ukraine military aid than most EU/NATO peers.",
    gdp: "~$135 billion (nominal)",
    majorExports: ["Motor vehicles (major regional auto hub)", "Machinery", "Electronics"],
    topTradePartners: ["Germany", "Czechia", "Poland"],
    militaryBranches: ["Pozemné sily (Army)", "Vzdušné sily (Air Force)"],
    activePersonnel: "~13,000",
    defenseBudget: "~$3.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "One of the world's most auto-manufacturing-intensive economies per capita. Fico's government has broken " +
      "with regional consensus by halting state military aid to Ukraine while maintaining EU/NATO membership.",
  },
  Hungary: {
    region: "Europe",
    capital: "Budapest",
    population: "~9.6 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Viktor Orbán (Fidesz), in power since 2010.",
    gdp: "~$220 billion (nominal)",
    majorExports: ["Motor vehicles & parts", "Machinery & electronics (semiconductors)", "Pharmaceuticals"],
    topTradePartners: ["Germany", "Slovakia", "Italy", "Romania", "Austria"],
    militaryBranches: ["Magyar Honvédség (unified Army/Air Force)"],
    activePersonnel: "~37,000 (expanding)",
    defenseBudget: "~$4.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "Frequently at odds with Brussels over rule-of-law disputes and has taken the most Russia/Kremlin-accommodating " +
      "stance among EU/NATO members, including blocking or slow-walking aspects of EU Ukraine aid and sanctions packages.",
  },
  Romania: {
    region: "Europe",
    capital: "Bucharest",
    population: "~19 million",
    governmentType: "Semi-presidential republic",
    rulingParties: "Coalition government (PSD, PNL, UDMR) under PM Ilie Bolojan; President Nicușor Dan, since 2025.",
    gdp: "~$350 billion (nominal)",
    majorExports: ["Machinery", "Motor vehicle parts", "Electrical equipment"],
    topTradePartners: ["Germany", "Italy", "France", "Hungary"],
    militaryBranches: ["Forțele Terestre (Army)", "Forțele Aeriene (Air Force)", "Forțele Navale (Navy)"],
    activePersonnel: "~70,000",
    defenseBudget: "~$8 billion (~2.5% of GDP)",
    alliances: ["NATO", "European Union"],
    summary:
      "Hosts major NATO infrastructure directly relevant to the Ukraine war and Black Sea security — the " +
      "Mihail Kogălniceanu air base (a key logistics/reinforcement hub) and the Deveselu ballistic-missile-defense site.",
  },
  Bulgaria: {
    region: "Europe",
    capital: "Sofia",
    population: "~6.4 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Fragile GERB-led coalition amid years of recurring political instability and repeat elections.",
    gdp: "~$105 billion (nominal)",
    majorExports: ["Machinery", "Base metals", "Chemicals", "Agricultural products"],
    topTradePartners: ["Germany", "Romania", "Italy", "Turkey"],
    militaryBranches: ["Сухопътни войски (Land Forces)", "Военновъздушни сили (Air Force)", "Военноморски сили (Navy)"],
    activePersonnel: "~37,000",
    defenseBudget: "~$3.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "A Black Sea NATO member that has struggled with chronic government instability (multiple snap elections " +
      "since 2021) while gradually modernizing Soviet-era military equipment with Western systems.",
  },
  Greece: {
    region: "Europe",
    capital: "Athens",
    population: "~10.4 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Kyriakos Mitsotakis (New Democracy), in office since 2019 and re-elected 2023.",
    gdp: "~$240 billion (nominal)",
    majorExports: ["Refined petroleum products", "Aluminum", "Machinery", "Olive oil & agricultural products", "Shipping services"],
    topTradePartners: ["Italy", "Germany", "Turkey", "Cyprus"],
    militaryBranches: ["Hellenic Army", "Hellenic Navy", "Hellenic Air Force"],
    activePersonnel: "~130,000 (large relative to population)",
    defenseBudget: "~$8 billion (~3% of GDP — among NATO's highest shares)",
    alliances: ["NATO", "European Union"],
    summary:
      "Maintains an outsized military relative to population due to long-standing tension with Turkey over " +
      "Aegean airspace/maritime boundaries and Cyprus; controls one of the world's largest merchant shipping fleets.",
  },
  Cyprus: {
    region: "Europe",
    capital: "Nicosia",
    population: "~1.25 million (government-controlled area)",
    governmentType: "Presidential republic",
    rulingParties: "President Nikos Christodoulides (independent, DISY-backed), since 2023.",
    gdp: "~$32 billion (nominal)",
    majorExports: ["Pharmaceuticals", "Halloumi & dairy products", "Ship management/registration services"],
    topTradePartners: ["Greece", "United Kingdom", "Germany"],
    militaryBranches: ["National Guard (closely integrated with the Hellenic Army)"],
    activePersonnel: "~15,000 (incl. conscripts)",
    defenseBudget: "~$550 million",
    alliances: ["European Union; not NATO (blocked by the Turkey/Cyprus dispute)"],
    summary:
      "Divided since 1974 between the internationally recognized Republic of Cyprus and the Turkish-occupied " +
      "north; hosts the UN buffer zone (UNFICYP) and UK Sovereign Base Areas at Akrotiri and Dhekelia.",
  },
  "Northern Cyprus": {
    region: "Europe",
    capital: "North Nicosia (Lefkoşa)",
    population: "~380,000",
    governmentType: "Self-declared republic, recognized only by Turkey",
    rulingParties: "Local administration under Turkish protection; not recognized by the UN or any state besides Turkey.",
    gdp: "Small, tied to the Turkish lira; limited international trade due to non-recognition",
    majorExports: ["Citrus", "Tourism services (largely to/via Turkey)"],
    topTradePartners: ["Turkey (dominant, due to trade isolation)"],
    militaryBranches: ["Local security forces plus a substantial Turkish Armed Forces garrison"],
    activePersonnel: "Turkish troop presence estimated in the 30,000–40,000 range",
    defenseBudget: "Not independently published (defense underwritten by Turkey)",
    alliances: ["De facto Turkish protectorate; outside NATO/EU frameworks applicable to Cyprus"],
    summary:
      "Established after Turkey's 1974 intervention; remains diplomatically isolated with the dispute unresolved " +
      "despite periodic UN-mediated reunification talks.",
  },
  Ireland: {
    region: "Europe",
    capital: "Dublin",
    population: "~5.3 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Coalition of Fianna Fáil and Fine Gael with independents; Taoiseach Micheál Martin, since 2025.",
    gdp: "~$550 billion (nominal — inflated by multinational corporate activity)",
    majorExports: ["Pharmaceuticals", "Computer & tech services", "Medical devices", "Dairy & food products"],
    topTradePartners: ["United States", "Germany", "United Kingdom", "Belgium"],
    militaryBranches: ["Army", "Naval Service", "Air Corps"],
    activePersonnel: "~9,000",
    defenseBudget: "~$1.5 billion",
    alliances: ["Militarily neutral; European Union member, not NATO"],
    summary:
      "Long-standing military neutrality alongside deep EU integration; home to major U.S. tech/pharma multinational " +
      "operations that make it disproportionately significant to trans-Atlantic trade and tax policy debates.",
  },
  Iceland: {
    region: "Europe",
    capital: "Reykjavik",
    population: "~390,000",
    governmentType: "Parliamentary republic",
    rulingParties: "Coalition government led by PM Kristrún Frostadóttir (Social Democratic Alliance), after the 2024 election.",
    gdp: "~$32 billion (nominal)",
    majorExports: ["Fish & seafood products", "Aluminum", "Tourism services"],
    topTradePartners: ["Netherlands", "United Kingdom", "United States", "Spain"],
    militaryBranches: ["No standing army; Icelandic Coast Guard performs defense-adjacent duties"],
    activePersonnel: "N/A (no armed forces)",
    defenseBudget: "Minimal (Coast Guard budget only)",
    alliances: ["NATO founding member (relies on allied air policing; historically hosted U.S. forces at Keflavík)"],
    summary:
      "The only NATO member with no standing military, relying on allied partners for air policing over the " +
      "strategically important GIUK gap chokepoint between the North Atlantic and Arctic.",
  },
  Denmark: {
    region: "Europe",
    capital: "Copenhagen",
    population: "~5.9 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Mette Frederiksen (Social Democrats) leads a broad cross-party coalition government.",
    gdp: "~$400 billion (nominal)",
    majorExports: ["Pharmaceuticals (Novo Nordisk)", "Machinery", "Wind turbines & renewable technology", "Meat & agricultural products"],
    topTradePartners: ["Germany", "Sweden", "United States", "Netherlands"],
    militaryBranches: ["Hæren (Army)", "Søværnet (Navy)", "Flyvevåbnet (Air Force)"],
    activePersonnel: "~17,000",
    defenseBudget: "~$9 billion (rapidly expanding since 2022)",
    alliances: ["NATO", "European Union (reversed its defense-policy opt-out via 2022 referendum)"],
    summary:
      "Sovereign over Greenland and the Faroe Islands, giving it outsized Arctic strategic relevance amid growing " +
      "great-power competition over Greenland's minerals and shipping routes.",
  },
  Norway: {
    region: "Europe",
    capital: "Oslo",
    population: "~5.5 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Jonas Gahr Støre (Labour Party) minority government.",
    gdp: "~$480 billion (nominal — major oil/gas exporter; manages the world's largest sovereign wealth fund)",
    majorExports: ["Petroleum & natural gas", "Fish & seafood", "Metals"],
    topTradePartners: ["United Kingdom", "Germany", "Netherlands", "Sweden"],
    militaryBranches: ["Hæren (Army)", "Sjøforsvaret (Navy)", "Luftforsvaret (Air Force)", "Heimevernet (Home Guard)"],
    activePersonnel: "~24,000",
    defenseBudget: "~$9 billion",
    alliances: ["NATO founding member; not EU (EEA member)"],
    summary:
      "A founding NATO member sharing a direct Arctic border with Russia (Svalbard/Barents region), making it a " +
      "key flank for monitoring Russian Northern Fleet activity.",
  },
  Sweden: {
    region: "Europe",
    capital: "Stockholm",
    population: "~10.6 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Ulf Kristersson (Moderate Party) coalition, supported by the Sweden Democrats.",
    gdp: "~$600 billion (nominal)",
    majorExports: ["Machinery", "Motor vehicles", "Pharmaceuticals", "Telecom equipment", "Iron & steel"],
    topTradePartners: ["Germany", "Norway", "United States", "Finland"],
    militaryBranches: ["Markstridskrafterna (Army)", "Marinstridskrafterna (Navy)", "Flygvapnet (Air Force)"],
    activePersonnel: "~28,000 (rapidly expanding; conscription reintroduced)",
    defenseBudget: "~$10 billion",
    alliances: ["NATO (joined March 2024, ending ~200 years of non-alignment)", "European Union"],
    summary:
      "Ended two centuries of military non-alignment by joining NATO in 2024 in direct response to Russia's " +
      "invasion of Ukraine, bringing a technologically advanced defense-industrial base (Gripen, Saab) into the alliance.",
  },
  Finland: {
    region: "Europe",
    capital: "Helsinki",
    population: "~5.6 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Petteri Orpo (National Coalition Party) coalition government.",
    gdp: "~$300 billion (nominal)",
    majorExports: ["Machinery", "Paper & forestry products", "Electronics", "Metals"],
    topTradePartners: ["Germany", "Sweden", "United States", "Netherlands"],
    militaryBranches: ["Maavoimat (Army)", "Merivoimat (Navy)", "Ilmavoimat (Air Force)"],
    activePersonnel: "~24,000 active, ~900,000 wartime reserve",
    defenseBudget: "~$7 billion",
    alliances: ["NATO (joined April 2023 — the alliance's first expansion after Russia's invasion of Ukraine)", "European Union"],
    summary:
      "Shares roughly 1,340 km of border with Russia — the longest of any NATO member — and maintains one of " +
      "Europe's largest mobilizable reserve forces via universal conscription.",
  },
  Estonia: {
    region: "Europe",
    capital: "Tallinn",
    population: "~1.37 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Kristen Michal (Reform Party) coalition government.",
    gdp: "~$40 billion (nominal)",
    majorExports: ["Machinery & electronics", "Wood products", "Mineral fuels"],
    topTradePartners: ["Finland", "Sweden", "Latvia", "Germany"],
    militaryBranches: ["Maavägi (Army)", "Merevägi (Navy)", "Õhuvägi (Air Force)"],
    activePersonnel: "~7,700 (conscription-based, with a large reserve)",
    defenseBudget: "~$1.3 billion (~3.4% of GDP — among the highest shares in NATO)",
    alliances: ["NATO (hosts an enhanced Forward Presence battlegroup)", "European Union"],
    summary:
      "A frontline Baltic state bordering Russia directly, with among the highest per-GDP defense spending in " +
      "NATO and a sizable ethnic-Russian minority that Moscow has periodically sought to leverage politically.",
  },
  Latvia: {
    region: "Europe",
    capital: "Riga",
    population: "~1.85 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Coalition government under PM Evika Siliņa (New Unity).",
    gdp: "~$45 billion (nominal)",
    majorExports: ["Wood products", "Machinery", "Agricultural & food products"],
    topTradePartners: ["Lithuania", "Estonia", "Germany"],
    militaryBranches: ["Sauszemes spēki (Army)", "Jūras spēki (Navy)", "Gaisa spēki (Air Force)", "Zemessardze (National Guard)"],
    activePersonnel: "~8,000–11,000 (conscription reintroduced in 2023)",
    defenseBudget: "~$1.4 billion (~3% of GDP)",
    alliances: ["NATO (hosts a Canada-led enhanced Forward Presence battlegroup)", "European Union"],
    summary:
      "A Baltic frontline state that reinstated conscription in 2023 amid heightened threat perception from " +
      "Russia, and hosts allied NATO forces as part of the alliance's post-2022 eastern-flank reinforcement.",
  },
  Lithuania: {
    region: "Europe",
    capital: "Vilnius",
    population: "~2.8 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Coalition led by the Social Democrats under President Gitanas Nausėda, following the 2024 election.",
    gdp: "~$83 billion (nominal)",
    majorExports: ["Machinery", "Refined petroleum", "Furniture", "Agricultural products"],
    topTradePartners: ["Latvia", "Poland", "Germany"],
    militaryBranches: ["Sausumos pajėgos (Land Force)", "Karinės oro pajėgos (Air Force)", "Karinis jūrų laivynas (Navy)"],
    activePersonnel: "~23,000 (conscription reinstated)",
    defenseBudget: "~$2.5 billion (~3% of GDP)",
    alliances: ["NATO (hosts a permanently based German armored brigade)", "European Union"],
    summary:
      "Sandwiched between Russia's Kaliningrad exclave and Belarus, making the narrow Suwałki Gap corridor — " +
      "linking it to Poland — a widely cited NATO chokepoint vulnerability.",
  },
  Belarus: {
    region: "Europe",
    capital: "Minsk",
    population: "~9.2 million",
    governmentType: "Presidential republic (authoritarian)",
    rulingParties: "President Alexander Lukashenko, in power since 1994; closely aligned with and dependent on Russia.",
    gdp: "~$70 billion (nominal)",
    majorExports: ["Potash", "Petroleum products", "Machinery", "Agricultural products"],
    topTradePartners: ["Russia (dominant)", "China"],
    militaryBranches: ["Ground Forces", "Air Force and Air Defense Forces"],
    activePersonnel: "~48,000",
    defenseBudget: "~$1 billion (opaque reporting)",
    alliances: ["CSTO (Russia-led)", "Union State with Russia"],
    summary:
      "Served as a staging ground for Russia's February 2022 invasion of Ukraine and has hosted Russian tactical " +
      "nuclear weapons since 2023; Lukashenko's government remains internationally isolated over the 2020 " +
      "disputed election and crackdown.",
  },
  Russia: {
    region: "Europe/Asia (transcontinental)",
    capital: "Moscow",
    population: "~144 million",
    governmentType: "Federal semi-presidential republic (authoritarian in practice)",
    rulingParties: "President Vladimir Putin, in power since 1999/2000; United Russia is the dominant party.",
    gdp: "~$2.1 trillion (nominal; substantially larger on a PPP basis)",
    majorExports: ["Crude oil & petroleum products", "Natural gas", "Metals", "Wheat & grain", "Arms"],
    topTradePartners: ["China (dominant, post-sanctions)", "India", "Turkey", "Belarus"],
    militaryBranches: ["Ground Forces", "Navy", "Aerospace Forces (VKS)", "Strategic Rocket Forces", "Rosgvardiya (National Guard)"],
    activePersonnel: "~1.15 million (largest standing force in Europe), plus a large mobilization base",
    defenseBudget: "~$110+ billion officially (likely understated); ~6–7% of GDP amid the Ukraine war",
    alliances: ["CSTO", "Shanghai Cooperation Organisation", "BRICS", "UN Security Council (permanent member)"],
    summary:
      "Engaged in a full-scale war against Ukraine since February 2022 and under extensive Western sanctions. " +
      "Holds the world's largest nuclear arsenal and a permanent UN Security Council seat.",
  },
  Ukraine: {
    region: "Europe",
    capital: "Kyiv",
    population: "~36–38 million (pre-war ~41M; significant wartime displacement)",
    governmentType: "Semi-presidential republic (under martial law since February 2022; elections suspended)",
    rulingParties: "President Volodymyr Zelensky (Servant of the People), in office since 2019.",
    gdp: "~$180 billion (nominal, war-depressed)",
    majorExports: ["Grain & agricultural products (major global wheat/corn/sunflower-oil exporter)", "Iron & steel", "Machinery"],
    topTradePartners: ["Poland", "Germany", "other EU states (Russia/China trade largely severed since 2022)"],
    militaryBranches: ["Ground Forces", "Air Force", "Navy", "National Guard", "Territorial Defense Forces"],
    activePersonnel: "~880,000–1,000,000 (wartime mobilization — one of Europe's largest current militaries)",
    defenseBudget: "~$50+ billion equivalent (majority foreign-funded/supported); ~25%+ of GDP in wartime spending",
    alliances: ["Not a NATO member (declared aspirant); extensive U.S./EU/UK military and financial support", "EU candidate status"],
    summary:
      "Fighting the largest active land war in Europe since World War II following Russia's February 2022 " +
      "full-scale invasion, sustained largely through Western military aid, financing, and intelligence support.",
  },
  Moldova: {
    region: "Europe",
    capital: "Chișinău",
    population: "~2.5 million",
    governmentType: "Parliamentary republic",
    rulingParties: "President Maia Sandu (PAS, pro-EU), re-elected 2024; PAS holds a parliamentary majority.",
    gdp: "~$16 billion (nominal)",
    majorExports: ["Wine & fruit", "Textiles", "Machinery"],
    topTradePartners: ["Romania", "Italy", "Germany"],
    militaryBranches: ["National Army (small, non-NATO force)"],
    activePersonnel: "~6,000–7,000",
    defenseBudget: "~$100–200 million (very limited)",
    alliances: ["Constitutionally neutral; EU candidate status (2022)"],
    summary:
      "The breakaway Transnistria region hosts an unrecognized pro-Russian administration and roughly 1,500 " +
      "Russian 'peacekeeping' troops, a persistent frozen-conflict risk on the EU's eastern border amid the Ukraine war.",
  },
  Croatia: {
    region: "Europe",
    capital: "Zagreb",
    population: "~3.85 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Andrej Plenković (HDZ) coalition government.",
    gdp: "~$85 billion (nominal)",
    majorExports: ["Machinery", "Ships", "Pharmaceuticals", "Tourism services"],
    topTradePartners: ["Germany", "Italy", "Slovenia"],
    militaryBranches: ["Hrvatska kopnena vojska (Army)", "Hrvatsko ratno zrakoplovstvo (Air Force)", "Hrvatska ratna mornarica (Navy)"],
    activePersonnel: "~16,000",
    defenseBudget: "~$1.5 billion",
    alliances: ["NATO", "European Union"],
    summary:
      "Adriatic NATO/EU member whose economy leans heavily on tourism; joined the eurozone and Schengen area in 2023.",
  },
  Slovenia: {
    region: "Europe",
    capital: "Ljubljana",
    population: "~2.1 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Robert Golob (Freedom Movement) coalition government.",
    gdp: "~$68 billion (nominal)",
    majorExports: ["Machinery", "Pharmaceuticals", "Motor vehicle parts"],
    topTradePartners: ["Germany", "Italy", "Austria", "Croatia"],
    militaryBranches: ["Slovenska vojska (unified small force)"],
    activePersonnel: "~7,000",
    defenseBudget: "~$800 million",
    alliances: ["NATO", "European Union"],
    summary:
      "One of the more economically stable ex-Yugoslav states, with a small professional military and close " +
      "integration into EU/NATO structures since the early 2000s.",
  },
  "Bosnia and Herzegovina": {
    region: "Europe",
    capital: "Sarajevo",
    population: "~3.2 million",
    governmentType: "Federal parliamentary republic (complex ethnic power-sharing under the Dayton Accords)",
    rulingParties:
      "Tripartite rotating presidency (Bosniak, Croat, Serb representatives); Republika Srpska leader Milorad " +
      "Dodik has repeatedly pushed secessionist rhetoric, straining central governance.",
    gdp: "~$27 billion (nominal)",
    majorExports: ["Base metals", "Machinery", "Furniture"],
    topTradePartners: ["Germany", "Croatia", "Serbia", "Italy"],
    militaryBranches: ["Armed Forces of Bosnia and Herzegovina (unified force since 2005)"],
    activePersonnel: "~8,000–10,000",
    defenseBudget: "~$250 million",
    alliances: ["NATO Partnership for Peace/aspirant (blocked by Republika Srpska/Serb-bloc objections)", "EU candidate status"],
    summary:
      "The EU-mandated EUFOR Althea peacekeeping mission remains deployed; Republika Srpska's periodic secessionist " +
      "moves and Dodik's Russia-friendly rhetoric are a recurring flashpoint for renewed instability.",
  },
  "Republic of Serbia": {
    region: "Europe",
    capital: "Belgrade",
    population: "~6.6 million",
    governmentType: "Parliamentary republic",
    rulingParties: "President Aleksandar Vučić (SNS), dominant in Serbian politics since 2012.",
    gdp: "~$80 billion (nominal)",
    majorExports: ["Machinery", "Motor vehicle parts", "Agricultural products", "Base metals"],
    topTradePartners: ["Germany", "Italy", "China", "Russia"],
    militaryBranches: ["Land Forces", "Air Force and Air Defence"],
    activePersonnel: "~28,000",
    defenseBudget: "~$1.5 billion",
    alliances: ["Formally militarily neutral; EU candidate while maintaining close China/Russia ties"],
    summary:
      "Pursues a balancing act between EU accession aspirations and continued close ties to Russia and China " +
      "(has not joined Western sanctions on Russia); does not recognize Kosovo's independence, and periodic unrest " +
      "flares in northern Kosovo's Serb-majority municipalities.",
  },
  Montenegro: {
    region: "Europe",
    capital: "Podgorica",
    population: "~620,000",
    governmentType: "Parliamentary republic",
    rulingParties: "Fragmented coalition politics following the 2023 election.",
    gdp: "~$7 billion (nominal)",
    majorExports: ["Aluminum & metals", "Electricity", "Tourism services"],
    topTradePartners: ["Serbia", "Italy", "Germany"],
    militaryBranches: ["Vojska Crne Gore (small unified force)"],
    activePersonnel: "~2,000",
    defenseBudget: "~$100 million",
    alliances: ["NATO (joined 2017)", "EU candidate status"],
    summary:
      "One of NATO's newest and smallest members; accession in 2017 was contested domestically and briefly " +
      "targeted by an alleged Russian-backed coup plot around the time it joined.",
  },
  Macedonia: {
    region: "Europe",
    capital: "Skopje",
    population: "~1.83 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Hristijan Mickoski (VMRO-DPMNE), since 2024.",
    gdp: "~$16 billion (nominal)",
    majorExports: ["Machinery & electrical equipment (auto parts for German suppliers)", "Iron & steel", "Textiles"],
    topTradePartners: ["Germany", "Serbia", "Greece"],
    militaryBranches: ["Army of North Macedonia (small unified force)"],
    activePersonnel: "~8,000",
    defenseBudget: "~$150 million",
    alliances: ["NATO (joined 2020)", "EU candidate status"],
    summary:
      "Formally renamed 'North Macedonia' in 2019 to resolve a decades-long naming dispute with Greece, clearing " +
      "the path to NATO membership in 2020; EU accession talks continue amid similar bilateral disputes with Bulgaria.",
  },
  Kosovo: {
    region: "Europe",
    capital: "Pristina",
    population: "~1.7 million",
    governmentType: "Parliamentary republic (partially recognized — roughly 100 UN member states recognize it; not recognized by Serbia, Russia, China, or five EU states)",
    rulingParties: "PM Albin Kurti (Vetëvendosje), re-elected 2025.",
    gdp: "~$11 billion (nominal)",
    majorExports: ["Base metals", "Minerals", "Machinery"],
    topTradePartners: ["Germany", "Albania", "North Macedonia"],
    militaryBranches: ["Kosovo Security Force (light forces, NATO-mentored, transitioning toward a full military)"],
    activePersonnel: "~5,000–6,000 (expanding)",
    defenseBudget: "~$120 million",
    alliances: ["Not a NATO/EU member; hosts the NATO-led KFOR peacekeeping mission (since 1999)"],
    summary:
      "Declared independence from Serbia in 2008 after the 1998–99 war and NATO intervention; friction persists " +
      "over northern Kosovo's Serb-majority municipalities, with periodic unrest and EU-mediated normalization talks ongoing.",
  },
  Albania: {
    region: "Europe",
    capital: "Tirana",
    population: "~2.75 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Edi Rama (Socialist Party), in power since 2013.",
    gdp: "~$25 billion (nominal)",
    majorExports: ["Textiles & footwear", "Minerals (chromium)", "Agricultural products", "Tourism services"],
    topTradePartners: ["Italy", "Germany", "Kosovo", "Greece"],
    militaryBranches: ["Armed Forces of Albania (small unified Army/Navy/Air units)"],
    activePersonnel: "~8,000",
    defenseBudget: "~$220 million",
    alliances: ["NATO (joined 2009)", "EU candidate status"],
    summary:
      "A NATO member since 2009 with EU accession talks ongoing; its coastline along the Adriatic/Ionian gives it " +
      "modest but growing strategic relevance for Mediterranean maritime security.",
  },

  // --- North & South America (added after Europe coverage) ---
  "United States of America": {
    region: "North America",
    capital: "Washington, D.C.",
    population: "~335 million",
    governmentType: "Federal presidential constitutional republic",
    rulingParties: "Executive and Congress composition shifts with each election cycle; check current officeholders for the latest alignment.",
    gdp: "~$27–29 trillion (nominal, world's largest)",
    majorExports: ["Refined petroleum & LNG", "Aircraft & aerospace", "Machinery & semiconductors", "Agricultural commodities", "Pharmaceuticals"],
    topTradePartners: ["Mexico", "Canada", "China", "Japan", "Germany"],
    militaryBranches: ["Army", "Navy", "Air Force", "Marine Corps", "Space Force", "Coast Guard"],
    activePersonnel: "~1.3 million active duty",
    defenseBudget: "~$850 billion (world's largest by far)",
    alliances: ["NATO", "Five Eyes", "AUKUS", "UN Security Council (permanent member)", "Bilateral treaties (Japan, South Korea, Australia, Philippines)"],
    summary:
      "The world's dominant military and economic power, with global force projection (carrier strike groups, " +
      "overseas basing, nuclear triad) and a dense web of alliances across Europe, the Indo-Pacific, and the Americas. " +
      "Central to nearly every major geopolitical flashpoint as a security guarantor, arms supplier, or mediator.",
  },
  Canada: {
    region: "North America",
    capital: "Ottawa",
    population: "~40 million",
    governmentType: "Federal parliamentary constitutional monarchy",
    rulingParties: "Federal government composition changes by election; Liberal and Conservative parties have alternated leading recent Parliaments.",
    gdp: "~$2.2 trillion (nominal)",
    majorExports: ["Crude oil & petroleum products", "Motor vehicles", "Machinery", "Lumber & wood products", "Potash & minerals"],
    topTradePartners: ["United States", "China", "Mexico", "United Kingdom", "Japan"],
    militaryBranches: ["Canadian Army", "Royal Canadian Navy", "Royal Canadian Air Force"],
    activePersonnel: "~68,000",
    defenseBudget: "~$33 billion (working toward NATO's 2% GDP target)",
    alliances: ["NATO", "NORAD (with the U.S.)", "Five Eyes", "G7"],
    summary:
      "A resource-rich G7 economy tightly integrated with the U.S. through NORAD continental defense and deep trade " +
      "ties. Arctic sovereignty and under-target defense spending relative to NATO commitments are recurring " +
      "strategic themes.",
  },
  Mexico: {
    region: "North America",
    capital: "Mexico City",
    population: "~128 million",
    governmentType: "Federal presidential republic",
    rulingParties: "Morena (left-populist) holds the presidency and Congressional majorities following the 2024 elections.",
    gdp: "~$1.8 trillion (nominal)",
    majorExports: ["Motor vehicles & auto parts", "Electronics & machinery", "Crude oil", "Agricultural products (avocados, produce)"],
    topTradePartners: ["United States", "China", "Canada", "Germany", "South Korea"],
    militaryBranches: ["Army (SEDENA, also runs the Air Force)", "Navy (SEMAR, includes Marines)"],
    activePersonnel: "~270,000",
    defenseBudget: "~$9–10 billion",
    alliances: ["USMCA (trade)", "Not a NATO member; close bilateral security cooperation with the U.S. on migration/counter-narcotics"],
    summary:
      "A top U.S. trading partner (via USMCA and nearshoring trends) whose security landscape is dominated by " +
      "powerful drug cartels contesting territory with state forces — a persistent internal-security rather than " +
      "conventional interstate concern.",
  },
  Guatemala: {
    region: "North America",
    capital: "Guatemala City",
    population: "~18 million",
    governmentType: "Presidential republic",
    rulingParties: "President Bernardo Arévalo (Semilla Movement, anti-corruption reformist), inaugurated 2024 after a contested transition.",
    gdp: "~$110 billion (nominal)",
    majorExports: ["Coffee", "Sugar", "Textiles & apparel", "Bananas & cardamom"],
    topTradePartners: ["United States", "El Salvador", "Honduras", "Mexico"],
    militaryBranches: ["Guatemalan Army (small Navy/Air components)"],
    activePersonnel: "~15,000",
    defenseBudget: "~$250 million",
    alliances: ["No major military alliance; CAFTA-DR trade pact with the U.S. and Central American neighbors"],
    summary:
      "Central America's largest economy by population; recent politics centered on a reformist president overcoming " +
      "an entrenched establishment's attempts to block his inauguration. Migration outflows to the U.S. remain a " +
      "dominant bilateral issue.",
  },
  Belize: {
    region: "North America",
    capital: "Belmopan",
    population: "~410,000",
    governmentType: "Parliamentary constitutional monarchy (Commonwealth realm)",
    rulingParties: "People's United Party government under PM Johnny Briceño, since 2020.",
    gdp: "~$3.3 billion (nominal)",
    majorExports: ["Sugar", "Bananas", "Citrus", "Marine products", "Tourism services"],
    topTradePartners: ["United States", "United Kingdom", "Caribbean Community (CARICOM) states"],
    militaryBranches: ["Belize Defence Force (small land/maritime unit)"],
    activePersonnel: "~1,500",
    defenseBudget: "~$30 million",
    alliances: ["Commonwealth", "CARICOM"],
    summary:
      "A small, low-conflict Commonwealth realm with a longstanding territorial dispute with Guatemala over its " +
      "western border, periodically referred to international adjudication (ICJ).",
  },
  "El Salvador": {
    region: "North America",
    capital: "San Salvador",
    population: "~6.3 million",
    governmentType: "Presidential republic",
    rulingParties: "President Nayib Bukele (Nuevas Ideas), holds a supermajority in the Legislative Assembly.",
    gdp: "~$35 billion (nominal)",
    majorExports: ["Textiles & apparel", "Coffee", "Sugar", "Electronics components"],
    topTradePartners: ["United States", "Guatemala", "Honduras"],
    militaryBranches: ["Armed Forces of El Salvador (Army, small Navy/Air Force)"],
    activePersonnel: "~30,000",
    defenseBudget: "~$200 million",
    alliances: ["CAFTA-DR trade pact; no major mutual-defense alliance"],
    summary:
      "Bukele's mass-incarceration crackdown on MS-13/Barrio 18 gangs sharply cut homicide rates while drawing " +
      "human-rights criticism; his consolidation of power (including a state of exception in force since 2022) is a " +
      "closely watched regional governance model.",
  },
  Honduras: {
    region: "North America",
    capital: "Tegucigalpa",
    population: "~10.6 million",
    governmentType: "Presidential republic",
    rulingParties: "President Xiomara Castro (LIBRE, left), first woman president, in office since 2022.",
    gdp: "~$34 billion (nominal)",
    majorExports: ["Coffee", "Textiles & apparel", "Bananas", "Palm oil", "Precious metals"],
    topTradePartners: ["United States", "Guatemala", "El Salvador"],
    militaryBranches: ["Armed Forces of Honduras (Army, Navy, Air Force)"],
    activePersonnel: "~17,000",
    defenseBudget: "~$400 million",
    alliances: ["CAFTA-DR; ended U.S. drug-interdiction basing tensions periodically resurface"],
    summary:
      "High emigration pressure (gang violence, poverty) drives large migrant flows toward the U.S.; Castro's " +
      "government has pursued closer ties with China (severing formal recognition of Taiwan in 2023).",
  },
  Nicaragua: {
    region: "North America",
    capital: "Managua",
    population: "~6.8 million",
    governmentType: "Presidential republic (widely described as increasingly authoritarian)",
    rulingParties: "President Daniel Ortega (FSLN/Sandinista), ruling continuously since 2007 with co-president/wife Rosario Murillo.",
    gdp: "~$16 billion (nominal)",
    majorExports: ["Coffee", "Beef", "Gold", "Textiles", "Sugar"],
    topTradePartners: ["United States", "Central American neighbors", "Mexico"],
    militaryBranches: ["Nicaraguan Army (small Navy/Air components)"],
    activePersonnel: "~12,000",
    defenseBudget: "~$100–150 million",
    alliances: ["Close ties with Russia, China, and Venezuela; not aligned with Western defense blocs"],
    summary:
      "Ortega's government has crushed opposition since the 2018 protests, stripped dissidents of citizenship, and " +
      "deepened alignment with Russia and Venezuela — a persistent friction point with the U.S. and OAS.",
  },
  "Costa Rica": {
    region: "North America",
    capital: "San José",
    population: "~5.2 million",
    governmentType: "Presidential republic",
    rulingParties: "President Rodrigo Chaves (Social Democratic Progress Party), since 2022.",
    gdp: "~$90 billion (nominal)",
    majorExports: ["Medical instruments", "Bananas", "Pineapples", "Coffee", "Electronics"],
    topTradePartners: ["United States", "China", "Netherlands", "Guatemala"],
    militaryBranches: ["No standing military (abolished 1948); Public Force handles internal security/border policing"],
    activePersonnel: "N/A (no military; ~14,000 police/public security personnel)",
    defenseBudget: "N/A (no defense ministry budget in the conventional sense)",
    alliances: ["OAS; relies on regional/U.S. security cooperation rather than a standing military"],
    summary:
      "Uniquely demilitarized since 1948, Costa Rica is a stable democracy and regional diplomatic hub, though drug " +
      "trafficking transit and rising gang-related violence have strained its unarmed public-security model in " +
      "recent years.",
  },
  Panama: {
    region: "North America",
    capital: "Panama City",
    population: "~4.4 million",
    governmentType: "Presidential republic",
    rulingParties: "President José Raúl Mulino (Realizing Goals party), since 2024.",
    gdp: "~$85 billion (nominal)",
    majorExports: ["Refined petroleum re-exports", "Bananas", "Seafood", "Canal transit/logistics services"],
    topTradePartners: ["United States", "China", "Costa Rica", "Netherlands"],
    militaryBranches: ["No standing army; National Police/National Border Service handle security"],
    activePersonnel: "N/A (no military; ~25,000 police/security personnel)",
    defenseBudget: "N/A (public security budget only)",
    alliances: ["No mutual-defense alliance; strategic partner to the U.S. given Canal security interests"],
    summary:
      "The Panama Canal remains one of the world's most strategically vital chokepoints; recent drought-driven " +
      "transit restrictions and U.S. political rhetoric about canal control have made it a recurring flashpoint " +
      "issue.",
  },
  Cuba: {
    region: "North America",
    capital: "Havana",
    population: "~11 million",
    governmentType: "One-party socialist republic",
    rulingParties: "Communist Party of Cuba (sole legal party); President Miguel Díaz-Canel since 2018, with Raúl Castro retaining influence.",
    gdp: "~$100–107 billion (nominal, official figures are opaque)",
    majorExports: ["Medical services/professionals", "Nickel", "Tobacco & cigars", "Sugar", "Pharmaceuticals"],
    topTradePartners: ["Venezuela", "China", "Russia", "Spain"],
    militaryBranches: ["Revolutionary Armed Forces (Army, Navy, Air Force/Air Defense)"],
    activePersonnel: "~50,000",
    defenseBudget: "Not publicly disclosed (estimated modest, constrained by economic crisis)",
    alliances: ["Close ties with Venezuela, Russia, and China; longstanding adversarial relationship with the U.S. (embargo since 1962)"],
    summary:
      "Under a decades-long U.S. embargo and a deepening economic crisis (chronic blackouts, fuel shortages, record " +
      "emigration), Cuba has leaned further on Russia and China for economic lifelines while maintaining one-party " +
      "rule.",
  },
  Jamaica: {
    region: "North America",
    capital: "Kingston",
    population: "~2.8 million",
    governmentType: "Parliamentary constitutional monarchy (Commonwealth realm)",
    rulingParties: "Jamaica Labour Party government under PM Andrew Holness, since 2016.",
    gdp: "~$20 billion (nominal)",
    majorExports: ["Bauxite/alumina", "Tourism services", "Sugar", "Rum", "Agricultural produce"],
    topTradePartners: ["United States", "United Kingdom", "Canada", "CARICOM states"],
    militaryBranches: ["Jamaica Defence Force (small Army, Coast Guard, Air Wing)"],
    activePersonnel: "~4,000",
    defenseBudget: "~$70 million",
    alliances: ["Commonwealth", "CARICOM"],
    summary:
      "A stable Commonwealth democracy grappling with one of the world's higher homicide rates driven by gang " +
      "violence and firearms trafficking (mostly from the U.S.); a discussion around transitioning to a republic " +
      "(removing the British monarch as head of state) has gained traction.",
  },
  Haiti: {
    region: "North America",
    capital: "Port-au-Prince",
    population: "~11.7 million",
    governmentType: "Presidential republic (currently without an elected president or functioning parliament)",
    rulingParties: "Governed since 2024 by a transitional Presidential Council amid state collapse; no elected president since 2021.",
    gdp: "~$20 billion (nominal)",
    majorExports: ["Apparel/textiles", "Essential oils", "Cocoa", "Mangoes"],
    topTradePartners: ["United States", "Dominican Republic"],
    militaryBranches: ["Small reconstituted Armed Forces of Haiti; national security relies mainly on the Haitian National Police"],
    activePersonnel: "~2,000 (military); police force severely under-resourced",
    defenseBudget: "Minimal; overshadowed by police/security spending",
    alliances: ["UN-backed Kenya-led Multinational Security Support mission (since 2024) assisting police operations"],
    summary:
      "Gangs control most of the capital and large swaths of territory following the 2021 presidential assassination " +
      "and total institutional collapse; a UN-authorized multinational security mission is attempting to restore " +
      "order amid a severe humanitarian crisis.",
  },
  "Dominican Republic": {
    region: "North America",
    capital: "Santo Domingo",
    population: "~11.3 million",
    governmentType: "Presidential republic",
    rulingParties: "President Luis Abinader (Modern Revolutionary Party), re-elected 2024.",
    gdp: "~$125 billion (nominal, one of the Caribbean's largest)",
    majorExports: ["Medical instruments", "Tourism services", "Gold", "Cigars", "Bananas & cacao"],
    topTradePartners: ["United States", "Haiti", "China", "Switzerland"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~56,000",
    defenseBudget: "~$700 million",
    alliances: ["CAFTA-DR; no mutual-defense pact"],
    summary:
      "One of the Caribbean's fastest-growing economies (tourism, mining, free-trade zones); has tightened border " +
      "controls and mass-deported Haitian migrants amid Haiti's collapse, a persistent bilateral friction point.",
  },
  "The Bahamas": {
    region: "North America",
    capital: "Nassau",
    population: "~410,000",
    governmentType: "Parliamentary constitutional monarchy (Commonwealth realm)",
    rulingParties: "Progressive Liberal Party government under PM Philip Davis, since 2021.",
    gdp: "~$14 billion (nominal)",
    majorExports: ["Tourism services", "Financial services", "Salt", "Aragonite", "Rum"],
    topTradePartners: ["United States", "CARICOM states"],
    militaryBranches: ["Royal Bahamas Defence Force (small maritime/coast guard force, no standing army)"],
    activePersonnel: "~1,200",
    defenseBudget: "~$60 million",
    alliances: ["Commonwealth", "CARICOM"],
    summary:
      "A tourism- and offshore-finance-dependent economy; its Defence Force focuses on maritime drug interdiction " +
      "and migrant-smuggling patrols in close cooperation with the U.S. Coast Guard.",
  },
  "Trinidad and Tobago": {
    region: "North America",
    capital: "Port of Spain",
    population: "~1.5 million",
    governmentType: "Parliamentary republic",
    rulingParties: "People's National Movement government under PM Keith Rowley/successor, coalition politics common.",
    gdp: "~$28 billion (nominal, energy-driven)",
    majorExports: ["Liquefied natural gas (LNG)", "Petrochemicals", "Ammonia & methanol", "Refined petroleum"],
    topTradePartners: ["United States", "CARICOM states", "Argentina"],
    militaryBranches: ["Trinidad and Tobago Defence Force (Army, Coast Guard, Air Guard)"],
    activePersonnel: "~4,000",
    defenseBudget: "~$150 million",
    alliances: ["CARICOM"],
    summary:
      "The Caribbean's largest oil/gas producer, giving it outsized regional economic weight; rising gang-related " +
      "gun violence (fueled by trafficking, some tied to Venezuela's crisis) has driven repeated states of emergency.",
  },
  "Puerto Rico": {
    region: "North America",
    capital: "San Juan",
    population: "~3.2 million",
    governmentType: "Unincorporated U.S. territory (self-governing commonwealth)",
    rulingParties: "Governor and legislature elected locally; territory status (statehood vs. independence vs. current commonwealth) is a recurring plebiscite issue.",
    gdp: "~$120 billion (nominal, GNP)",
    majorExports: ["Pharmaceuticals", "Medical devices", "Electronics", "Rum"],
    topTradePartners: ["United States (mainland, by far the dominant partner)"],
    militaryBranches: ["No independent military; hosts U.S. military installations; residents serve in U.S. armed forces"],
    activePersonnel: "N/A (part of U.S. armed forces)",
    defenseBudget: "N/A (funded as part of the U.S. federal defense budget)",
    alliances: ["U.S. territory; covered by all U.S. defense arrangements"],
    summary:
      "A U.S. territory whose residents are citizens but cannot vote in presidential elections and lack full " +
      "Congressional representation; recovering from a long debt crisis, Hurricane Maria's aftermath, and chronic " +
      "power-grid instability, with statehood status still unresolved.",
  },
  Colombia: {
    region: "South America",
    capital: "Bogotá",
    population: "~52 million",
    governmentType: "Presidential republic",
    rulingParties: "President Gustavo Petro (Pacto Histórico, first leftist president), since 2022; fragmented Congress.",
    gdp: "~$365 billion (nominal)",
    majorExports: ["Crude oil", "Coal", "Coffee", "Cut flowers", "Emeralds"],
    topTradePartners: ["United States", "China", "Panama", "Mexico"],
    militaryBranches: ["Army", "Navy", "Air Force", "National Police (separately organized, security-focused)"],
    activePersonnel: "~250,000 (military) + ~180,000 police",
    defenseBudget: "~$10 billion",
    alliances: ["NATO global partner (2018 partnership, not a member)", "Major non-NATO ally status with the U.S."],
    summary:
      "Decades of conflict with FARC largely ended via the 2016 peace deal, but dissident FARC factions, the ELN, " +
      "and drug-trafficking groups still contest territory; Petro's 'Total Peace' initiative seeks negotiated deals " +
      "with remaining armed groups.",
  },
  Venezuela: {
    region: "South America",
    capital: "Caracas",
    population: "~28 million (millions more have emigrated since 2015)",
    governmentType: "Presidential republic (widely described as authoritarian)",
    rulingParties: "President Nicolás Maduro (PSUV/Chavista), disputed re-election in 2024 amid allegations of fraud and opposition-claimed victory.",
    gdp: "~$100 billion (nominal, sharply diminished from oil-boom peak)",
    majorExports: ["Crude oil", "Petroleum products", "Gold"],
    topTradePartners: ["China", "United States (limited, sanctions-affected)", "India", "Cuba"],
    militaryBranches: ["National Bolivarian Armed Forces (Army, Navy, Air Force, National Guard)"],
    activePersonnel: "~120,000–150,000",
    defenseBudget: "Not transparently disclosed; degraded by economic crisis",
    alliances: ["Close ties with Russia, China, Cuba, Iran; not aligned with Western defense structures"],
    summary:
      "Maduro's disputed 2024 re-election, mass emigration (one of the world's largest displacement crises), and a " +
      "renewed territorial dispute with Guyana over the oil-rich Essequibo region make Venezuela one of the " +
      "hemisphere's most volatile flashpoints.",
  },
  Guyana: {
    region: "South America",
    capital: "Georgetown",
    population: "~810,000",
    governmentType: "Presidential republic (Commonwealth member)",
    rulingParties: "President Irfaan Ali (People's Progressive Party/Civic), since 2020.",
    gdp: "~$20 billion (nominal, among the world's fastest-growing due to new offshore oil)",
    majorExports: ["Crude oil (new offshore ExxonMobil-led production)", "Gold", "Bauxite", "Sugar & rice"],
    topTradePartners: ["United States", "Canada", "CARICOM states"],
    militaryBranches: ["Guyana Defence Force (small Army/Coast Guard/Air Corps)"],
    activePersonnel: "~3,400",
    defenseBudget: "~$70 million (rising with new oil revenue)",
    alliances: ["Commonwealth", "CARICOM"],
    summary:
      "Massive offshore oil discoveries have made Guyana one of the world's fastest-growing economies, sharpening " +
      "Venezuela's long-dormant claim to the Essequibo region (about two-thirds of Guyana's territory) into an " +
      "active flashpoint, including a 2023 Venezuelan annexation referendum.",
  },
  Suriname: {
    region: "South America",
    capital: "Paramaribo",
    population: "~620,000",
    governmentType: "Presidential republic",
    rulingParties: "President Chan Santokhi (Progressive Reform Party), since 2020.",
    gdp: "~$3.7 billion (nominal, poised to grow sharply with new offshore oil)",
    majorExports: ["Gold", "Crude oil", "Alumina", "Bananas & rice"],
    topTradePartners: ["Netherlands", "United States", "Switzerland", "CARICOM states"],
    militaryBranches: ["National Army of Suriname (small unified force)"],
    activePersonnel: "~2,000",
    defenseBudget: "~$25 million",
    alliances: ["CARICOM"],
    summary:
      "A small, ethnically diverse former Dutch colony on the cusp of an oil-driven economic transformation " +
      "following major offshore discoveries (TotalEnergies-led); historically low-conflict with stable if fragile " +
      "democratic institutions.",
  },
  Ecuador: {
    region: "South America",
    capital: "Quito",
    population: "~18 million",
    governmentType: "Presidential republic",
    rulingParties: "President Daniel Noboa (National Democratic Action, center-right), since 2023.",
    gdp: "~$120 billion (nominal)",
    majorExports: ["Crude oil", "Bananas", "Shrimp", "Cut flowers", "Cocoa"],
    topTradePartners: ["United States", "China", "Panama", "Chile"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~40,000",
    defenseBudget: "~$2.5 billion",
    alliances: ["No mutual-defense alliance; close security cooperation with the U.S. on counter-narcotics"],
    summary:
      "Once one of Latin America's safest countries, Ecuador has seen homicide rates spike as Mexican and Colombian " +
      "cartels moved operations through its ports; Noboa declared an 'internal armed conflict' against gangs in " +
      "early 2024 after a wave of prison riots and a televised studio takeover.",
  },
  Peru: {
    region: "South America",
    capital: "Lima",
    population: "~34 million",
    governmentType: "Presidential republic",
    rulingParties: "President Dina Boluarte (independent, formerly Perú Libre), since late 2022 after Pedro Castillo's ouster; deeply unpopular, fragmented Congress.",
    gdp: "~$260 billion (nominal)",
    majorExports: ["Copper", "Gold", "Zinc", "Fishmeal", "Agricultural produce"],
    topTradePartners: ["China", "United States", "European Union states"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~100,000",
    defenseBudget: "~$3 billion",
    alliances: ["No mutual-defense alliance; Pacific Alliance trade bloc"],
    summary:
      "Chronic political instability (six presidents since 2016) and deadly protests following Castillo's 2022 " +
      "self-coup attempt and ouster have eroded institutional trust; a major copper exporter with recurring social " +
      "unrest around mining projects.",
  },
  Bolivia: {
    region: "South America",
    capital: "Sucre (constitutional); La Paz (seat of government)",
    population: "~12 million",
    governmentType: "Presidential republic",
    rulingParties: "President Luis Arce (Movement for Socialism, MAS), since 2020; intense internal MAS rift with former president Evo Morales.",
    gdp: "~$45 billion (nominal)",
    majorExports: ["Natural gas", "Zinc & other minerals", "Soybeans", "Lithium (emerging)"],
    topTradePartners: ["Brazil", "Argentina", "United States", "China"],
    militaryBranches: ["Army", "Navy (river/lake force, no ocean coastline)", "Air Force"],
    activePersonnel: "~35,000",
    defenseBudget: "~$500 million",
    alliances: ["ALBA-associated; no Western mutual-defense alliance"],
    summary:
      "Holds some of the world's largest lithium reserves, drawing interest from China, Russia, and the U.S.; " +
      "an attempted military coup in mid-2024 was quickly put down, underscoring ongoing political volatility and " +
      "a bitter Arce–Morales power struggle within the ruling MAS party.",
  },
  Brazil: {
    region: "South America",
    capital: "Brasília",
    population: "~215 million (South America's largest)",
    governmentType: "Federal presidential republic",
    rulingParties: "President Luiz Inácio Lula da Silva (Workers' Party), since 2023; governs via a broad, fractious multi-party coalition.",
    gdp: "~$2.2 trillion (nominal, largest in Latin America)",
    majorExports: ["Soybeans", "Iron ore", "Crude oil", "Meat & poultry", "Sugar"],
    topTradePartners: ["China", "United States", "Argentina", "Netherlands"],
    militaryBranches: ["Army", "Navy (including a carrier-capable force)", "Air Force"],
    activePersonnel: "~360,000 (largest in South America)",
    defenseBudget: "~$20 billion",
    alliances: ["BRICS", "Mercosur", "No mutual-defense alliance; UN Security Council reform advocate for a permanent seat"],
    summary:
      "Latin America's dominant economic and military power, a BRICS founding member pursuing an independent " +
      "foreign policy (balancing ties with the U.S., China, and Russia); Amazon deforestation policy and organized " +
      "crime (PCC, Comando Vermelho) are major domestic security themes.",
  },
  Paraguay: {
    region: "South America",
    capital: "Asunción",
    population: "~6.8 million",
    governmentType: "Presidential republic",
    rulingParties: "President Santiago Peña (Colorado Party), since 2023 — the Colorado Party has governed nearly continuously since 1947.",
    gdp: "~$44 billion (nominal)",
    majorExports: ["Soybeans", "Beef", "Electricity (Itaipú/Yacyretá hydropower)", "Cereals"],
    topTradePartners: ["Brazil", "Argentina", "China (trade only — one of few states still recognizing Taiwan diplomatically)"],
    militaryBranches: ["Army", "Navy (river force)", "Air Force"],
    activePersonnel: "~13,000",
    defenseBudget: "~$300 million",
    alliances: ["Mercosur", "One of Taiwan's remaining diplomatic allies in South America"],
    summary:
      "A major hydropower exporter (Itaipú Dam, jointly run with Brazil) and one of the last South American states " +
      "to maintain formal diplomatic ties with Taiwan rather than China, a point of ongoing diplomatic pressure from " +
      "Beijing.",
  },
  Chile: {
    region: "South America",
    capital: "Santiago",
    population: "~19.5 million",
    governmentType: "Presidential republic",
    rulingParties: "President Gabriel Boric (left, Social Convergence/Frente Amplio), since 2022; governs with a divided Congress after two failed constitutional rewrite attempts.",
    gdp: "~$330 billion (nominal)",
    majorExports: ["Copper (world's top producer)", "Lithium", "Fruit & wine", "Salmon & seafood"],
    topTradePartners: ["China", "United States", "Japan", "South Korea"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~80,000",
    defenseBudget: "~$5 billion",
    alliances: ["No mutual-defense alliance; Pacific Alliance trade bloc; strong OAS/UN engagement"],
    summary:
      "The world's largest copper producer and a major lithium supplier, giving it outsized relevance to global " +
      "battery/EV supply chains; twice rejected new constitutions (2022, 2023) via referendum, leaving Pinochet-era " +
      "charter still formally in force with amendments.",
  },
  Argentina: {
    region: "South America",
    capital: "Buenos Aires",
    population: "~46 million",
    governmentType: "Federal presidential republic",
    rulingParties: "President Javier Milei (libertarian, La Libertad Avanza), since December 2023 — elected on a radical deregulation/dollarization-adjacent platform.",
    gdp: "~$640 billion (nominal, historically volatile)",
    majorExports: ["Soybeans & soy products", "Corn", "Beef", "Lithium (emerging)", "Wheat"],
    topTradePartners: ["Brazil", "China", "United States"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~75,000",
    defenseBudget: "~$3 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "Mercosur", "Maintains the long-running Falklands/Malvinas sovereignty claim against the UK"],
    summary:
      "Milei's shock-therapy austerity program has sharply cut inflation from triple-digit peaks but at a steep " +
      "social cost; the unresolved Falklands/Malvinas dispute with the UK (since the 1982 war) remains a nationalist " +
      "touchstone in foreign policy.",
  },
  Uruguay: {
    region: "South America",
    capital: "Montevideo",
    population: "~3.4 million",
    governmentType: "Presidential republic",
    rulingParties: "President Yamandú Orsi (Broad Front, left coalition), since March 2025, succeeding the center-right National Party's Lacalle Pou.",
    gdp: "~$77 billion (nominal)",
    majorExports: ["Beef", "Soybeans", "Cellulose/wood pulp", "Rice", "Dairy"],
    topTradePartners: ["Brazil", "China", "Argentina", "United States"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~15,000",
    defenseBudget: "~$1 billion",
    alliances: ["Mercosur", "No mutual-defense alliance"],
    summary:
      "Regularly ranked among Latin America's most stable, transparent democracies with strong rule-of-law and low " +
      "corruption indices; a consistent, low-volatility peer against which regional instability elsewhere is often " +
      "measured.",
  },
  "Falkland Islands": {
    region: "South America",
    capital: "Stanley",
    population: "~3,500",
    governmentType: "UK overseas territory (self-governing, with UK responsible for defense/foreign affairs)",
    rulingParties: "Local Legislative Assembly, non-partisan; UK-appointed Governor represents the Crown.",
    gdp: "~$300 million (nominal, fisheries- and tourism-driven)",
    majorExports: ["Squid & fish", "Wool", "Tourism services"],
    topTradePartners: ["United Kingdom", "Spain (via fisheries)", "Other EU states"],
    militaryBranches: ["No local military; garrisoned by British Forces South Atlantic Islands (UK Army/RAF/Royal Navy detachment)"],
    activePersonnel: "~1,200 (UK garrison)",
    defenseBudget: "N/A (funded by the UK Ministry of Defence)",
    alliances: ["UK overseas territory; defense guaranteed by the United Kingdom"],
    summary:
      "Site of the 1982 Falklands War between the UK and Argentina; Argentina's sovereignty claim (as the " +
      "'Malvinas') remains a live nationalist issue, though the islands have been self-governing and UK-defended " +
      "without major incident since the war.",
  },
  Greenland: {
    region: "North America",
    capital: "Nuuk",
    population: "~57,000",
    governmentType: "Self-governing territory within the Kingdom of Denmark",
    rulingParties: "Naleraq/Inuit Ataqatigiit-led local government has pushed for expanded autonomy and eventual independence from Denmark.",
    gdp: "~$3 billion (nominal, fisheries-dependent)",
    majorExports: ["Fish & shellfish (primarily shrimp and halibut)", "Rare earth minerals (emerging)"],
    topTradePartners: ["Denmark", "European Union states", "China (minerals interest)"],
    militaryBranches: ["No independent military; Danish Armed Forces (Arctic Command) and a U.S. Space Force base (Pituffik/Thule)"],
    activePersonnel: "N/A (Danish/U.S. forces garrison the territory)",
    defenseBudget: "N/A (funded by Denmark/NATO/U.S.)",
    alliances: ["Part of the Kingdom of Denmark (NATO member); hosts U.S. Pituffik Space Base"],
    summary:
      "Thrust into the spotlight by renewed U.S. interest (including proposals to acquire or annex it) in its " +
      "strategic Arctic location, rare-earth mineral deposits, and shrinking sea ice opening new shipping routes — " +
      "an active flashpoint in U.S.–Denmark relations and Greenlandic independence politics.",
  },

  // --- Africa (added after Europe/Americas coverage) ---
  Algeria: {
    region: "Africa",
    capital: "Algiers",
    population: "~46 million",
    governmentType: "Presidential republic",
    rulingParties: "President Abdelmadjid Tebboune (independent, military-backed), re-elected 2024; National Liberation Front (FLN) dominates the legislature.",
    gdp: "~$260 billion (nominal)",
    majorExports: ["Crude oil", "Natural gas/LNG", "Refined petroleum products"],
    topTradePartners: ["Italy", "France", "Spain", "China"],
    militaryBranches: ["People's National Army (Army, Navy, Air Force, Air Defense)"],
    activePersonnel: "~130,000",
    defenseBudget: "~$18–25 billion (Africa's largest defense budget)",
    alliances: ["African Union", "Arab League", "No Western mutual-defense alliance; major arms buyer from Russia"],
    summary:
      "North Africa's dominant military power (largely Russian-armed) and a key gas supplier to Europe; the " +
      "military-backed government maintains tight political control while tensions with Morocco over Western " +
      "Sahara remain a persistent regional friction point.",
  },
  Angola: {
    region: "Africa",
    capital: "Luanda",
    population: "~36 million",
    governmentType: "Presidential republic",
    rulingParties: "President João Lourenço (MPLA), ruling party in power continuously since independence (1975).",
    gdp: "~$110 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil", "Diamonds", "Refined petroleum"],
    topTradePartners: ["China", "United States", "India"],
    militaryBranches: ["Angolan Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~110,000",
    defenseBudget: "~$1.5–2 billion",
    alliances: ["African Union", "SADC", "Close economic ties with China (oil-for-loans)"],
    summary:
      "A major oil producer still dominated by the MPLA, which has ruled since independence from Portugal; " +
      "heavily indebted to China through oil-backed loans, with economic diversification efforts lagging.",
  },
  Benin: {
    region: "Africa",
    capital: "Porto-Novo (official); Cotonou (seat of government)",
    population: "~13.7 million",
    governmentType: "Presidential republic",
    rulingParties: "President Patrice Talon (Union Progressiste), since 2016.",
    gdp: "~$21 billion (nominal)",
    majorExports: ["Cotton", "Cashews", "Re-export trade (via Cotonou port to Sahel neighbors)"],
    topTradePartners: ["China", "India", "Nigeria", "France"],
    militaryBranches: ["Beninese Armed Forces (small unified force)"],
    activePersonnel: "~12,000",
    defenseBudget: "~$150–200 million",
    alliances: ["African Union", "ECOWAS"],
    summary:
      "A key West African trade corridor whose north has seen spillover jihadist attacks from the Sahel (JNIM/ISGS " +
      "affiliates), prompting expanded counter-terrorism cooperation with coastal neighbors.",
  },
  Botswana: {
    region: "Africa",
    capital: "Gaborone",
    population: "~2.5 million",
    governmentType: "Parliamentary republic",
    rulingParties: "President Duma Boko (Umbrella for Democratic Change), since 2024 — ending the Botswana Democratic Party's uninterrupted rule since 1966.",
    gdp: "~$20 billion (nominal)",
    majorExports: ["Diamonds", "Copper & nickel", "Beef"],
    topTradePartners: ["United Arab Emirates", "South Africa", "Belgium"],
    militaryBranches: ["Botswana Defence Force (Army, Air Wing)"],
    activePersonnel: "~9,000",
    defenseBudget: "~$400 million",
    alliances: ["African Union", "SADC"],
    summary:
      "One of Africa's most stable, well-governed democracies (world's largest diamond producer by value); the " +
      "2024 election ended nearly six decades of single-party rule in a peaceful, widely praised transition.",
  },
  "Burkina Faso": {
    region: "Africa",
    capital: "Ouagadougou",
    population: "~23 million",
    governmentType: "Military-led transitional government",
    rulingParties: "Captain Ibrahim Traoré, military junta leader since a September 2022 coup (the country's second coup that year).",
    gdp: "~$21 billion (nominal)",
    majorExports: ["Gold", "Cotton", "Livestock"],
    topTradePartners: ["Switzerland (gold trade)", "Mali", "Ivory Coast"],
    militaryBranches: ["Burkinabé Armed Forces (Army, Air Force); allied Volunteers for the Defense of the Homeland militia"],
    activePersonnel: "~11,000 (plus tens of thousands of civilian militia)",
    defenseBudget: "~$500 million (wartime priority spending)",
    alliances: ["Alliance of Sahel States (with Mali and Niger); withdrew from ECOWAS in 2024; expelled French forces, deepened ties with Russia/Wagner"],
    summary:
      "Among the epicenters of the Sahel jihadist insurgency (JNIM, ISGS), with roughly half the country outside " +
      "government control; the junta has pivoted from French to Russian security partnerships and co-founded the " +
      "Alliance of Sahel States after quitting ECOWAS.",
  },
  Burundi: {
    region: "Africa",
    capital: "Gitega",
    population: "~13 million",
    governmentType: "Presidential republic",
    rulingParties: "President Évariste Ndayishimiye (CNDD-FDD), since 2020.",
    gdp: "~$3.5 billion (nominal, one of the world's poorest and most densely populated countries)",
    majorExports: ["Coffee (dominant export crop)", "Tea", "Gold"],
    topTradePartners: ["United Arab Emirates", "Democratic Republic of the Congo", "Uganda"],
    militaryBranches: ["Burundi National Defence Force (small Army)"],
    activePersonnel: "~30,000",
    defenseBudget: "~$60–80 million",
    alliances: ["African Union", "East African Community", "Deployed troops to Somalia's AU mission"],
    summary:
      "Recovering from a 2015 political crisis and ethnic-tinged unrest sparked by a disputed third-term bid; " +
      "remains one of the world's poorest, most aid-dependent nations, with tense relations with neighboring " +
      "Rwanda over alleged cross-border rebel support.",
  },
  Cameroon: {
    region: "Africa",
    capital: "Yaoundé",
    population: "~28 million",
    governmentType: "Presidential republic",
    rulingParties: "President Paul Biya (Cameroon People's Democratic Movement), in power since 1982 — one of the world's longest-ruling heads of state.",
    gdp: "~$50 billion (nominal)",
    majorExports: ["Crude oil", "Cocoa", "Timber", "Cotton"],
    topTradePartners: ["China", "France", "Netherlands"],
    militaryBranches: ["Cameroon Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~35,000 (plus paramilitary gendarmerie)",
    defenseBudget: "~$400–500 million",
    alliances: ["African Union", "ECCAS", "Close security ties with France and the U.S. (counter-Boko Haram)"],
    summary:
      "Faces two simultaneous conflicts: a Boko Haram/ISWAP insurgency in the Far North and an Anglophone " +
      "separatist crisis in the Northwest/Southwest regions since 2016; the 92-year-old Biya's succession is a " +
      "growing source of uncertainty.",
  },
  "Central African Republic": {
    region: "Africa",
    capital: "Bangui",
    population: "~5.7 million",
    governmentType: "Presidential republic",
    rulingParties: "President Faustin-Archange Touadéra, since 2016; extended his rule via a 2023 constitutional referendum removing term limits.",
    gdp: "~$2.5 billion (nominal, among the world's poorest)",
    majorExports: ["Diamonds", "Gold", "Timber"],
    topTradePartners: ["China", "France", "United Arab Emirates"],
    militaryBranches: ["Central African Armed Forces (small, heavily supplemented by Russian Wagner/Africa Corps mercenaries)"],
    activePersonnel: "~9,000 (national forces; Russian mercenary presence adds significant additional force)",
    defenseBudget: "Minimal; security largely underwritten by Russia and a UN peacekeeping mission (MINUSCA)",
    alliances: ["Deep security dependence on Russia (Wagner/Africa Corps); hosts a large UN peacekeeping mission"],
    summary:
      "A fragile state where roughly half the territory has historically been contested by armed groups; Russian " +
      "Wagner Group (now rebranded Africa Corps) forces prop up the government in exchange for access to gold and " +
      "diamond resources, a flagship case of Russia's Africa security-for-resources model.",
  },
  Chad: {
    region: "Africa",
    capital: "N'Djamena",
    population: "~18 million",
    governmentType: "Presidential republic",
    rulingParties: "President Mahamat Idriss Déby (National Movement for the Salvation of Chad), took power after his father's 2021 death, formally elected 2024.",
    gdp: "~$14 billion (nominal)",
    majorExports: ["Crude oil", "Cotton", "Livestock", "Gum arabic"],
    topTradePartners: ["United States", "China", "India"],
    militaryBranches: ["Chadian National Army (regarded as one of the region's most combat-effective forces)"],
    activePersonnel: "~30,000–35,000",
    defenseBudget: "~$300–400 million",
    alliances: ["African Union", "G5 Sahel (defunct)", "Key French/U.S. counter-terrorism partner in the Sahel/Lake Chad basin"],
    summary:
      "A hereditary power transfer (father to son) followed a 2021 battlefield death, unusual even by regional " +
      "standards; hosts significant French military presence and is a frontline state against Boko Haram/ISWAP " +
      "around Lake Chad, while managing large refugee inflows from Sudan's civil war.",
  },
  "Democratic Republic of the Congo": {
    region: "Africa",
    capital: "Kinshasa",
    population: "~102 million",
    governmentType: "Presidential republic",
    rulingParties: "President Félix Tshisekedi (Union for Democracy and Social Progress-aligned coalition), re-elected 2023.",
    gdp: "~$70 billion (nominal, vast untapped mineral wealth)",
    majorExports: ["Copper", "Cobalt (world's top producer, critical for EV batteries)", "Diamonds", "Gold"],
    topTradePartners: ["China", "United Arab Emirates", "South Africa"],
    militaryBranches: ["Armed Forces of the DRC (FARDC) — Army, Navy, Air Force"],
    activePersonnel: "~130,000–160,000",
    defenseBudget: "~$500 million–1 billion",
    alliances: ["African Union", "SADC deployed troops in support; large UN peacekeeping mission (MONUSCO)"],
    summary:
      "The war in the mineral-rich east has escalated sharply since 2021–2025 as the M23 rebel group (backed by " +
      "Rwanda, per UN experts) seized major cities including Goma and Bukavu — one of the world's largest ongoing " +
      "humanitarian crises, layered atop the globally critical cobalt/coltan supply chain.",
  },
  Djibouti: {
    region: "Africa",
    capital: "Djibouti (city)",
    population: "~1.1 million",
    governmentType: "Presidential republic",
    rulingParties: "President Ismaïl Omar Guelleh (People's Rally for Progress), in power since 1999.",
    gdp: "~$4 billion (nominal, strategic-location/logistics-driven)",
    majorExports: ["Re-export trade (transshipment)", "Livestock", "Port/logistics services"],
    topTradePartners: ["Ethiopia (dependent transit trade)", "China", "Somalia"],
    militaryBranches: ["Djiboutian Armed Forces (small national force)"],
    activePersonnel: "~10,500",
    defenseBudget: "~$50–70 million (national forces; dwarfed by foreign base lease revenue)",
    alliances: ["Hosts military bases for France, the U.S. (Camp Lemonnier), China, Japan, and Italy — a rare multinational basing hub"],
    summary:
      "Its strategic position at the Bab-el-Mandeb chokepoint (Red Sea/Gulf of Aden) makes it host to the largest " +
      "concentration of foreign military bases in Africa, including China's only overseas base — generating " +
      "outsized geopolitical relevance and lease-revenue income for its small economy.",
  },
  Egypt: {
    region: "Africa",
    capital: "Cairo",
    population: "~112 million",
    governmentType: "Presidential republic",
    rulingParties: "President Abdel Fattah el-Sisi (independent, military-backed), re-elected 2024.",
    gdp: "~$380 billion (nominal)",
    majorExports: ["Crude oil & petroleum products", "Natural gas", "Textiles", "Agricultural produce"],
    topTradePartners: ["United States", "China", "Italy", "Saudi Arabia"],
    militaryBranches: ["Army", "Navy", "Air Force", "Air Defense Command"],
    activePersonnel: "~440,000 (one of the largest militaries in the Middle East/Africa)",
    defenseBudget: "~$5–6 billion (reported; actual spending believed higher)",
    alliances: ["Major non-NATO ally status with the U.S.", "Arab League", "African Union", "Operates the Suez Canal, a top global chokepoint"],
    summary:
      "Controls the Suez Canal, one of the world's most critical shipping chokepoints, repeatedly disrupted by " +
      "Houthi Red Sea attacks since 2023–2024, costing Egypt billions in transit-fee revenue; a top recipient of " +
      "U.S. military aid and a key mediator in Gaza ceasefire diplomacy.",
  },
  "Equatorial Guinea": {
    region: "Africa",
    capital: "Malabo",
    population: "~1.7 million",
    governmentType: "Presidential republic (widely regarded as authoritarian)",
    rulingParties: "President Teodoro Obiang Nguema Mbasogo, in power since 1979 — Africa's longest-serving head of state.",
    gdp: "~$12 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil", "Natural gas (LNG)", "Methanol"],
    topTradePartners: ["China", "Spain", "United States"],
    militaryBranches: ["Equatoguinean Armed Forces (small unified force)"],
    activePersonnel: "~2,000",
    defenseBudget: "Not publicly disclosed (modest)",
    alliances: ["African Union", "ECCAS"],
    summary:
      "Small but oil-wealthy, with governance dominated by one family for over four decades amid persistent " +
      "allegations of corruption and human-rights abuses; oil revenues have not translated into broad-based " +
      "development.",
  },
  Eritrea: {
    region: "Africa",
    capital: "Asmara",
    population: "~3.7 million",
    governmentType: "One-party authoritarian state (no elections held since independence)",
    rulingParties: "President Isaias Afwerki (People's Front for Democracy and Justice, sole legal party), in power since independence (1993).",
    gdp: "~$2.5 billion (nominal, one of the world's most closed economies)",
    majorExports: ["Gold & minerals", "Livestock", "Textiles"],
    topTradePartners: ["China", "United Arab Emirates"],
    militaryBranches: ["Eritrean Defence Forces (Army, small Navy/Air Force); indefinite compulsory national service"],
    activePersonnel: "~200,000 (large relative to population, due to open-ended conscription)",
    defenseBudget: "Not publicly disclosed",
    alliances: ["Close ties with Ethiopia's federal government (fought alongside it against Tigray forces 2020–22); historically isolated diplomatically"],
    summary:
      "One of the world's most closed, tightly controlled states, built around indefinite national conscription; " +
      "Eritrean forces' role in Ethiopia's Tigray war (2020–2022) and lingering troop presence remain a regional " +
      "flashpoint.",
  },
  Ethiopia: {
    region: "Africa",
    capital: "Addis Ababa",
    population: "~128 million (Africa's second most populous)",
    governmentType: "Federal parliamentary republic",
    rulingParties: "Prosperity Party under PM Abiy Ahmed, since 2018 (Nobel Peace Prize 2019 for the Eritrea peace deal).",
    gdp: "~$160–210 billion (nominal)",
    majorExports: ["Coffee", "Oilseeds", "Cut flowers", "Gold"],
    topTradePartners: ["China", "United States", "United Arab Emirates"],
    militaryBranches: ["Ethiopian National Defense Force (Army, Air Force)"],
    activePersonnel: "~140,000–160,000 (post-Tigray war drawdown)",
    defenseBudget: "~$500 million–1 billion",
    alliances: ["African Union headquarters host; no mutual-defense alliance; disputes with Egypt/Sudan over the Grand Ethiopian Renaissance Dam"],
    summary:
      "The 2020–2022 Tigray war killed hundreds of thousands before a fragile peace deal; ongoing unrest in Amhara " +
      "and Oromia regions, a 2024 port-access deal with Somaliland (angering Somalia), and the unresolved Nile dam " +
      "dispute with Egypt keep it a central East African flashpoint.",
  },
  Gabon: {
    region: "Africa",
    capital: "Libreville",
    population: "~2.4 million",
    governmentType: "Presidential republic (military-transitional)",
    rulingParties: "General Brice Oligui Nguema, took power in an August 2023 coup ending the Bongo family's 56-year rule; elected president in 2025 transitional polls.",
    gdp: "~$20 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil", "Manganese", "Timber"],
    topTradePartners: ["China", "United States", "France"],
    militaryBranches: ["Gabonese Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~5,000",
    defenseBudget: "~$200 million",
    alliances: ["African Union (suspended after the coup, later reinstated); ECCAS"],
    summary:
      "A 2023 coup ended the Bongo family's 56-year dynastic rule, part of a broader wave of West/Central African " +
      "military takeovers; the junta leader was subsequently elected president in a transitional vote widely seen " +
      "as consolidating military control.",
  },
  Gambia: {
    region: "Africa",
    capital: "Banjul",
    population: "~2.7 million",
    governmentType: "Presidential republic",
    rulingParties: "President Adama Barrow (National People's Party), since 2017, ending Yahya Jammeh's 22-year authoritarian rule.",
    gdp: "~$2.5 billion (nominal)",
    majorExports: ["Groundnuts (peanuts)", "Cashews", "Fish", "Tourism services"],
    topTradePartners: ["Mali", "Senegal", "China"],
    militaryBranches: ["Gambian Armed Forces (small unified force)"],
    activePersonnel: "~2,500",
    defenseBudget: "~$30 million",
    alliances: ["African Union", "ECOWAS"],
    summary:
      "A small democracy still working through transitional justice for the Jammeh dictatorship's human-rights " +
      "abuses (a truth commission recommended prosecutions); tourism and remittances are key economic pillars.",
  },
  Ghana: {
    region: "Africa",
    capital: "Accra",
    population: "~34 million",
    governmentType: "Presidential republic",
    rulingParties: "President John Mahama (National Democratic Congress), returned to power in the December 2024 election.",
    gdp: "~$76 billion (nominal)",
    majorExports: ["Gold", "Cocoa", "Crude oil", "Timber"],
    topTradePartners: ["Switzerland (gold trade)", "China", "India", "United Arab Emirates"],
    militaryBranches: ["Ghana Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~15,000",
    defenseBudget: "~$250–300 million",
    alliances: ["African Union", "ECOWAS", "Longstanding UN peacekeeping contributor"],
    summary:
      "One of West Africa's most stable multiparty democracies with regular peaceful transfers of power; recently " +
      "restructured sovereign debt after a 2022 default, and remains a top global gold and cocoa producer.",
  },
  Guinea: {
    region: "Africa",
    capital: "Conakry",
    population: "~14 million",
    governmentType: "Military-led transitional government",
    rulingParties: "Colonel Mamadi Doumbouya, military junta leader since a September 2021 coup.",
    gdp: "~$21 billion (nominal)",
    majorExports: ["Bauxite (world's top exporter)", "Gold", "Alumina"],
    topTradePartners: ["China", "United Arab Emirates", "India"],
    militaryBranches: ["Guinean Armed Forces (Army, small Navy/Air Force)"],
    activePersonnel: "~12,000",
    defenseBudget: "~$150 million",
    alliances: ["African Union (suspended after the coup); ECOWAS relations strained over transition timeline"],
    summary:
      "The world's top bauxite exporter (critical for global aluminum supply chains), under military rule since " +
      "2021; the junta has repeatedly delayed a promised return to civilian government, straining ties with " +
      "ECOWAS.",
  },
  "Guinea-Bissau": {
    region: "Africa",
    capital: "Bissau",
    population: "~2.1 million",
    governmentType: "Presidential republic (history of chronic instability)",
    rulingParties: "President Umaro Sissoco Embaló, since 2020; the country has experienced numerous coups and attempted coups since independence.",
    gdp: "~$1.9 billion (nominal, one of the world's poorest)",
    majorExports: ["Cashews (dominant export crop)", "Fish", "Timber"],
    topTradePartners: ["India", "Senegal", "China"],
    militaryBranches: ["Guinea-Bissau Armed Forces (small unified force, historically prone to political intervention)"],
    activePersonnel: "~4,500",
    defenseBudget: "~$25 million",
    alliances: ["African Union", "ECOWAS", "CPLP (Community of Portuguese Language Countries)"],
    summary:
      "One of the world's most coup-prone states, long labeled a hub for transatlantic cocaine trafficking due to " +
      "weak institutions and porous borders; near-total economic reliance on cashew exports leaves it acutely " +
      "vulnerable to price shocks.",
  },
  "Ivory Coast": {
    region: "Africa",
    capital: "Yamoussoukro (official); Abidjan (economic capital/seat of government)",
    population: "~30 million",
    governmentType: "Presidential republic",
    rulingParties: "President Alassane Ouattara (Rally of Houphouëtists for Democracy and Peace), serving a fourth term after a disputed 2020 constitutional reinterpretation.",
    gdp: "~$78 billion (nominal, West Africa's second largest)",
    majorExports: ["Cocoa (world's top producer)", "Cashews", "Gold", "Rubber", "Crude oil"],
    topTradePartners: ["Netherlands", "United States", "France", "Mali"],
    militaryBranches: ["Ivorian Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~24,000",
    defenseBudget: "~$500 million",
    alliances: ["African Union", "ECOWAS", "Close French/U.S. security partner amid Sahel spillover concerns"],
    summary:
      "The world's top cocoa producer and a regional economic anchor; recovered from a 2010–11 post-election civil " +
      "conflict but faces creeping jihadist spillover from Burkina Faso/Mali in its north, and periodic controversy " +
      "over Ouattara's extended tenure.",
  },
  Kenya: {
    region: "Africa",
    capital: "Nairobi",
    population: "~55 million",
    governmentType: "Presidential republic",
    rulingParties: "President William Ruto (United Democratic Alliance/Kenya Kwanza coalition), since 2022.",
    gdp: "~$115 billion (nominal, East Africa's economic hub)",
    majorExports: ["Tea", "Cut flowers", "Coffee", "Horticultural produce"],
    topTradePartners: ["United States", "Uganda", "European Union states", "China"],
    militaryBranches: ["Kenya Defence Forces (Army, Navy, Air Force)"],
    activePersonnel: "~25,000",
    defenseBudget: "~$1.2 billion",
    alliances: ["Major non-NATO ally status with the U.S. (designated 2024)", "African Union", "EAC", "Troop contributor to AU/UN missions in Somalia and Haiti"],
    summary:
      "East Africa's diplomatic and economic hub, and the first sub-Saharan African country designated a major " +
      "non-NATO U.S. ally; major 2024 anti-tax protests (Gen Z-led) forced cabinet reshuffles, while Kenyan troops " +
      "lead the multinational security mission in Haiti and fight al-Shabaab in Somalia.",
  },
  Lesotho: {
    region: "Africa",
    capital: "Maseru",
    population: "~2.3 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "Coalition government under PM Sam Matekane (Revolution for Prosperity), since 2022; King Letsie III is head of state.",
    gdp: "~$2.3 billion (nominal)",
    majorExports: ["Textiles & apparel (AGOA-driven)", "Diamonds", "Water (exported to South Africa via the Lesotho Highlands project)"],
    topTradePartners: ["South Africa (near-total economic dependence)", "United States"],
    militaryBranches: ["Lesotho Defence Force (small Army)"],
    activePersonnel: "~2,000",
    defenseBudget: "~$40 million",
    alliances: ["African Union", "SADC (has deployed stabilization forces into Lesotho previously)"],
    summary:
      "An enclave entirely surrounded by South Africa, almost fully economically dependent on it; a history of " +
      "political instability and army factionalism has periodically prompted SADC intervention to stabilize the " +
      "government.",
  },
  Liberia: {
    region: "Africa",
    capital: "Monrovia",
    population: "~5.4 million",
    governmentType: "Presidential republic",
    rulingParties: "President Joseph Boakai (Unity Party), since 2024, defeating incumbent George Weah in a peaceful transfer of power.",
    gdp: "~$4.5 billion (nominal)",
    majorExports: ["Iron ore", "Rubber", "Gold", "Timber"],
    topTradePartners: ["United States", "Poland", "Switzerland"],
    militaryBranches: ["Armed Forces of Liberia (rebuilt with U.S. assistance after the civil wars)"],
    activePersonnel: "~2,000",
    defenseBudget: "~$40 million",
    alliances: ["African Union", "ECOWAS", "Historic close ties with the United States"],
    summary:
      "Founded by freed American slaves, it endured back-to-back civil wars (1989–2003) before rebuilding under UN " +
      "peacekeeping and U.S.-backed security assistance; the 2024 peaceful election transfer reinforced its " +
      "post-war democratic recovery.",
  },
  Libya: {
    region: "Africa",
    capital: "Tripoli (contested seat)",
    population: "~7 million",
    governmentType: "Divided/contested — no unified national government since 2014",
    rulingParties: "Rival administrations: the UN-recognized Government of National Unity (Tripoli, west) vs. a rival government aligned with commander Khalifa Haftar's Libyan National Army (Benghazi, east).",
    gdp: "~$40–45 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil", "Natural gas"],
    topTradePartners: ["Italy", "China", "Germany"],
    militaryBranches: ["Fragmented — GNU-aligned forces (west) and the Haftar-led Libyan National Army (east), plus assorted militias"],
    activePersonnel: "Fragmented; estimated 100,000+ combined across rival factions and militias",
    defenseBudget: "Not centrally tracked amid the political split",
    alliances: ["GNU backed by Turkey; Haftar's LNA backed by Russia (Wagner/Africa Corps), Egypt, and the UAE"],
    summary:
      "Split since the 2011 fall of Gaddafi and a 2014 civil war into rival western (Tripoli) and eastern " +
      "(Benghazi/Haftar) governments backed by competing foreign patrons (Turkey vs. Russia/UAE/Egypt); a major " +
      "migration transit point to Europe and a persistent proxy-conflict zone.",
  },
  Madagascar: {
    region: "Africa",
    capital: "Antananarivo",
    population: "~30 million",
    governmentType: "Presidential republic",
    rulingParties: "President Andry Rajoelina (TGV/IRD coalition), re-elected 2023 amid opposition boycotts alleging irregularities.",
    gdp: "~$16 billion (nominal, among the world's poorest despite unique biodiversity)",
    majorExports: ["Vanilla (world's top producer)", "Nickel & cobalt", "Textiles", "Cloves"],
    topTradePartners: ["France", "United States", "China"],
    militaryBranches: ["Madagascar Armed Forces (small Army, Navy, Gendarmerie)"],
    activePersonnel: "~14,000 (plus large gendarmerie)",
    defenseBudget: "~$60–80 million",
    alliances: ["African Union", "SADC"],
    summary:
      "The world's top vanilla producer, prone to price-shock boom/bust cycles; chronic political instability " +
      "(repeated contested elections and past coups) coexists with globally unique but severely threatened " +
      "biodiversity.",
  },
  Malawi: {
    region: "Africa",
    capital: "Lilongwe",
    population: "~21 million",
    governmentType: "Presidential republic",
    rulingParties: "President Peter Mutharika (Democratic Progressive Party), returned to power in the September 2025 election.",
    gdp: "~$13 billion (nominal, among the world's poorest)",
    majorExports: ["Tobacco (dominant export crop)", "Tea", "Sugar", "Cotton"],
    topTradePartners: ["Belgium", "South Africa", "United States"],
    militaryBranches: ["Malawi Defence Force (small Army, Air Wing)"],
    activePersonnel: "~10,500",
    defenseBudget: "~$40–50 million",
    alliances: ["African Union", "SADC"],
    summary:
      "Heavily reliant on tobacco exports and donor aid, with recurring food-security crises from droughts/cyclones " +
      "exacerbated by climate change; peaceful democratic transitions have generally held despite deep poverty.",
  },
  Mali: {
    region: "Africa",
    capital: "Bamako",
    population: "~23 million",
    governmentType: "Military-led transitional government",
    rulingParties: "Colonel Assimi Goïta, military junta leader following coups in 2020 and 2021; postponed promised elections indefinitely.",
    gdp: "~$19 billion (nominal)",
    majorExports: ["Gold (major producer)", "Cotton", "Livestock"],
    topTradePartners: ["Switzerland (gold trade)", "Senegal", "China"],
    militaryBranches: ["Malian Armed Forces (Army, Air Force), heavily supported by Russian Wagner/Africa Corps mercenaries"],
    activePersonnel: "~25,000 (plus significant Russian mercenary presence)",
    defenseBudget: "~$500 million–1 billion (wartime priority spending)",
    alliances: ["Alliance of Sahel States (with Burkina Faso and Niger); withdrew from ECOWAS in 2024; expelled French/UN forces, partnered with Russia"],
    summary:
      "Ground zero of the Sahel jihadist crisis (JNIM, ISGS) and Russia's 'Africa Corps' security-for-resources " +
      "model after expelling French and UN (MINUSMA) forces; a 2024 Tuareg/JNIM rebel offensive retook territory in " +
      "the north, and the junta co-founded the breakaway Alliance of Sahel States.",
  },
  Mauritania: {
    region: "Africa",
    capital: "Nouakchott",
    population: "~5 million",
    governmentType: "Presidential republic",
    rulingParties: "President Mohamed Ould Ghazouani (El Insaf party), re-elected 2024.",
    gdp: "~$11 billion (nominal)",
    majorExports: ["Iron ore", "Fish/seafood", "Gold", "Copper"],
    topTradePartners: ["China", "Switzerland", "Spain"],
    militaryBranches: ["Mauritanian Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~20,000",
    defenseBudget: "~$250 million",
    alliances: ["African Union", "Arab Maghreb Union", "Key Western counter-terrorism partner (relatively insulated from Sahel jihadist spread compared to neighbors)"],
    summary:
      "Notably more stable than its Sahel neighbors despite proximity to the jihadist insurgency, credited to " +
      "proactive counter-terrorism and community engagement; new offshore gas developments (with Senegal) are set " +
      "to reshape its economy.",
  },
  Morocco: {
    region: "Africa",
    capital: "Rabat",
    population: "~37.5 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "King Mohammed VI holds ultimate authority; National Rally of Independents-led government under PM Aziz Akhannouch since 2021.",
    gdp: "~$150 billion (nominal)",
    majorExports: ["Automobiles & parts (major EU supplier)", "Phosphates & fertilizers", "Textiles", "Agricultural produce"],
    topTradePartners: ["Spain", "France", "United States"],
    militaryBranches: ["Royal Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~200,000+",
    defenseBudget: "~$5–6 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "African Union", "Arab League", "Abraham Accords signatory (normalized ties with Israel, 2020)"],
    summary:
      "Controls most of disputed Western Sahara, a decades-old territorial dispute with the Polisario Front " +
      "(backed by Algeria) that keeps Morocco-Algeria relations severed; the 2020 U.S. recognition of Moroccan " +
      "sovereignty over Western Sahara (tied to Abraham Accords normalization) remains diplomatically contentious.",
  },
  Mozambique: {
    region: "Africa",
    capital: "Maputo",
    population: "~34 million",
    governmentType: "Presidential republic",
    rulingParties: "President Daniel Chapo (FRELIMO), since 2025 — FRELIMO has ruled since independence (1975); the 2024 election result triggered deadly nationwide protests over fraud allegations.",
    gdp: "~$21 billion (nominal, major LNG development underway)",
    majorExports: ["Aluminum", "Coal", "Natural gas (LNG, developing)", "Cashews"],
    topTradePartners: ["India", "South Africa", "China", "Netherlands"],
    militaryBranches: ["Mozambique Armed Defence Forces (Army, Navy, Air Force)"],
    activePersonnel: "~11,000 (plus Rwandan and SADC forces supporting counter-insurgency)",
    defenseBudget: "~$100 million",
    alliances: ["African Union", "SADC", "Rwanda's military deployed to fight Cabo Delgado insurgents (since 2021)"],
    summary:
      "An ISIS-affiliated insurgency in gas-rich Cabo Delgado province (since 2017) has displaced hundreds of " +
      "thousands and stalled a major TotalEnergies LNG project, partially contained by Rwandan and SADC troop " +
      "deployments; the disputed 2024 election sparked the deadliest unrest in decades.",
  },
  Namibia: {
    region: "Africa",
    capital: "Windhoek",
    population: "~3 million",
    governmentType: "Presidential republic",
    rulingParties: "President Netumbo Nandi-Ndaitwah (SWAPO), since 2025 — Namibia's first female president; SWAPO has governed since independence (1990).",
    gdp: "~$13 billion (nominal, major new offshore oil discoveries)",
    majorExports: ["Diamonds", "Uranium", "Fish", "Crude oil (emerging, post-2022 discoveries)"],
    topTradePartners: ["China", "South Africa", "Botswana"],
    militaryBranches: ["Namibian Defence Force (Army, small Navy/Air Wing)"],
    activePersonnel: "~9,000",
    defenseBudget: "~$150 million",
    alliances: ["African Union", "SADC"],
    summary:
      "Major offshore oil discoveries (2022 onward, among the largest globally in recent years) are set to " +
      "transform a historically diamond/uranium-driven economy; SWAPO's continuous rule since independence " +
      "remains dominant but increasingly contested by a younger electorate.",
  },
  Niger: {
    region: "Africa",
    capital: "Niamey",
    population: "~27 million",
    governmentType: "Military-led transitional government",
    rulingParties: "General Abdourahamane Tchiani, military junta leader since a July 2023 coup that ousted elected President Mohamed Bazoum.",
    gdp: "~$17 billion (nominal)",
    majorExports: ["Uranium (major global supplier)", "Gold", "Livestock", "Crude oil (emerging pipeline exports)"],
    topTradePartners: ["France (uranium, historically)", "China", "Nigeria"],
    militaryBranches: ["Nigerien Armed Forces (Army, Air Force)"],
    activePersonnel: "~15,000",
    defenseBudget: "~$300–400 million",
    alliances: ["Alliance of Sahel States (with Mali and Burkina Faso); withdrew from ECOWAS in 2024; expelled French and U.S. forces, pivoted toward Russia"],
    summary:
      "The 2023 coup ousted a key Western counter-terrorism partner, prompting the junta to expel French troops and " +
      "shut down the U.S. drone base at Agadez, pivoting security cooperation toward Russia; a major uranium " +
      "supplier whose exports France's nuclear industry historically relied on.",
  },
  Nigeria: {
    region: "Africa",
    capital: "Abuja",
    population: "~230 million (Africa's most populous)",
    governmentType: "Federal presidential republic",
    rulingParties: "President Bola Tinubu (All Progressives Congress), since 2023.",
    gdp: "~$380–470 billion (nominal, one of Africa's two largest economies)",
    majorExports: ["Crude oil & petroleum products", "Natural gas (LNG)", "Cocoa"],
    topTradePartners: ["India", "China", "Netherlands", "United States"],
    militaryBranches: ["Army", "Navy", "Air Force"],
    activePersonnel: "~230,000",
    defenseBudget: "~$3–4 billion",
    alliances: ["African Union", "ECOWAS (regional leader)", "Major non-NATO-style security partner to the U.S. and UK on counter-terrorism"],
    summary:
      "Africa's most populous nation and a top oil producer, contending simultaneously with the Boko Haram/ISWAP " +
      "insurgency in the northeast, farmer-herder violence in the Middle Belt, and Niger Delta pipeline sabotage — " +
      "Tinubu's fuel-subsidy removal and currency reforms have driven painful but IMF-praised economic adjustment.",
  },
  "Republic of the Congo": {
    region: "Africa",
    capital: "Brazzaville",
    population: "~6 million",
    governmentType: "Presidential republic",
    rulingParties: "President Denis Sassou Nguesso (Congolese Labour Party), in power for most of the period since 1979.",
    gdp: "~$15 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil", "Timber", "Potash"],
    topTradePartners: ["China", "European Union states"],
    militaryBranches: ["Congolese Armed Forces (small Army, Navy, Air Force)"],
    activePersonnel: "~10,000",
    defenseBudget: "~$100 million",
    alliances: ["African Union", "ECCAS", "CEMAC"],
    summary:
      "One of Africa's longest-ruling leaders presides over an oil-dependent economy burdened by heavy debt " +
      "(notably to China/commodity traders); frequently confused with its much larger, more conflict-affected " +
      "neighbor, the Democratic Republic of the Congo.",
  },
  Rwanda: {
    region: "Africa",
    capital: "Kigali",
    population: "~14 million",
    governmentType: "Presidential republic (widely described as tightly controlled)",
    rulingParties: "President Paul Kagame (Rwandan Patriotic Front), in power since 2000 (dominant figure since the 1994 genocide's end), re-elected with over 99% in 2024.",
    gdp: "~$14 billion (nominal, fast-growing)",
    majorExports: ["Coffee", "Tea", "Minerals (tin, tantalum, tungsten)", "Re-exported gold/minerals"],
    topTradePartners: ["United Arab Emirates", "Democratic Republic of the Congo", "China"],
    militaryBranches: ["Rwanda Defence Force (Army, Air Force) — regarded as one of Africa's most capable and disciplined militaries"],
    activePersonnel: "~33,000",
    defenseBudget: "~$150–200 million",
    alliances: ["African Union", "East African Community", "Commonwealth", "UN peacekeeping troop contributor; bilateral security deal deploying troops to Mozambique"],
    summary:
      "Rebuilt rapidly after the 1994 genocide into one of Africa's most orderly, business-friendly states under " +
      "tightly centralized rule; UN experts and the DRC accuse Rwanda of backing the M23 rebellion in eastern DRC, " +
      "a major regional flashpoint and source of Western sanctions pressure.",
  },
  Senegal: {
    region: "Africa",
    capital: "Dakar",
    population: "~18 million",
    governmentType: "Presidential republic",
    rulingParties: "President Bassirou Diomaye Faye (Pastef, reformist/pan-Africanist), since 2024 — West Africa's youngest elected leader.",
    gdp: "~$32 billion (nominal, new oil/gas production starting)",
    majorExports: ["Gold", "Fish/seafood", "Groundnuts (peanuts)", "Phosphates", "Crude oil (new, from 2024)"],
    topTradePartners: ["Mali", "Switzerland", "India", "China"],
    militaryBranches: ["Senegalese Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~17,000",
    defenseBudget: "~$300 million",
    alliances: ["African Union", "ECOWAS", "Historically close ties with France, now recalibrating (requested French troop withdrawal in 2024)"],
    summary:
      "One of West Africa's most durable democracies, having avoided the coup wave affecting its Sahel neighbors; " +
      "new offshore oil and gas production began in 2024, and the reformist Faye government has pushed to reduce " +
      "French military presence and renegotiate resource contracts.",
  },
  "Sierra Leone": {
    region: "Africa",
    capital: "Freetown",
    population: "~8.7 million",
    governmentType: "Presidential republic",
    rulingParties: "President Julius Maada Bio (Sierra Leone People's Party), re-elected 2023 amid opposition fraud allegations; survived a 2023 coup attempt.",
    gdp: "~$4.3 billion (nominal)",
    majorExports: ["Diamonds", "Iron ore", "Rutile (titanium ore)", "Cocoa"],
    topTradePartners: ["China", "Belgium", "United States"],
    militaryBranches: ["Republic of Sierra Leone Armed Forces (small unified force)"],
    activePersonnel: "~13,000",
    defenseBudget: "~$30–40 million",
    alliances: ["African Union", "ECOWAS", "Commonwealth"],
    summary:
      "Recovered from a brutal 1991–2002 civil war (fueled by 'blood diamonds') into a functioning if fragile " +
      "democracy; withstood a November 2023 coup attempt, and remains heavily dependent on mineral exports and " +
      "donor support.",
  },
  Somalia: {
    region: "Africa",
    capital: "Mogadishu",
    population: "~18 million",
    governmentType: "Federal parliamentary republic (fragile central authority)",
    rulingParties: "President Hassan Sheikh Mohamud, since 2022; federal authority contested by autonomous regional states and al-Shabaab-held territory.",
    gdp: "~$11–13 billion (nominal, among the world's poorest)",
    majorExports: ["Livestock (dominant export)", "Bananas", "Fish", "Charcoal (informal/sanctioned)"],
    topTradePartners: ["United Arab Emirates", "Oman", "China"],
    militaryBranches: ["Somali National Army (rebuilding with African Union/Western support)"],
    activePersonnel: "~20,000 (national forces; supplemented by ~12,000+ AU Transition Mission troops)",
    defenseBudget: "Heavily donor-dependent; not fully self-tracked",
    alliances: ["African Union Transition Mission in Somalia (AUSSOM, successor to ATMIS/AMISOM)", "Major U.S./UK/Turkey counter-terrorism partner"],
    summary:
      "Fighting a decades-long insurgency by al-Shabaab, one of al-Qaeda's most resilient affiliates, which still " +
      "controls significant rural territory despite a 2022–2023 government offensive; a 2024 Ethiopia-Somaliland " +
      "port deal triggered a serious sovereignty dispute with Mogadishu.",
  },
  Somaliland: {
    region: "Africa",
    capital: "Hargeisa",
    population: "~5.7 million (estimated; unrecognized state, no official census)",
    governmentType: "Presidential republic (de facto independent, internationally unrecognized)",
    rulingParties: "President Abdirahman Mohamed Abdullahi 'Irro' (Waddani party), since 2024, in a peaceful, internationally praised transfer of power.",
    gdp: "~$2–3 billion (nominal, informal estimate)",
    majorExports: ["Livestock (dominant, especially to Gulf states)", "Frankincense/myrrh", "Hides"],
    topTradePartners: ["Ethiopia (dependent trade/port access)", "Gulf states (Saudi Arabia, UAE)"],
    militaryBranches: ["Somaliland Armed Forces (self-declared, not internationally recognized as a state military)"],
    activePersonnel: "~15,000 (estimated)",
    defenseBudget: "Not internationally tracked",
    alliances: ["Not a UN member or formally recognized by any state; a 2024 memorandum with Ethiopia (offering port/naval access in exchange for possible recognition) remains contentious and unratified"],
    summary:
      "Declared independence from Somalia in 1991 and has functioned as a stable, democratic de facto state ever " +
      "since, despite zero international recognition; its 2024 port-access deal with Ethiopia (widely seen as a " +
      "step toward recognition) sparked a serious diplomatic crisis with Somalia and regional powers.",
  },
  "South Africa": {
    region: "Africa",
    capital: "Pretoria (executive); Cape Town (legislative); Bloemfontein (judicial)",
    population: "~60 million",
    governmentType: "Parliamentary republic",
    rulingParties: "African National Congress (ANC) leads a Government of National Unity coalition (with the Democratic Alliance and others) formed after losing its outright majority in the 2024 election for the first time since 1994; President Cyril Ramaphosa.",
    gdp: "~$400 billion (nominal, Africa's most industrialized economy)",
    majorExports: ["Gold & platinum-group metals", "Coal", "Motor vehicles", "Fruit & wine"],
    topTradePartners: ["China", "United States", "Germany", "United Kingdom"],
    militaryBranches: ["South African National Defence Force (Army, Navy, Air Force, Military Health Service)"],
    activePersonnel: "~75,000",
    defenseBudget: "~$3 billion",
    alliances: ["BRICS", "G20", "African Union", "SADC", "Non-aligned foreign policy (maintains ties with Russia, China, and the West simultaneously)"],
    summary:
      "The continent's most industrialized economy and a BRICS founding member pursuing a deliberately non-aligned " +
      "foreign policy (drawing Western criticism over Russia ties and its ICJ genocide case against Israel); the " +
      "ANC's 2024 loss of its parliamentary majority for the first time since apartheid's end reshaped domestic " +
      "politics into coalition governance.",
  },
  "South Sudan": {
    region: "Africa",
    capital: "Juba",
    population: "~11 million",
    governmentType: "Presidential republic (fragile power-sharing transitional government)",
    rulingParties: "President Salva Kiir (Sudan People's Liberation Movement) and First Vice President Riek Machar (SPLM-IO) share power under a fragile 2018 peace deal; Machar was placed under house arrest in 2025 amid renewed tensions.",
    gdp: "~$6–9 billion (nominal, oil-dependent, world's youngest country since 2011)",
    majorExports: ["Crude oil (dominant, near-total export reliance)"],
    topTradePartners: ["China", "Regional partners via pipeline through Sudan"],
    militaryBranches: ["Sudan People's Liberation Army (SPLA), plus SPLA-IO opposition forces nominally integrating under the peace deal"],
    activePersonnel: "~150,000–185,000 (combined government and integrating opposition forces, estimated)",
    defenseBudget: "Not transparently disclosed; oil-revenue dependent and often diverted from civilian budgets",
    alliances: ["African Union", "IGAD (regional mediator)", "Large UN peacekeeping mission (UNMISS)"],
    summary:
      "The world's youngest country (independent from Sudan in 2011) fought a brutal 2013–2018 civil war between " +
      "Kiir and Machar factions; the fragile unity government has been destabilized further by Machar's 2025 house " +
      "arrest and by Sudan's civil war disrupting its sole oil export pipeline route.",
  },
  Sudan: {
    region: "Africa",
    capital: "Khartoum (contested); Port Sudan (wartime seat of government)",
    population: "~48 million",
    governmentType: "No functioning central government — active civil war between rival military factions",
    rulingParties: "Sovereignty Council under General Abdel Fattah al-Burhan (Sudanese Armed Forces) at war with the paramilitary Rapid Support Forces (RSF) under General Mohamed Hamdan Dagalo ('Hemedti') since April 2023.",
    gdp: "~$30–50 billion (nominal, collapsing amid the war)",
    majorExports: ["Gold", "Crude oil (reduced since South Sudan's 2011 secession)", "Livestock", "Gum arabic"],
    topTradePartners: ["United Arab Emirates (notably gold trade)", "China", "Egypt"],
    militaryBranches: ["Sudanese Armed Forces (SAF) vs. the paramilitary Rapid Support Forces (RSF) — a full-scale civil war, not a unified military"],
    activePersonnel: "SAF ~100,000+; RSF estimated 100,000+ — both sides have expanded through wartime recruitment",
    defenseBudget: "Not centrally tracked amid the war economy",
    alliances: ["SAF has drawn support from Egypt and (reportedly) Iran; RSF has been accused by UN experts of receiving UAE backing — both denied by respective backers"],
    summary:
      "One of the world's largest and deadliest ongoing conflicts, killing tens of thousands and displacing over " +
      "10 million since the April 2023 SAF-RSF war erupted; RSF forces have been accused of genocide-level atrocities " +
      "in Darfur, and the conflict has become a significant proxy battleground for regional powers' gold and " +
      "influence interests.",
  },
  Swaziland: {
    region: "Africa",
    capital: "Mbabane (administrative); Lobamba (royal/legislative)",
    population: "~1.2 million",
    governmentType: "Absolute monarchy (branded 'Eswatini' by royal decree since 2018)",
    rulingParties: "King Mswati III rules by decree; political parties are effectively banned from contesting seats, making it Africa's last absolute monarchy.",
    gdp: "~$4.7 billion (nominal)",
    majorExports: ["Sugar", "Soft drink concentrates (major Coca-Cola concentrate producer)", "Textiles", "Wood pulp"],
    topTradePartners: ["South Africa (near-total economic dependence)", "United States (AGOA-linked)"],
    militaryBranches: ["Umbutfo Eswatini Defence Force (small Army, Air Wing)"],
    activePersonnel: "~3,000",
    defenseBudget: "~$40–50 million",
    alliances: ["African Union", "SADC"],
    summary:
      "Africa's last absolute monarchy, where King Mswati III holds near-total power and pro-democracy protests " +
      "(intermittently violent since 2021) have been met with heavy security crackdowns; the economy is almost " +
      "fully dependent on South Africa via a shared customs union.",
  },
  Togo: {
    region: "Africa",
    capital: "Lomé",
    population: "~9 million",
    governmentType: "Presidential republic (transitioning toward a parliamentary system)",
    rulingParties: "President Faure Gnassingbé (Union for the Republic), in power since 2005, continuing the Gnassingbé family's rule since 1967; a 2024 constitutional overhaul shifted power toward a new, unelected 'President of the Council of Ministers' post he was expected to assume.",
    gdp: "~$9 billion (nominal)",
    majorExports: ["Phosphates", "Cotton", "Cocoa", "Re-export/transshipment trade via the Port of Lomé"],
    topTradePartners: ["Burkina Faso", "India", "China"],
    militaryBranches: ["Togolese Armed Forces (small unified force)"],
    activePersonnel: "~11,000",
    defenseBudget: "~$100 million",
    alliances: ["African Union", "ECOWAS"],
    summary:
      "One of Africa's longest-ruling family dynasties (57+ years), which pushed through a controversial 2024 " +
      "constitutional change widely viewed as designed to let Gnassingbé extend his rule indefinitely via a new, " +
      "less electorally accountable executive post.",
  },
  Tunisia: {
    region: "Africa",
    capital: "Tunis",
    population: "~12 million",
    governmentType: "Presidential republic (democratic backsliding since 2021)",
    rulingParties: "President Kais Saied (independent), re-elected 2024 in a vote widely criticized as neither free nor fair after jailing rivals; ruled by decree since suspending parliament in 2021.",
    gdp: "~$50 billion (nominal)",
    majorExports: ["Textiles & apparel", "Machinery/electrical components", "Olive oil", "Phosphates"],
    topTradePartners: ["France", "Italy", "Germany"],
    militaryBranches: ["Tunisian Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~35,000",
    defenseBudget: "~$1 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "African Union", "Arab League"],
    summary:
      "The birthplace of the 2010–11 Arab Spring and long considered its lone democratic success story, until " +
      "President Saied's 2021 power seizure (parliament suspension, rule by decree, jailed opposition figures) " +
      "reversed much of that progress; also a major departure point for Mediterranean migrant crossings to Europe.",
  },
  Uganda: {
    region: "Africa",
    capital: "Kampala",
    population: "~48 million",
    governmentType: "Presidential republic",
    rulingParties: "President Yoweri Museveni (National Resistance Movement), in power since 1986 — one of Africa's longest-ruling leaders, expected to seek another term in 2026.",
    gdp: "~$50 billion (nominal, new oil production beginning)",
    majorExports: ["Coffee", "Gold", "Tea", "Fish", "Crude oil (new, pipeline under construction with Tanzania — EACOP)"],
    topTradePartners: ["United Arab Emirates", "Democratic Republic of the Congo", "Kenya"],
    militaryBranches: ["Uganda People's Defence Force (Army, Air Force)"],
    activePersonnel: "~45,000",
    defenseBudget: "~$400–500 million",
    alliances: ["African Union", "East African Community", "Deployed troops in Somalia (AU mission) and eastern DRC counter-rebel operations"],
    summary:
      "Museveni's near four-decade rule faces succession questions as his son, army chief Muhoozi Kainerugaba, is " +
      "widely seen as being positioned to succeed him; the controversial East Africa Crude Oil Pipeline (EACOP) " +
      "with Tanzania has drawn international environmental and human-rights criticism.",
  },
  "United Republic of Tanzania": {
    region: "Africa",
    capital: "Dodoma (official); Dar es Salaam (commercial capital)",
    population: "~68 million",
    governmentType: "Presidential republic (union of mainland Tanzania and Zanzibar)",
    rulingParties: "President Samia Suluhu Hassan (Chama Cha Mapinduzi, CCM), since 2021 — CCM has ruled continuously since independence; re-elected 2025 amid opposition claims of a severely restricted vote.",
    gdp: "~$85 billion (nominal, East Africa's second largest)",
    majorExports: ["Gold", "Cashews", "Tourism services", "Tobacco", "Natural gas (LNG project developing)"],
    topTradePartners: ["China", "India", "United Arab Emirates", "South Africa"],
    militaryBranches: ["Tanzania People's Defence Force (Army, Navy, Air Force)"],
    activePersonnel: "~27,000",
    defenseBudget: "~$400–500 million",
    alliances: ["African Union", "SADC", "East African Community", "Deployed troops to Mozambique's Cabo Delgado counter-insurgency"],
    summary:
      "A politically dominant CCM has ruled since independence across the mainland-Zanzibar union; a major LNG " +
      "project and the contentious East Africa Crude Oil Pipeline (with Uganda) are reshaping its energy sector, " +
      "while safari tourism remains a core economic pillar.",
  },
  "Western Sahara": {
    region: "Africa",
    capital: "El Aaiún (Laâyoune, administered by Morocco); Tifariti (SADR-controlled area)",
    population: "~600,000 (estimated; disputed territory, no agreed census)",
    governmentType: "Disputed territory — administered mostly by Morocco; claimed by the Polisario Front's self-declared Sahrawi Arab Democratic Republic (SADR)",
    rulingParties: "Morocco administers ~80% of the territory as its 'Southern Provinces'; the Polisario Front governs refugee camps and a strip of territory, backed by Algeria.",
    gdp: "Included within Moroccan statistics for the administered area; not separately tracked",
    majorExports: ["Phosphates", "Fish/seafood (administered under Moroccan control)"],
    topTradePartners: ["Integrated into Moroccan trade for the administered zone; EU fisheries/phosphate agreements have faced legal challenges over Sahrawi consent"],
    militaryBranches: ["Moroccan Royal Armed Forces control the administered territory; Polisario Front's small guerrilla forces operate along a UN-monitored buffer/berm"],
    activePersonnel: "Not separately tracked from Morocco's military; Polisario forces estimated in the low thousands",
    defenseBudget: "N/A (folded into Morocco's defense budget for the administered area)",
    alliances: ["Morocco backed by the U.S. (2020 sovereignty recognition), France; Polisario/SADR backed by Algeria; monitored by a UN peacekeeping mission (MINURSO)"],
    summary:
      "Africa's last major unresolved decolonization dispute: Morocco controls most of the territory behind a " +
      "heavily fortified sand berm, while the Polisario Front (backed by Algeria) demands a self-determination " +
      "referendum that has never been held — a low-intensity ceasefire violation flared into renewed skirmishes " +
      "starting in 2020.",
  },
  Zambia: {
    region: "Africa",
    capital: "Lusaka",
    population: "~20 million",
    governmentType: "Presidential republic",
    rulingParties: "President Hakainde Hichilema (United Party for National Development), since 2021.",
    gdp: "~$29 billion (nominal, copper-dependent)",
    majorExports: ["Copper (major global producer)", "Cobalt", "Tobacco"],
    topTradePartners: ["China", "Switzerland", "Democratic Republic of the Congo"],
    militaryBranches: ["Zambia Army, Zambia Air Force, Zambia National Service"],
    activePersonnel: "~16,000",
    defenseBudget: "~$200 million",
    alliances: ["African Union", "SADC"],
    summary:
      "A major copper producer that completed a landmark sovereign debt restructuring (2023–2024) after defaulting " +
      "in 2020, the first African country to do so under the G20's Common Framework; copper's centrality to global " +
      "EV/battery supply chains gives it growing strategic economic weight.",
  },
  Zimbabwe: {
    region: "Africa",
    capital: "Harare",
    population: "~16.5 million",
    governmentType: "Presidential republic (widely criticized elections since 2000)",
    rulingParties: "President Emmerson Mnangagwa (ZANU-PF), since a 2017 military-assisted removal of Robert Mugabe; re-elected 2023 in a vote regional/international observers criticized as falling short of standards.",
    gdp: "~$28–35 billion (nominal, history of hyperinflation)",
    majorExports: ["Gold", "Tobacco", "Platinum-group metals", "Nickel & diamonds"],
    topTradePartners: ["United Arab Emirates", "South Africa", "China"],
    militaryBranches: ["Zimbabwe Defence Forces (Army, Air Force)"],
    activePersonnel: "~30,000",
    defenseBudget: "~$300 million",
    alliances: ["African Union", "SADC"],
    summary:
      "ZANU-PF has ruled continuously since independence (1980), with the military playing a decisive role in " +
      "removing longtime ruler Robert Mugabe in 2017; recurring currency collapses/hyperinflation and Western " +
      "sanctions tied to land-reform-era human-rights concerns have kept the economy fragile.",
  },

  // --- Middle East / Western Asia (Cyprus, Northern Cyprus, and Egypt are
  // already covered above under Europe/Africa) ---
  Armenia: {
    region: "Middle East",
    capital: "Yerevan",
    population: "~3 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Nikol Pashinyan (Civil Contract party), since 2018.",
    gdp: "~$25 billion (nominal)",
    majorExports: ["Copper & precious metals", "Diamonds (cut/processed)", "Alcoholic beverages (brandy/wine)", "Agricultural produce"],
    topTradePartners: ["Russia", "United Arab Emirates", "China"],
    militaryBranches: ["Armenian Armed Forces (Army, Air Force)"],
    activePersonnel: "~45,000",
    defenseBudget: "~$1.3–1.5 billion",
    alliances: ["Historically CSTO member (relationship frozen/deteriorated since 2023–2024); deepening ties with the EU/France/India for arms and diplomatic support"],
    summary:
      "Lost the Nagorno-Karabakh enclave entirely to Azerbaijan in a swift September 2023 offensive, ending decades " +
      "of contested control and triggering the exodus of virtually the entire ethnic Armenian population; Yerevan " +
      "has since pivoted away from traditional patron Russia toward the West.",
  },
  Azerbaijan: {
    region: "Middle East",
    capital: "Baku",
    population: "~10.2 million",
    governmentType: "Presidential republic (widely described as authoritarian)",
    rulingParties: "President Ilham Aliyev (New Azerbaijan Party), in power since 2003, continuing the Aliyev family's rule since 1993.",
    gdp: "~$78 billion (nominal, oil/gas-driven)",
    majorExports: ["Crude oil", "Natural gas (key alternative EU gas supplier post-2022)", "Petroleum products"],
    topTradePartners: ["Italy", "Turkey", "Israel"],
    militaryBranches: ["Azerbaijani Armed Forces (Army, Navy, Air Force), modernized with Turkish and Israeli equipment"],
    activePersonnel: "~67,000",
    defenseBudget: "~$3.5–4 billion",
    alliances: ["Close military/political alliance with Turkey ('one nation, two states'); significant defense-technology partnership with Israel"],
    summary:
      "Retook the entire Nagorno-Karabakh region by force in 2023, reversing the post-1994 status quo and " +
      "displacing its ethnic Armenian population; a growing gas supplier to Europe seeking to reduce Russian energy " +
      "dependence, and a close Turkish/Israeli defense partner.",
  },
  Georgia: {
    region: "Middle East",
    capital: "Tbilisi",
    population: "~3.7 million",
    governmentType: "Parliamentary republic",
    rulingParties: "Georgian Dream party, in power since 2012 (billionaire founder Bidzina Ivanishvili remains its dominant influence); contested 2024 election results triggered mass pro-EU protests.",
    gdp: "~$30 billion (nominal)",
    majorExports: ["Copper ores", "Wine", "Motor vehicles (re-export)", "Mineral waters"],
    topTradePartners: ["China", "Russia", "Azerbaijan", "Turkey"],
    militaryBranches: ["Georgian Defence Forces (Army, Air Force, small Navy)"],
    activePersonnel: "~37,000",
    defenseBudget: "~$500–600 million",
    alliances: ["NATO aspirant (membership stalled); EU candidate status (accession process frozen amid democratic-backsliding concerns)"],
    summary:
      "Russia occupies roughly 20% of its territory (Abkhazia and South Ossetia) since the 2008 war; the ruling " +
      "Georgian Dream party's 2024 'foreign agents' law and disputed election results sparked sustained pro-EU " +
      "street protests and a stalled EU accession bid, deepening East-West polarization.",
  },
  Iraq: {
    region: "Middle East",
    capital: "Baghdad",
    population: "~45 million",
    governmentType: "Federal parliamentary republic",
    rulingParties: "PM Mohammed Shia' Al Sudani (Coordination Framework, Shia-led coalition), since 2022; power-sharing among Shia, Sunni, and Kurdish blocs.",
    gdp: "~$250–270 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil (near-total export reliance, OPEC member)"],
    topTradePartners: ["China", "India", "South Korea"],
    militaryBranches: ["Iraqi Army, Air Force, Navy; Popular Mobilization Forces (PMF, Iran-aligned Shia militias with formal state status)"],
    activePersonnel: "~190,000 (military) + ~150,000+ PMF fighters",
    defenseBudget: "~$5–6 billion",
    alliances: ["Hosts a residual U.S.-led coalition military presence (drawing down under a 2024 agreement); PMF factions closely aligned with Iran"],
    summary:
      "Balances a fraught U.S.-Iran rivalry playing out on its soil — hosting U.S. troops while Iran-aligned militias " +
      "periodically attack them — amid lingering ISIS remnant threats and chronic corruption/governance dysfunction " +
      "since the 2003 U.S. invasion.",
  },
  Israel: {
    region: "Middle East",
    capital: "Jerusalem (disputed; most embassies in Tel Aviv)",
    population: "~9.8 million",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Benjamin Netanyahu (Likud-led right-wing/religious coalition), governing since late 2022.",
    gdp: "~$530 billion (nominal)",
    majorExports: ["Semiconductors & electronics", "Cut diamonds", "Pharmaceuticals", "Machinery", "Defense technology"],
    topTradePartners: ["United States", "China", "United Kingdom", "European Union states"],
    militaryBranches: ["Israel Defense Forces (Army, Navy, Air Force, unified command structure)"],
    activePersonnel: "~170,000 active (600,000+ with reserves mobilized)",
    defenseBudget: "~$27–30 billion (sharply elevated since October 2023)",
    alliances: ["Major non-NATO ally status with the U.S. (largest recipient of U.S. military aid)", "Abraham Accords (UAE, Bahrain, Morocco, Sudan)"],
    summary:
      "Fighting a multi-front war since Hamas's October 7, 2023 attack — a devastating Gaza campaign, sustained " +
      "exchanges with Hezbollah in Lebanon, and a full-scale war with Iran that erupted Feb 28, 2026 (\"Operation " +
      "Epic Fury\"), in which Israel and the US struck Iranian military/nuclear sites and killed Supreme Leader Ali " +
      "Khamenei. That war saw a contested ceasefire from April 2026 and renewed maritime clashes with Iran through " +
      "mid-2026; as of August 2026 large strikes have paused but tension remains high — all while Israel faces an " +
      "ICJ genocide case and deep domestic political polarization over judicial reform and the wars' conduct.",
  },
  Jordan: {
    region: "Middle East",
    capital: "Amman",
    population: "~11.3 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "King Abdullah II holds executive authority; PM-led cabinet appointed by the King, with an evolving elected-party-list parliament since 2024 reforms.",
    gdp: "~$50 billion (nominal)",
    majorExports: ["Potash & phosphates", "Pharmaceuticals", "Textiles/apparel", "Fertilizers"],
    topTradePartners: ["United States", "Saudi Arabia", "India"],
    militaryBranches: ["Jordanian Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~100,000",
    defenseBudget: "~$2.5–3 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "Peace treaty with Israel (1994)", "Arab League"],
    summary:
      "A key Western security partner hosting over 700,000 registered Syrian refugees and a large Palestinian-origin " +
      "population, giving it acute sensitivity to Gaza-war spillover (repeated mass protests) despite its own 1994 " +
      "peace treaty with Israel; helped intercept Iranian missiles during 2024 Israel-Iran exchanges.",
  },
  Kuwait: {
    region: "Middle East",
    capital: "Kuwait City",
    population: "~4.3 million (~70% non-citizen residents)",
    governmentType: "Constitutional emirate",
    rulingParties: "Emir Meshal Al-Ahmad Al-Jaber Al-Sabah, since 2023; dissolved parliament and suspended parts of the constitution in 2024 to consolidate executive authority.",
    gdp: "~$160 billion (nominal, oil-dependent)",
    majorExports: ["Crude oil (near-total export reliance, OPEC member)"],
    topTradePartners: ["China", "South Korea", "India"],
    militaryBranches: ["Kuwait Army, Navy, Air Force"],
    activePersonnel: "~17,000",
    defenseBudget: "~$7–8 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "Gulf Cooperation Council", "Hosts significant U.S. military basing (Camp Arifjan, Ali Al Salem)"],
    summary:
      "A major U.S. regional basing hub since the 1991 Gulf War liberation; the Emir's 2024 suspension of parts of " +
      "the constitution and dissolution of the historically assertive National Assembly marked a significant, " +
      "closely watched centralization of royal power.",
  },
  Lebanon: {
    region: "Middle East",
    capital: "Beirut",
    population: "~5.5 million (plus roughly 1.5 million Syrian refugees)",
    governmentType: "Parliamentary republic (confessional power-sharing system)",
    rulingParties: "President Joseph Aoun and PM Nawaf Salam took office in early 2025, ending a more than two-year presidential vacuum; power is constitutionally divided among Maronite Christian, Sunni, and Shia (Hezbollah-aligned) blocs.",
    gdp: "~$20–24 billion (nominal, collapsed from a pre-2019 peak amid one of the world's worst modern financial crises)",
    majorExports: ["Precious metals/jewelry (re-export)", "Machinery & electrical equipment", "Agricultural produce"],
    topTradePartners: ["United Arab Emirates", "Saudi Arabia", "Switzerland"],
    militaryBranches: ["Lebanese Armed Forces (state military); Hezbollah operates as a separate, more heavily armed non-state militia/political party"],
    activePersonnel: "~80,000 (LAF); Hezbollah's own forces estimated in the tens of thousands",
    defenseBudget: "~$600 million–1 billion (LAF, heavily donor-subsidized; Hezbollah's separate arsenal is externally funded, chiefly by Iran)",
    alliances: ["LAF backed by the U.S./France/Gulf states; Hezbollah is a core member of Iran's 'Axis of Resistance'"],
    summary:
      "Devastated by a 2019–present financial collapse, the 2020 Beirut port explosion, and a year-plus of intense " +
      "Israel-Hezbollah warfare in 2024 that killed Hezbollah's longtime leader Hassan Nasrallah before a " +
      "November 2024 ceasefire; the 2025 election of a president ended a historic institutional vacuum amid hopes " +
      "for IMF-backed reform.",
  },
  Oman: {
    region: "Middle East",
    capital: "Muscat",
    population: "~4.6 million",
    governmentType: "Absolute monarchy (sultanate)",
    rulingParties: "Sultan Haitham bin Tariq, since 2020; no political parties, rule by royal decree with an advisory (non-legislative) Consultative Assembly.",
    gdp: "~$115 billion (nominal)",
    majorExports: ["Crude oil", "Natural gas (LNG)", "Petrochemicals & fertilizers"],
    topTradePartners: ["China", "United Arab Emirates", "India"],
    militaryBranches: ["Royal Army of Oman", "Royal Navy of Oman", "Royal Air Force of Oman"],
    activePersonnel: "~43,000",
    defenseBudget: "~$5–6 billion",
    alliances: ["Gulf Cooperation Council", "Longstanding neutral, mediating foreign policy — hosted indirect U.S.-Iran and U.S.-Houthi backchannel talks"],
    summary:
      "Uniquely positioned as the Gulf's neutral diplomatic broker, maintaining working relations with Iran, Saudi " +
      "Arabia, the U.S., and Gulf rivals alike; has repeatedly hosted discreet backchannel negotiations, including " +
      "on Iran's nuclear program and Yemen's war.",
  },
  Palestine: {
    region: "Middle East",
    capital: "Ramallah (de facto administrative seat; East Jerusalem claimed as capital)",
    population: "~5.4 million (West Bank and Gaza combined, per Palestinian statistics)",
    governmentType: "Split governance — Palestinian Authority (Fatah) administers parts of the West Bank; Hamas has governed Gaza since 2007, though its rule has been shattered by the 2023–2025 war",
    rulingParties: "President Mahmoud Abbas (Fatah), PA chief since 2005 (no elections held since); Hamas historically controlled Gaza's government until Israel's post-October 2023 military campaign devastated its governing structures.",
    gdp: "~$15–17 billion (nominal, pre-war; Gaza's economy has since been catastrophically destroyed)",
    majorExports: ["Olive oil & agricultural produce", "Stone & marble", "Textiles (limited, constrained by movement restrictions)"],
    topTradePartners: ["Israel (dominant, near-total trade dependency)", "Jordan"],
    militaryBranches: ["No state military; PA Security Forces (West Bank, security-coordination role); Hamas's Izz ad-Din al-Qassam Brigades and other Gaza armed factions (non-state, PA-independent)"],
    activePersonnel: "PA security forces ~30,000; Hamas/Gaza militant factions severely degraded by the 2023–2025 war (pre-war estimated 25,000–40,000)",
    defenseBudget: "N/A (no sovereign state military; PA forces funded via international donor aid)",
    alliances: ["Non-member UN observer state; Arab League member", "Hamas backed historically by Iran/Qatar/Turkey; PA backed by the U.S./EU/Arab states"],
    summary:
      "Gaza has been catastrophically devastated by Israel's military campaign following Hamas's October 7, 2023 " +
      "attack, with tens of thousands killed and the territory's infrastructure largely destroyed; the West Bank " +
      "faces surging settler violence and Israeli military operations, while a fragmented Palestinian leadership " +
      "(aging Fatah/PA vs. weakened Hamas) struggles to present a unified postwar governance plan.",
  },
  Qatar: {
    region: "Middle East",
    capital: "Doha",
    population: "~2.7 million (~85% non-citizen residents)",
    governmentType: "Constitutional emirate",
    rulingParties: "Emir Tamim bin Hamad Al Thani, since 2013; no political parties, rule by decree.",
    gdp: "~$235 billion (nominal, world's highest per-capita income)",
    majorExports: ["Liquefied natural gas (LNG, one of the world's top exporters)", "Crude oil", "Petrochemicals"],
    topTradePartners: ["China", "Japan", "South Korea", "India"],
    militaryBranches: ["Qatar Emiri Land Force", "Qatar Emiri Navy", "Qatar Emiri Air Force"],
    activePersonnel: "~12,000–15,000",
    defenseBudget: "~$5–7 billion",
    alliances: ["Major non-NATO ally status with the U.S.", "Gulf Cooperation Council", "Hosts the largest U.S. military base in the Middle East (Al Udeid Air Base)"],
    summary:
      "A pivotal, uniquely positioned mediator hosting Al Udeid Air Base (the U.S. Central Command's regional " +
      "hub) while simultaneously serving as chief broker of Gaza ceasefire/hostage negotiations between Israel and " +
      "Hamas, alongside its top-tier LNG export role and 2022 World Cup-era global soft-power push.",
  },
  "Saudi Arabia": {
    region: "Middle East",
    capital: "Riyadh",
    population: "~36 million",
    governmentType: "Absolute monarchy",
    rulingParties: "King Salman bin Abdulaziz is head of state; Crown Prince Mohammed bin Salman (MBS) holds day-to-day executive authority as prime minister and is the driving force behind 'Vision 2030' reforms.",
    gdp: "~$1.1 trillion (nominal, the Arab world's largest economy)",
    majorExports: ["Crude oil (world's largest exporter, OPEC+ leader)", "Petrochemicals", "Refined petroleum products"],
    topTradePartners: ["China", "India", "Japan", "South Korea"],
    militaryBranches: ["Royal Saudi Land Forces", "Royal Saudi Navy", "Royal Saudi Air Force", "Royal Saudi Strategic Missile Force", "Saudi Arabian National Guard"],
    activePersonnel: "~250,000 (plus a large National Guard)",
    defenseBudget: "~$75–80 billion (among the world's largest)",
    alliances: ["Major strategic (non-treaty) U.S. partner", "Gulf Cooperation Council", "OPEC+ leader", "In active, U.S.-brokered talks toward Israel normalization (paused since October 2023)"],
    summary:
      "MBS's Vision 2030 diversification push (NEOM, tourism, sports investment) continues alongside a landmark " +
      "2023 China-brokered rapprochement with rival Iran and paused-but-not-abandoned talks on normalizing ties " +
      "with Israel — talks complicated by the Gaza war and Riyadh's insistence on a credible Palestinian statehood " +
      "pathway.",
  },
  Syria: {
    region: "Middle East",
    capital: "Damascus",
    population: "~23 million (millions displaced internally and as refugees since 2011)",
    governmentType: "Transitional government (post-Assad)",
    rulingParties: "Interim President Ahmed al-Sharaa (formerly known as Abu Mohammed al-Jolani, ex-leader of Hayat Tahrir al-Sham), heading a transitional administration since the sudden fall of Bashar al-Assad's government in December 2024.",
    gdp: "~$10–20 billion (nominal, catastrophically diminished after 13+ years of civil war)",
    majorExports: ["Crude oil (limited, war-degraded)", "Phosphates", "Textiles (limited)"],
    topTradePartners: ["Turkey", "Gulf states (reengaging post-Assad)", "Iraq"],
    militaryBranches: ["Reorganizing under the new transitional government from former rebel/HTS forces; remnants of the old Assad-era military largely dissolved or defected"],
    activePersonnel: "Being reconstituted; estimated tens of thousands drawn from former rebel factions",
    defenseBudget: "Not established under the transitional government",
    alliances: ["Turkey has emerged as the dominant external patron of the new government; Western/Gulf states cautiously re-engaging; Russia retains its Tartus naval base and Khmeimim airbase under negotiation with the new authorities"],
    summary:
      "The stunning December 2024 collapse of the Assad dynasty's 53-year rule — following a rapid rebel offensive " +
      "led by Hayat Tahrir al-Sham — ended a 13-year civil war that killed hundreds of thousands; the country now " +
      "navigates a fragile transition amid sectarian violence risks, Israeli strikes on former regime military " +
      "assets, Kurdish autonomy questions in the northeast, and uncertainty over Russia's basing future.",
  },
  Turkey: {
    region: "Middle East",
    capital: "Ankara",
    population: "~85.5 million",
    governmentType: "Presidential republic",
    rulingParties: "President Recep Tayyip Erdoğan (Justice and Development Party, AKP), in power since 2003 (as PM then president).",
    gdp: "~$1.1–1.3 trillion (nominal)",
    majorExports: ["Motor vehicles", "Machinery", "Textiles & apparel", "Iron & steel"],
    topTradePartners: ["Germany", "United States", "United Kingdom", "Iraq"],
    militaryBranches: ["Turkish Land Forces", "Turkish Naval Forces", "Turkish Air Force"],
    activePersonnel: "~355,000 (NATO's second-largest standing military)",
    defenseBudget: "~$16–20 billion",
    alliances: ["NATO (since 1952)", "G20", "Increasingly influential patron of Syria's new government; complex balancing act with Russia (S-400 purchase drew U.S. sanctions)"],
    summary:
      "NATO's second-largest military straddles Europe and Asia, pursuing an assertive, independent foreign policy — " +
      "mediating the Russia-Ukraine war while selling Bayraktar drones to Kyiv, deepening influence in post-Assad " +
      "Syria, and periodically striking Kurdish militant (PKK/YPG) targets in Syria and Iraq.",
  },
  "United Arab Emirates": {
    region: "Middle East",
    capital: "Abu Dhabi",
    population: "~10 million (~88% non-citizen residents)",
    governmentType: "Federal absolute monarchy (federation of seven emirates)",
    rulingParties: "President Sheikh Mohamed bin Zayed Al Nahyan (Abu Dhabi's ruler), federal president since 2022; no political parties.",
    gdp: "~$550 billion (nominal)",
    majorExports: ["Crude oil", "Refined petroleum", "Gold & precious metals (major re-export/trading hub)", "Aluminum"],
    topTradePartners: ["India", "China", "Saudi Arabia"],
    militaryBranches: ["UAE Armed Forces (Land, Naval, Air Forces — unified command)"],
    activePersonnel: "~65,000",
    defenseBudget: "~$22–24 billion",
    alliances: ["Major strategic U.S. partner (F-35 negotiations ongoing)", "Gulf Cooperation Council", "Abraham Accords signatory (normalized ties with Israel, 2020)"],
    summary:
      "A pioneering 2020 Abraham Accords signatory and major global trade/finance/logistics hub (Dubai, gold and " +
      "diaspora-capital hub), while simultaneously drawing UN-expert scrutiny over alleged backing of Sudan's RSF " +
      "paramilitary and playing an active diplomatic role in Gaza reconstruction planning.",
  },
  Yemen: {
    region: "Middle East",
    capital: "Sana'a (Houthi-controlled); Aden (seat of the internationally recognized government)",
    population: "~34 million",
    governmentType: "Split governance — internationally recognized government vs. Houthi (Ansar Allah) de facto authority in the north/most populous areas",
    rulingParties: "Internationally recognized Presidential Leadership Council under Rashad al-Alimi (Aden-based); Houthi movement under Abdul-Malik al-Houthi controls Sana'a and northern Yemen.",
    gdp: "~$15–20 billion (nominal, one of the world's poorest, collapsed by a decade of war)",
    majorExports: ["Crude oil (limited, war-disrupted)", "Coffee (heritage Mokha variety)", "Fish"],
    topTradePartners: ["Saudi Arabia", "China", "United Arab Emirates"],
    militaryBranches: ["Yemeni government forces (Aden-based, backed by the Saudi-led coalition); Houthi forces (control the north, including advanced missile/drone capability supplied by Iran)"],
    activePersonnel: "Government forces ~150,000+; Houthi forces estimated 200,000+ (including irregular mobilized fighters)",
    defenseBudget: "Not centrally tracked amid the divided war economy; government forces heavily subsidized by Saudi Arabia/UAE",
    alliances: ["Government backed by a Saudi-led coalition (with UAE); Houthis backed by Iran as part of its 'Axis of Resistance'"],
    summary:
      "A decade-long civil war (since 2014–2015) has produced one of the world's worst humanitarian crises; since " +
      "late 2023 the Iran-aligned Houthis have launched persistent missile/drone attacks on Red Sea shipping and " +
      "Israel in declared solidarity with Gaza, drawing U.S./UK airstrikes and severely disrupting global maritime " +
      "trade through the Bab-el-Mandeb chokepoint.",
  },

  // --- Asia & Oceania ---
  China: {
    region: "Asia",
    capital: "Beijing",
    population: "~1.41 billion",
    governmentType: "One-party Communist state",
    rulingParties: "Chinese Communist Party under General Secretary/President Xi Jinping, in power since 2012 (no term limits since 2018).",
    gdp: "~$18.3 trillion (nominal, second-largest economy)",
    majorExports: ["Electronics & machinery", "Textiles & apparel", "Solar panels & batteries", "Steel"],
    topTradePartners: ["United States", "European Union", "ASEAN bloc", "Japan", "South Korea"],
    militaryBranches: ["People's Liberation Army (Ground, Navy, Air, Rocket Force, Strategic Support/Aerospace Force)"],
    activePersonnel: "~2 million (world's largest standing military)",
    defenseBudget: "~$230–290 billion (officially; independent estimates run higher)",
    alliances: ["Shanghai Cooperation Organisation", "Close strategic partnership with Russia", "BRICS"],
    summary:
      "The world's second-largest economy and a rising military peer competitor to the U.S., pursuing rapid naval " +
      "expansion and missile modernization. Maintains an assertive posture toward Taiwan (frequent air/naval incursions), " +
      "disputed South China Sea claims contested by the Philippines and Vietnam, and a deepening 'no limits' partnership " +
      "with Russia amid the Ukraine war.",
  },
  Taiwan: {
    region: "Asia",
    capital: "Taipei",
    population: "~23.5 million",
    governmentType: "Semi-presidential republic (self-governing democracy)",
    rulingParties: "President Lai Ching-te (William Lai) of the Democratic Progressive Party, since May 2024; DPP holds the presidency but not a Legislative Yuan majority.",
    gdp: "~$800 billion (nominal)",
    majorExports: ["Semiconductors (TSMC — world's leading advanced-chip foundry)", "Electronics", "Machinery"],
    topTradePartners: ["China", "United States", "Japan", "Hong Kong"],
    militaryBranches: ["Republic of China Army", "Navy", "Air Force"],
    activePersonnel: "~170,000 (plus a large reserve force)",
    defenseBudget: "~$20 billion (rising amid Chinese pressure)",
    alliances: ["Unofficial but deep U.S. security partnership (Taiwan Relations Act arms sales)", "Not a UN member; recognized by only a handful of states"],
    summary:
      "A self-governing democracy that Beijing claims as its territory and has not ruled out annexing by force. " +
      "Home to TSMC, the world's most advanced chip foundry — a linchpin of the global economy and a key strategic " +
      "flashpoint. Faces near-daily Chinese military aircraft/naval incursions into its air defense identification zone.",
  },
  Japan: {
    region: "Asia",
    capital: "Tokyo",
    population: "~124 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "Liberal Democratic Party-led coalition; PM Shigeru Ishiba took office October 2024 after Fumio Kishida's resignation.",
    gdp: "~$4.2 trillion (nominal, third/fourth-largest economy)",
    majorExports: ["Automobiles", "Electronics & semiconductors equipment", "Machinery", "Steel"],
    topTradePartners: ["China", "United States", "South Korea", "Taiwan"],
    militaryBranches: ["Japan Self-Defense Forces (Ground, Maritime, Air)"],
    activePersonnel: "~247,000",
    defenseBudget: "~$55 billion (rapidly rising toward a 2% of GDP NATO-style target by 2027)",
    alliances: ["U.S.-Japan Security Treaty (major non-NATO ally)", "Quad (with U.S., India, Australia)"],
    summary:
      "A pacifist-constitution democracy undergoing its largest military buildup since WWII in response to China's " +
      "rise, North Korean missile tests, and Russian activity near its northern islands. A key U.S. treaty ally hosting " +
      "major American bases (Okinawa, Yokosuka) central to any Taiwan contingency.",
  },
  "South Korea": {
    region: "Asia",
    capital: "Seoul",
    population: "~51.7 million",
    governmentType: "Presidential republic",
    rulingParties:
      "President Lee Jae-myung (Democratic Party) took office June 2025 following the impeachment and removal of " +
      "Yoon Suk Yeol over his December 2024 martial law declaration.",
    gdp: "~$1.9 trillion (nominal)",
    majorExports: ["Semiconductors", "Automobiles", "Shipbuilding", "Petrochemicals"],
    topTradePartners: ["China", "United States", "Vietnam", "Japan"],
    militaryBranches: ["Republic of Korea Army", "Navy", "Air Force", "Marine Corps"],
    activePersonnel: "~500,000 (plus conscription-based reserves)",
    defenseBudget: "~$47 billion",
    alliances: ["U.S.-South Korea Mutual Defense Treaty (28,500 U.S. troops stationed)", "Trilateral security coordination with U.S. and Japan"],
    summary:
      "A frontline democracy facing a nuclear-armed North Korea across the DMZ, hosting a large permanent U.S. troop " +
      "presence. Recently shaken by a brief 2024 martial law crisis and presidential impeachment, now stabilizing under " +
      "a new administration while continuing to be a top global chipmaker (Samsung, SK Hynix) and arms exporter.",
  },
  "North Korea": {
    region: "Asia",
    capital: "Pyongyang",
    population: "~26 million",
    governmentType: "One-party totalitarian dictatorship (hereditary Kim dynasty)",
    rulingParties: "Supreme Leader Kim Jong Un, Workers' Party of Korea, in power since 2011.",
    gdp: "~$18–30 billion (nominal, isolated command economy; unreliable official data)",
    majorExports: ["Coal & minerals (largely sanctioned/smuggled)", "Textiles", "Arms exports to Russia (artillery shells, missiles)"],
    topTradePartners: ["China (dominant, ~90% of trade)", "Russia (deepening military-economic ties)"],
    militaryBranches: ["Korean People's Army (Ground, Navy, Air, Strategic Force)"],
    activePersonnel: "~1.28 million (one of the world's largest militaries per capita)",
    defenseBudget: "Not disclosed; estimated a very large share of GDP",
    alliances: ["Mutual defense treaty with Russia (2024)", "China as primary patron"],
    summary:
      "A nuclear-armed state under heavy international sanctions, which has deployed thousands of troops to fight " +
      "alongside Russia against Ukraine since late 2024 in exchange for military technology transfers. Continues " +
      "frequent ballistic missile tests and has formally abandoned the goal of peaceful reunification with the South.",
  },
  India: {
    region: "Asia",
    capital: "New Delhi",
    population: "~1.44 billion (world's most populous country)",
    governmentType: "Federal parliamentary republic",
    rulingParties: "PM Narendra Modi, Bharatiya Janata Party-led NDA coalition, serving a third term since June 2024 elections.",
    gdp: "~$3.9 trillion (nominal, fifth-largest economy, among the fastest-growing major economies)",
    majorExports: ["Petroleum products", "Pharmaceuticals & generics", "IT services", "Gems & jewelry", "Textiles"],
    topTradePartners: ["United States", "China", "United Arab Emirates", "Saudi Arabia"],
    militaryBranches: ["Indian Army", "Indian Navy", "Indian Air Force"],
    activePersonnel: "~1.45 million (world's second-largest active military)",
    defenseBudget: "~$86 billion",
    alliances: ["Quad (with U.S., Japan, Australia)", "Strategic partnership with Russia (legacy arms supplier)", "BRICS", "Non-aligned tradition"],
    summary:
      "A nuclear-armed rising power balancing between the West and Russia, with a long-standing rivalry with " +
      "Pakistan over Kashmir (renewed deadly clashes in 2025) and a tense, militarized border standoff with China " +
      "in the Himalayas since 2020. A key Quad member courted by Washington as a counterweight to China.",
  },
  Pakistan: {
    region: "Asia",
    capital: "Islamabad",
    population: "~250 million",
    governmentType: "Federal parliamentary republic (military-influenced)",
    rulingParties:
      "PM Shehbaz Sharif (Pakistan Muslim League-N) heads a coalition government since March 2024 elections widely " +
      "seen as manipulated against jailed former PM Imran Khan's PTI party; the military (Army Chief Asim Munir) " +
      "retains outsized influence.",
    gdp: "~$375 billion (nominal)",
    majorExports: ["Textiles & garments", "Rice", "Leather goods", "Surgical instruments"],
    topTradePartners: ["China", "United States", "United Arab Emirates"],
    militaryBranches: ["Pakistan Army", "Navy", "Air Force"],
    activePersonnel: "~650,000",
    defenseBudget: "~$10–11 billion",
    alliances: ["Deep strategic/military partnership with China (CPEC)", "Historic U.S. security partner"],
    summary:
      "A nuclear-armed state with chronic political instability, a dominant military establishment, and an economy " +
      "reliant on repeated IMF bailouts. Fought renewed cross-border clashes with India over Kashmir in 2025 and faces " +
      "an escalating domestic insurgency from the Pakistani Taliban (TTP) along the Afghan border.",
  },
  Afghanistan: {
    region: "Asia",
    capital: "Kabul",
    population: "~42 million",
    governmentType: "De facto Islamic emirate (unrecognized by most of the world)",
    rulingParties: "Taliban movement under supreme leader Hibatullah Akhundzada, ruling since the August 2021 takeover following U.S./NATO withdrawal.",
    gdp: "~$14–17 billion (nominal, one of the world's poorest economies, heavily aid-dependent)",
    majorExports: ["Fruits & nuts", "Carpets", "Opium/illicit narcotics (despite a Taliban poppy ban)"],
    topTradePartners: ["Pakistan", "China", "Iran"],
    militaryBranches: ["Taliban security forces (no formal internationally recognized military)"],
    activePersonnel: "Estimated 150,000+ Taliban fighters/security personnel",
    defenseBudget: "Not centrally tracked; no formal state budget process",
    alliances: ["No formal alliances; limited diplomatic engagement with China, Russia, Gulf states"],
    summary:
      "Ruled by the Taliban since 2021, with women and girls barred from secondary/higher education and most public " +
      "life under strict edicts condemned internationally as gender apartheid. Faces a persistent ISIS-Khorasan (ISIS-K) " +
      "insurgency and periodic border clashes with Pakistan amid deteriorating relations.",
  },
  Iran: {
    region: "Asia",
    capital: "Tehran",
    population: "~90 million",
    governmentType: "Theocratic presidential republic (Supreme Leader holds ultimate authority)",
    rulingParties: "Supreme Leader Mojtaba Khamenei (succeeded his father Ali Khamenei after Ali Khamenei was killed in the Feb 28, 2026 opening US/Israeli strikes); President Masoud Pezeshkian (reformist-aligned), in office since July 2024.",
    gdp: "~$400–450 billion (nominal, heavily sanctioned economy, further strained by ongoing war)",
    majorExports: ["Crude oil & petroleum products (mostly to China, sanctions-evading, disrupted by war/blockade)", "Petrochemicals", "Carpets & agricultural goods"],
    topTradePartners: ["China", "United Arab Emirates", "Iraq", "Turkey"],
    militaryBranches: ["Islamic Republic of Iran Army (Artesh)", "Islamic Revolutionary Guard Corps (IRGC)", "IRGC Navy/Aerospace Force"],
    activePersonnel: "~610,000 (Artesh + IRGC combined; degraded by 2026 war losses)",
    defenseBudget: "~$10–20 billion (officially; asymmetric/proxy spending obscures true totals)",
    alliances: ["'Axis of Resistance' network (Hezbollah, Houthis, Iraqi militias)", "Strategic partnership with Russia and China"],
    summary:
      "Iran has been at war with the United States and Israel since February 28, 2026 (\"Operation Epic Fury\"), when " +
      "coordinated US/Israeli strikes hit Iranian military and nuclear sites and killed Supreme Leader Ali Khamenei " +
      "and senior IRGC commanders; his son Mojtaba Khamenei succeeded him as Supreme Leader. Iran retaliated with " +
      "large-scale missile/drone strikes and closed the Strait of Hormuz to US/Israeli-linked shipping, triggering a " +
      "global oil-market shock. A partial ceasefire (April 7-8, 2026, brokered by Pakistan) never fully held; fighting " +
      "resumed at sea in June-July after Iranian attacks on commercial vessels. As of August 2026 there have been no " +
      "major airstrikes inside Iran for several weeks, but the Strait of Hormuz remains an active maritime blockade " +
      "and confrontation zone (dozens of vessels redirected/disabled, 20+ coalition warships involved), with both " +
      "sides on high alert and Iran shifting toward proxy/asymmetric tactics. Total casualties across all parties are " +
      "estimated in the ~9,000-18,000 range. Its regional 'Axis of Resistance' network was already severely degraded " +
      "in 2024-2025 (Hezbollah decimated, Assad's Syria collapsed, Hamas battered) prior to this war.",
  },
  Kazakhstan: {
    region: "Asia",
    capital: "Astana",
    population: "~20 million",
    governmentType: "Presidential republic",
    rulingParties: "President Kassym-Jomart Tokayev, Amanat party-dominated legislature, since 2019 (following Nazarbayev's long rule).",
    gdp: "~$280 billion (nominal, Central Asia's largest economy)",
    majorExports: ["Crude oil", "Uranium (world's top producer)", "Metals & minerals", "Grain"],
    topTradePartners: ["China", "Russia", "Italy", "European Union"],
    militaryBranches: ["Kazakh Armed Forces (Ground, Air Defense, Naval)"],
    activePersonnel: "~39,000",
    defenseBudget: "~$1.5–2 billion",
    alliances: ["Collective Security Treaty Organisation (Russia-led)", "Shanghai Cooperation Organisation"],
    summary:
      "Central Asia's largest, most resource-rich economy (top uranium producer, major oil exporter), pursuing a " +
      "careful multi-vector foreign policy balancing Russia, China, and the West while avoiding open alignment with " +
      "Moscow over Ukraine.",
  },
  Uzbekistan: {
    region: "Asia",
    capital: "Tashkent",
    population: "~36 million (Central Asia's most populous)",
    governmentType: "Presidential republic",
    rulingParties: "President Shavkat Mirziyoyev, Uzbekistan Liberal Democratic Party, since 2016; re-elected 2023 under an extended-term constitution.",
    gdp: "~$115 billion (nominal)",
    majorExports: ["Gold", "Cotton & textiles", "Natural gas", "Vehicles"],
    topTradePartners: ["Russia", "China", "Kazakhstan"],
    militaryBranches: ["Uzbek Armed Forces (Ground, Air & Air Defense)"],
    activePersonnel: "~48,000",
    defenseBudget: "~$1.5 billion",
    alliances: ["Not a CSTO member (withdrew in 2012)", "Cooperative ties with both Russia and the West"],
    summary:
      "Pursuing a decade-long reform and opening drive under Mirziyoyev after decades of isolation under Karimov, " +
      "positioning itself as a Central Asian trade and connectivity hub while carefully hedging between Russia, China, " +
      "and Western investors.",
  },
  Turkmenistan: {
    region: "Asia",
    capital: "Ashgabat",
    population: "~6.5 million",
    governmentType: "Authoritarian presidential republic (one of the world's most closed states)",
    rulingParties: "President Serdar Berdimuhamedow, since 2022 (succeeded his father Gurbanguly in a managed dynastic transition); single dominant party.",
    gdp: "~$60–90 billion (nominal, unreliable official data; heavily gas-dependent)",
    majorExports: ["Natural gas (mostly to China via pipeline)", "Petrochemicals", "Textiles"],
    topTradePartners: ["China (dominant gas buyer)", "Turkey", "Russia"],
    militaryBranches: ["Turkmen Armed Forces (Ground, Air, Navy — small Caspian flotilla)"],
    activePersonnel: "~36,000",
    defenseBudget: "Not disclosed",
    alliances: ["Officially declared 'permanent neutrality' (UN-recognized); no formal military alliances"],
    summary:
      "One of the world's most isolated and opaque states, with vast natural gas reserves almost entirely exported " +
      "to China. Maintains an official policy of strict neutrality and minimal international engagement.",
  },
  Kyrgyzstan: {
    region: "Asia",
    capital: "Bishkek",
    population: "~7 million",
    governmentType: "Presidential republic",
    rulingParties: "President Sadyr Japarov, since 2021 (following unrest that toppled his predecessor); consolidated power via a 2021 constitutional overhaul.",
    gdp: "~$14 billion (nominal)",
    majorExports: ["Gold", "Textiles", "Re-exported goods (Russia/China transshipment)"],
    topTradePartners: ["Russia", "China", "Kazakhstan"],
    militaryBranches: ["Kyrgyz Armed Forces (Ground, Air)"],
    activePersonnel: "~11,000",
    defenseBudget: "~$200 million",
    alliances: ["Collective Security Treaty Organisation", "Eurasian Economic Union", "Hosts a Russian air base (Kant)"],
    summary:
      "A Central Asian state prone to political upheaval (multiple revolutions since 2005) that hosts a Russian " +
      "military air base and has periodic deadly border clashes with neighboring Tajikistan over disputed enclaves.",
  },
  Tajikistan: {
    region: "Asia",
    capital: "Dushanbe",
    population: "~10.4 million",
    governmentType: "Authoritarian presidential republic",
    rulingParties: "President Emomali Rahmon, People's Democratic Party, in power since 1994 (the longest-serving post-Soviet leader).",
    gdp: "~$12 billion (nominal, one of Central Asia's poorest, heavily remittance-dependent)",
    majorExports: ["Aluminum", "Cotton", "Gold"],
    topTradePartners: ["Russia", "China", "Kazakhstan"],
    militaryBranches: ["Tajik Armed Forces (Ground, Air)"],
    activePersonnel: "~9,000 (plus a large Russian 201st Military Base garrison)",
    defenseBudget: "~$150–200 million",
    alliances: ["Collective Security Treaty Organisation", "Hosts Russia's largest foreign military base"],
    summary:
      "One of the poorest post-Soviet states, reliant on labor-migrant remittances from Russia, hosting Russia's " +
      "largest overseas military base near the sensitive Afghan border, which it monitors closely for spillover " +
      "instability and militant activity.",
  },
  Mongolia: {
    region: "Asia",
    capital: "Ulaanbaatar",
    population: "~3.4 million",
    governmentType: "Semi-presidential parliamentary republic",
    rulingParties: "PM Luvsannamsrain Oyun-Erdene, Mongolian People's Party, since 2021 (re-elected with a reduced majority in 2024).",
    gdp: "~$21 billion (nominal)",
    majorExports: ["Coal", "Copper concentrate", "Gold"],
    topTradePartners: ["China (over 80% of exports)", "Russia (fuel imports)"],
    militaryBranches: ["Mongolian Armed Forces (Ground, small Air element)"],
    activePersonnel: "~10,000",
    defenseBudget: "~$150–200 million",
    alliances: ["Officially non-aligned 'third neighbor' policy balancing ties with the U.S., EU, Japan alongside China and Russia"],
    summary:
      "A landlocked democracy sandwiched between Russia and China, pursuing a deliberate 'third neighbor' policy to " +
      "diversify partnerships with the U.S., EU, Japan and South Korea while remaining economically dependent on " +
      "Chinese mineral demand and Russian fuel supplies.",
  },
  Bangladesh: {
    region: "Asia",
    capital: "Dhaka",
    population: "~173 million",
    governmentType: "Parliamentary republic (interim government)",
    rulingParties:
      "Interim government led by Chief Adviser Muhammad Yunus (Nobel laureate) since August 2024, after mass protests " +
      "toppled PM Sheikh Hasina's 15-year Awami League rule; elections planned for 2026.",
    gdp: "~$450 billion (nominal)",
    majorExports: ["Ready-made garments (world's second-largest exporter)", "Textiles", "Leather goods", "Jute"],
    topTradePartners: ["United States", "European Union", "China", "India"],
    militaryBranches: ["Bangladesh Army", "Navy", "Air Force"],
    activePersonnel: "~160,000",
    defenseBudget: "~$4.5 billion",
    alliances: ["Non-aligned; UN peacekeeping is a major military role (top troop-contributing country)"],
    summary:
      "Underwent a dramatic 2024 political upheaval when student-led protests ousted long-ruling PM Sheikh Hasina, " +
      "who fled to India. Now governed by an interim administration under Nobel laureate Muhammad Yunus ahead of new " +
      "elections, amid a fragile security and economic transition.",
  },
  "Sri Lanka": {
    region: "Asia",
    capital: "Sri Jayawardenepura Kotte (official); Colombo (commercial capital)",
    population: "~22 million",
    governmentType: "Presidential republic",
    rulingParties: "President Anura Kumara Dissanayake, National People's Power (leftist coalition), since September 2024 elections following the 2022 economic-collapse protests.",
    gdp: "~$85 billion (nominal, recovering from 2022 sovereign default)",
    majorExports: ["Tea", "Garments & textiles", "Rubber products", "Gems"],
    topTradePartners: ["United States", "India", "United Kingdom", "China"],
    militaryBranches: ["Sri Lanka Army", "Navy", "Air Force"],
    activePersonnel: "~200,000",
    defenseBudget: "~$1.3 billion",
    alliances: ["Non-aligned; balances close ties with both India and China (including Chinese-funded Hambantota port)"],
    summary:
      "Recovering from its 2022 economic collapse and sovereign default under an IMF program, having elected a " +
      "leftist reform government in 2024. Remains a geopolitical pivot point between India and China, which has " +
      "invested heavily in strategic port infrastructure.",
  },
  Nepal: {
    region: "Asia",
    capital: "Kathmandu",
    population: "~30 million",
    governmentType: "Federal parliamentary republic",
    rulingParties:
      "Coalition government amid frequent turnover; Gen Z-led protests in September 2025 over a social-media ban and " +
      "corruption toppled PM K.P. Sharma Oli's government, with an interim administration under Sushila Karki formed " +
      "to oversee elections.",
    gdp: "~$45 billion (nominal)",
    majorExports: ["Textiles & carpets", "Agricultural goods", "Handicrafts"],
    topTradePartners: ["India (dominant trade/transit partner)", "China", "United States"],
    militaryBranches: ["Nepalese Army"],
    activePersonnel: "~95,000",
    defenseBudget: "~$400–500 million",
    alliances: ["Non-aligned; balances India and China ties; major UN peacekeeping contributor"],
    summary:
      "Rocked by youth-led ('Gen Z') protests in 2025 that toppled the sitting government over corruption and a " +
      "since-reversed social media ban, reflecting chronic political instability. Strategically wedged between India " +
      "and China, both of which court Kathmandu's infrastructure investment.",
  },
  Bhutan: {
    region: "Asia",
    capital: "Thimphu",
    population: "~780,000",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "King Jigme Khesar Namgyel Wangchuck (head of state); PM Tshering Tobgay, People's Democratic Party, since 2024 elections.",
    gdp: "~$3 billion (nominal, small hydropower- and tourism-driven economy)",
    majorExports: ["Hydroelectricity (to India)", "Ferroalloys", "Cement"],
    topTradePartners: ["India (dominant, currency-pegged and closely integrated)"],
    militaryBranches: ["Royal Bhutan Army"],
    activePersonnel: "~10,000 (plus Indian military training support)",
    defenseBudget: "Not separately disclosed; closely tied to Indian security guarantees",
    alliances: ["Special treaty relationship with India (security and foreign-policy coordination)"],
    summary:
      "A small Himalayan kingdom closely aligned with India for security guarantees, notably over a long-running " +
      "China-India-Bhutan trijunction border dispute at Doklam, where Chinese infrastructure-building has periodically " +
      "triggered tension.",
  },
  Myanmar: {
    region: "Asia",
    capital: "Naypyidaw",
    population: "~54 million",
    governmentType: "Military junta (State Administration Council)",
    rulingParties: "Senior General Min Aung Hlaing, ruling since the February 2021 coup that ousted Aung San Suu Kyi's elected government.",
    gdp: "~$65 billion (nominal, war-battered economy)",
    majorExports: ["Natural gas", "Garments", "Gems (jade) & precious stones", "Agricultural goods"],
    topTradePartners: ["China", "Thailand", "Singapore"],
    militaryBranches: ["Tatmadaw (Army, Navy, Air Force)"],
    activePersonnel: "~150,000–300,000 (depleted by defections and combat losses)",
    defenseBudget: "Not transparently disclosed",
    alliances: ["Backed diplomatically/militarily by China and Russia (arms supplies)"],
    summary:
      "Engulfed in civil war since the 2021 military coup, with the junta losing significant territory to a coalition " +
      "of ethnic armed organizations and pro-democracy 'People's Defense Force' resistance fighters. One of the world's " +
      "most severe ongoing internal conflicts, compounded by a devastating 2025 earthquake.",
  },
  Thailand: {
    region: "Asia",
    capital: "Bangkok",
    population: "~71.6 million",
    governmentType: "Constitutional monarchy with a parliamentary government",
    rulingParties:
      "PM Anutin Charnvirakul (Bhumjaithai Party) took office September 2025 after a court removed PM Paetongtarn " +
      "Shinawatra amid a border dispute scandal, continuing a cycle of instability in Thai politics.",
    gdp: "~$550 billion (nominal, Southeast Asia's second-largest economy)",
    majorExports: ["Automobiles & auto parts", "Electronics", "Rubber products", "Rice"],
    topTradePartners: ["China", "United States", "Japan"],
    militaryBranches: ["Royal Thai Army", "Navy", "Air Force"],
    activePersonnel: "~360,000",
    defenseBudget: "~$5.8 billion",
    alliances: ["Major non-NATO U.S. ally (treaty dating to 1954)", "ASEAN"],
    summary:
      "A treaty U.S. ally with a long history of military coups and court-driven government turnover, most recently " +
      "in 2025. Fought a deadly border clash with Cambodia in mid-2025 over a long-disputed frontier temple area, " +
      "briefly escalating into artillery exchanges before a ceasefire.",
  },
  Cambodia: {
    region: "Asia",
    capital: "Phnom Penh",
    population: "~17 million",
    governmentType: "Dominant-party parliamentary system (de facto authoritarian)",
    rulingParties: "PM Hun Manet, Cambodian People's Party, since 2023 (succeeded his father Hun Sen in a managed dynastic transition after decades of CPP one-party dominance).",
    gdp: "~$45 billion (nominal)",
    majorExports: ["Garments & footwear", "Bicycles", "Agricultural goods (rice, rubber)"],
    topTradePartners: ["United States", "China", "Vietnam"],
    militaryBranches: ["Royal Cambodian Armed Forces (Army, Navy, Air Force)"],
    activePersonnel: "~125,000",
    defenseBudget: "~$1.3 billion",
    alliances: ["Close strategic/economic ties with China (Ream naval base access)", "ASEAN"],
    summary:
      "Ruled continuously by the Hun family/CPP for decades, closely aligned with China (which has funded a " +
      "controversially expanded Ream naval base). Fought a deadly border clash with Thailand in mid-2025 over disputed " +
      "ancient temple territory before a fragile ceasefire took hold.",
  },
  Laos: {
    region: "Asia",
    capital: "Vientiane",
    population: "~7.7 million",
    governmentType: "One-party Communist state",
    rulingParties: "Lao People's Revolutionary Party; President Thongloun Sisoulith, General Secretary since 2021.",
    gdp: "~$16 billion (nominal, heavily debt-burdened, especially to China)",
    majorExports: ["Electricity (hydropower, 'battery of Southeast Asia')", "Copper", "Agricultural goods"],
    topTradePartners: ["Thailand", "China", "Vietnam"],
    militaryBranches: ["Lao People's Armed Forces"],
    activePersonnel: "~29,000",
    defenseBudget: "~$150–200 million",
    alliances: ["Close ties with Vietnam and China (major creditor and investor)", "ASEAN"],
    summary:
      "A landlocked, one-party Communist state carrying heavy sovereign debt owed largely to China, which has " +
      "financed major hydropower and rail infrastructure (the China-Laos Railway) in exchange for growing economic " +
      "leverage over Vientiane.",
  },
  Vietnam: {
    region: "Asia",
    capital: "Hanoi",
    population: "~100 million",
    governmentType: "One-party Communist state",
    rulingParties: "Communist Party of Vietnam; General Secretary To Lam, since August 2024 (after a period of rapid leadership turnover).",
    gdp: "~$470 billion (nominal, one of Asia's fastest-growing manufacturing economies)",
    majorExports: ["Electronics (Samsung's largest manufacturing hub)", "Textiles & footwear", "Machinery", "Furniture"],
    topTradePartners: ["United States", "China", "South Korea", "Japan"],
    militaryBranches: ["Vietnam People's Army (Ground, Navy, Air, Coast Guard)"],
    activePersonnel: "~450,000",
    defenseBudget: "~$8–9 billion",
    alliances: ["Non-aligned 'bamboo diplomacy' balancing the U.S., China, and Russia (major legacy arms supplier)"],
    summary:
      "A major beneficiary of manufacturing supply-chain diversification away from China, becoming a top electronics " +
      "and garment export hub. Maintains disputed South China Sea claims (Paracels/Spratlys) contested with Beijing " +
      "while pursuing 'bamboo diplomacy' balancing the U.S., China, and Russia.",
  },
  Malaysia: {
    region: "Asia",
    capital: "Kuala Lumpur",
    population: "~34 million",
    governmentType: "Federal parliamentary constitutional monarchy",
    rulingParties: "PM Anwar Ibrahim, Pakatan Harapan-led unity coalition, since November 2022.",
    gdp: "~$430 billion (nominal)",
    majorExports: ["Electronics & semiconductors", "Palm oil", "Petroleum & LNG", "Chemicals"],
    topTradePartners: ["China", "Singapore", "United States"],
    militaryBranches: ["Malaysian Army", "Navy", "Air Force"],
    activePersonnel: "~110,000",
    defenseBudget: "~$4.5 billion",
    alliances: ["Five Power Defence Arrangements (with UK, Australia, NZ, Singapore)", "ASEAN"],
    summary:
      "A key Southeast Asian semiconductor-assembly and electronics hub benefiting from supply-chain diversification. " +
      "Holds contested South China Sea claims near the Spratly Islands and has periodic maritime friction with China " +
      "over energy exploration in its exclusive economic zone.",
  },
  Singapore: {
    region: "Asia",
    capital: "Singapore",
    population: "~6 million",
    governmentType: "Parliamentary republic (dominant-party system)",
    rulingParties: "PM Lawrence Wong, People's Action Party, since 2024 (PAP has governed continuously since 1959).",
    gdp: "~$530 billion (nominal, among the world's highest GDP per capita)",
    majorExports: ["Electronics & semiconductors", "Refined petroleum", "Chemicals", "Financial & trade services"],
    topTradePartners: ["China", "Malaysia", "United States", "European Union"],
    militaryBranches: ["Singapore Army", "Navy", "Air Force"],
    activePersonnel: "~72,500 (plus a large trained reserve via national service)",
    defenseBudget: "~$13 billion (highest defense spend per capita in ASEAN)",
    alliances: ["Five Power Defence Arrangements", "Close but non-treaty U.S. security cooperation"],
    summary:
      "A wealthy city-state and one of the world's busiest trade/financial hubs, positioned at the strategic Strait " +
      "of Malacca chokepoint. Maintains a heavily invested, technologically advanced military and a deliberately " +
      "neutral posture between the U.S. and China despite close economic and security ties to both.",
  },
  Indonesia: {
    region: "Asia",
    capital: "Jakarta (administrative); Nusantara (new capital under construction)",
    population: "~280 million (world's fourth-most-populous country)",
    governmentType: "Presidential republic",
    rulingParties: "President Prabowo Subianto, since October 2024, heading a broad multi-party coalition.",
    gdp: "~$1.4 trillion (nominal, Southeast Asia's largest economy, G20 member)",
    majorExports: ["Coal", "Palm oil (world's top producer)", "Nickel & processed metals (EV battery supply chain)", "Rubber"],
    topTradePartners: ["China", "United States", "Japan", "India"],
    militaryBranches: ["Indonesian Army", "Navy", "Air Force"],
    activePersonnel: "~400,000",
    defenseBudget: "~$9–10 billion",
    alliances: ["ASEAN founder", "Non-aligned foreign policy tradition"],
    summary:
      "Southeast Asia's largest economy and a G20 member, the world's top nickel producer feeding global EV battery " +
      "supply chains. Building an entirely new capital city (Nusantara) on Borneo, and maintains a traditionally " +
      "non-aligned foreign policy while facing periodic Chinese coast guard incursions near the Natuna Islands.",
  },
  Philippines: {
    region: "Asia",
    capital: "Manila",
    population: "~117 million",
    governmentType: "Presidential republic",
    rulingParties: "President Ferdinand 'Bongbong' Marcos Jr., since 2022; increasingly at odds with Vice President Sara Duterte amid a bitter political rift.",
    gdp: "~$470 billion (nominal)",
    majorExports: ["Electronics & semiconductors", "Business process outsourcing services", "Coconut products", "Machinery"],
    topTradePartners: ["China", "United States", "Japan"],
    militaryBranches: ["Philippine Army", "Navy", "Air Force"],
    activePersonnel: "~145,000",
    defenseBudget: "~$6 billion (rapidly rising amid South China Sea tensions)",
    alliances: ["U.S.-Philippines Mutual Defense Treaty (expanded EDCA base access)", "ASEAN"],
    summary:
      "A frontline U.S. treaty ally locked in an escalating maritime standoff with China over the South China Sea " +
      "(Scarborough Shoal, Second Thomas Shoal), with frequent coast guard collisions and water-cannon incidents. Has " +
      "expanded U.S. military base access under EDCA amid deepening security cooperation against Chinese pressure.",
  },
  Brunei: {
    region: "Asia",
    capital: "Bandar Seri Begawan",
    population: "~460,000",
    governmentType: "Absolute monarchy (sultanate)",
    rulingParties: "Sultan Hassanal Bolkiah, absolute monarch and head of government, ruling since 1967 (world's longest-reigning current monarch of a sovereign state alongside a few others).",
    gdp: "~$15 billion (nominal, oil- and gas-wealth-driven, no income tax)",
    majorExports: ["Crude oil", "Liquefied natural gas", "Petrochemicals"],
    topTradePartners: ["Japan", "South Korea", "China", "ASEAN partners"],
    militaryBranches: ["Royal Brunei Armed Forces (Land, Navy, Air)"],
    activePersonnel: "~7,000",
    defenseBudget: "~$400–500 million",
    alliances: ["ASEAN", "UK maintains a small permanent Gurkha garrison in Brunei"],
    summary:
      "A small, wealthy oil- and gas-rich absolute monarchy under Sultan Hassanal Bolkiah, notable for enacting a " +
      "strict Sharia penal code in 2019 (largely unenforced against foreigners) and maintaining a claim in the " +
      "contested South China Sea.",
  },
  "East Timor": {
    region: "Asia",
    capital: "Dili",
    population: "~1.4 million",
    governmentType: "Semi-presidential parliamentary republic",
    rulingParties: "PM Xanana Gusmão (independence-era leader), since 2023; President José Ramos-Horta.",
    gdp: "~$2 billion (nominal, one of Asia's poorest, oil/gas-revenue-dependent via a sovereign wealth fund)",
    majorExports: ["Coffee", "Petroleum & natural gas (declining as offshore fields deplete)"],
    topTradePartners: ["Indonesia", "Singapore", "China"],
    militaryBranches: ["Timor-Leste Defence Force (small Army, Naval component)"],
    activePersonnel: "~1,300",
    defenseBudget: "~$30–40 million",
    alliances: ["ASEAN's newest member (admitted 2025)", "Close ties with Australia and Portugal (former colonial power)"],
    summary:
      "Asia's youngest nation (independent from Indonesia in 2002, after a brutal occupation), which formally joined " +
      "ASEAN in 2025 as its 11th member. Heavily reliant on a depleting offshore petroleum fund and led by veteran " +
      "independence figures Xanana Gusmão and José Ramos-Horta.",
  },
  Australia: {
    region: "Oceania",
    capital: "Canberra",
    population: "~27 million",
    governmentType: "Federal parliamentary constitutional monarchy",
    rulingParties: "PM Anthony Albanese, Australian Labor Party, since 2022 (re-elected with an increased majority in 2025).",
    gdp: "~$1.8 trillion (nominal)",
    majorExports: ["Iron ore", "Coal", "Natural gas (LNG)", "Gold"],
    topTradePartners: ["China", "Japan", "United States", "South Korea"],
    militaryBranches: ["Australian Army", "Royal Australian Navy", "Royal Australian Air Force"],
    activePersonnel: "~60,000",
    defenseBudget: "~$40 billion (rising sharply under the AUKUS submarine program)",
    alliances: ["AUKUS (with U.S., UK)", "ANZUS Treaty", "Quad (with U.S., Japan, India)", "Five Eyes"],
    summary:
      "A key U.S. ally undertaking a historic defense buildup centered on the AUKUS deal to acquire nuclear-powered " +
      "submarines, driven by concern over Chinese naval expansion in the Pacific. A major raw-materials exporter to " +
      "China even as strategic rivalry with Beijing deepens.",
  },
  "New Zealand": {
    region: "Oceania",
    capital: "Wellington",
    population: "~5.3 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Christopher Luxon, National Party-led coalition (with ACT and NZ First), since 2023.",
    gdp: "~$250 billion (nominal)",
    majorExports: ["Dairy products", "Meat", "Wine", "Wood & forestry products"],
    topTradePartners: ["China", "Australia", "United States"],
    militaryBranches: ["New Zealand Army", "Navy", "Air Force"],
    activePersonnel: "~9,000",
    defenseBudget: "~$2.5 billion (increasing amid Pacific security concerns)",
    alliances: ["ANZUS (informally, post-1985 nuclear-ships rift with the U.S.)", "Five Eyes", "Close defense ties with Australia"],
    summary:
      "A small, historically nuclear-free-policy nation increasing defense spending amid rising concern over Chinese " +
      "influence-seeking across the South Pacific islands, while maintaining deep intelligence-sharing ties through " +
      "the Five Eyes alliance.",
  },
  Fiji: {
    region: "Oceania",
    capital: "Suva",
    population: "~930,000",
    governmentType: "Parliamentary republic",
    rulingParties: "PM Sitiveni Rabuka, People's Alliance-led coalition, since December 2022 elections.",
    gdp: "~$5.5 billion (nominal)",
    majorExports: ["Sugar", "Bottled water (Fiji Water)", "Fish", "Tourism services (major GDP driver, not a goods export)"],
    topTradePartners: ["Australia", "New Zealand", "United States"],
    militaryBranches: ["Republic of Fiji Military Forces (Land, Naval)"],
    activePersonnel: "~3,500",
    defenseBudget: "~$60–80 million",
    alliances: ["Pacific Islands Forum member", "Close defense ties with Australia and New Zealand"],
    summary:
      "The most populous Melanesian Pacific island state and a Pacific Islands Forum leader, courted heavily by both " +
      "China and traditional Western partners (Australia, U.S.) amid intensifying great-power competition for " +
      "influence across the Pacific.",
  },
  "Papua New Guinea": {
    region: "Oceania",
    capital: "Port Moresby",
    population: "~10.3 million",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM James Marape, Pangu Pati-led coalition, since 2019 (survived multiple no-confidence challenges).",
    gdp: "~$32 billion (nominal, resource-driven)",
    majorExports: ["Liquefied natural gas", "Gold & copper", "Palm oil", "Timber"],
    topTradePartners: ["Australia", "China", "Japan"],
    militaryBranches: ["Papua New Guinea Defence Force"],
    activePersonnel: "~4,000",
    defenseBudget: "~$100–150 million",
    alliances: ["Defense cooperation agreements with both Australia and the United States (2023)", "Pacific Islands Forum"],
    summary:
      "The largest Pacific Island nation by population and land area, rich in LNG and mineral resources, and a key " +
      "focus of U.S.-Australia efforts to counter growing Chinese security and infrastructure engagement across " +
      "Melanesia, having signed defense pacts with both Canberra and Washington.",
  },
  "Solomon Islands": {
    region: "Oceania",
    capital: "Honiara",
    population: "~740,000",
    governmentType: "Parliamentary constitutional monarchy",
    rulingParties: "PM Jeremiah Manele, Ownership, Unity and Responsibility Party, since 2024 (succeeded Manasseh Sogavare).",
    gdp: "~$1.7 billion (nominal, one of the Pacific's poorest states)",
    majorExports: ["Timber & logs", "Fish", "Palm oil", "Cocoa"],
    topTradePartners: ["China", "Australia"],
    militaryBranches: ["No standing military; Royal Solomon Islands Police Force handles security"],
    activePersonnel: "N/A (police-based security force only)",
    defenseBudget: "Not applicable (no armed forces)",
    alliances: ["Controversial 2022 security pact with China", "Pacific Islands Forum"],
    summary:
      "The epicenter of intensifying U.S.-China rivalry in the Pacific since signing a controversial 2022 security " +
      "pact with Beijing that alarmed Australia and the U.S., raising fears of a future Chinese military foothold " +
      "despite Honiara's denials of any such plan.",
  },
  Vanuatu: {
    region: "Oceania",
    capital: "Port Vila",
    population: "~330,000",
    governmentType: "Parliamentary republic",
    rulingParties: "Prone to frequent coalition changes and votes of no confidence; government composition shifts often among small local parties.",
    gdp: "~$1 billion (nominal, tourism- and agriculture-dependent, still rebuilding from a severe December 2023 cyclone and 2024 earthquake)",
    majorExports: ["Copra & coconut products", "Kava", "Beef", "Cocoa"],
    topTradePartners: ["Thailand", "Japan", "Australia"],
    militaryBranches: ["No standing military; Vanuatu Mobile Force (paramilitary police unit) handles security"],
    activePersonnel: "N/A (paramilitary police force only)",
    defenseBudget: "Not applicable (no armed forces)",
    alliances: ["Pacific Islands Forum", "Close development ties with Australia, New Zealand, and China"],
    summary:
      "A small, disaster-prone archipelago (major 2023 cyclones and a damaging December 2024 earthquake) courted by " +
      "both China and Australia for regional influence, with chronically unstable domestic coalition politics.",
  },
  "New Caledonia": {
    region: "Oceania",
    capital: "Nouméa",
    population: "~270,000",
    governmentType: "French special collectivity (autonomous territory)",
    rulingParties: "Local Congress split between pro-independence (Kanak, FLNKS) and pro-France loyalist parties; French High Commissioner represents Paris.",
    gdp: "~$9–10 billion (nominal, nickel-mining-dependent)",
    majorExports: ["Nickel ore & ferronickel (major global producer)"],
    topTradePartners: ["France", "China", "Japan", "South Korea"],
    militaryBranches: ["French Armed Forces garrison (FANC — Forces Armées en Nouvelle-Calédonie)"],
    activePersonnel: "~1,500 French military personnel stationed",
    defenseBudget: "Funded via the French national defense budget",
    alliances: ["French overseas territory; defense provided by France"],
    summary:
      "A French Pacific territory that saw deadly pro-independence riots in May 2024 over a contested voting-rights " +
      "reform, the worst unrest in decades, reviving a long-running Kanak independence movement against continued " +
      "French rule and drawing military reinforcements from Paris.",
  },
};
