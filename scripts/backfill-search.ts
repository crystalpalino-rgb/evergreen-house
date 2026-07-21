/**
 * Full-Text Search Backfill Script
 * Populates the `full_text_search` tsvector column on all products where it is NULL.
 *
 * Usage: DATABASE_URL="<url>" bun run scripts/backfill-search.ts
 */

import { sql } from "../src/db";

const db = sql();

// ── Backfill ──
await db`
  UPDATE products SET full_text_search = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(full_name, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(editor_note, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(brand, '')), 'B')
  WHERE full_text_search IS NULL
`;

// ── Verify ──
const result = await db`SELECT count(*) as remaining FROM products WHERE full_text_search IS NULL`;
const remaining = (result as any[])[0]?.remaining ?? 'unknown';
console.log(`Backfill complete. Products with NULL full_text_search: ${remaining}`);
