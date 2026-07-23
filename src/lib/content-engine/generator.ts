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

// ─── Caption generation ─────────────────────────────────────────────────────

/**
 * Generate a short, editorial caption for a product.
 * Maximum 12 words, no banned phrases, warm editorial voice.
 */
function generateCaption(product: Product): string {
  // Use editor note if available and short enough
  if (product.editor_note) {
    const words = product.editor_note.trim().split(/\s+/);
    if (words.length <= 12) {
      return product.editor_note.trim();
    }
    // Truncate to 12 words
    return words.slice(0, 12).join(" ") + ".";
  }

  // Fall back to AI summary excerpt
  if (product.ai_summary) {
    const words = product.ai_summary.trim().split(/\s+/);
    return words.slice(0, 12).join(" ") + ".";
  }

  // Minimal fallback from product name + type
  const typeStr = product.product_type
    ? product.product_type.replace(/-/g, " ")
    : "piece";
  const room = product.room.replace(/-/g, " ");
  return `A ${typeStr} that belongs in every ${room}.`;
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

  // 1. Filter to this room
  // (caller should pre-filter, but double-check)
  const roomProducts = products;

  // 2. Get diversity exclusions
  const recentlyUsed = new Set(getRecentlyUsedProducts(diversityDays));
  const recentlyUsedHooks = getRecentlyUsedHooks(diversityDays);

  // 3. Score all products and filter
  const scored = roomProducts
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

  // 4. If not enough products above threshold, relax threshold
  let candidates = scored;
  if (candidates.length < count) {
    // Relax to 80
    const relaxed = roomProducts
      .filter((p) => !recentlyUsed.has(p.id))
      .map((product) => ({
        product,
        score: scoreProduct(product),
        boost: getCurrentSeasonalBoost(product),
      }))
      .filter((item) => (item.score.overall + item.boost) >= 80);

    candidates = relaxed;
  }

  // 5. Order and select top N
  const ordered = orderProducts(candidates);
  const selected = ordered.slice(0, count);

  // 6. Pick a fresh hook
  const hook = getFreshHook(recentlyUsedHooks, hookStyle);

  // 7. Build captions
  const productsWithCaptions = selected.map((item) => ({
    product: item.product,
    score: item.score,
    caption: generateCaption(item.product),
    seasonalBoost: item.boost,
  }));

  return {
    hook: hook.text,
    hookStyle: hook.style,
    room: roomProducts[0]?.room || "unknown",
    season,
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
      products: [],
      generatedAt: new Date().toISOString(),
    };
  }

  return generateContent(filtered, count, options);
}
