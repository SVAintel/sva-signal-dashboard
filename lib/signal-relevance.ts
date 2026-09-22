export type RelevanceReason = "structured" | "public-interest" | "ambiguous" | "sports" | "entertainment" | "gaming" | "lifestyle" | "promotion" | "empty";
export interface RelevanceDecision { keep: boolean; reason: RelevanceReason; }

export function isStructuredSource(source: string): boolean {
  return /^(?:USGS|EMSC|ACLED|Alpha ?Vantage|CoinGecko|Dashboard)$/i.test(source.trim());
}

const SPORTS = /\b(?:ncaa|nfl|nba|mlb|nhl|ufc|fifa|cricket|tennis|golf|football|soccer|baseball|basketball|quarterback|running back|touchdowns?|wickets?|innings|playoffs?|semifinals?|quarterfinals?|premier league|champions league|world cup|olympics?|grand prix|formula (?:one|1)|transfer window|run game|florida state rb|college sports|boxing)\b/i;
const SPORT_ROUTINE = /\b(?:scores?|results?|wins?|loses?|goals?|league|season|rankings?|coach|players?|athletes?|injur(?:y|ies)|transfers?|trade|touchdowns?|run game|rb|striker|batsman|tournament|olympics?|praise|stats|game|match|title race|fans)\b/i;
const POST_MATCH = /\b(?:head coach|HC|post[ -]?(?:game|match)|half[ -]?time|matchday)\b/i;
const SCORE_RESULT = /\b\d{1,3}\s*[-–:]\s*\d{1,3}\s+(?:loss|win|defeat|victory|draw)\b|\b(?:loss|win|defeat|victory|draw)\b.{0,40}\b\d{1,3}\s*[-–:]\s*\d{1,3}\b/i;
const ENTERTAINMENT = /\b(?:movie|film|cinema|actor|actress|celebrity|singer|concert|album|oscars?|grammys?|emmys?|box office|red carpet|tv show|reality show|netflix|streaming series|c[eé]line dion|taylor swift|kardashian|sequel|biopic)\b/i;
const FICTION = /\b(?:movie|film|series|novel|fictional|screenplay|trailer|plot|character|on screen)\b/i;
const FICTION_ACTION = /\b(?:plot|scene|trailer|review|portray|portrays|fictional|starring|stars as|character|box office|sequel|streaming)\b/i;
const GAMING = /\b(?:video games?|esports?|riot games|playstation|xbox|nintendo|fortnite|minecraft|call of duty|in.game|gameplay|gaming|steam sale)\b/i;
const LIFESTYLE = /\b(?:horoscope|crossword|recipes?|beauty tips|skincare|fashion trends|weight loss|diet tips|dieting|weight journey|body confidence|sleep habits|dating tips|anti.aging|heart disease|heart attack|hidden debt|chronic stress|supplements?|superfoods?|longevity|workout|fitness tips|wellness|celebrity diet|tree of the year)\b/i;
const PROMOTION = /\b(?:sponsored content|advertorial|promo code|coupon code|shopping deals|best deals|buy now|product review|affiliate links)\b/i;

const PUBLIC_POLICY = /\b(?:government|parliament|minister|president|senate|congress|court|police|regulator|central bank|federal reserve|elections?|ballot|legislation|treaty|sanctions?|political boycott|diplomatic boycott|human rights|public health|health ministry|health authorities|who declares|cdc warns)\b/i;
const PUBLIC_ACTION = /\b(?:ban|bans|banned|boycott|boycotts|sanctions?|tariffs?|regulat(?:ion|ions|es|e)|policy|policies|investigat(?:es|ion|ing)|lawsuit|sues|ruling|law|bill|election|outbreak|pandemic|epidemic|recall|emergency|arrest(?:ed|s)?|charges?|corruption|protest(?:s|ers)?|strike|resign(?:s|ation)?|interest rates?|inflation|trade|budget|fiscal|monetary)\b/i;
const SPECIFIC_THREAT = /\b(?:airstrikes?|missile strikes?|drone strikes?|armed clashes|ransomware|cyberattacks?|data breach|power grid|pipeline rupture|nuclear reactor|radiation leak|mass shooting|terrorist attack|bomb threat|bombing|earthquakes?|tsunami|wildfires?|typhoons?|hurricanes?|cyclones?|flash floods?|landslides?|pandemic|epidemic|disease outbreak|ebola outbreak|cholera outbreak|measles outbreak|oil spill|chemical spill|bridge collapse|train derailment|plane crash|humanitarian|ceasefire|military deployment)\b/i;
const VENUES = String.raw`(?:stadium|arena|cinema|theat(?:er|re)|concert|festival|match|airport|school|hospital|crowd|spectators?|fans|venue)`;
const VENUE_EMERGENCIES = String.raw`(?:evacuat(?:ed|ion|e|es)|bombing|bomb threat|shooting|terrorist attack|stampede|mass casualties|structural collapse)`;
const REAL_VENUE_EVENT = new RegExp(String.raw`\b${VENUES}\b.{0,85}\b${VENUE_EMERGENCIES}\b|\b${VENUE_EMERGENCIES}\b.{0,85}\b${VENUES}\b`, "i");
const REAL_RESPONSE = /\b(?:police|firefighters?|emergency services|authorities|hospitals?|rescuers?|evacuat(?:ed|ion|e|es)|arrested|suspects?|wounded|injured people|mass casualties)\b/i;

