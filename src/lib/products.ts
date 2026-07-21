import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";

// ── Product Type ──
/** @deprecated Use src/lib/intelligence.ts instead. Use Product from ~/lib/types for the unified type. */
export interface DBProduct {
  id: number;
  name: string;
  full_name: string | null;
  room: string;
  style: string[];
  amazon_url: string;
  price: number | null;
  rating: number | null;
  editor_note: string | null;
  image_url: string | null;
  pinterest_title: string | null;
  blog_category: string | null;
  collection: string | null;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  fullName: string | null;
  room: string;
  style: string[];
  amazonUrl: string;
  price: number | null;
  rating: number | null;
  editorNote: string | null;
  imageUrl: string | null;
  pinterestTitle: string | null;
  blogCategory: string | null;
  collection: string | null;
  isTrending: boolean;
}

function toProduct(row: DBProduct): Product {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    room: row.room,
    style: row.style || [],
    amazonUrl: row.amazon_url,
    price: row.price,
    rating: row.rating,
    editorNote: row.editor_note,
    imageUrl: row.image_url,
    pinterestTitle: row.pinterest_title,
    blogCategory: row.blog_category,
    collection: row.collection,
    isTrending: row.is_trending,
  };
}

// Virtual rooms — curated product ID lists (no keyword bleed)
async function getVirtualRoomProducts(room: string): Promise<Product[]> {
  const curated: Record<string, number[]> = {
    "seasonal-finds": [
      74, 75, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 114, 115,
    ],
    "wall-decor": [
      12, 16, 30, 46,
    ],
    "dining-room": [
      13, 28, 39, 63, 69, 92, 105, 106, 111, 113,
    ],
  };
  const ids = curated[room];
  if (!ids || ids.length === 0) return [];

  // Fetch all products and filter by curated IDs in memory
  const allRows = await sql()`SELECT * FROM products ORDER BY rating DESC NULLS LAST`;
  const arr = Array.isArray(allRows) ? allRows : [...allRows];
  const idSet = new Set(ids);
  return arr.filter((r: DBProduct) => idSet.has(r.id)).map(toProduct);
}

async function getVirtualRoomCounts(): Promise<{room: string, count: number}[]> {
  const virtualRooms = ["seasonal-finds", "wall-decor", "dining-room"];
  const counts: {room: string, count: number}[] = [];
  for (const room of virtualRooms) {
    const products = await getVirtualRoomProducts(room);
    if (products.length > 0) {
      counts.push({ room, count: products.length });
    }
  }
  return counts;
}

// ── Direct (non-RPC) exports for SSR route loaders ──
// These bypass the createServerFn machinery, matching the marketing API pattern
// that works correctly with sql().

/** @deprecated Use getProductsByRoom from src/lib/intelligence.ts instead. */
export const getProductsByRoomDirect = async (room: string): Promise<Product[]> => {
  const virtualProducts = await getVirtualRoomProducts(room);
  if (virtualProducts.length > 0) {
    virtualProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return virtualProducts;
  }
  const rows = await sql()`SELECT * FROM products WHERE room = ${room} ORDER BY rating DESC NULLS LAST`;
  return rows.map(toProduct);
};

/** @deprecated Use getAllProducts from src/lib/intelligence.ts instead. */
export const getAllProductsDirect = async (): Promise<Product[]> => {
  const rows = await sql()`SELECT * FROM products ORDER BY created_at DESC`;
  return rows.map(toProduct);
};

export const getTrendingProductsDirect = async (limit: number = 8): Promise<Product[]> => {
  const rows = await sql()`SELECT * FROM products WHERE is_trending = true ORDER BY rating DESC NULLS LAST LIMIT ${limit}`;
  return rows.map(toProduct);
};

export const getCollectionsDirect = async () => {
  const rows = await sql()`SELECT collection, COUNT(*) as count FROM products WHERE collection IS NOT NULL GROUP BY collection ORDER BY count DESC`;
  return rows;
};

export const getRoomProductCountsDirect = async () => {
  const realRooms = await sql()`SELECT room, COUNT(*) as count FROM products GROUP BY room ORDER BY count DESC`;
  const virtualRooms = await getVirtualRoomCounts();
  return [...realRooms, ...virtualRooms.filter((v: any) => v.count > 0)];
};

