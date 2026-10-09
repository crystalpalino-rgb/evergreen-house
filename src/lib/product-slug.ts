/**
 * Canonical product URL slug, in one place.
 *
 * The product route (src/routes/product/$slug.tsx) resolves a product by
 * comparing the incoming URL segment against `canonicalProductSlug(product)`,
 * so every link the site renders for a product MUST be built with the same
 * function. Anything else (e.g. slugifying the display name on its own)
 * produces a URL that no route ever matches and the visitor gets a 404.
 *
 * Rule: a stored `seo_slug` wins; otherwise the name-derived slug.
 * Both field spellings are accepted because product data reaches components
 * either snake_case (raw DB rows via src/lib/intelligence.ts) or camelCase
 * (serialized/mapped payloads via the per-route mappers).
 */

/** Slugify a product display name. Mirrors the historical route behaviour. */
export function productNameToSlug(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** Minimal shape needed to resolve a product URL. */
export interface SlugSource {
  name?: string | null;
  seo_slug?: string | null;
  seoSlug?: string | null;
}

function storedSlug(product: SlugSource | null | undefined): string {
  if (!product) return "";
  for (const value of [product.seo_slug, product.seoSlug]) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "";
}

/**
 * THE canonical slug for a product URL. Use for every product link, canonical
 * tag, schema URL and sitemap entry.
 */
export function canonicalProductSlug(product: SlugSource | null | undefined): string {
  return storedSlug(product) || productNameToSlug(product?.name || "");
}