export function assessSignalRelevance(title: string, description = "", source = ""): RelevanceDecision {
  if (isStructuredSource(source)) return { keep: true, reason: "structured" };
  const headline = title.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!headline) return { keep: false, reason: "empty" };
  const text = `${headline} ${description.replace(/<[^>]*>/g, " ").slice(0, 4000)}`;
  const sportsOutlet = /\b(?:ESPN|Sky Sports|NBC Sports|Sports Illustrated|The Athletic)\b/i.test(source);
  const sports = (SPORTS.test(headline) || sportsOutlet) && SPORT_ROUTINE.test(text) ||
    POST_MATCH.test(text) && SCORE_RESULT.test(headline);
  const entertainment = ENTERTAINMENT.test(headline);
  const issuePreview = /^([^#]{1,100})#\d{1,5}\s+(?:preview|review)\s*:/i.exec(headline);
  const comicPreview = !!issuePreview && !SPECIFIC_THREAT.test(issuePreview[1]) &&
    !REAL_RESPONSE.test(issuePreview[1]) && !PUBLIC_POLICY.test(issuePreview[1]);
  const gaming = GAMING.test(headline);
  const lifestyle = LIFESTYLE.test(headline);
  const fiction = comicPreview || FICTION.test(headline) && FICTION_ACTION.test(headline) ||
    gaming && /\b(?:review|gameplay|in.game|mission|plot|trailer|character)\b/i.test(headline);
  const publicPolicy = PUBLIC_POLICY.test(headline) && PUBLIC_ACTION.test(text) && !fiction;
  const humanHarm = /\b(?:kills?|killed|injures?|wounds?)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve|dozens)\s+(?:people|fans|spectators|attendees)\b|\b\d+\s+(?:people\s+)?(?:dead|injured|wounded)\b/i.test(headline);
  const venueAttack = /\b(?:concert|stadium|arena|cinema|festival|crowd)\b/i.test(headline) &&
    /\battack\b/i.test(headline) && (humanHarm || REAL_RESPONSE.test(headline));
  const venueEmergency = (REAL_VENUE_EVENT.test(headline) || venueAttack) && !fiction;
  const realDisaster = /\b(?:earthquake|tsunami|wildfire|typhoon|hurricane|cyclone|flash flood)\b/i.test(headline) &&
    /\b(?:disrupts?|cancels?|evacuat\w*|hits?|strikes?|damages?|landfall|warnings?|killed|deaths?|flooding)\b/i.test(headline) && !fiction;
  const publicHealth = /\b(?:outbreak|pandemic|epidemic|public health emergency|disease surveillance)\b/i.test(headline) && !fiction;
  const digitalIncident = /\b(?:ransomware|cyberattack|data breach|hackers? stole|cybersecurity)\b/i.test(headline) && !fiction;

  if (venueEmergency || realDisaster || publicHealth || digitalIncident || publicPolicy) return { keep: true, reason: "public-interest" };
  if (PROMOTION.test(headline)) return { keep: false, reason: "promotion" };
  if (gaming) return { keep: false, reason: "gaming" };
  if (sports) return { keep: false, reason: "sports" };
  if (entertainment || fiction) return { keep: false, reason: "entertainment" };
  if (lifestyle) return { keep: false, reason: "lifestyle" };
  if (SPECIFIC_THREAT.test(text)) return { keep: true, reason: "public-interest" };
  return { keep: true, reason: "ambiguous" };
}