// ── Server Functions (for client-side use) ──

export const getAllProducts = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`SELECT * FROM products ORDER BY created_at DESC`;
  return rows.map(toProduct);
});

export const getProductsByRoom = createServerFn({ method: "GET" })
  .validator((room: string) => room)
  .handler(async ({ data: room }) => {
    // Virtual rooms — keyword matching
    const virtualProducts = await getVirtualRoomProducts(room);
    if (virtualProducts.length > 0) {
      // Sort by rating descending
      virtualProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return virtualProducts;
    }
    // If no virtual products matched, fall through to real room query
    const rows = await sql()`SELECT * FROM products WHERE room = ${room} ORDER BY rating DESC NULLS LAST`;
    return rows.map(toProduct);
  });

export const getProductsByStyle = createServerFn({ method: "GET" })
  .validator((style: string) => style)
  .handler(async ({ data: style }) => {
    const rows = await sql()`SELECT * FROM products WHERE ${style} = ANY(style) ORDER BY rating DESC NULLS LAST`;
    return rows.map(toProduct);
  });

export const getTrendingProducts = createServerFn({ method: "GET" })
  .validator((limit?: number) => limit ?? 8)
  .handler(async ({ data: limit }) => {
    const rows = await sql()`SELECT * FROM products WHERE is_trending = true ORDER BY rating DESC NULLS LAST LIMIT ${limit}`;
    return rows.map(toProduct);
  });

export const getCollections = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await sql()`SELECT collection, COUNT(*) as count FROM products WHERE collection IS NOT NULL GROUP BY collection ORDER BY count DESC`;
  return rows;
});

export const searchProducts = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const q = `%${query.toLowerCase()}%`;
    const rows = await sql()`
      SELECT * FROM products 
      WHERE LOWER(name) LIKE ${q} 
         OR LOWER(room) LIKE ${q} 
         OR EXISTS (SELECT 1 FROM unnest(style) s WHERE LOWER(s) LIKE ${q})
         OR LOWER(COALESCE(editor_note, '')) LIKE ${q}
      ORDER BY rating DESC NULLS LAST 
      LIMIT 20
    `;
    return rows.map(toProduct);
  });

export const getRoomProductCounts = createServerFn({ method: "GET" }).handler(async () => {
  const realRooms = await sql()`SELECT room, COUNT(*) as count FROM products GROUP BY room ORDER BY count DESC`;
  const virtualRooms = await getVirtualRoomCounts();
  // Merge virtual counts into results, skipping any that are zero
  const all = [...realRooms, ...virtualRooms.filter((v: any) => v.count > 0)];
  return all;
});

export const getProductsByCollection = createServerFn({ method: "GET" })
  .validator((collection: string) => collection)
  .handler(async ({ data: collection }) => {
    const rows = await sql()`SELECT * FROM products WHERE collection = ${collection} ORDER BY rating DESC NULLS LAST`;
    return rows.map(toProduct);
  });

// ── Auto-import from spreadsheet (idempotent) ──
let importPromise: Promise<boolean> | null = null;

