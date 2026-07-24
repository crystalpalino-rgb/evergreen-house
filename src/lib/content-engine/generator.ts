/**
 * Content Generator — the core engine that produces complete TikTok/social
 * content packages for a given room.
 *
 * Pipeline:
 *   1. Query products for the room from the database
 *   2. Score every product
 *   3. Filter to products scoring above threshold (90)
 *   4. Exclude products used in the last 60 days
 *   5. Pick a fresh hook (not recently used)
 *   6. Order products intentionally (visual impact first)
 *   7. Apply seasonal boost
 *   8. Return a ContentPackage ready for review/publishing
 */

import type { Product } from "~/lib/types";
import { scoreProduct, type ProductScore } from "./scorer";
import { getFreshHook, type HookStyle } from "./hooks";
import {
  getRecentlyUsedProducts,
  getRecentlyUsedHooks,
} from "./diversity";
import { getCurrentSeason, getCurrentSeasonalBoost } from "./seasonal";

// ─── Re-export ContentPackage type ──────────────────────────────────────────

export interface ContentPackage {
  hook: string;
  hookStyle: HookStyle;
  room: string;
  season: string;
  musicVibe: string;
  visualSequence: string;
  products: Array<{
    product: Product;
    score: ProductScore;
    caption: string;
    seasonalBoost: number;
  }>;
  generatedAt: string;
}

export interface GenerateOptions {
  /** Minimum overall score to include (default 90) */
  minScore?: number;
  /** Override hook style selection */
  hookStyle?: HookStyle;
  /** Override season */
  season?: string;
  /** Days to look back for diversity (default 60) */
  diversityDays?: number;
}

// ─── Music vibe by room ─────────────────────────────────────────────────────

const MUSIC_VIBE: Record<string, string> = {
  "bedroom": "Soft piano, slow tempo — think peaceful morning instrumental",
  "kitchen": "Light acoustic guitar, warm and unhurried — think Sunday morning coffee",
  "living-room": "Warm ambient instrumental, gentle pulse — think golden hour at home",
  "bathroom": "Spa-like ambient, soft and calming — think candlelit soak",
  "office": "Lo-fi instrumental, gentle focus — think quiet afternoon at the desk",
  "patio": "Acoustic folk, breezy and relaxed — think golden hour outdoors",
  "entryway": "Warm strings, welcoming — think coming home after a long day",
  "dining-room": "Soft jazz, intimate — think dinner with close friends",
  "laundry": "Light instrumental, fresh and clean — think Sunday morning reset",
  "pantry": "Mellow acoustic, understated — think slow weekend organizing",
};

function getMusicVibe(room: string): string {
  return MUSIC_VIBE[room] ?? "Calm instrumental, unhurried — think quiet moments at home";
}

// ─── Visual sequence by room ────────────────────────────────────────────────

const VISUAL_SEQUENCE: Record<string, string> = {
  "bedroom": "Wide → detail → texture → finish → close",
  "kitchen": "Statement piece → everyday beauty → detail → organization → function",
  "living-room": "Warmth → texture → styling → glow → layer",
  "bathroom": "Stillness → detail → texture → light → close",
  "office": "Desk → detail → organization → warmth → close",
  "patio": "Wide → gathering → detail → greenery → close",
  "entryway": "Welcome → detail → organization → warmth → close",
  "dining-room": "Table → place setting → detail → glow → close",
  "laundry": "Wide → utility → detail → organization → close",
  "pantry": "Wide → organization → detail → ingredients → close",
};

function getVisualSequence(room: string): string {
  return VISUAL_SEQUENCE[room] ?? "Wide → detail → texture → finish → close";
}

// ─── Caption generation ─────────────────────────────────────────────────────

/**
 * Material adjectives that sound editorial and warm.
 * Maps raw material names to more descriptive, editorial forms.
 */
