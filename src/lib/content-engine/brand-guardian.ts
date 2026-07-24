/**
 * Brand Guardian — validates content packages before publishing.
 * Ensures every piece of content meets Evergreen House editorial standards.
 *
 * Checks:
 *   - No banned phrases
 *   - No mismatched rooms
 *   - Captions under 12 words
 *   - Products scored 90+
 *   - Hook is from approved list
 *   - No seasonal mismatches
 */

import type { ProductScore } from "./scorer";
import { HOOKS, type Hook } from "./hooks";
import { getCurrentSeason, getSeasonalBoost, type Season } from "./seasonal";
import type { Product } from "~/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentPackage {
  hook: string;
  room: string;
  products: Array<{
    product: Product;
    score: ProductScore;
    caption: string;
  }>;
  generatedAt: string;
}

export interface ValidationIssue {
  type: "error" | "warning";
  field: string;
  message: string;
  productIndex?: number;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  summary: string;
}

// ─── Banned phrases ─────────────────────────────────────────────────────────

const BANNED_PHRASES = [
  "must have",
  "you need",
  "run don't walk",
  "run, don't walk",
  "obsessed",
  "life changing",
  "life-changing",
  "game changer",
  "game-changer",
  "holy grail",
  "you guys",
  "literally",
  "insane",
  "crazy good",
  "to die for",
  "don't sleep on",
  "viral",
  "fomo",
  "limited time",
  "act fast",
  "selling out",
  "hurry",
  "don't miss",
];

// ─── Max caption length ─────────────────────────────────────────────────────

const MAX_CAPTION_WORDS = 12;

// ─── Minimum product score ──────────────────────────────────────────────────

const MIN_PRODUCT_SCORE = 80;

// ─── Validation functions ───────────────────────────────────────────────────

function checkBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.filter((phrase) => lower.includes(phrase));
}

function checkHookApproved(hookText: string): boolean {
  return HOOKS.some((h) => h.text === hookText);
}

function getApprovedHooksList(): string[] {
  return HOOKS.map((h) => h.text);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkSeasonalMismatch(
  product: Product,
  season: Season,
): string | null {
  const boost = getSeasonalBoost(season, product);

  // Strong negative signal: product explicitly tagged for opposite season
  const oppositeSeasons: Record<Season, string> = {
    spring: "fall",
    summer: "winter",
    fall: "spring",
    winter: "summer",
  };

  if (
    product.seasons &&
    product.seasons.includes(oppositeSeasons[season])
  ) {
    return `Tagged for ${oppositeSeasons[season]} but current season is ${season}`;
  }

  // Weak signal: zero seasonal boost for a room with high seasonal affinity
  if (boost === 0) {
    const highAffinityRooms = {
      spring: ["patio"],
      summer: ["patio", "outdoor"],
      fall: ["living-room", "dining-room"],
      winter: ["living-room", "bedroom"],
    };

    const relevant = highAffinityRooms[season] || [];
    if (relevant.includes(product.room)) {
      return `Low seasonal relevance for ${product.room} in ${season}`;
    }
  }

  return null;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Validate a content package before publishing.
 * Returns detailed results with pass/fail and specific issues.
 */
export function validateContent(pkg: ContentPackage): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Check hook is from approved list
  if (!checkHookApproved(pkg.hook)) {
    issues.push({
      type: "error",
      field: "hook",
      message: `Hook "${pkg.hook}" is not from the approved hook library.`,
    });
  }

  // 2. Check hook for banned phrases
  const hookBanned = checkBannedPhrases(pkg.hook);
  for (const phrase of hookBanned) {
    issues.push({
      type: "error",
      field: "hook",
      message: `Hook contains banned phrase: "${phrase}"`,
    });
  }

  // 3. Check each product
  const currentSeason = getCurrentSeason();

  for (let i = 0; i < pkg.products.length; i++) {
    const item = pkg.products[i];
    const { product, score, caption } = item;

    // 3a. Room mismatch
    if (product.room !== pkg.room) {
      issues.push({
        type: "error",
        field: "room",
        message: `Product "${product.name}" belongs to room "${product.room}" but package is for "${pkg.room}"`,
        productIndex: i,
      });
    }

    // 3b. Score threshold
    if (score.overall < MIN_PRODUCT_SCORE) {
      issues.push({
        type: "error",
        field: "score",
        message: `Product "${product.name}" scored ${score.overall} — below minimum ${MIN_PRODUCT_SCORE}`,
        productIndex: i,
      });
    }

    // 3c. Caption length
    const wc = wordCount(caption);
    if (wc > MAX_CAPTION_WORDS) {
      issues.push({
        type: "warning",
        field: "caption",
        message: `Caption for "${product.name}" is ${wc} words — should be ${MAX_CAPTION_WORDS} or fewer`,
        productIndex: i,
      });
    }

    // 3d. Caption banned phrases
    const captionBanned = checkBannedPhrases(caption);
    for (const phrase of captionBanned) {
      issues.push({
        type: "error",
        field: "caption",
        message: `Caption for "${product.name}" contains banned phrase: "${phrase}"`,
        productIndex: i,
      });
    }

    // 3e. Seasonal mismatch
    const seasonalIssue = checkSeasonalMismatch(product, currentSeason);
    if (seasonalIssue) {
      issues.push({
        type: "warning",
        field: "seasonal",
        message: seasonalIssue,
        productIndex: i,
      });
    }
  }

  // 4. Product count sanity
  if (pkg.products.length === 0) {
    issues.push({
      type: "error",
      field: "products",
      message: "Content package has no products.",
    });
  }

  const errors = issues.filter((i) => i.type === "error");
  const passed = errors.length === 0;

  const summary = passed
    ? `✅ All checks passed. ${issues.length > 0 ? `${issues.length} warning(s).` : ""}`
    : `❌ ${errors.length} error(s), ${issues.length - errors.length} warning(s).`;

  return { passed, issues, summary };
}

// ─── Utility exports ────────────────────────────────────────────────────────

export { checkBannedPhrases, getApprovedHooksList, MAX_CAPTION_WORDS, MIN_PRODUCT_SCORE };
