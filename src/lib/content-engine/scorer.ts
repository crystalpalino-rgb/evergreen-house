/**
 * Human Taste Engine — scores every product on a 1-100 scale across
 * 5 dimensions reflecting the Evergreen House editorial point of view.
 *
 * Dimensions:
 *   1. Timelessness    — classic vs. trendy
 *   2. Visual Quality  — product image appeal
 *   3. Material Quality — premium materials, solid construction
 *   4. Lifestyle Appeal — Evergreen House aesthetic fit
 *   5. Photography      — resolution, lighting, composition
 *
 * Overall = weighted average (configurable weights).
 */

import type { Product } from "~/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProductScore {
  productId: number;
  productName: string;
  timelessness: number;
  visualQuality: number;
  materialQuality: number;
  lifestyleAppeal: number;
  photography: number;
  overall: number;
}

export interface ScoringWeights {
  timelessness: number;
  visualQuality: number;
  materialQuality: number;
  lifestyleAppeal: number;
  photography: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  timelessness: 0.25,
  visualQuality: 0.20,
  materialQuality: 0.25,
  lifestyleAppeal: 0.20,
  photography: 0.10,
};

// ─── Material quality keywords ──────────────────────────────────────────────

/** Premium material keywords that signal quality construction */
const PREMIUM_MATERIALS = [
  "linen", "stoneware", "ceramic", "wood", "brass", "marble",
  "wool", "cotton", "leather", "oak", "walnut", "granite",
  "porcelain", "iron", "bronze", "copper", "velvet", "silk",
  "rattan", "solid wood", "tempered glass", "hand-blown",
  "handmade", "artisan", "hand-woven", "hand-knotted",
];

/** Trend-chasing keywords that hurt timelessness */
const TREND_KEYWORDS = [
  "modern", "trendy", "bold", "statement", "contemporary",
  "geometric", "neon", "acrylic", "lucite", "chrome",
  "high-gloss", "metallic", "faux", "vegan leather",
  "cheetah", "leopard", "zebra", "neon", "bright",
];

/** Neutral/earth tone keywords that boost timelessness */
const EARTH_TONES = [
  "cream", "beige", "taupe", "oak", "walnut", "sage",
  "olive", "terracotta", "clay", "stone", "sand", "ivory",
  "charcoal", "brown", "tan", "linen", "oatmeal", "greige",
  "warm white", "off-white", "natural", "raw", "undyed",
];

// ─── Name-based inference ───────────────────────────────────────────────────

/**
 * Infer materials from product name when explicit materials array is empty.
 * Uses common product name patterns for home goods.
 */
function inferMaterialsFromName(name: string): string[] {
  const lower = name.toLowerCase();
  const found: string[] = [];

  const patterns: [string, string][] = [
    ["cotton", "cotton"],
    ["linen", "linen"],
    ["wool", "wool"],
    ["silk", "silk"],
    ["velvet", "velvet"],
    ["leather", "leather"],
    ["wood", "wood"],
    ["wooden", "wood"],
    ["bamboo", "wood"],
    ["oak", "oak"],
    ["walnut", "walnut"],
    ["marble", "marble"],
    ["brass", "brass"],
    ["ceramic", "ceramic"],
    ["stoneware", "stoneware"],
    ["porcelain", "porcelain"],
    ["glass", "glass"],
    ["iron", "iron"],
    ["steel", "steel"],
    ["bronze", "bronze"],
    ["copper", "copper"],
    ["rattan", "rattan"],
    ["wicker", "rattan"],
    ["jute", "jute"],
    ["seagrass", "seagrass"],
    ["down", "down"],
    ["feather", "down"],
    ["microfiber", "microfiber"],
    ["polyester", "polyester"],
    ["acrylic", "acrylic"],
    ["resin", "resin"],
    ["aluminum", "aluminum"],
    ["gold", "brass"],
    ["silver", "steel"],
    ["stone", "stone"],
    ["concrete", "stone"],
    ["clay", "ceramic"],
    ["terracotta", "ceramic"],
    ["faux fur", "faux-fur"],
    ["shearling", "wool"],
    ["cashmere", "wool"],
  ];

  for (const [keyword, material] of patterns) {
    if (lower.includes(keyword) && !found.includes(material)) {
      found.push(material);
    }
  }

  return found;
}

