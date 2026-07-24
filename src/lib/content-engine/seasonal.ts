/**
 * Seasonal Intelligence — detect current season and compute seasonal relevance
 * boosts for products. Used by the scorer to give time-appropriate bonuses.
 */

import type { Product } from "~/lib/types";

export type Season = "spring" | "summer" | "fall" | "winter";

/** Map of month (0-indexed) to season for Northern Hemisphere */
const MONTH_TO_SEASON: Record<number, Season> = {
  0: "winter",  // January
  1: "winter",  // February
  2: "spring",  // March
  3: "spring",  // April
  4: "spring",  // May
  5: "summer",  // June
  6: "summer",  // July
  7: "summer",  // August
  8: "fall",    // September
  9: "fall",    // October
  10: "fall",   // November
  11: "winter", // December
};

/** Get the current season based on the calendar month */
export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  return MONTH_TO_SEASON[month];
}

/**
 * Seasonal room affinity — how strongly each room aligns with each season.
 * Score is 0-10 representing the seasonal boost potential.
 */
const ROOM_SEASON_AFFINITY: Record<string, Partial<Record<Season, number>>> = {
  "patio": { spring: 7, summer: 10, fall: 4, winter: 0 },
  "outdoor": { spring: 7, summer: 10, fall: 4, winter: 0 },
  "living-room": { spring: 3, summer: 2, fall: 6, winter: 7 },
  "bedroom": { spring: 3, summer: 2, fall: 5, winter: 6 },
  "kitchen": { spring: 4, summer: 3, fall: 6, winter: 5 },
  "dining-room": { spring: 4, summer: 3, fall: 6, winter: 6 },
  "entryway": { spring: 4, summer: 3, fall: 6, winter: 5 },
  "bathroom": { spring: 3, summer: 3, fall: 3, winter: 4 },
  "office": { spring: 2, summer: 2, fall: 3, winter: 4 },
  "laundry": { spring: 3, summer: 3, fall: 3, winter: 3 },
  "pantry": { spring: 2, summer: 2, fall: 3, winter: 3 },
  "nursery": { spring: 3, summer: 3, fall: 4, winter: 4 },
};

/**
 * Material seasonal associations — some materials feel more appropriate
 * in certain seasons. Returns a boost factor.
 */
const SEASONAL_MATERIALS: Record<Season, string[]> = {
  spring: ["linen", "cotton", "wicker", "rattan", "ceramic", "glass", "light-wood"],
  summer: ["linen", "cotton", "wicker", "rattan", "ceramic", "glass", "stone", "outdoor-fabric"],
  fall: ["wool", "brass", "wood", "marble", "stoneware", "ceramic", "leather", "velvet"],
  winter: ["wool", "brass", "wood", "marble", "velvet", "leather", "iron", "bronze"],
};

/**
 * Mood seasonal associations for extra boost
 */
const SEASONAL_MOODS: Record<Season, string[]> = {
  spring: ["bright", "fresh", "airy", "natural", "organic"],
  summer: ["bright", "airy", "breezy", "natural", "relaxed"],
  fall: ["cozy", "warm", "rich", "layered", "earthy", "moody"],
  winter: ["cozy", "warm", "rich", "intimate", "quiet", "moody"],
};

/**
 * Compute a seasonal boost (0-10) for a product in the given season.
 * This is additive to the base product score.
 */
export function getSeasonalBoost(season: Season, product: Product): number {
  let boost = 0;

  // 1. Room-based boost (0-5 points)
  const roomAffinity = ROOM_SEASON_AFFINITY[product.room];
  if (roomAffinity && roomAffinity[season] != null) {
    boost += roomAffinity[season]! * 0.5;
  }

  // 2. Material-based boost (0-3 points)
  const seasonalMats = SEASONAL_MATERIALS[season];
  const productMats = (product.materials || []).map((m) => m.toLowerCase());
  const matMatches = productMats.filter((m) =>
    seasonalMats.some((sm) => m.includes(sm) || sm.includes(m)),
  );
  boost += Math.min(3, matMatches.length * 1.0);

  // 3. Mood-based boost (0-2 points)
  const seasonalMoods = SEASONAL_MOODS[season];
  const productMoods = (product.moods || []).map((m) => m.toLowerCase());
  const moodMatches = productMoods.filter((m) =>
    seasonalMoods.some((sm) => m.includes(sm) || sm.includes(m)),
  );
  boost += Math.min(2, moodMatches.length * 0.5);

  // 4. Color-based boost (0-2 points) — warm tones in fall/winter, light tones in spring/summer
  const warmColors = ["cream", "beige", "taupe", "brown", "terracotta", "rust", "bronze", "gold", "warm"];
  const coolColors = ["white", "light", "sage", "pale", "blue", "green", "sand"];
  const productColors = (product.colors || []).map((c) => c.toLowerCase());

  if (season === "fall" || season === "winter") {
    const warmMatches = productColors.filter((c) =>
      warmColors.some((wc) => c.includes(wc)),
    );
    boost += Math.min(2, warmMatches.length * 0.5);
  } else {
    const coolMatches = productColors.filter((c) =>
      coolColors.some((cc) => c.includes(cc)),
    );
    boost += Math.min(2, coolMatches.length * 0.5);
  }

  // 5. Seasonal tag matching — if the product explicitly has this season tagged
  if (product.seasons && product.seasons.includes(season)) {
    boost += 2;
  }

  return Math.round(Math.min(10, boost));
}

/**
 * Convenience: seasonal boost for the current season
 */
export function getCurrentSeasonalBoost(product: Product): number {
  return getSeasonalBoost(getCurrentSeason(), product);
}
