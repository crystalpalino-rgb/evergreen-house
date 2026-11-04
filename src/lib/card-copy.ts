/**
 * Copy helpers for the shared product card (src/components/ProductCard.tsx).
 *
 * Deliberately dependency-free: the card ships to the browser, so this module
 * must never pull in the database client (which is why the room labels below
 * are duplicated from src/lib/related.ts rather than imported from it).
 *
 * No em-dashes anywhere (owner style directive): plain hyphens only.
 */

/** Human-readable room labels for the card's small editorial label. */
export const CARD_ROOM_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  office: "Home Office",
  patio: "Patio and Outdoor",
  entryway: "Entryway",
  "dining-room": "Dining Room",
  laundry: "Laundry Room",
  pantry: "Pantry",
  storage: "Storage",
  organization: "Organization",
  holiday: "Holiday",
  summer: "Summer",
  fall: "Fall",
  spring: "Spring",
  winter: "Winter",
  nursery: "Nursery",
  apparel: "Apparel",
};

/**
 * Room label for the card, or null when the row carries no usable room.
 * Falls back to a title-cased slug so a new room value never renders raw.
 */
export function cardRoomLabel(room: string | null | undefined): string | null {
  const value = (room || "").trim();
  if (!value) return null;
  const known = CARD_ROOM_LABELS[value];
  if (known) return known;
  const words = value.replace(/[-_]+/g, " ").trim();
  if (!words) return null;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Clause boundaries a derived line may end at. Each entry is the exact text the
 * cut happens BEFORE, so a line never ends on the punctuation itself.
 *
 * STRONG boundaries close a real clause: a comma, a dash, a colon, or a
 * conjunction that opens one. WEAK boundaries (a preposition or a verb) are
 * only used when no strong cut reads well, because a cut in front of "for" or
 * "needs" can leave a noun phrase behind - still far better than a truncation.
 *
 * Relative pronouns ("that", "which", "who", "whose") are deliberately NOT
 * boundaries: cutting in front of them leaves a noun phrase begging for its
 * clause ("A felt pumpkin garland is the small piece"). A short note is used
 * whole instead, which is why the first-sentence rule comes first.
 */
const STRONG_BOUNDARIES = [
  ", ",
  " - ",
  ": ",
  "; ",
  " and ",
  " but ",
  " so ",
  " or ",
  " yet ",
  " because ",
  " while ",
  " when ",
  " where ",
  " if ",
  " though ",
  " although ",
  " since ",
  " unless ",
  " rather than ",
];

const WEAK_BOUNDARIES = [
  " to ",
  " for ",
  " with ",
  " from ",
  " in ",
  " on ",
  " at ",
  " by ",
  " of ",
  " into ",
  " over ",
  " under ",
  " after ",
  " before ",
  " is ",
  " are ",
  " was ",
  " were ",
  " has ",
  " have ",
  " does ",
  " gives ",
  " makes ",
  " turns ",
  " keeps ",
  " needs ",
  " earns ",
  " suits ",
  " holds ",
  " adds ",
  " brings ",
  " comes ",
  " works ",
  " reads ",
  " feels ",
  " looks ",
  " sits ",
  " layers ",
  " pairs ",
  " solves ",
  " saves ",
  " warms ",
];

/**
 * Longest derived line we render. The hook sits on two lines on a narrow card
 * (line-clamp-2 in ProductCard), so a full short sentence fits.
 */
export const HOOK_MAX = 110;
/** Shortest derived line worth rendering at all. */
const HOOK_MIN = 12;
/** A cut shorter than this is a noun phrase, not a line: use a longer one. */
const CUT_MIN = 30;
/** Shortest self-contained clause we would rather show than a cut (~45 chars). */
const CLAUSE_MIN = 40;
/** Above this a line starts to read as truncated, so shorter wins instead. */
const COMFORT_MAX = 85;

/**
 * Words a line must never end on: articles, pronouns, prepositions,
 * conjunctions and auxiliaries. A line that stops on one of these reads as a
 * sentence someone cut in half, which is exactly what the card must not show.
 * This is a real stopword list, not a handful of examples.
 */
const STOPWORDS = new Set([
  // articles, determiners, quantifiers
  "a", "an", "the", "one", "this", "that", "these", "those", "each", "every",
  "either", "neither", "another", "some", "any", "no", "all", "both", "such",
  "many", "much", "few", "several",
  // pronouns
  "i", "we", "you", "he", "she", "it", "they", "me", "us", "him", "her",
  "them", "my", "our", "your", "his", "its", "their", "whose", "which", "who",
  "whom", "what", "whatever", "whichever",
  // conjunctions and subordinators
  "and", "or", "but", "nor", "yet", "so", "if", "when", "while", "where",
  "because", "since", "though", "although", "unless", "until", "than", "then",
  "whether", "as", "plus",
  // prepositions
  "of", "to", "in", "on", "at", "by", "for", "from", "with", "without",
  "into", "onto", "over", "under", "past", "about", "above", "below",
  "between", "through", "during", "before", "after", "against", "across",
  "around", "along", "behind", "beyond", "within", "upon", "per", "via",
  "off", "out", "up", "down", "near", "like", "despite", "toward",
  // auxiliaries and copulas
  "is", "are", "was", "were", "be", "been", "being", "am",
  "has", "have", "had", "having", "do", "does", "did", "doing",
  "can", "could", "would", "should", "will", "shall", "may", "might", "must",
  // adverbs that leave a thought hanging
  "not", "very", "just", "also", "too", "only", "still", "even", "more",
  "most", "less", "least", "how", "why", "however", "almost", "rather",
  "quite", "nearly", "always", "often", "never", "here", "there", "now",
]);

/**
 * Words that make a cut read as a clause rather than a noun phrase. Only used
 * to rank candidates: a line that contains one of these is preferred over one
 * that is just a list of things.
 */
const CLAUSE_VERBS = new Set([
  "is", "are", "was", "were", "be", "been", "has", "have", "had", "does",
  "do", "did", "can", "will", "makes", "make", "gives", "give", "turns",
  "turn", "keeps", "keep", "needs", "need", "earns", "earn", "suits", "suit",
  "holds", "hold", "adds", "add", "brings", "bring", "comes", "come",
  "works", "work", "reads", "read", "feels", "feel", "looks", "look",
  "sits", "sit", "layers", "layer", "pairs", "pair", "solves", "solve",
  "saves", "save", "warms", "warm", "hangs", "hang", "runs", "run",
  "stands", "stand", "fits", "fit", "drapes", "drape", "sets", "set",
  "lets", "let", "gets", "get", "takes", "take", "puts", "put", "says",
  "say", "wants", "want", "grows", "grow", "fills", "fill",
  "covers", "cover", "carries", "carry", "softens", "soften",
]);

/** Lowercase alphanumeric-only form, used to detect a hook that repeats the name. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** The last word of a line, lowercased and stripped of punctuation. */
function lastWord(line: string): string {
  const words = line.split(" ").filter(Boolean);
  const word = words[words.length - 1] || "";
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

/** True when the line carries a verb, so a cut reads as a clause, not a list. */
function hasClauseVerb(line: string): boolean {
  return line
    .toLowerCase()
    .split(/[^a-z']+/)
    .some((word) => word.length > 1 && CLAUSE_VERBS.has(word));
}

/**
 * True when a line reads as a finished thought: no trailing space, no colon or
 * semicolon, no bare hyphen, and never a stopword at the end. Exported so
 * scripts/audit-card-hooks.mjs checks derived lines with this exact rule.
 */
export function hookEndsCleanly(line: string): boolean {
  const value = line || "";
  if (!value.trim()) return false;
  if (value !== value.trim()) return false;
  if (/[:;]$/.test(value)) return false;
  if (/[\s-]$/.test(value)) return false;
  const word = lastWord(value);
  if (!word) return false;
  return !STOPWORDS.has(word);
}

/**
 * Adverbs that can trail a clause without breaking it ("the drawer I open
 * most"). A cut may drop one of these and still read. Anything else - an
 * article, a pronoun, a preposition or a conjunction - means the cut landed
 * mid-phrase, so that cut is dropped rather than patched.
 */
const POPPABLE_ADVERBS = new Set([
  "most", "less", "least", "more", "very", "just", "only", "still", "even",
  "also", "too", "not", "quite", "rather", "nearly", "almost", "always",
  "often", "never", "now", "here", "there", "however",
]);

/** Drop trailing stopwords, so a cut that lands on "most" still reads. */
function popTrailingStopwords(line: string): string {
  const words = line.split(" ").filter(Boolean);
  while (words.length > 2 && STOPWORDS.has(lastWord(words.join(" ")))) {
    words.pop();
  }
  return words.join(" ");
}

/** The same, but only for a trailing adverb: never patch a cut mid-phrase. */
function popTrailingAdverb(line: string): string {
  const word = lastWord(line);
  if (!POPPABLE_ADVERBS.has(word)) return line;
  return popTrailingStopwords(line);
}

/** Trim to a whole-word boundary, never leaving a hanging word or a bare ellipsis. */
function trimToWordBoundary(text: string, max: number): string {
  const clean = text.replace(/\.{2,}$/, ".").replace(/[,\s;:\-]+$/, "").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut)
    .replace(/[,\s;:\-]+$/, "")
    .trim();
  return popTrailingStopwords(base).replace(/[,\s;:\-]+$/, "").trim();
}

/** Sentence case for a derived line, without touching the words themselves. */
function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** True when the line just repeats the product name back at the shopper. */
function repeatsName(line: string, name?: string | null): boolean {
  const nameText = (name || "").trim();
  if (!nameText) return false;
  const a = normalize(line);
  const b = normalize(nameText);
  return Boolean(a && b && (b.includes(a) || a.includes(b)));
}

/** The note as one clean line: no stray dashes, no wrapping quotes, no double spaces. */
function cleanNote(note: string | null | undefined): string {
  return (note || "")
    .replace(/\s*[\u2013\u2014]\s*/g, " - ")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The note's first complete sentence, punctuation included, or null when the
 * note never closes one. A period inside a number or an abbreviation ("4.2",
 * "e.g.") does not end a sentence, because the next character is not a space
 * followed by a capital.
 */
function firstCompleteSentence(text: string): string | null {
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    const next = text.charAt(i + 1);
    if (next && next !== " ") continue;
    const rest = text.slice(i + 1).trim();
    if (rest && !/^["'(\u201c\u2018A-Z]/.test(rest)) continue;
    return text.slice(0, i + 1).trim();
  }
  return null;
}

/** A candidate line plus what it takes to rank it. */
type HookCandidate = {
  line: string;
  length: number;
  strong: boolean;
  hasVerb: boolean;
};

/**
 * Every place the note can be cut, as the text BEFORE the boundary, plus the
 * same cut with trailing stopwords dropped. Trailing commas are stripped, so a
 * cut never ends on punctuation.
 */
function boundaryCuts(text: string): HookCandidate[] {
  const out: HookCandidate[] = [];
  const add = (raw: string, strong: boolean) => {
    const line = raw.replace(/[,\s;:\-]+$/, "").trim();
    if (!line) return;
    out.push({
      line,
      length: line.length,
      strong,
      hasVerb: hasClauseVerb(line),
    });
    const popped = popTrailingAdverb(line);
    if (popped !== line) {
      out.push({
        line: popped,
        length: popped.length,
        strong,
        hasVerb: hasClauseVerb(popped),
      });
    }
  };

  const scan = (boundaries: string[], strong: boolean) => {
    for (const boundary of boundaries) {
      let at = text.indexOf(boundary);
      while (at > 0) {
        if (at <= HOOK_MAX) {
          add(text.slice(0, at), strong);
        }
        at = text.indexOf(boundary, at + 1);
      }
    }
  };

  scan(STRONG_BOUNDARIES, true);
  scan(WEAK_BOUNDARIES, false);
  return out;
}

/**
 * One short editorial line for the card, and it is ALWAYS a line.
 *
 * Order of preference, best reading first:
 *   1. the note's first complete sentence, verbatim, when it fits in HOOK_MAX;
 *   2. the shortest cut between CLAUSE_MIN and COMFORT_MAX characters, at a
 *      strong boundary first (comma, dash, colon, or a conjunction that opens
 *      a real clause) and a weak one after (a preposition or a verb);
 *   3. failing that, the longest clean cut between CUT_MIN and CLAUSE_MIN - a
 *      short clean line still beats a long broken one;
 *   4. failing that, the shortest cut over COMFORT_MAX, which reads long
 *      rather than cut off;
 *   5. the note trimmed back to a whole word;
 *   6. when the row carries no usable note, an honest line naming where the
 *      piece belongs - never a claim about the product, never an empty string.
 *
 * Every candidate must read as a finished thought: see hookEndsCleanly. A line
 * never repeats the product name and never invents a claim about the product.
 */
export function cardHookLine(
  note: string | null | undefined,
  name?: string | null,
  roomLabel?: string | null,
): string {
  const text = cleanNote(note);

  if (text) {
    const ordered: string[] = [];

    const sentence = firstCompleteSentence(text);
    if (sentence && sentence.length >= HOOK_MIN && sentence.length <= HOOK_MAX) {
      ordered.push(sentence);
    }

    /* Rank every cut in one list. The band is what the card actually reads
       well at: 40 to COMFORT_MAX characters is the target, a shorter cut is
       the next best thing as long as it clears CUT_MIN (longest of those
       first, so the line keeps content),
       and anything longer than COMFORT_MAX comes last because a long cut is
       the one that reads as truncated. Inside a band a strong boundary wins,
       then the shortest line. */
    const band = (length: number) =>
      length < CLAUSE_MIN ? 1 : length > COMFORT_MAX ? 2 : 0;
    const cuts = boundaryCuts(text)
      .filter((cut) => cut.length >= CUT_MIN && cut.length <= HOOK_MAX)
      .sort((a, b) => {
        const bandDiff = band(a.length) - band(b.length);
        if (bandDiff !== 0) return bandDiff;
        if (a.strong !== b.strong) return a.strong ? -1 : 1;
        const shortFirst = band(a.length) !== 1;
        const lengthDiff = shortFirst ? a.length - b.length : b.length - a.length;
        if (lengthDiff !== 0) return lengthDiff;
        return Number(b.hasVerb) - Number(a.hasVerb);
      });
    ordered.push(...cuts.map((cut) => cut.line));

    const whole = trimToWordBoundary(text, HOOK_MAX);
    if (whole) ordered.push(whole);

    const seen = new Set<string>();
    for (const candidate of ordered) {
      const line = candidate.replace(/\s+/g, " ").trim();
      const key = line.toLowerCase();
      if (!line || seen.has(key)) continue;
      seen.add(key);
      if (!hookEndsCleanly(line)) continue;
      if (repeatsName(line, name)) continue;
      return sentenceCase(line);
    }
  }

  const where = (roomLabel || "").trim().toLowerCase();
  return where
    ? `An Evergreen House pick for the ${where}.`
    : "An Evergreen House pick from our editors.";
}

/** Price for a US reader: $19.99. Null when the row carries no verified price. */
export function cardPrice(price: number | string | null | undefined): string | null {
  if (price === null || price === undefined || price === "") return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/**
 * Star rating exactly as stored: 4.2 prints as 4.2, never 4 or 4.5. Null when
 * the row carries no rating, so the card shows no stars rather than a zero.
 */
export function cardRating(rating: number | string | null | undefined): string | null {
  if (rating === null || rating === undefined || rating === "") return null;
  const n = Number(rating);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Number.isInteger(n) ? n.toFixed(1) : String(n);
}

/** Review count for a US reader: 1,354. Null when the row carries no count. */
export function cardReviewCount(count: number | string | null | undefined): string | null {
  if (count === null || count === undefined || count === "") return null;
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("en-US").format(n);
}

/**
 * "November 2026" from a price_checked_at date. Null when nothing was ever
 * verified, so the page disclosure shows no date rather than a guess.
 */
export function cardVerifiedMonth(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(String(date));
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** The card's title: the clean human title when set, the listing name otherwise. */
export function cardTitle(
  displayTitle: string | null | undefined,
  name: string | null | undefined,
): string {
  const clean = (displayTitle || "").trim();
  if (clean) return clean;
  return (name || "").trim();
}
