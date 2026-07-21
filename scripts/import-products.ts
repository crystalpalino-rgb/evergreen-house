import * as XLSX from "xlsx";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── Room slug mapping ──
function mapRoom(room: string): string {
  const r = (room || "").trim();
  const normalized = r.toLowerCase();

  if (
    normalized === "living room" ||
    normalized === "living room " ||
    normalized === "living-room" ||
    normalized === "livingroom"
  ) {
    return "living-room";
  }
  if (
    normalized === "bedroom" ||
    normalized === "bedroom " ||
    normalized === "bed room"
  ) {
    return "bedroom";
  }
  if (
    normalized === "bedroom/living room" ||
    normalized === "bedroom living room" ||
    normalized === "bedroom-living-room"
  ) {
    return "living-room"; // multi-room: put in living-room as primary
  }
  if (normalized === "kitchen") return "kitchen";
  if (
    normalized === "bathroom" ||
    normalized === "bathroom " ||
    normalized === "master bathroom" ||
    normalized === "kids bathroom" ||
    normalized === "guest bathroom"
  ) {
    return "bathroom";
  }
  if (normalized === "office") return "office";
  if (
    normalized === "patio" ||
    normalized === "outdoor" ||
    normalized === "outdoors" ||
    normalized === "backyard"
  ) {
    return "patio";
  }
  if (
    normalized === "laundry" ||
    normalized === "laundry room" ||
    normalized === "utility room"
  ) {
    return "laundry";
  }
  if (normalized === "entryway" || normalized === "entry way") {
    return "entryway";
  }
  if (
    normalized === "organization" ||
    normalized === "storage" ||
    normalized === "storage & organization" ||
    normalized === "closet"
  ) {
    return "storage";
  }
  // Catch-all mappings
  if (normalized === "anywhere") return "living-room";
  if (normalized === "kids room") return "bedroom";
  if (normalized === "travel/sidelines") return "patio";
  if (normalized === "games") return "living-room";

  return "living-room"; // default fallback
}

