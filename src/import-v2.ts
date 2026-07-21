/**
 * Standalone import script for Amazon Listv2.xlsx.
 * Inserts new products into the existing products table with deduplication.
 *
 * Usage: DATABASE_URL="..." bun run src/import-v2.ts
 */

import { neon } from "@neondatabase/serverless";
import * as XLSX from "xlsx";

// ── Helper functions (same logic as products.ts ensureProductsImported) ──

function mapRoom(room: string): string {
  const r = (room || "").trim();
  const normalized = r.toLowerCase();
  if (
    normalized === "living room" ||
    normalized === "living room " ||
    normalized === "living-room" ||
    normalized === "livingroom"
  )
    return "living-room";
  if (normalized === "bedroom" || normalized === "bedroom " || normalized === "bed room")
    return "bedroom";
  if (normalized === "bedroom/living room" || normalized === "bedroom living room")
    return "living-room";
  if (normalized === "kitchen") return "kitchen";
  if (
    normalized === "bathroom" ||
    normalized === "bathroom " ||
    normalized === "master bathroom" ||
    normalized === "kids bathroom" ||
    normalized === "guest bathroom"
  )
    return "bathroom";
  if (normalized === "office") return "office";
  if (
    normalized === "patio" ||
    normalized === "outdoor" ||
    normalized === "outdoors" ||
    normalized === "backyard"
  )
    return "patio";
  if (
    normalized === "laundry" ||
    normalized === "laundry room" ||
    normalized === "utility room"
  )
    return "laundry";
  if (normalized === "entryway" || normalized === "entry way") return "entryway";
  if (
    normalized === "organization" ||
    normalized === "storage" ||
    normalized === "storage & organization" ||
    normalized === "closet"
  )
    return "storage";
  if (normalized === "anywhere") return "living-room";
  if (normalized === "kids room") return "bedroom";
  if (normalized === "travel/sidelines") return "patio";
  if (normalized === "games") return "living-room";
  if (normalized === "seasonal") return "living-room";
  return "living-room";
}

