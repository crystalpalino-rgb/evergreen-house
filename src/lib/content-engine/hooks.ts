/**
 * Hook Library — curated TikTok/social hooks for Evergreen House content.
 * Organized by style. Never salesy, never trend-chasing.
 *
 * BANNED PHRASES (never use):
 *   "Must Have", "You Need", "Run Don't Walk", "Obsessed", "Life Changing"
 */

export interface Hook {
  text: string;
  style: HookStyle;
}

export type HookStyle =
  | "editorial"
  | "discovery"
  | "personal"
  | "timeless"
  | "details"
  | "classic";

/** All curated hooks */
export const HOOKS: Hook[] = [
  // ── Editorial ──
  {
    text: "Simple pieces that make a home feel finished.",
    style: "editorial",
  },
  {
    text: "The kind of pieces that make a room feel collected, not decorated.",
    style: "editorial",
  },
  {
    text: "Quiet upgrades that change how a room feels.",
    style: "editorial",
  },
  {
    text: "A few thoughtful pieces that do more than fill a corner.",
    style: "editorial",
  },

  // ── Discovery ──
  {
    text: "Amazon finds that don't look like Amazon.",
    style: "discovery",
  },
  {
    text: "Well-made pieces hiding in plain sight.",
    style: "discovery",
  },
  {
    text: "The kind of find that makes people ask where you got it.",
    style: "discovery",
  },
  {
    text: "Under-the-radar home pieces worth knowing about.",
    style: "discovery",
  },

  // ── Personal ──
  {
    text: "Beautiful pieces I'd actually put in my own home.",
    style: "personal",
  },
  {
    text: "What I'd buy if I were starting this room from scratch.",
    style: "personal",
  },
  {
    text: "Pieces I keep coming back to, season after season.",
    style: "personal",
  },
  {
    text: "The home pieces I'd recommend to a friend.",
    style: "personal",
  },

  // ── Timeless ──
  {
    text: "Timeless home upgrades worth buying once.",
    style: "timeless",
  },
  {
    text: "Pieces that will still feel right in ten years.",
    style: "timeless",
  },
  {
    text: "Things worth investing in — and things worth saving on.",
    style: "timeless",
  },
  {
    text: "Quiet classics that never feel dated.",
    style: "timeless",
  },

  // ── Details ──
  {
    text: "Little details that make a room feel expensive.",
    style: "details",
  },
  {
    text: "Small changes with an outsized impact on how a room feels.",
    style: "details",
  },
  {
    text: "The finishing touches most people forget.",
    style: "details",
  },

  // ── Classic ──
  {
    text: "If your style is classic, start here.",
    style: "classic",
  },
  {
    text: "For homes that feel warm, layered, and lived-in.",
    style: "classic",
  },
  {
    text: "Neutral doesn't have to mean boring — here's proof.",
    style: "classic",
  },
  {
    text: "A collected home starts with pieces like these.",
    style: "classic",
  },
];

/** Get all hooks of a given style */
export function getHooksByStyle(style: HookStyle): Hook[] {
  return HOOKS.filter((h) => h.style === style);
}

/** Get a random hook, optionally filtered by style */
export function getRandomHook(style?: HookStyle): Hook {
  const pool = style ? getHooksByStyle(style) : HOOKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get hooks excluding recently used ones */
export function getFreshHook(
  recentlyUsed: string[],
  style?: HookStyle,
): Hook {
  const pool = (style ? getHooksByStyle(style) : HOOKS).filter(
    (h) => !recentlyUsed.includes(h.text),
  );

  // If all are recently used, fall back to full pool
  const available = pool.length > 0 ? pool : HOOKS;
  return available[Math.floor(Math.random() * available.length)];
}