// ── Shorten product name (first 3-5 meaningful words) ──
function shortenName(fullName: string): string {
  if (!fullName) return "Product";
  const cleaned = fullName.replace(/[|,\-–—]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  // Take enough words to form a readable name (typically 3-5)
  if (words.length <= 5) return cleaned;

  // Try to find a natural break: look for brand + descriptive words
  // Common pattern: "Brand Product Type Key Descriptor ..."
  const stopWords = new Set([
    "with", "for", "and", "set", "of", "in", "to", "the", "a", "an",
    "no", "or", "by", "from", "no.", "inch", "inches", "ft", "pack",
    "pcs", "piece", "pieces", "size", "large", "small", "extra",
    "up", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "12", "14", "16", "18", "20", "22", "24", "26", "28", "30",
  ]);

  // Take first 4 words, unless word 5 is not a stop word
  let end = 4;
  if (words.length > 4 && !stopWords.has(words[4].toLowerCase())) {
    end = 5;
  }
  if (words.length > 5 && !stopWords.has(words[5].toLowerCase()) && words[5].length > 3) {
    end = 6;
  }

  return words.slice(0, end).join(" ");
}

// ── Infer style tags from product name and room ──
function inferStyles(name: string, room: string): string[] {
  const lower = name.toLowerCase();
  const styles: Set<string> = new Set();

  // Room-based defaults
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

  const defaults = roomStyles[room] || ["modern"];
  defaults.forEach((s) => styles.add(s));

  // Keyword-based
  if (lower.includes("boho") || lower.includes("bohemian")) styles.add("boho");
  if (lower.includes("farmhouse") || lower.includes("rustic")) styles.add("farmhouse");
  if (lower.includes("coastal")) styles.add("coastal");
  if (lower.includes("mid-century") || lower.includes("mid century") || lower.includes("modern"))
    styles.add("modern");
  if (lower.includes("minimalist") || lower.includes("minimal")) styles.add("minimalist");
  if (lower.includes("vintage") || lower.includes("retro")) styles.add("traditional");
  if (lower.includes("glam") || lower.includes("gold") || lower.includes("velvet")) styles.add("glam");
  if (lower.includes("linen") || lower.includes("natural") || lower.includes("woven"))
    styles.add("coastal");
  if (lower.includes("luxury") || lower.includes("premium") || lower.includes("designer"))
    styles.add("glam");
  if (lower.includes("faux") || lower.includes("artificial") || lower.includes("fake"))
    styles.add("modern");
  if (lower.includes("wood") || lower.includes("rattan") || lower.includes("acacia"))
    styles.add("farmhouse");

  return [...styles].slice(0, 5); // max 5 style tags
}

// ── Infer collection from room and styles ──
function inferCollection(room: string, styles: string[]): string {
  if (room === "living-room") return "living-room-look";
  if (room === "bedroom") return "bedroom-look";
  if (room === "kitchen") return "kitchen-look";
  if (room === "bathroom") return "bathroom-look";
  if (room === "patio") return "patio-look";
  if (room === "entryway") return "entryway-look";
  return "home-essentials";
}

// ── Main import ──
async function main() {
  console.log("Reading Excel file...");
  const wb = XLSX.readFile("/home/team/shared/Amazon List.xlsx");
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
  });

  // Headers: Room, Product, Amazon Link, Price, Own it, Rating, Why I love it, Pinterest Title, Blog Category, Photo Taken
  const rows = data.slice(1); // skip header row

  console.log(`Found ${rows.length} rows (including any empty ones)...`);

  // Create table
  console.log("Creating products table if not exists...");
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
  console.log("Table ready.");

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    const rawRoom = String(row[0] || "").trim();
    const fullName = String(row[1] || "").trim();
    const amazonUrl = String(row[2] || "").trim();
    const rawPrice = row[3];
    const rawRating = row[5];
    const editorNote = String(row[6] || "").trim();
    const pinterestTitle = String(row[7] || "").trim();
    const blogCategory = String(row[8] || "").trim();

    // Skip empty rows
    if (!fullName || !amazonUrl) {
      console.log(`  Skipping row: empty name or URL (room: "${rawRoom}")`);
      skipped++;
      continue;
    }

    // Validate amazon URL
    if (!amazonUrl.startsWith("http")) {
      console.log(`  Skipping row: invalid URL "${amazonUrl}"`);
      skipped++;
      continue;
    }

    const room = mapRoom(rawRoom);
    const name = shortenName(fullName);
    const styles = inferStyles(fullName, room);
    const collection = inferCollection(room, styles);

    // Parse price and rating
    const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : null;
    const rating = rawRating !== undefined && rawRating !== null ? Number(rawRating) : null;

    // Check for duplicates
    const existing = await sql`SELECT id FROM products WHERE amazon_url = ${amazonUrl}`;
    if (existing.length > 0) {
      console.log(`  Skipping duplicate: ${name} (${amazonUrl})`);
      skipped++;
      continue;
    }

    // Infer trending from rating (top-rated in each room)
    const isTrending = rating !== null && rating >= 4.6;

    await sql`
      INSERT INTO products (name, full_name, room, style, amazon_url, price, rating, editor_note, image_url, pinterest_title, blog_category, collection, is_trending)
      VALUES (${name}, ${fullName}, ${room}, ${styles}, ${amazonUrl}, ${price}, ${rating}, ${editorNote || null}, ${null}, ${pinterestTitle || null}, ${blogCategory || null}, ${collection}, ${isTrending})
    `;

    console.log(`  Imported: ${name} → ${room} [${styles.join(", ")}]`);
    imported++;
  }

  // Verify
  const count = await sql`SELECT count(*) as cnt FROM products`;
  console.log(`\nDone! Imported ${imported} products, skipped ${skipped}.`);
  console.log(`Database has ${count[0].cnt} products total.`);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
