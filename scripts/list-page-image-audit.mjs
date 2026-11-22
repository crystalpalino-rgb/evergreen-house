// Audit: for each of the eight list pages, does every on-page card have a
// product photo available? Matches manifest ASINs to product rows through the
// ASIN inside amazon_url (the products table has no asin column).
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`select id, amazon_url, image_url, image_alt from products`;
const byAsin = new Map();
for (const r of rows) {
  const m = String(r.amazon_url || "").match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/);
  if (m) byAsin.set(m[1], r);
}

const dirs = [
  "stocking-stuffers",
  "stocking-men",
  "stocking-teen-boys",
  "stocking-teen-girls",
  "new-year-organized-home",
  "meal-prep-kitchen-reset",
  "small-space-home-fitness",
  "wellness-at-home",
];

for (const d of dirs) {
  const p = `src/data/${d}/list-manifest.json`;
  if (!fs.existsSync(p)) {
    console.log(d, "NO MANIFEST");
    continue;
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const items = j.items || [];
  let onPage = 0;
  let matched = 0;
  let withImage = 0;
  const miss = [];
  for (const it of items) {
    if (it.appears_on_page === false) continue;
    onPage += 1;
    const m = String(it.url || "").match(/(?:dp\/|gp\/product\/)([A-Z0-9]{10})/);
    const asin = m ? m[1] : it.asin;
    const r = byAsin.get(asin);
    if (r) {
      matched += 1;
      if (r.image_url) withImage += 1;
      else miss.push(`${asin}:row-without-image`);
    } else {
      miss.push(`${asin}:no-product-row`);
    }
  }
  console.log(`${d}: onPage=${onPage} matched=${matched} withImage=${withImage}`);
  if (miss.length) console.log(`  miss: ${miss.join(", ")}`);
}
process.exit(0);
