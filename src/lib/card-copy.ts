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

/** Longest hook we will render on one line. */
const HOOK_MAX = 64;
/** Shortest hook worth rendering. Below this it reads as a fragment. */
const HOOK_MIN = 12;

/** Lowercase alphanumeric-only form, used to detect a hook that repeats the name. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * A one-line styling hook for the card, derived from the product's own editor
 * note: the opening clause of the note, cut at the first natural boundary (a
 * comma, " that ", " is ", ...) and capped at HOOK_MAX characters.
 *
 * Returns null rather than a truncated fragment when no clean short clause
 * exists, when the clause repeats the product name, or when the note is empty.
 * The card renders nothing in that case (the card is server-rendered, so a
 * missing line never shifts layout after load).
 */
export function cardHookLine(
  note: string | null | undefined,
  name?: string | null,
): string | null {
  if (!note) return null;
  const text = note.trim().replace(/^["']+|["']+$/g, "").replace(/\s+/g, " ");
  if (!text) return null;

  let cut = -1;
  for (const boundary of HOOK_BOUNDARIES) {
    const at = text.indexOf(boundary);
    if (at > 0 && (cut === -1 || at < cut)) cut = at;
  }

  const clause = (cut === -1 ? text : text.slice(0, cut))
    .replace(/[,\s;:.\-]+$/, "")
    .trim();
  if (clause.length < HOOK_MIN || clause.length > HOOK_MAX) return null;

  // Do not repeat the product name back at the shopper.
  const nameText = (name || "").trim();
  if (nameText) {
    const a = normalize(clause);
    const b = normalize(nameText);
    if (a && b && (b.includes(a) || a.includes(b))) return null;
  }

  return clause.charAt(0).toUpperCase() + clause.slice(1);
}