/**
 * Infer colors from product name.
 */
function inferColorsFromName(name: string): string[] {
  const lower = name.toLowerCase();
  const found: string[] = [];

  const colorPatterns: [string, string][] = [
    ["beige", "beige"], ["cream", "cream"], ["ivory", "ivory"],
    ["white", "white"], ["black", "black"], ["gray", "gray"],
    ["grey", "gray"], ["brown", "brown"], ["tan", "tan"],
    ["taupe", "taupe"], ["sage", "sage"], ["olive", "olive"],
    ["green", "green"], ["blue", "blue"], ["navy", "navy"],
    ["blush", "blush"], ["pink", "pink"], ["terracotta", "terracotta"],
    ["rust", "rust"], ["gold", "gold"], ["silver", "silver"],
    ["charcoal", "charcoal"], ["oatmeal", "oatmeal"],
    ["natural", "natural"], ["linen", "linen"], ["walnut", "walnut"],
    ["oak", "oak"], ["mahogany", "brown"], ["espresso", "brown"],
    ["cherry", "brown"], ["warm white", "cream"],
  ];

  for (const [keyword, color] of colorPatterns) {
    if (lower.includes(keyword) && !found.includes(color)) {
      found.push(color);
    }
  }

  return found.slice(0, 3);
}

/**
 * Infer moods from product name and editor note.
 */
function inferMoodsFromText(name: string, editorNote: string | null): string[] {
  const combined = `${name.toLowerCase()} ${(editorNote || "").toLowerCase()}`;
  const found: string[] = [];

  const moodPatterns: [string, string][] = [
    ["cozy", "cozy"], ["warm", "warm"], ["calm", "calm"],
    ["soft", "soft"], ["elegant", "elegant"], ["modern", "modern"],
    ["classic", "classic"], ["vintage", "vintage"], ["rustic", "rustic"],
    ["boho", "boho"], ["minimalist", "minimalist"], ["luxury", "luxurious"],
    ["luxurious", "luxurious"], ["comfortable", "cozy"], ["relaxing", "calm"],
    ["peaceful", "calm"], ["inviting", "warm"], ["natural", "natural"],
    ["organic", "natural"], ["simple", "minimalist"], ["chic", "elegant"],
    ["sophisticated", "elegant"], ["designer", "elegant"], ["layered", "layered"],
    ["textured", "textured"],
  ];

  for (const [keyword, mood] of moodPatterns) {
    if (combined.includes(keyword) && !found.includes(mood)) {
      found.push(mood);
    }
  }

  return found.slice(0, 3);
}

// ─── Scoring helpers ────────────────────────────────────────────────────────