function shortenName(fullName: string): string {
  if (!fullName) return "Product";
  const cleaned = fullName
    .replace(/[|,\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ");
  if (words.length <= 5) return cleaned;
  const stopWords = new Set([
    "with", "for", "and", "set", "of", "in", "to", "the", "a", "an", "no", "or",
    "by", "from", "no.", "inch", "inches", "ft", "pack", "pcs", "piece", "pieces",
    "size", "large", "small", "extra", "up", "2", "3", "4", "5", "6", "7", "8",
    "9", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30",
  ]);
  let end = 4;
  if (words.length > 4 && !stopWords.has(words[4].toLowerCase())) end = 5;
  if (
    words.length > 5 &&
    !stopWords.has(words[5].toLowerCase()) &&
    words[5].length > 3
  )
    end = 6;
  return words.slice(0, end).join(" ");
}

function inferStyles(name: string, room: string): string[] {
  const lower = name.toLowerCase();
  const styles: Set<string> = new Set();
  const roomStyles: Record<string, string[]> = {
    "living-room": ["modern", "cozy"],
    bedroom: ["cozy", "minimalist"],
    kitchen: ["modern", "farmhouse"],
    bathroom: ["modern", "minimalist"],
    patio: ["coastal", "modern"],
    laundry: ["minimalist"],
    entryway: ["modern"],
    storage: ["minimalist", "modern"],
  };
  (roomStyles[room] || ["modern"]).forEach((s) => styles.add(s));
  if (lower.includes("boho") || lower.includes("bohemian")) styles.add("boho");
  if (lower.includes("farmhouse") || lower.includes("rustic")) styles.add("farmhouse");
  if (lower.includes("coastal")) styles.add("coastal");
  if (
    lower.includes("mid-century") ||
    lower.includes("mid century") ||
    lower.includes("modern")
  )
    styles.add("modern");
  if (lower.includes("minimalist") || lower.includes("minimal")) styles.add("minimalist");
  if (lower.includes("vintage") || lower.includes("retro")) styles.add("traditional");
  if (lower.includes("glam") || lower.includes("gold") || lower.includes("velvet"))
    styles.add("glam");
  if (lower.includes("linen") || lower.includes("natural") || lower.includes("woven"))
    styles.add("coastal");
  if (
    lower.includes("luxury") ||
    lower.includes("premium") ||
    lower.includes("designer")
  )
    styles.add("glam");
  if (lower.includes("wood") || lower.includes("rattan") || lower.includes("acacia"))
    styles.add("farmhouse");
  return [...styles].slice(0, 5);
}

function inferCollection(room: string): string {
  if (room === "living-room") return "living-room-look";
  if (room === "bedroom") return "bedroom-look";
  if (room === "kitchen") return "kitchen-look";
  if (room === "bathroom") return "bathroom-look";
  if (room === "patio") return "patio-look";
  if (room === "entryway") return "entryway-look";
  return "home-essentials";
}

// ── Main import logic ──

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  // Read the spreadsheet
  const filePath = "/home/team/shared/Amazon Listv2.xlsx";
  console.log(`Reading ${filePath}...`);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
  });
  const rows = data.slice(1); // skip header
  console.log(`Found ${rows.length} data rows in spreadsheet`);

  // Ensure table exists (idempotent)
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      full_name TEXT,
      room TEXT NOT NULL,
      style TEXT[] DEFAULT '{}',
      amazon_url TEXT NOT NULL UNIQUE,
      price DECIMAL,
      rating DECIMAL,
      editor_note TEXT,
      image_url TEXT,
      pinterest_title TEXT,
      blog_category TEXT,
      collection TEXT,
      is_trending BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Get current count before import
  const before = await sql`SELECT count(*) as cnt FROM products`;
  const beforeCount = before[0].cnt;
  console.log(`Products before import: ${beforeCount}`);

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const rawRoom = String(row[0] || "").trim();
    const fullName = String(row[1] || "").trim();
    const amazonUrl = String(row[2] || "").trim();
    const imageUrl = String(row[3] || "").trim();
    const rawPrice = row[4];
    const _ownIt = row[5]; // not used
    const rawRating = row[6];
    const editorNote = String(row[7] || "").trim();
    const pinterestTitle = String(row[8] || "").trim();
    const blogCategory = String(row[9] || "").trim();

    // Validate required fields
    if (!fullName || !amazonUrl || !amazonUrl.startsWith("http")) {
      skipped++;
      continue;
    }

    const room = mapRoom(rawRoom);
    const name = shortenName(fullName);
    const styles = inferStyles(fullName, room);
    const collection = inferCollection(room);
    const price = rawPrice !== undefined && rawPrice !== null && rawPrice !== ""
      ? Number(rawPrice)
      : null;
    const rating =
      rawRating !== undefined && rawRating !== null && rawRating !== ""
        ? Number(rawRating)
        : null;
    const isTrending = rating !== null && rating >= 4.6;

    try {
      await sql`
        INSERT INTO products (
          name, full_name, room, style, amazon_url, price, rating,
          editor_note, image_url, pinterest_title, blog_category,
          collection, is_trending
        )
        VALUES (
          ${name}, ${fullName}, ${room}, ${styles}, ${amazonUrl},
          ${price}, ${rating}, ${editorNote || null},
          ${imageUrl || null}, ${pinterestTitle || null},
          ${blogCategory || null}, ${collection}, ${isTrending}
        )
        ON CONFLICT (amazon_url) DO NOTHING
      `;
      imported++;
    } catch (err: any) {
      console.error(`  Skipped row due to error: ${err.message}`);
      skipped++;
    }
  }

  // Get count after import
  const after = await sql`SELECT count(*) as cnt FROM products`;
  const afterCount = after[0].cnt;
  const newProducts = afterCount - beforeCount;

  console.log(`\n=== Import Results ===`);
  console.log(`Products before: ${beforeCount}`);
  console.log(`Products after:  ${afterCount}`);
  console.log(`New added:       ${newProducts}`);
  console.log(`Attempted:       ${imported}`);
  console.log(`Skipped:         ${skipped}`);

  // Show some new entries
  if (newProducts > 0) {
    const latest = await sql`
      SELECT id, name, room, price, rating, amazon_url
      FROM products
      ORDER BY id DESC
      LIMIT 5
    `;
    console.log(`\nLatest 5 products:`);
    for (const p of latest) {
      console.log(`  #${p.id} [${p.room}] ${p.name} - $${p.price} (${p.rating}★)`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
