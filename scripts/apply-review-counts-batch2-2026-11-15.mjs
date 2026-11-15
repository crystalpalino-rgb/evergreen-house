/**
 * Review counts batch 2 (2026-11-15).
 *
 * Source of truth: /home/team/shared/curation/review-counts-batch2-2026-11-15.json
 *
 *   - every one of the 60 rows gets the review count read from its own Amazon
 *     listing on 2026-11-15, never an estimate
 *   - the 25 rows whose live rating differs from the stored one get the live
 *     read, and price_checked_at = the pass date, so the row says when it was
 *     read (the same rule batch 1 applied)
 *   - rows where only the count was filled keep the date stamp they had: the
 *     rating on those cards did not move
 *
 * Nothing is parked. The rows below the 4.3 gate (Slushie Cup 4.2, OUAI 3.9)
 * and the rows without a buy box stay on their pages as they are, with their
 * honest numbers, until Crystal decides replace or suppress. price, is_active
 * and room are never touched.
 *
 * Usage:
 *   bun run scripts/apply-review-counts-batch2-2026-11-15.mjs            # apply
 *   bun run scripts/apply-review-counts-batch2-2026-11-15.mjs --dry-run  # checks only
 *   bun run scripts/apply-review-counts-batch2-2026-11-15.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BATCH = "/home/team/shared/curation/review-counts-batch2-2026-11-15.json";
const BACKUP = "/home/team/shared/curation/review-counts-batch2-backup-2026-11-15.json";
const CHECKED_AT = "2026-11-15";
const ROOMS = ["kitchen", "bedroom", "bathroom", "living-room"];

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) {
      return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local - fall through to the error below */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const day = (v) => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

/** Per-room counts of active rows carrying a rating but no review count. */
async function gapByRoom(label) {
  const rows = await db`
    SELECT room,
           count(*) FILTER (WHERE rating IS NOT NULL AND review_count IS NULL)::int AS missing,
           count(*) FILTER (WHERE review_count IS NOT NULL)::int AS with_count,
           count(*)::int AS total
    FROM products
    WHERE is_active = true AND room = ANY(${ROOMS})
    GROUP BY room
    ORDER BY room`;
  console.log(`\n${label}`);
  for (const r of rows) {
    console.log(
      `  ${r.room.padEnd(12)} active ${String(r.total).padStart(3)}  with a count ${String(r.with_count).padStart(3)}  rating but no count ${String(r.missing).padStart(3)}`,
    );
  }
  return rows;
}

/* ------------------------------------------------------------------ read */

const batch = JSON.parse(readFileSync(BATCH, "utf8"));
const rows = batch.rows || [];
const ids = rows.map((r) => Number(r.product_id));
const moved = rows.filter((r) => r.rating_match === false);
const still = rows.filter((r) => r.rating_match === true);

/* ------------------------------------------------------------- revert */

if (REVERT) {
  const backup = JSON.parse(readFileSync(BACKUP, "utf8"));
  const values = backup.rows
    .map((r) => `(${r.id}, ${r.rating}, ${r.review_count}, ${r.price_checked_at ? `'${r.price_checked_at}'` : "NULL"})`)
    .join(", ");
  const w = await db.query(
    `UPDATE products AS p
        SET rating = v.rating::numeric,
            review_count = v.rc::int,
            price_checked_at = v.checked::date,
            updated_at = now()
       FROM (VALUES ${values}) AS v(id, rating, rc, checked)
      WHERE p.id = v.id
      RETURNING p.id`,
    [],
  );
  if (w.length !== backup.rows.length) fail(`Reverted ${w.length} rows, expected ${backup.rows.length}.`);
  console.log(`Reverted ${w.length} rows from ${BACKUP}.`);
  await gapByRoom("After revert");
  process.exit(0);
}

/* -------------------------------------------------------------- checks */

if (rows.length !== batch.totals?.products_in_batch) {
  fail(`file totals say ${batch.totals?.products_in_batch} rows, the file carries ${rows.length}.`);
}
if (new Set(ids).size !== ids.length) fail("the file carries the same product_id twice.");
for (const r of rows) {
  if (!Number.isInteger(Number(r.review_count_read)) || Number(r.review_count_read) <= 0) {
    fail(`id ${r.product_id} has no usable review_count_read (${r.review_count_read}).`);
  }
  if (!Number.isFinite(Number(r.rating_read)) || Number(r.rating_read) <= 0) {
    fail(`id ${r.product_id} has no usable rating_read (${r.rating_read}).`);
  }
  if (r.date !== CHECKED_AT) fail(`id ${r.product_id} was read ${r.date}, not ${CHECKED_AT}.`);
}
const flagged = new Set((batch.flags || []).map((f) => Number(f.product_id)));
if (moved.length !== flagged.size) {
  fail(`${moved.length} rows differ on rating but the file flags ${flagged.size}.`);
}
for (const r of moved) {
  if (!flagged.has(Number(r.product_id))) fail(`id ${r.product_id} differs but is not flagged.`);
}
console.log(`Batch: ${BATCH}`);
console.log(
  `${rows.length} rows, ${rows.length} review counts, ${moved.length} ratings set to the live read and re-dated ${CHECKED_AT}, ${still.length} ratings unchanged, nothing parked.`,
);