/** Score timelessness: higher = more classic, lower = trendy */
function scoreTimelessness(product: Product): number {
  let score = 72; // neutral baseline — Evergreen House products trend classic by default

  const name = (product.name || "").toLowerCase();
  const desc = (product.ai_summary || product.editor_note || "").toLowerCase();
  const combined = `${name} ${desc}`;

  // Infer taxonomy if explicit data is sparse
  const colors = (product.colors && product.colors.length > 0)
    ? product.colors.map((c) => c.toLowerCase())
    : inferColorsFromName(product.name);
  const mats = (product.materials && product.materials.length > 0)
    ? product.materials.map((m) => m.toLowerCase())
    : inferMaterialsFromName(product.name);

  // Penalize trend keywords
  for (const kw of TREND_KEYWORDS) {
    if (combined.includes(kw)) {
      score -= 8;
    }
  }

  // Boost earth tone colors
  const earthMatches = colors.filter((c) =>
    EARTH_TONES.some((et) => c.includes(et)),
  );
  score += earthMatches.length * 5;

  // Boost classic styles
  const styles = (product.style || []).map((s) => s.toLowerCase());
  const classicStyles = ["traditional", "classic", "timeless", "transitional"];
  if (styles.some((s) => classicStyles.includes(s))) {
    score += 10;
  }

  // Natural materials boost timelessness
  const naturalMats = ["wood", "marble", "brass", "cotton", "linen", "wool", "stone", "ceramic"];
  const naturalMatches = mats.filter((m) =>
    naturalMats.some((nm) => m.includes(nm)),
  );
  score += Math.min(15, naturalMatches.length * 4);

  // Higher price often = more considered/timeless design (with cap)
  if (product.price != null) {
    if (product.price >= 100 && product.price < 300) score += 5;
    else if (product.price >= 300) score += 10;
  }

  return clamp(score);
}

/** Score visual quality based on product metadata signals */
function scoreVisualQuality(product: Product): number {
  let score = 70;

  // Rating is a proxy for visual appeal
  if (product.rating != null) {
    if (product.rating >= 4.5) score += 15;
    else if (product.rating >= 4.0) score += 10;
    else if (product.rating >= 3.5) score += 5;
  }

  // Review count signals validation
  if (product.review_count != null) {
    if (product.review_count >= 500) score += 10;
    else if (product.review_count >= 100) score += 5;
  }

  // Editor picks are visually vetted
  if (product.editor_pick) score += 10;

  // Products with editor notes typically have better visuals
  if (product.editor_note) score += 5;

  return clamp(score);
}

/** Score material quality based on materials, price, and construction signals */
function scoreMaterialQuality(product: Product): number {
  let score = 65;

  const mats = (product.materials && product.materials.length > 0)
    ? product.materials.map((m) => m.toLowerCase())
    : inferMaterialsFromName(product.name);
  const name = (product.name || "").toLowerCase();

  // Premium material keywords in materials list or product name
  const premiumMatches = PREMIUM_MATERIALS.filter(
    (pm) =>
      mats.some((m) => m.includes(pm)) || name.includes(pm),
  );

  // Each premium material adds points
  score += Math.min(20, premiumMatches.length * 4);

  // Price is a (capped) signal of materials
  if (product.price != null) {
    if (product.price < 25) score -= 5;
    else if (product.price >= 25 && product.price < 50) score += 3;
    else if (product.price >= 50 && product.price < 150) score += 10;
    else if (product.price >= 150 && product.price < 300) score += 15;
    else if (product.price >= 300) score += 20;
  }

  // Rating also reflects material satisfaction
  if (product.rating != null && product.rating >= 4.3) score += 8;

  // Editor tip often mentions quality
  if (product.editor_tip) score += 5;

  // Positive sentiment in AI summary
  const summary = (product.ai_summary || "").toLowerCase();
  const qualityWords = ["solid", "well-made", "quality", "durable", "substantial", "heavy", "handmade"];
  for (const w of qualityWords) {
    if (summary.includes(w)) score += 3;
  }

  return clamp(score);
}

