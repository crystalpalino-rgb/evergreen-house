/**
 * Google Merchant Center Product Feed Generator
 *
 * Queries all active products from the database and generates a
 * Google Shopping-compatible XML feed at public/google-merchant-feed.xml.
 *
 * Run: bun run scripts/generate-merchant-feed.ts
 */
import { neon } from "@neondatabase/serverless";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = "https://evergreenhouse.co";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateDescription(text: string | null, maxLen = 500): string {
  if (!text) return "Curated home find from Evergreen House.";
  return text.length <= maxLen ? text : text.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function formatPrice(price: unknown, currency: string | null): string {
  if (price === null || price === undefined) return "";
  const num = Number(price);
  if (isNaN(num)) return "";
  const curr = currency || "USD";
  return `${num.toFixed(2)} ${curr}`;
}

function mapAvailability(dbValue: string | null): string {
  if (!dbValue) return "in stock";
  const lower = dbValue.toLowerCase();
  if (lower === "in_stock" || lower === "in stock") return "in stock";
  if (lower === "out_of_stock" || lower === "out of stock") return "out of stock";
  if (lower === "preorder" || lower === "pre_order") return "preorder";
  return "in stock";
}

interface ProductRow {
  id: number;
  name: string;
  brand: string | null;
  price: unknown;
  price_currency: string | null;
  availability: string | null;
  seo_slug: string | null;
  editor_note: string | null;
  image_url: string | null;
  amazon_url: string;
}

async function main() {
  const dbUrl = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  if (!dbUrl) {
    console.error("DATABASE_URL not set — skipping merchant feed generation");
    process.exit(0);
  }
  const db = neon(dbUrl);
  const publicDir = join(import.meta.dir, "..", "public");
  mkdirSync(publicDir, { recursive: true });

  console.log("Fetching active products...");
  const products = (await db`
    SELECT id, name, brand, price, price_currency, availability,
           seo_slug, editor_note, image_url, amazon_url
    FROM products
    WHERE is_active = true
    ORDER BY id
  `) as unknown as ProductRow[];

  console.log(`Found ${products.length} active products`);

  const items = products
    .map((p) => {
      const slug = p.seo_slug || slugify(p.name);
      const link = `${SITE_URL}/product/${xmlEscape(slug)}`;
      const title = xmlEscape(p.name);
      const description = xmlEscape(truncateDescription(p.editor_note));
      const imageLink = p.image_url ? xmlEscape(p.image_url) : "";
      const price = formatPrice(p.price, p.price_currency);
      const availability = mapAvailability(p.availability);
      const brand = p.brand ? xmlEscape(p.brand) : "Evergreen House";

      // Skip products without a valid image or price (required by Google)
      if (!imageLink || !price) {
        return null;
      }

      return `  <item>
    <g:id>${xmlEscape(slug)}</g:id>
    <g:title>${title}</g:title>
    <g:description>${description}</g:description>
    <g:link>${link}</g:link>
    <g:image_link>${imageLink}</g:image_link>
    <g:price>${price}</g:price>
    <g:availability>${availability}</g:availability>
    <g:condition>new</g:condition>
    <g:brand>${brand}</g:brand>
    <g:google_product_category>Home &amp; Garden</g:google_product_category>
  </item>`;
    })
    .filter(Boolean)
    .join("\n");

  const now = new Date().toISOString();
  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Evergreen House — Curated Home Finds</title>
    <link>${SITE_URL}</link>
    <description>Timeless, beautiful home products thoughtfully selected for quality, longevity, and everyday living.</description>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

  writeFileSync(join(publicDir, "google-merchant-feed.xml"), feed);
  console.log(`Wrote google-merchant-feed.xml with ${items.split("<item>").length - 1} products`);
  console.log("✅ Merchant feed generated successfully!");
}

main().catch((err) => {
  console.error("Merchant feed generation failed:", err);
  process.exit(1);
});
