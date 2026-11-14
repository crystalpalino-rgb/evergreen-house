import type { Product } from "./types";

/**
 * One entry per product per page (Site Standard rule 6, owner decision 37).
 *
 * The same Amazon listing can sit in the products table more than once. A
 * seasonal sourcing pass imported a second copy of an item that was already in
 * the catalog (the copy carries a season suffix on its seo_slug), so a
 * collection whose rule matched both copies rendered the same product twice:
 * Coastal showed 29 cards for 22 products, Farmhouse 132 for 120, Spring
 * Refresh 9 for 5.
 *
 * The copies share one ASIN, so the Amazon listing is the identity, not the row
 * id. This runs inside the collection resolver (src/lib/intelligence.ts) rather
 * than in a component, so every page that reads a collection gets the same
 * answer and a fresh duplicate row cannot put a second card back on the page.
 */

function asinFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = String(url);
  const match =
    value.match(/(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})/i) ||
    value.match(/[?&]asin=([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

/** Amazon ASIN when the row has one, otherwise the normalized product name. */
function listingKey(product: Product): string {
  const asin = asinFromUrl(product.amazon_url);
  if (asin) return `asin:${asin}`;
  const name = (product.full_name || product.name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  return `name:${name || product.id}`;
}

/** The copy with more of its card fields filled wins; the older row breaks ties. */
function isBetter(candidate: Product, current: Product): boolean {
  const completeness =
    (candidate.completeness_score ?? 0) - (current.completeness_score ?? 0);
  if (completeness !== 0) return completeness > 0;
  const quality = (candidate.quality_score ?? 0) - (current.quality_score ?? 0);
  if (quality !== 0) return quality > 0;
  return candidate.id < current.id;
}

/**
 * Collapse rows that are the same Amazon listing, keeping the best copy in the
 * position the first copy occupied so the page order does not move.
 */
export function dedupeProductsByListing(products: Product[]): Product[] {
  if (products.length < 2) return products;

  const best = new Map<string, Product>();
  for (const product of products) {
    const key = listingKey(product);
    const current = best.get(key);
    if (!current || isBetter(product, current)) best.set(key, product);
  }
  if (best.size === products.length) return products;

  const emitted = new Set<string>();
  const out: Product[] = [];
  for (const product of products) {
    const key = listingKey(product);
    if (emitted.has(key)) continue;
    emitted.add(key);
    out.push(best.get(key) as Product);
  }
  return out;
}