/** Score lifestyle appeal — how well the product fits the Evergreen House aesthetic */
function scoreLifestyleAppeal(product: Product): number {
  let score = 68;

  // High ratings = real people love living with it
  if (product.rating != null) {
    if (product.rating >= 4.5) score += 20;
    else if (product.rating >= 4.0) score += 12;
    else if (product.rating >= 3.5) score += 5;
    else score -= 10;
  }

  // Infer taxonomy if sparse
  const productMoods = (product.moods && product.moods.length > 0)
    ? product.moods.map((m) => m.toLowerCase())
    : inferMoodsFromText(product.name, product.editor_note);
  const colors = (product.colors && product.colors.length > 0)
    ? product.colors.map((c) => c.toLowerCase())
    : inferColorsFromName(product.name);

  // Mood alignment with Evergreen House vibe
  const desiredMoods = ["cozy", "warm", "calm", "peaceful", "inviting", "organic", "natural", "quiet", "soft"];
  const moodMatches = productMoods.filter((m) =>
    desiredMoods.some((dm) => m.includes(dm)),
  );
  score += Math.min(15, moodMatches.length * 5);

  // Undesirable moods
  const undesirableMoods = ["cold", "sterile", "flashy", "loud", "busy"];
  for (const m of productMoods) {
    if (undesirableMoods.some((um) => m.includes(um))) {
      score -= 8;
    }
  }

  // Earth tones boost lifestyle appeal
  const earthMatches = colors.filter((c) =>
    EARTH_TONES.some((et) => c.includes(et)),
  );
  score += Math.min(10, earthMatches.length * 3);

  // Editor endorsement is a strong signal
  if (product.editor_pick) score += 10;
  if (product.editor_note) score += 5;
  if (product.editor_why) score += 5;

  // Products with lifestyle tags are pre-vetted
  if (product.lifestyle_tags && product.lifestyle_tags.length > 0) {
    score += Math.min(8, product.lifestyle_tags.length * 2);
  }

  return clamp(score);
}

/** Score photography quality based on available image signals */
function scorePhotography(product: Product): number {
  let score = 65;

  // Products with images at all
  if (product.image_url) {
    score += 15;
  } else {
    return 20; // No image = low score
  }

  // Image dimensions as quality proxy
  if (product.image_width && product.image_height) {
    const megapixels = (product.image_width * product.image_height) / 1_000_000;
    if (megapixels >= 2) score += 15;
    else if (megapixels >= 1) score += 10;
    else score += 5;
  }

  // Image alt text = intentional photography
  if (product.image_alt) score += 10;

  // Gallery = multiple curated shots
  if (product.image_gallery) {
    const gallery = Array.isArray(product.image_gallery)
      ? product.image_gallery
      : [];
    score += Math.min(15, gallery.length * 5);
  }

  // Editor note often mentions photography context
  const note = (product.editor_note || "").toLowerCase();
  if (
    note.includes("styled") ||
    note.includes("image") ||
    note.includes("photo") ||
    note.includes("shown")
  ) {
    score += 5;
  }

  return clamp(score);
}

/** Clamp a score to 1-100 range */
function clamp(value: number): number {
  return Math.max(1, Math.min(100, Math.round(value)));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Score a single product.
 */
export function scoreProduct(
  product: Product,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): ProductScore {
  const t = scoreTimelessness(product);
  const v = scoreVisualQuality(product);
  const m = scoreMaterialQuality(product);
  const l = scoreLifestyleAppeal(product);
  const p = scorePhotography(product);

  const overall = Math.round(
    t * weights.timelessness +
    v * weights.visualQuality +
    m * weights.materialQuality +
    l * weights.lifestyleAppeal +
    p * weights.photography,
  );

  return {
    productId: product.id,
    productName: product.name,
    timelessness: t,
    visualQuality: v,
    materialQuality: m,
    lifestyleAppeal: l,
    photography: p,
    overall: clamp(overall),
  };
}

/**
 * Score multiple products, returning results sorted by overall score descending.
 */
export function scoreProducts(
  products: Product[],
  weights?: ScoringWeights,
): ProductScore[] {
  return products
    .map((p) => scoreProduct(p, weights))
    .sort((a, b) => b.overall - a.overall);
}

/**
 * Filter products scoring above a threshold and return the top N.
 */
export function topProducts(
  products: Product[],
  count: number,
  threshold: number = 90,
  weights?: ScoringWeights,
): ProductScore[] {
  const scored = scoreProducts(products, weights);
  return scored.filter((s) => s.overall >= threshold).slice(0, count);
}
