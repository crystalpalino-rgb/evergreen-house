// Fetches product images from Amazon for all products with NULL image_url.
// Usage: DATABASE_URL=... bun run scripts/fetch-amazon-images.ts

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env for DATABASE_URL
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(import.meta.dir, "..", ".env"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

loadEnv();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface Product {
  id: number;
  name: string;
  amazon_url: string;
  image_url: string | null;
}

async function fetchImageUrl(amazonUrl: string): Promise<string | null> {
  try {
    // Step 1: Follow the redirect to get the real Amazon URL
    const redirectRes = await fetch(amazonUrl, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    const finalUrl = redirectRes.url;

    // Step 2: Fetch the product page and extract og:image
    const pageRes = await fetch(finalUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });

    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // Try og:image
    let match = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (match) return match[1];

    // Try twitter:image
    match = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (match) return match[1];

    // Try image with data-old-hires
    match = html.match(/data-old-hires=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png))["']/i);
    if (match) return match[1];

    // Try any high-res image from media-amazon
    match = html.match(/(https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s]+\.(?:jpg|jpeg|png))/i);
    if (match) return match[1];

    return null;
  } catch (err: any) {
    console.error(`  Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("Fetching products with NULL image_url...");
  const rows = (await sql`SELECT id, name, amazon_url, image_url FROM products ORDER BY id`) as Product[];
  const needsImage = rows.filter((r) => !r.image_url);

  console.log(`Found ${needsImage.length} products needing images (out of ${rows.length} total)\n`);

  let got = 0;
  let failed = 0;

  for (let i = 0; i < needsImage.length; i++) {
    const product = needsImage[i];
    const label = product.name.length > 50 ? product.name.slice(0, 47) + "..." : product.name.padEnd(50);

    process.stdout.write(`[${i + 1}/${needsImage.length}] ${label} ... `);

    const imageUrl = await fetchImageUrl(product.amazon_url);

    if (imageUrl) {
      await sql`UPDATE products SET image_url = ${imageUrl} WHERE id = ${product.id}`;
      console.log(`✓ ${imageUrl.slice(0, 60)}...`);
      got++;
    } else {
      console.log("✗ no image found");
      failed++;
    }

    // Delay between requests to avoid being blocked
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    // Extra pause every 10 products
    if ((i + 1) % 10 === 0 && i < needsImage.length - 1) {
      console.log(`\n  Pausing 30s (batch ${Math.floor((i + 1) / 10)} complete)...\n`);
      await new Promise((r) => setTimeout(r, 30000));
    }
  }

  console.log(`\nDone. Got ${got} images, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
