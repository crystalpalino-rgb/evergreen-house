import { neon } from "@neondatabase/serverless";
import * as fs from "fs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(DATABASE_URL);
const BASE_URL = "https://evergreenhouse.co";

const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/rooms", changefreq: "weekly", priority: "0.9" },
  { path: "/styles", changefreq: "weekly", priority: "0.9" },
  { path: "/collections", changefreq: "weekly", priority: "0.9" },
  { path: "/editors-picks", changefreq: "daily", priority: "0.8" },
  { path: "/search", changefreq: "weekly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
];

const urls: string[] = [];

// Static pages
for (const page of staticPages) {
  urls.push(`  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
}

// Room pages
const rooms = await sql`SELECT DISTINCT room FROM products ORDER BY room`;
for (const row of rooms) {
  const room = row.room;
  urls.push(`  <url>
    <loc>${BASE_URL}/room/${room}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
}

// Style pages
const styles = [
  "traditional", "transitional", "modern-farmhouse", "coastal",
  "minimalist", "scandinavian", "boho", "industrial",
  "everyday-luxury", "organic-modern", "cozy", "vintage-eclectic"
];
for (const style of styles) {
  urls.push(`  <url>
    <loc>${BASE_URL}/style/${style}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
}

// Collection pages
const collections = await sql`SELECT DISTINCT slug FROM collections`;
for (const row of collections) {
  urls.push(`  <url>
    <loc>${BASE_URL}/collection/${row.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
}

// Product pages (if any individual product pages exist)
const products = await sql`SELECT id FROM products WHERE id IS NOT NULL ORDER BY id`;
for (const row of products) {
  urls.push(`  <url>
    <loc>${BASE_URL}/product/${row.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

fs.writeFileSync("/home/team/shared/site/public/sitemap.xml", sitemap);
console.log(`Sitemap generated with ${urls.length} URLs`);
