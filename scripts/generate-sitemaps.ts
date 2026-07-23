/**
 * Sitemap Generation Script
 * 
 * Generates all sitemap XML files into `public/` at build time.
 * Run: bun run scripts/generate-sitemaps.ts
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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(d: unknown): string {
  if (!d) return today();
  try {
    const date = d instanceof Date ? d : new Date(String(d));
    if (isNaN(date.getTime())) return today();
    return date.toISOString().split("T")[0];
  } catch {
    return today();
  }
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface ProductRow {
  id: number;
  name: string;
  image_url: string | null;
  room: string;
  updated_at: string;
}

interface CollectionRow {
  slug: string;
  updated_at: string;
}

async function main() {
  const dbUrl = (process.env.DATABASE_URL || "").replace(/^["']|["']$/g, "");
  if (!dbUrl) {
    console.error("DATABASE_URL not set — skipping sitemap generation");
    process.exit(0);
  }

  const db = neon(dbUrl);
  const publicDir = join(import.meta.dir, "..", "public");
  mkdirSync(publicDir, { recursive: true });

  const dateStr = today();

  // ── Fetch data ──
  console.log("Fetching products...");
  const productRows = await db`
    SELECT id, name, image_url, room, updated_at 
    FROM products 
    WHERE is_active = true 
    ORDER BY id
  ` as unknown as ProductRow[];

  console.log(`Found ${productRows.length} active products`);

  console.log("Fetching collections...");
  const collectionRows = await db`
    SELECT slug, updated_at 
    FROM collections 
    WHERE is_active = true 
    ORDER BY slug
  ` as unknown as CollectionRow[];

  console.log(`Found ${collectionRows.length} active collections`);

  // Unique rooms from products
  const rooms = [...new Set(productRows.map((p) => p.room).filter(Boolean))].sort();

  // ── 1. Sitemap Index ──
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-pages.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-products.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-rooms.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-collections.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-images.xml</loc>
    <lastmod>${dateStr}</lastmod>
  </sitemap>
</sitemapindex>`;

  writeFileSync(join(publicDir, "sitemap.xml"), sitemapIndex);
  console.log("Wrote sitemap.xml (index)");

  // ── 2. Static Pages Sitemap ──
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/rooms", priority: "0.9", changefreq: "weekly" },
    { loc: "/styles", priority: "0.9", changefreq: "weekly" },
    { loc: "/collections", priority: "0.9", changefreq: "weekly" },
    { loc: "/editors-picks", priority: "0.8", changefreq: "daily" },
    { loc: "/search", priority: "0.7", changefreq: "weekly" },
    { loc: "/about", priority: "0.6", changefreq: "monthly" },
    { loc: "/contact", priority: "0.5", changefreq: "monthly" },
    { loc: "/blog", priority: "0.8", changefreq: "weekly" },
    { loc: "/seasonal", priority: "0.7", changefreq: "weekly" },
  ];

  const pagesSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map((p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  writeFileSync(join(publicDir, "sitemap-pages.xml"), pagesSitemap);
  console.log("Wrote sitemap-pages.xml");

  // ── 3. Products Sitemap ──
  const productsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${productRows.map((p) => {
    const slug = slugify(p.name);
    const lastmod = formatDate(p.updated_at);
    return `  <url>
    <loc>${SITE_URL}/product/${xmlEscape(slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join("\n")}
</urlset>`;

  writeFileSync(join(publicDir, "sitemap-products.xml"), productsXml);
  console.log("Wrote sitemap-products.xml");

  // ── 4. Rooms Sitemap ──
  const roomsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rooms.map((room) => `  <url>
    <loc>${SITE_URL}/room/${xmlEscape(room)}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join("\n")}
</urlset>`;

  writeFileSync(join(publicDir, "sitemap-rooms.xml"), roomsXml);
  console.log("Wrote sitemap-rooms.xml");

  // ── 5. Collections Sitemap ──
  const collectionsXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${collectionRows.map((c) => {
    const lastmod = formatDate(c.updated_at);
    return `  <url>
    <loc>${SITE_URL}/collection/${xmlEscape(c.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join("\n")}
</urlset>`;

  writeFileSync(join(publicDir, "sitemap-collections.xml"), collectionsXml);
  console.log("Wrote sitemap-collections.xml");

  // ── 6. Image Sitemap ──
  const withImages = productRows.filter((p) => p.image_url);
  const imagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${withImages.map((p) => {
    const slug = slugify(p.name);
    return `  <url>
    <loc>${SITE_URL}/product/${xmlEscape(slug)}</loc>
    <image:image>
      <image:loc>${xmlEscape(p.image_url!)}</image:loc>
      <image:title>${xmlEscape(p.name)}</image:title>
    </image:image>
  </url>`;
  }).join("\n")}
</urlset>`;

  writeFileSync(join(publicDir, "sitemap-images.xml"), imagesXml);
  console.log(`Wrote sitemap-images.xml (${withImages.length} images)`);

  console.log("\n✅ All sitemaps generated successfully!");
}

main().catch((err) => {
  console.error("Sitemap generation failed:", err);
  process.exit(1);
});
