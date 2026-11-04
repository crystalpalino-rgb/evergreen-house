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
 * Clause boundaries used to shorten an editor note into a one-line hook.
 * Longest-first so " that " wins over " is " when both would cut later text.
 */
const HOOK_BOUNDARIES = [
  " that ",
  " which ",
  " makes ",
  " turns ",
  " because ",
  " is ",
  " are ",
  " was ",
  " were ",
  " does ",
  " so ",
  " but ",
  " and ",
  " with ",
  " for ",
  " in ",
  " on ",
  " - ",
  ", ",
  ". ",
  ",",
  ": ",
  "; ",
];

/** Longest hook we will render. Two lines at most on a narrow card. */
const HOOK_MAX = 72;
/** Shortest hook worth rendering as a line of its own. */
const HOOK_MIN = 12;

/**
 * Words a line must never end on. A line that stops on one of these reads as a
 * sentence someone cut in half, which is exactly what the card must not show.
 */
const DANGLING_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "with", "for", "to", "of", "in", "on",
  "at", "by", "from", "that", "which", "who", "is", "are", "was", "were", "be",
  "so", "as", "than", "then", "into", "your", "our", "their", "its", "his",
  "her", "it", "this", "these", "those", "not", "very", "plus", "over", "under",
  "more", "most", "less", "all", "every", "each", "both", "just", "also", "up",
  "out", "off", "onto", "about", "like", "while", "when", "where", "how",
]);

/** Lowercase alphanumeric-only form, used to detect a hook that repeats the name. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Trim to a whole-word boundary, never leaving a hanging word or a bare ellipsis. */
function trimToWordBoundary(text: string, max: number): string {
  const clean = text.replace(/[,\s;:.\-]+$/, "").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const base = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut)
    .replace(/[,\s;:.\-]+$/, "")
    .trim();
  const words = base.split(" ").filter(Boolean);
  while (
    words.length > 1 &&
    DANGLING_WORDS.has(words[words.length - 1].toLowerCase().replace(/[^a-z']/g, ""))
  ) {
    words.pop();
  }
  return words.join(" ").replace(/[,\s;:.\-]+$/, "").trim();
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

/**
 * One short editorial line for the card, and it is ALWAYS a line.
 *
 * Order of preference:
 *   1. the opening clause of the product's own editor note, cut at a natural
 *      boundary and capped at HOOK_MAX characters;
 *   2. the whole note, trimmed back to a whole word;
 *   3. for a note too short to reach HOOK_MIN, that note as written;
 *   4. when the row carries no usable note, an honest line naming where the
 *      piece belongs - never a claim about the product, never an empty string.
 *
 * A null return is gone on purpose: a card with no line reads as unfinished, and
 * the old 64-character rule silently produced exactly that on a few cards.
 */
export function cardHookLine(
  note: string | null | undefined,
  name?: string | null,
  roomLabel?: string | null,
): string {
  const text = (note || "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, " ");

  if (text) {
    // Candidate A: as much of the note as fits, cut back to a whole word.
    const trimmed = trimToWordBoundary(text, HOOK_MAX);
    // Candidate B: the note cut at the latest natural clause boundary that still
    // fits, which is what keeps a line reading like a sentence instead of a
    // fragment ("A handheld fan is the smallest thing that rescues a hot
    // afternoon" rather than "A handheld fan").
    let bestBoundary = -1;
    for (const boundary of HOOK_BOUNDARIES) {
      let at = text.indexOf(boundary);
      while (at > 0 && at <= HOOK_MAX) {
        if (at > bestBoundary) bestBoundary = at;
        at = text.indexOf(boundary, at + 1);
      }
    }
    const clause =
      bestBoundary > 0 ? trimToWordBoundary(text.slice(0, bestBoundary), HOOK_MAX) : "";

    // The longer of the two, as long as it is a usable line.
    const candidates = [clause, trimmed]
      .filter((line) => line.length >= HOOK_MIN)
      .sort((a, b) => b.length - a.length);

    for (const line of candidates) {
      if (!repeatsName(line, name)) return sentenceCase(line);
    }

    // A note too short for HOOK_MIN still gets its own line.
    if (trimmed.length > 0 && !repeatsName(trimmed, name)) return sentenceCase(trimmed);
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