const MATERIAL_ADJECTIVES: Record<string, string> = {
  "linen": "French linen",
  "stoneware": "Stoneware",
  "ceramic": "Ceramic",
  "terracotta": "Terracotta",
  "wood": "Solid wood",
  "oak": "Oak",
  "walnut": "Walnut",
  "brass": "Brass",
  "marble": "Marble",
  "wool": "Wool",
  "cotton": "Cotton",
  "leather": "Leather",
  "velvet": "Velvet",
  "rattan": "Rattan",
  "glass": "Glass",
  "porcelain": "Porcelain",
  "iron": "Cast iron",
  "copper": "Copper",
  "bronze": "Bronze",
  "wicker": "Wicker",
  "jute": "Jute",
  "seagrass": "Seagrass",
  "stone": "Natural stone",
  "down": "Down",
  "silk": "Silk",
  "bamboo": "Bamboo",
  "acacia": "Acacia wood",
  "boucle": "Boucle",
  "shearling": "Shearling",
};

/**
 * Extract a clean, capitalized material label from a product.
 */
function getMaterialLabel(product: Product): string | null {
  // Try explicit materials first
  if (product.materials && product.materials.length > 0) {
    for (const m of product.materials) {
      const key = m.toLowerCase();
      if (MATERIAL_ADJECTIVES[key]) return MATERIAL_ADJECTIVES[key];
    }
  }
  // Try to infer from product name
  const name = (product.name || "").toLowerCase();
  for (const [key, label] of Object.entries(MATERIAL_ADJECTIVES)) {
    if (name.includes(key)) return label;
  }
  return null;
}

/**
 * Extract a clean product type name (no brand, no room prefix).
 * Uses product_type if helpful, otherwise infers from the product name.
 */