await gapByRoom("Before (active rows in the four rooms this batch covers)");

const before = await db`
  SELECT id, room, name, rating, review_count, price_checked_at, is_active
  FROM products WHERE id = ANY(${ids})`;
if (before.length !== ids.length) {
  const found = new Set(before.map((r) => r.id));
  fail(`missing products: ${ids.filter((id) => !found.has(id)).join(", ")}`);
}
for (const row of rows) {
  const live = before.find((b) => b.id === Number(row.product_id));
  if (live.rating === null) fail(`id ${row.product_id} has no stored rating to compare against.`);
  if (Number(live.rating) !== Number(row.current_rating)) {
    fail(
      `id ${row.product_id} stored rating is ${live.rating} but the file recorded ${row.current_rating} on ${CHECKED_AT}. Re-read the listing before applying.`,
    );
  }
  if (!live.is_active) fail(`id ${row.product_id} is parked (is_active = false); this batch writes live rows only.`);
}

const backup = {
  batch: batch.batch,
  written_at: CHECKED_AT,
  rows: before.map((r) => ({
    id: r.id,
    room: r.room,
    name: r.name,
    rating: r.rating === null ? null : Number(r.rating),
    review_count: r.review_count,
    price_checked_at: day(r.price_checked_at),
  })),
};

if (DRY) {
  console.log(`\nDry run: no write. Back-up would be written to ${BACKUP}`);
  for (const r of rows) {
    const was = before.find((b) => b.id === Number(r.product_id));
    console.log(
      `  ${r.product_id} ${r.name}: count ${was.review_count ?? "null"} -> ${r.review_count_read}` +
        (r.rating_match ? "" : `, rating ${was.rating} -> ${r.rating_read}`),
    );
  }
  process.exit(0);
}

writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* --------------------------------------------------------------- write */

/* One statement: counts on all 60, the live rating and the read date on the
   25 that moved. Atomic, and guarded on the stored state read a moment ago. */
const values = rows
  .map(
    (r) =>
      `(${r.product_id}, ${Number(r.review_count_read)}, ${Number(r.rating_read)}, ` +
      `${Number(r.current_rating)}, ${r.rating_match ? "false" : "true"})`,
  )
  .join(", ");
const written = await db.query(
  `UPDATE products AS p
      SET review_count = v.rc,
          rating = v.rating::numeric,
          price_checked_at = CASE WHEN v.recheck THEN '${CHECKED_AT}'::date ELSE p.price_checked_at END,
          updated_at = now()
     FROM (VALUES ${values}) AS v(id, rc, rating, cur, recheck)
    WHERE p.id = v.id AND p.rating = v.cur::numeric
   RETURNING p.id`,
  [],
);
if (written.length !== rows.length) fail(`Wrote ${written.length} product rows, expected ${rows.length}.`);
console.log(`Rows written: ${written.length}`);

/* ------------------------------------------------------------- read back */

const after = await db`
  SELECT id, room, name, rating, review_count, price_checked_at
  FROM products WHERE id = ANY(${ids}) ORDER BY id`;
const problems = [];
for (const row of rows) {
  const got = after.find((a) => a.id === Number(row.product_id));
  if (!got) {
    problems.push(`${row.product_id} disappeared`);
    continue;
  }
  if (Number(got.rating) !== Number(row.rating_read)) {
    problems.push(`${row.product_id} rating ${got.rating} != ${row.rating_read}`);
  }
  if (Number(got.review_count) !== Number(row.review_count_read)) {
    problems.push(`${row.product_id} review_count ${got.review_count} != ${row.review_count_read}`);
  }
  if (!row.rating_match && day(got.price_checked_at) !== CHECKED_AT) {
    problems.push(`${row.product_id} price_checked_at ${day(got.price_checked_at)} != ${CHECKED_AT}`);
  }
  if (row.rating_match && day(got.price_checked_at) !== day(before.find((b) => b.id === got.id).price_checked_at)) {
    problems.push(`${row.product_id} date moved on a row whose rating did not change`);
  }
}
if (problems.length) fail(`read back disagrees:\n  ${problems.join("\n  ")}`);

console.log(`\nRead back ${after.length} rows, every count, rating and date as written:`);
for (const r of after) {
  const was = before.find((b) => b.id === r.id);
  console.log(
    `  id ${String(r.id).padStart(3)} ${String(r.room).padEnd(11)} count ${String(was.review_count ?? "null").padStart(6)} -> ${String(r.review_count).padStart(6)}  rating ${was.rating}${Number(was.rating) !== Number(r.rating) ? ` -> ${r.rating}` : " (unchanged)"}  checked ${day(was.price_checked_at)}${day(was.price_checked_at) !== day(r.price_checked_at) ? ` -> ${day(r.price_checked_at)}` : ""}`,
  );
}

const gaps = await gapByRoom("After (active rows in the four rooms this batch covers)");
const stillMissing = gaps.reduce((n, g) => n + g.missing, 0);
console.log(`\nActive rows in these four rooms still carrying a rating but no count: ${stillMissing}`);

const sitewide = await db`
  SELECT count(*)::int AS n FROM products WHERE is_active = true AND review_count IS NULL`;
console.log(`Sitewide active rows still without a review count: ${sitewide[0].n}`);
console.log("No price, is_active or room value was changed. Nothing was parked.");
