/**
 * Review counts batch 3 (2026-11-15).
 *
 * Source of truth: /home/team/shared/curation/review-counts-batch3-2026-11-15.json
 * The last 37 open rows on Living Room, plus Dining Room, Entryway and the first
 * two Office rows: 60 rows, 59 of them with a live review count.
 *
 *   - every row with a count_read gets that count, never an estimate
 *   - every row whose live rating differs gets the live read, and
 *     price_checked_at = 2026-11-15, so the row says when it was read
 *   - 244 (FEPPO Warming Mat) has no readable listing at all: it is left alone
 *     here and parked by scripts/park-decision42-2026-11-15.mjs
 *
 * Rows that this batch reads below the 4.3 bar, or without a live buy box, are
 * not parked here either: decision 42 parking is its own script so each pass
 * reverses on its own.
 *
 * Usage:
 *   bun run scripts/apply-review-counts-batch3-2026-11-15.mjs            # apply
 *   bun run scripts/apply-review-counts-batch3-2026-11-15.mjs --dry-run  # checks only
 *   bun run scripts/apply-review-counts-batch3-2026-11-15.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BATCH = "/home/team/shared/curation/review-counts-batch3-2026-11-15.json";
const BACKUP = "/home/team/shared/curation/review-counts-batch3-backup-2026-11-15.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* no .env.local - fall through to the error below */
  }
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* no .env either */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

/* ------------------------------------------------------------------ read */

const batch = JSON.parse(readFileSync(BATCH, "utf8"));
const rows = batch.rows || [];
const counted = rows.filter((r) => num(r.review_count_read) !== null);
const rated = counted.filter((r) => r.rating_match === false && num(r.rating_read) !== null);
const unreadable = rows.filter((r) => num(r.review_count_read) === null);

console.log(`Batch: ${BATCH}`);
console.log(`Rows in batch: ${rows.length}, with a count: ${counted.length}, rating moved: ${rated.length}`);
console.log(`No readable listing (left to the decision 42 pass): ${unreadable.map((r) => r.product_id).join(", ") || "none"}\n`);

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));
  if (back.products.length > 0) {
    const res = await db`
      UPDATE products AS p
         SET rating = v.rating, review_count = v.review_count, price_checked_at = v.price_checked_at
        FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
             AS v(id int, rating numeric, review_count int, price_checked_at date)
       WHERE p.id = v.id
      RETURNING p.id`;
    console.log(`Products restored: ${res.length}`);
  }
  console.log("\nRevert done.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

const ids = counted.map((r) => Number(r.product_id));
if (new Set(ids).size !== ids.length) fail("The batch names the same product twice.");

const current = await db`SELECT id, rating, review_count, is_active, pin_rank, price_checked_at
                           FROM products WHERE id = ANY(${ids}::int[])`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
if (current.length !== ids.length) fail(`Expected ${ids.length} product rows, read ${current.length}.`);

for (const r of counted) {
  const row = byId.get(Number(r.product_id));
  if (!row) fail(`Product ${r.product_id} is not in the catalog.`);
  if (num(row.review_count) !== null) {
    fail(`Product ${r.product_id} already carries review_count ${row.review_count}: the batch expected it empty.`);
  }
  if (num(row.rating) !== num(r.current_rating)) {
    fail(`Product ${r.product_id} stores rating ${row.rating}, batch says ${r.current_rating}: the row moved since the file was written.`);
  }
  if (num(r.rating_read) === null && r.rating_match === false) {
    fail(`Product ${r.product_id} is flagged as drifted but carries no live rating.`);
  }
}

for (const r of unreadable) {
  const row = byId.get(Number(r.product_id)) || (await db`SELECT id, review_count FROM products WHERE id = ${Number(r.product_id)}`)[0];
  if (!row) fail(`Product ${r.product_id} is not in the catalog.`);
}

/* ----------------------------------------------------------------- write */

if (DRY) {
  console.log("Dry run: no write. Back-up would be written to " + BACKUP + "\n");
  for (const r of counted) {
    const moved = r.rating_match === false ? `, rating ${r.current_rating} -> ${r.rating_read}` : "";
    console.log(`  ${r.product_id} ${String(r.name).slice(0, 44)}: review_count ${r.review_count_read}${moved}`);
  }
  console.log(`\nWould write ${counted.length} counts and ${rated.length} corrected ratings dated 2026-11-15.`);
  process.exit(0);
}

const backup = {
  batch: batch.batch,
  written_at: new Date().toISOString(),
  products: counted.map((r) => {
    const row = byId.get(Number(r.product_id));
    return {
      id: Number(r.product_id),
      rating: row.rating,
      review_count: row.review_count,
      price_checked_at: row.price_checked_at ? String(row.price_checked_at).slice(0, 10) : null,
    };
  }),
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* One statement, guarded on the state the checks just read: the count must
   still be empty and the stored rating must still be the one the batch saw. */
const values = counted
  .map((r) => {
    const moved = r.rating_match === false && num(r.rating_read) !== null;
    return `(${Number(r.product_id)}, ${num(r.review_count_read)}, ${num(r.current_rating)}, ` +
      `${moved ? num(r.rating_read) : "NULL"}, ${moved ? "'2026-11-15'" : "NULL"})`;
  })
  .join(", ");

const w1 = await db.query(
  `UPDATE products AS p
      SET review_count = v.rc,
          rating = COALESCE(v.new_rating, v.rating),
          price_checked_at = COALESCE(v.checked::date, p.price_checked_at)
     FROM (VALUES ${values}) AS v(id, rc, rating, new_rating, checked)
    WHERE p.id = v.id AND p.review_count IS NULL AND p.rating = v.rating
   RETURNING p.id, p.review_count, p.rating, p.price_checked_at`,
  [],
);
if (w1.length !== counted.length) fail(`Wrote ${w1.length} product rows, expected ${counted.length}.`);
console.log(`Counts written: ${w1.length}`);

/* ------------------------------------------------------------- read-back */

const after = await db`SELECT id, rating, review_count, price_checked_at FROM products
                        WHERE id = ANY(${ids}::int[]) ORDER BY id`;
const bad = after.filter((r) => {
  const want = counted.find((c) => Number(c.product_id) === Number(r.id));
  return num(r.review_count) !== num(want.review_count_read);
});
if (bad.length) fail(`Read-back mismatch on ${bad.map((r) => r.id).join(", ")}.`);
const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").slice(0, 10));
const dated = after.filter((r) => day(r.price_checked_at) === "2026-11-15").length;
console.log(`Rows now carrying their count: ${after.length - bad.length} of ${counted.length}`);
console.log(`Rows re-dated 2026-11-15 (rating corrected): ${dated} of ${rated.length}`);

const stillNull = await db`SELECT count(*)::int AS n FROM products
                             WHERE is_active = true AND rating IS NOT NULL AND review_count IS NULL`;
console.log(`Active rated rows still without a count, sitewide: ${stillNull[0].n}`);