function getProductTypeLabel(product: Product): string {
  // Use explicit product_type if it's meaningful
  if (product.product_type && !["decor", "home", "accessory", "furniture", "accent", "kitchenware", "cookware", "tableware", "drinkware", "dining", "bedding", "bath", "storage", "table", "organization", "organizer", "textile", "textiles"].includes(product.product_type)) {
    return product.product_type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Try to extract from name using common product type patterns
  const name = (product.name || "").toLowerCase();

  const typePatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\b(cookbook|recipe book)\b/i, label: "cookbook" },
    { pattern: /\b(duvet cover)\b/i, label: "duvet cover" },
    { pattern: /\b(fitted sheet)\b/i, label: "fitted sheet" },
    { pattern: /\b(throw pillow|pillow cover|pillow insert|pillow)\b/i, label: "pillow" },
    { pattern: /\b(throw blanket|throw|blanket)\b/i, label: "throw" },
    { pattern: /\b(lazy susan)\b/i, label: "lazy susan" },
    { pattern: /\b(cutting board|chopping board)\b/i, label: "cutting board" },
    { pattern: /\b(butter dish)\b/i, label: "butter dish" },
    { pattern: /\b(dinnerware|plates?|bowls?|mugs?|cups?)\s+sets?\b/i, label: "dinnerware" },
    { pattern: /\b(dinnerware|stoneware)\b/i, label: "dinnerware" },
    { pattern: /\b(tumbler|rambler|bottle|lowball|mug|cup|glass)\b/i, label: "bottle" },
    { pattern: /\b(toaster|kettle|coffee maker|espresso machine|espresso)\b/i, label: "appliance" },
    { pattern: /\b(candle warmer|candle)\b/i, label: "candle warmer" },
    { pattern: /\b(vase|planter|pot)\b/i, label: "vase" },
    { pattern: /\b(tray|organizer)\b/i, label: "organizer" },
    { pattern: /\b(nightstand|side table|end table|bench|ottoman)\b/i, label: "furniture" },
    { pattern: /\b(basket|bin)\b/i, label: "basket" },
    { pattern: /\b(soap dispenser|soap pump|lotion dispenser)\b/i, label: "dispenser" },
    { pattern: /\b(towel)\b/i, label: "towel" },
    { pattern: /\b(rug|mat|runner)\b/i, label: "rug" },
    { pattern: /\b(mirror)\b/i, label: "mirror" },
    { pattern: /\b(curtain|drape)\b/i, label: "curtain" },
    { pattern: /\b(jar|canister|container)\b/i, label: "jar" },
    { pattern: /\b(shelf|shelving)\b/i, label: "shelf" },
    { pattern: /\b(cooler|backpack cooler|soft cooler)\b/i, label: "cooler" },
    { pattern: /\b(book)\b/i, label: "book" },
  ];

  const nameLower = name;
  for (const { pattern, label } of typePatterns) {
    if (pattern.test(nameLower)) {
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  }

  // Absolute fallback: take the last 1-2 nouns from name, skipping brand words
  const words = product.name.split(/\s+/);
  const skipWords = new Set([
    "set", "sets", "cover", "covers", "pair", "pack", "with", "and",
    "in", "for", "of", "or", "the", "a", "an", "is", "it", "to",
    "oz", "inch", "cm", "mm", "kg", "lb", "lbs",
    "items", "less", "more", "than", "each", "per", "all",
    "by", "on", "at", "no", "not", "only", "just",
  ]);
  const typeWords: string[] = [];
  for (let i = words.length - 1; i >= 0 && typeWords.length < 2; i--) {
    const w = words[i].toLowerCase();
    // Skip numbers, units, filler words, and words that look like qualifiers
    if (skipWords.has(w) || /^\d+(\.\d+)?$/.test(w) || w.length <= 1) continue;
    // Skip words that are clearly not nouns (brand names, adjectives)
    if (/^(yeti|rambler|roadie|hopper|malacasa|bedsure|miulee|utopia|nathan|james|mina|trader|joe|creative|co|op)(\.|'s|s)?$/i.test(w)) continue;
    typeWords.unshift(words[i]);
  }
  const result = typeWords.join(" ");
  // If the result is still nonsensical, fall back to "piece"
  if (!result || result.length < 2 || /^(less|more|items|things|stuff)$/i.test(result)) {
    return "piece";
  }
  return result;
}

/**
 * Words/prefixes that signal a note is a raw product description, not editorial copy.
 * If a short editor note starts with any of these, we compose a new caption instead.
 */
const NON_EDITORIAL_PATTERNS: RegExp[] = [
  /^this\b/i, /^these\b/i, /^it\b/i, /^the\b/i,
  /^available\b/i, /^comes\b/i, /^features\b/i,
  /^made\b/i, /^includes\b/i, /^perfect\b/i,
  /^great\b/i, /^ideal\b/i, /^keep\b/i, /^get\b/i,
  /^make\b/i, /^add\b/i, /^use\b/i, /^buy\b/i,
  /^shop\b/i, /^find\b/i, /^check\b/i, /^try\b/i,
  /^trend/i, /^upgrade\b/i, /^enjoy\b/i,
  /^i\b/i, /^we\b/i, /^you\b/i, /^my\b/i,
  /^love\b/i, /^need\b/i, /^want\b/i, /^can't\b/i,
  /^don't\b/i, /^save\b/i, /^grab\b/i, /^snag\b/i,
  /^best\b/i, /^top\b/i, /^favorite\b/i, /^new\b/i,
  /^now\b/i, /^just\b/i, /^easy\b/i, /^simple\b/i,
  /^looking\b/i, /^ready\b/i, /^must\b/i,
];

/**
 * Returns true if a note sounds like raw product copy rather than editorial voice.
 */
function isRawProductCopy(text: string): boolean {
  const trimmed = text.trim();
  // Exclamation marks = enthusiastic sales copy
  if (trimmed.includes("!")) return true;
  // Check for non-editorial opening patterns
  for (const pat of NON_EDITORIAL_PATTERNS) {
    if (pat.test(trimmed)) return true;
  }
  return false;
}

/**
 * Benefit phrases — editorial descriptions of what a product does for a space.
 * Organized by product type keywords so we can match intelligently.
 */
const BENEFIT_PATTERNS: Array<{ match: string[]; phrase: string }> = [
  { match: ["duvet", "cover", "sheet", "bedding", "fitted sheet"], phrase: "that only gets softer with every wash" },
  { match: ["throw", "blanket"], phrase: "for evenings worth slowing down" },
  { match: ["pillow", "cushion", "pillow cover", "insert"], phrase: "that layers this space effortlessly" },
  { match: ["bench", "ottoman", "nightstand", "side table", "end table"], phrase: "that makes the room feel finished" },
  { match: ["vase"], phrase: "with the warmth of something collected over time" },
  { match: ["tray", "lazy susan", "organizer"], phrase: "that keeps everything in its place, beautifully" },
  { match: ["lamp", "light", "sconce", "candle warmer"], phrase: "that casts the warmest glow" },
  { match: ["rug", "mat", "runner"], phrase: "that grounds the room in texture" },
  { match: ["mirror"], phrase: "that makes the room feel larger and brighter" },
  { match: ["bowl", "dish", "dinnerware", "plate", "mug", "cup", "butter dish"], phrase: "beautiful enough to live on open shelving" },
  { match: ["jar", "canister", "container", "storage"], phrase: "that turns everyday staples into something beautiful" },
  { match: ["toaster", "kettle", "appliance", "coffee maker", "espresso"], phrase: "designed to stay out, not hide away" },
  { match: ["cutting board", "board", "chopping"], phrase: "that earns its place on the counter" },
  { match: ["candle", "candleholder", "candle warmer"], phrase: "for evenings that deserve a softer light" },
  { match: ["basket", "bin"], phrase: "that makes storage feel intentional" },
  { match: ["shelf", "shelving"], phrase: "that adds warmth without losing wall space" },
  { match: ["planter", "pot"], phrase: "that brings a little life to any corner" },
  { match: ["hook", "rack"], phrase: "that keeps things tidy without trying too hard" },
  { match: ["soap", "dispenser", "pump"], phrase: "that makes the everyday feel elevated" },
  { match: ["towel"], phrase: "that feels like a small luxury every morning" },
  { match: ["curtain", "drape"], phrase: "that frames a window beautifully" },
  { match: ["art", "print", "frame"], phrase: "that finishes the room without overwhelming it" },
  { match: ["bottle", "tumbler", "rambler", "mug", "cup", "glass"], phrase: "that makes hydration feel like a ritual" },
  { match: ["cookbook", "book"], phrase: "that earns a permanent spot on the counter" },
  { match: ["knife", "utensil", "tool", "gadget"], phrase: "that works beautifully and looks the part" },
  { match: ["napkin", "placemat", "tablecloth", "linen"], phrase: "that elevates every meal without trying too hard" },
  { match: ["pitcher", "carafe", "decanter"], phrase: "that deserves to stay on the table" },
  { match: ["clock", "timer"], phrase: "that blends form and function" },
];

/**
 * Find the best benefit phrase for a product based on its type/name.
 */
function findBenefitPhrase(product: Product): string | null {
  const searchText = [
    product.name || "",
    product.product_type || "",
    product.best_for || "",
    ...(product.lifestyle_tags || []),
  ].join(" ").toLowerCase();

  for (const pattern of BENEFIT_PATTERNS) {
    if (pattern.match.some((kw) => searchText.includes(kw))) {
      return pattern.phrase;
    }
  }
  return null;
}

/**
 * Attempt to extract a short benefit snippet from editorial text.
 * Looks for phrases like "...that..." or "...with..." patterns.
 * Requires minimum word count to avoid fragments like "with this bottle."
 */
function extractBenefitFromText(text: string): string | null {
  // Look for "that" clauses (preferred — they're usually benefits)
  const thatMatch = text.match(/\bthat\s+[a-z].{5,70}?[.!]?$/i);
  if (thatMatch) {
    const snippet = thatMatch[0].replace(/[.!]$/, "").trim();
    const words = snippet.split(/\s+/);
    if (words.length >= 4 && words.length <= 14) return snippet;
  }

  // Look for "with" clauses (secondary — check they're substantial)
  const withMatch = text.match(/\bwith\s+(the\s+)?[a-z].{8,70}?[.!]?$/i);
  if (withMatch) {
    const snippet = withMatch[0].replace(/[.!]$/, "").trim();
    const words = snippet.split(/\s+/);
    if (words.length >= 5 && words.length <= 14) return snippet;
  }

  // Try to grab the last sentence (often the payoff)
  const sentences = text.split(/[.!]\s+/);
  for (let i = sentences.length - 1; i >= 0; i--) {
    const s = sentences[i].trim();
    const words = s.split(/\s+/);
    if (words.length >= 5 && words.length <= 14) {
      // Skip if it looks like raw copy
      if (!isRawProductCopy(s)) return s;
    }
  }

  return null;
}

/**
 * Clean up a caption: remove double punctuation, trailing spaces, ensure single period.
 */
function cleanCaption(text: string): string {
  let cleaned = text.trim();
  // Remove duplicate punctuation at end
  cleaned = cleaned.replace(/[.!]+$/, "");
  // Add single period
  return cleaned + ".";
}

/**
 * Generate a short, editorial caption for a product.
 * Maximum 12 words, warm editorial voice, never salesy.
 *
 * Strategy:
 *   1. If editor_note is short (≤12 words) AND passes the editorial voice check, use it
 *   2. Try to compose: [Material] + [type] + [benefit phrase]
 *   3. Try to extract benefit from editor_note or ai_summary
 *   4. Fall back to a clean, room-aware caption
 */
function generateCaption(product: Product): string {
  // ── Step 1: Use short editor note only if it sounds editorial ──
  if (product.editor_note) {
    const note = product.editor_note.trim();
    const words = note.split(/\s+/);

    if (words.length <= 12 && !isRawProductCopy(note)) {
      return cleanCaption(note);
    }

    // Try to extract benefit from longer editor note (or raw copy we rejected)
    const benefit = extractBenefitFromText(note);
    if (benefit && !isRawProductCopy(benefit)) {
      const material = getMaterialLabel(product);
      if (material) {
        const caption = `${material} ${getProductTypeLabel(product).toLowerCase()} ${benefit}.`;
        if (caption.split(/\s+/).length <= 12) return cleanCaption(caption);
      }
      if (benefit.split(/\s+/).length <= 12) return cleanCaption(benefit);
    }
  }

  // ── Step 2: Try ai_summary ──
  if (product.ai_summary) {
    const benefit = extractBenefitFromText(product.ai_summary);
    if (benefit && !isRawProductCopy(benefit)) {
      const material = getMaterialLabel(product);
      if (material) {
        const caption = `${material} ${getProductTypeLabel(product).toLowerCase()} ${benefit}.`;
        if (caption.split(/\s+/).length <= 12) return cleanCaption(caption);
      }
      if (benefit.split(/\s+/).length <= 12) return cleanCaption(benefit);
    }
  }

  // ── Step 3: Compose from material + type + benefit ──
  const material = getMaterialLabel(product);
  const typeLabel = getProductTypeLabel(product).toLowerCase();
  const benefit = findBenefitPhrase(product);

  if (material && benefit) {
    const caption = `${material} ${typeLabel} ${benefit}.`;
    const wordCount = caption.split(/\s+/).length;
    if (wordCount <= 12) return cleanCaption(caption);
    // Try without type label
    const shortCaption = `${material} piece ${benefit}.`;
    if (shortCaption.split(/\s+/).length <= 12) return cleanCaption(shortCaption);
  }

  if (benefit) {
    const caption = `A ${typeLabel} ${benefit}.`;
    const wordCount = caption.split(/\s+/).length;
    if (wordCount <= 12) return cleanCaption(caption);
  }

  // ── Step 4: Material-only caption ──
  if (material) {
    const room = product.room.replace(/-/g, " ");
    return `${material} that feels at home in any ${room}.`;
  }

  // ── Step 5: Minimal fallback ──
  const room = product.room.replace(/-/g, " ");
  return `A timeless ${typeLabel} for a beautiful ${room}.`;
}

// ─── Product ordering ───────────────────────────────────────────────────────

/**
 * Order products for maximum visual and narrative impact.
 * Strategy: best images first, then by score, keeping variety.
 */
function orderProducts(
  items: Array<{ product: Product; score: ProductScore; boost: number }>,
): typeof items {
  // Sort by: boost-adjusted score desc, then visual quality desc
  return [...items].sort((a, b) => {
    const aFinal = a.score.overall + a.boost;
    const bFinal = b.score.overall + b.boost;

    if (Math.abs(aFinal - bFinal) > 5) {
      return bFinal - aFinal;
    }

    // Break ties by visual quality, then photography
    if (a.score.visualQuality !== b.score.visualQuality) {
      return b.score.visualQuality - a.score.visualQuality;
    }

    return b.score.photography - a.score.photography;
  });
}

// ─── Main generator ─────────────────────────────────────────────────────────

/**
 * Generate a complete content package for a room.
 *
 * @param products   - Array of products (should already be filtered to the room)
 * @param count      - Desired number of products to include
 * @param options    - Generation options
 * @returns A ContentPackage ready for review
 */
export function generateContent(
  products: Product[],
  count: number,
  options: GenerateOptions = {},
): ContentPackage {
  const {
    minScore = 82,
    hookStyle,
    season: seasonOverride,
    diversityDays = 60,
  } = options;

  const season = seasonOverride || getCurrentSeason();
  const room = products[0]?.room || "unknown";

  // 1. Get diversity exclusions
  const recentlyUsed = new Set(getRecentlyUsedProducts(diversityDays));
  const recentlyUsedHooks = getRecentlyUsedHooks(diversityDays);

  // 2. Score all products and filter
  const scored = products
    .map((product) => {
      const score = scoreProduct(product);
      const seasonalBoost = getCurrentSeasonalBoost(product);
      return { product, score, boost: seasonalBoost };
    })
    .filter((item) => {
      // Exclude recently used
      if (recentlyUsed.has(item.product.id)) return false;
      // Score threshold (after seasonal boost)
      return (item.score.overall + item.boost) >= minScore;
    });

  // 3. If not enough products above threshold, relax threshold
  let candidates = scored;
  if (candidates.length < count) {
    // Relax to 80
    const relaxed = products
      .filter((p) => !recentlyUsed.has(p.id))
      .map((product) => ({
        product,
        score: scoreProduct(product),
        boost: getCurrentSeasonalBoost(product),
      }))
      .filter((item) => (item.score.overall + item.boost) >= 80);

    candidates = relaxed;
  }

  // 4. Order and select top N
  const ordered = orderProducts(candidates);
  const selected = ordered.slice(0, count);

  // 5. Pick a fresh hook
  const hook = getFreshHook(recentlyUsedHooks, hookStyle);

  // 6. Build captions
  const productsWithCaptions = selected.map((item) => ({
    product: item.product,
    score: item.score,
    caption: generateCaption(item.product),
    seasonalBoost: item.boost,
  }));

  return {
    hook: hook.text,
    hookStyle: hook.style,
    room,
    season,
    musicVibe: getMusicVibe(room),
    visualSequence: getVisualSequence(room),
    products: productsWithCaptions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a quick content package from a pre-filtered list.
 * Useful for script-based generation where the DB query happens externally.
 */
export function generateContentFromProducts(
  room: string,
  products: Product[],
  count: number,
  options?: GenerateOptions,
): ContentPackage {
  // Filter to room
  const filtered = products.filter((p) => p.room === room);

  if (filtered.length === 0) {
    return {
      hook: "Simple pieces that make a home feel finished.",
      hookStyle: "editorial",
      room,
      season: options?.season || getCurrentSeason(),
      musicVibe: getMusicVibe(room),
      visualSequence: getVisualSequence(room),
      products: [],
      generatedAt: new Date().toISOString(),
    };
  }

  return generateContent(filtered, count, options);
}
