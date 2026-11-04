/**
 * Read-only snapshot of the rows the pin-priority change touches.
 *
 * Prints id, room, display_title, price, rating, review_count, availability,
 * price_checked_at and pin_rank for each id, plus the room card counts that the
 * change must not move. Used for the before/after proof around
 * scripts/apply-pin-priority.mjs.
 *
 * Usage: bun run scripts/pin-priority-snapshot.mjs [label]
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const IDS = [293, 297, 300, 318, 36, 27, 243, 405, 406, 403, 407, 483, 413, 419, 28, 90, 44];

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const label = process.argv[2] || "snapshot";

const rows = await db.query(
  `SELECT id, room, name, display_title, price, rating, review_count, availability,
          price_checked_at, pin_rank, is_active
     FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [IDS],
);
console.log(`=== ${label} ===`);
for (const r of rows) {
  console.log(
    `${r.id} [${r.room}] active=${r.is_active} pin_rank=${r.pin_rank} price=${r.price} ` +
      `rating=${r.rating} reviews=${r.review_count} avail="${r.availability}" checked=${r.price_checked_at}\n` +
      `    title="${r.display_title}"  name="${r.name}"`,
  );
}

const counts = await db.query(
  `SELECT room, count(*)::int AS n FROM products WHERE is_active = true
    GROUP BY room ORDER BY room`,
);
console.log(`\nActive rows by room (${label}):`);
console.log(counts.map((r) => `${r.room}=${r.n}`).join(" "));