export const ensureProductsImported = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // Check if already imported
    const existing = await sql()`SELECT count(*) as cnt FROM products`;
    if (existing[0].cnt > 0) {
      return { imported: false, count: existing[0].cnt, message: "Already imported" };
    }

    // Dynamically import xlsx only when needed (server-side only)
    const XLSX = await import("xlsx");

    const wb = XLSX.readFile("/home/team/shared/Amazon List.xlsx");
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });
    const rows = data.slice(1);

    // Create table (idempotent)
    await sql()`
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

      if (!fullName || !amazonUrl || !amazonUrl.startsWith("http")) {
        skipped++;
        continue;
      }

      const room = mapRoom(rawRoom);
      const name = shortenName(fullName);
      const styles = inferStyles(fullName, room);
      const collection = inferCollection(room);
      const price = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : null;
      const rating = rawRating !== undefined && rawRating !== null ? Number(rawRating) : null;
      const isTrending = rating !== null && rating >= 4.6;

      try {
        await sql()`
          INSERT INTO products (name, full_name, room, style, amazon_url, price, rating, editor_note, image_url, pinterest_title, blog_category, collection, is_trending)
          VALUES (${name}, ${fullName}, ${room}, ${styles}, ${amazonUrl}, ${price}, ${rating}, ${editorNote || null}, ${null}, ${pinterestTitle || null}, ${blogCategory || null}, ${collection}, ${isTrending})
          ON CONFLICT (amazon_url) DO NOTHING
        `;
        imported++;
      } catch {
        skipped++;
      }
    }

    const count = await sql()`SELECT count(*) as cnt FROM products`;
    return { imported: true, count: count[0].cnt, skipped };
  } catch (err: any) {
    console.error("Import failed:", err.message);
    return { imported: false, count: 0, error: err.message };
  }
});

// ── Import helper functions (same as in the standalone script) ──
function mapRoom(room: string): string {
  const r = (room || "").trim();
  const normalized = r.toLowerCase();
  if (normalized === "living room" || normalized === "living room " || normalized === "living-room" || normalized === "livingroom") return "living-room";
  if (normalized === "bedroom" || normalized === "bedroom " || normalized === "bed room") return "bedroom";
  if (normalized === "bedroom/living room" || normalized === "bedroom living room") return "living-room";
  if (normalized === "kitchen") return "kitchen";
  if (normalized === "bathroom" || normalized === "bathroom " || normalized === "master bathroom" || normalized === "kids bathroom" || normalized === "guest bathroom") return "bathroom";
  if (normalized === "office") return "office";
  if (normalized === "patio" || normalized === "outdoor" || normalized === "outdoors" || normalized === "backyard") return "patio";
  if (normalized === "laundry" || normalized === "laundry room" || normalized === "utility room") return "laundry";
  if (normalized === "entryway" || normalized === "entry way") return "entryway";
  if (normalized === "organization" || normalized === "storage" || normalized === "storage & organization" || normalized === "closet") return "storage";
  if (normalized === "anywhere") return "living-room";
  if (normalized === "kids room") return "bedroom";
  if (normalized === "travel/sidelines") return "patio";
  if (normalized === "games") return "living-room";
  return "living-room";
}

function shortenName(fullName: string): string {
  if (!fullName) return "Product";
  const cleaned = fullName.replace(/[|,\-–—]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  if (words.length <= 5) return cleaned;
  const stopWords = new Set(["with", "for", "and", "set", "of", "in", "to", "the", "a", "an", "no", "or", "by", "from", "no.", "inch", "inches", "ft", "pack", "pcs", "piece", "pieces", "size", "large", "small", "extra", "up", "2", "3", "4", "5", "6", "7", "8", "9", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30"]);
  let end = 4;
  if (words.length > 4 && !stopWords.has(words[4].toLowerCase())) end = 5;
  if (words.length > 5 && !stopWords.has(words[5].toLowerCase()) && words[5].length > 3) end = 6;
  return words.slice(0, end).join(" ");
}

function inferStyles(name: string, room: string): string[] {
  const lower = name.toLowerCase();
  const styles: Set<string> = new Set();
  const roomStyles: Record<string, string[]> = {
    "living-room": ["modern", "cozy"], bedroom: ["cozy", "minimalist"],
    kitchen: ["modern", "farmhouse"], bathroom: ["modern", "minimalist"],
    patio: ["coastal", "modern"], laundry: ["minimalist"],
    entryway: ["modern"], storage: ["minimalist", "modern"],
  };
  (roomStyles[room] || ["modern"]).forEach((s) => styles.add(s));
  if (lower.includes("boho") || lower.includes("bohemian")) styles.add("boho");
  if (lower.includes("farmhouse") || lower.includes("rustic")) styles.add("farmhouse");
  if (lower.includes("coastal")) styles.add("coastal");
  if (lower.includes("mid-century") || lower.includes("mid century") || lower.includes("modern")) styles.add("modern");
  if (lower.includes("minimalist") || lower.includes("minimal")) styles.add("minimalist");
  if (lower.includes("vintage") || lower.includes("retro")) styles.add("traditional");
  if (lower.includes("glam") || lower.includes("gold") || lower.includes("velvet")) styles.add("glam");
  if (lower.includes("linen") || lower.includes("natural") || lower.includes("woven")) styles.add("coastal");
  if (lower.includes("luxury") || lower.includes("premium") || lower.includes("designer")) styles.add("glam");
  if (lower.includes("wood") || lower.includes("rattan") || lower.includes("acacia")) styles.add("farmhouse");
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
