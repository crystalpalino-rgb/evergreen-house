/**
 * Review counts batch 1 (2026-11-15).
 *
 * Source of truth: /home/team/shared/curation/review-counts-batch1-2026-11-15.json
 *
 *   - every row with a count_read gets that count, never an estimate
 *   - every row whose live rating differs gets the live read, and
 *     price_checked_at = the pass date, so the row says when it was read
 *   - the two rows with no readable listing (72: dead ASIN, 534: no rating
 *     listed and below the 4.3 gate) are parked: is_active = false, out of the
 *     draft list and out of the published snapshot, so no page renders a card
 *     we cannot stand behind.
 *
 * Why parking touches the edit lists: edit pages render the published snapshot
 * by product id and never filter is_active (src/lib/edits.ts
 * getCuratedProducts), so is_active alone would leave both cards on the pages.
 * The product row is parked as well, which is what takes them off the rooms,
 * /collection/holiday, /search, the sitemaps, the feed and the product pages.
 *
 * Usage:
 *   bun run scripts/apply-review-counts-batch1-2026-11-15.mjs            # apply
 *   bun run scripts/apply-review-counts-batch1-2026-11-15.mjs --dry-run  # checks only
 *   bun run scripts/apply-review-counts-batch1-2026-11-15.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BATCH = "/home/team/shared/curation/review-counts-batch1-2026-11-15.json";
const BACKUP = "/home/team/shared/curation/review-counts-batch1-backup-2026-11-15.json";

/** The two rows this batch parks, and why. */
const PARKED = [
  { id: 72, reason: "Amazon returns Page Not Found for the ASIN: the card links to a dead listing" },
  { id: 534, reason: "no star rating and no review count listed today, and the stored 3.7 sits below the 4.3 gate" },
];

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

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
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

/* ------------------------------------------------------------------ read */

const batch = JSON.parse(readFileSync(BATCH, "utf8"));
const rows = batch.rows || [];
const counted = rows.filter((r) => r.review_count_read !== null && r.review_count_read !== undefined);
const parkedIds = PARKED.map((p) => p.id);
const rated = counted.filter((r) => r.rating_match === false);

console.log(`Batch: ${BATCH}`);
console.log(`Rows in batch: ${rows.length}, with a count: ${counted.length}, rating moved: ${rated.length}`);
console.log(`Parking: ${parkedIds.join(", ")}\n`);

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  if (back.products.length > 0) {
    const res = await db`
      UPDATE products AS p
         SET rating = v.rating, review_count = v.review_count,
             price_checked_at = v.price_checked_at, is_active = v.is_active
        FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
             AS v(id int, rating numeric, review_count int, price_checked_at date, is_active boolean)
       WHERE p.id = v.id
      RETURNING p.id`;
    console.log(`Products restored: ${res.length}`);
  }

  if (back.edit_items.length > 0) {
    const res = await db`
      INSERT INTO edit_items (edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at)
      SELECT edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at
        FROM jsonb_to_recordset(${JSON.stringify(back.edit_items)}::jsonb)
             AS t(edit_id int, product_id int, position int, display_title text, hook text, slug text, name text, raw_name boolean, price_override numeric, price_set_at timestamptz)
      RETURNING id`;
    console.log(`Edit items reinserted: ${res.length}`);
  }

  if (back.snapshots.length > 0) {
    const res = await db`
      UPDATE edit_publications p
         SET snapshot = v.snapshot::jsonb
        FROM jsonb_to_recordset(${JSON.stringify(back.snapshots)}::jsonb)
             AS v(edit_id int, snapshot text)
       WHERE p.edit_id = v.edit_id
      RETURNING p.edit_id`;
    console.log(`Snapshots restored: ${res.length}`);
  }

  console.log("\nRevert done.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

const ids = counted.map((r) => r.product_id);
const current = await db`SELECT id, rating, review_count, is_active, pin_rank, price_checked_at
                           FROM products WHERE id = ANY(${ids}::int[])`;
const byId = new Map(current.map((r) => [Number(r.id), r]));

if (current.length !== counted.length) fail(`Expected ${counted.length} product rows, read ${current.length}.`);

for (const r of counted) {
  const row = byId.get(r.product_id);
  if (!row) fail(`Product ${r.product_id} is not in the catalog.`);
  if (num(row.review_count) !== null) fail(`Product ${r.product_id} already carries review_count ${row.review_count}: the batch expected it empty.`);
  if (num(row.rating) !== num(r.current_rating)) fail(`Product ${r.product_id} stores rating ${row.rating}, batch says ${r.current_rating}: the row moved since the file was written.`);
}

for (const p of PARKED) {
  const row = byId.get(p.id) || (await db`SELECT id, is_active, pin_rank FROM products WHERE id = ${p.id}`)[0];
  if (!row) fail(`Parked product ${p.id} is not in the catalog.`);
  if (row.is_active !== true) fail(`Parked product ${p.id} is already inactive.`);
  if (num(row.pin_rank) !== null) fail(`Parked product ${p.id} is in the Pinterest rotation (pin_rank ${row.pin_rank}): not parkable.`);
}

/* the edit lists that carry the parked rows: draft and published */
const items = await db`SELECT i.id, i.edit_id, i.product_id, i.position FROM edit_items i
                        WHERE i.product_id = ANY(${parkedIds}::int[]) ORDER BY i.edit_id`;
if (items.length !== PARKED.length) fail(`Expected ${PARKED.length} draft edit items, read ${items.length}.`);

const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))];
const pubs = await db`SELECT edit_id, snapshot FROM edit_publications
                       WHERE edit_id = ANY(${editsAffected}::int[]) ORDER BY edit_id`;
if (pubs.length !== editsAffected.length) fail(`Expected ${editsAffected.length} published snapshots, read ${pubs.length}.`);

for (const item of items) {
  const pub = pubs.find((p) => Number(p.edit_id) === Number(item.edit_id));
  if (!pub) fail(`Edit ${item.edit_id} has a draft item for ${item.product_id} but no published snapshot.`);
  const present = (pub.snapshot.items || []).map((i) => Number(i.id));
  if (!present.includes(Number(item.product_id))) {
    fail(`Edit ${item.edit_id} snapshot does not carry ${item.product_id}: the lists are out of step.`);
  }
}

const collectionsWithIds = await db`SELECT slug, product_ids FROM collections WHERE product_ids IS NOT NULL`;
const inCollections = collectionsWithIds.filter((c) => {
  const list = Array.isArray(c.product_ids) ? c.product_ids.map(Number) : [];
  return parkedIds.some((id) => list.includes(id));
});
if (inCollections.length > 0) fail(`Parked ids are named by collections: ${inCollections.map((c) => c.slug).join(", ")}.`);

const inactiveInEdits = await db`SELECT i.edit_id, i.product_id FROM edit_items i
                                   JOIN products p ON p.id = i.product_id
                                  WHERE p.is_active = false`;
if (inactiveInEdits.length > 0) fail(`Edit lists already carry inactive products (${JSON.stringify(inactiveInEdits)}): the render path would disagree with them.`);

console.log(`Checks passed: ${counted.length} rows to fill, ${rated.length} ratings to re-date, ${PARKED.length} to park.`);

/* ------------------------------------------------------------- the backup */

const productBackup = await db`SELECT id, rating, review_count, price_checked_at, is_active
                                FROM products WHERE id = ANY(${[...ids, ...parkedIds]}::int[])`;
const backup = {
  written_at: new Date().toISOString(),
  batch: batch.batch,
  products: productBackup.map((r) => ({
    id: Number(r.id),
    rating: r.rating === null ? null : String(r.rating),
    review_count: r.review_count === null ? null : Number(r.review_count),
    price_checked_at: day(r.price_checked_at),
    is_active: r.is_active,
  })),
  edit_items: items.map((i) => ({
    edit_id: Number(i.edit_id),
    product_id: Number(i.product_id),
    position: Number(i.position),
  })),
  snapshots: pubs.map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) })),
};

if (DRY) {
  console.log("\nDry run: no write. Back-up would be written to " + BACKUP);
  for (const r of counted) {
    console.log(`  ${r.product_id} ${r.name}: review_count ${r.review_count_read}, rating ${r.current_rating}${r.rating_match ? "" : ` -> ${r.rating_read}`}`);
  }
  for (const p of PARKED) console.log(`  park ${p.id}: ${p.reason}`);
  process.exit(0);
}

writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* --------------------------------------------------------------- writes */

/* 1. counts, ratings and the read date: one statement, guarded on the state
      the checks above just read. */
const values = counted
  .map(
    (r) =>
      `(${r.product_id}, ${r.review_count_read}, ${r.current_rating}, ` +
      `${r.rating_match ? "NULL" : r.rating_read}, ${r.rating_match ? "NULL" : `'${r.date}'`})`,
  )
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

/* 2. park the two rows */
const w2 = await db`UPDATE products SET is_active = false
                     WHERE id = ANY(${parkedIds}::int[]) AND is_active = true
                    RETURNING id`;
if (w2.length !== PARKED.length) fail(`Parked ${w2.length} products, expected ${PARKED.length}.`);
console.log(`Products parked: ${w2.map((r) => r.id).join(", ")}`);

/* 3. out of the draft lists */
const w3 = await db`DELETE FROM edit_items WHERE product_id = ANY(${parkedIds}::int[])
                    RETURNING id, edit_id, product_id`;
if (w3.length !== PARKED.length) fail(`Removed ${w3.length} draft items, expected ${PARKED.length}.`);
console.log(`Draft items removed: ${w3.map((r) => r.product_id).join(", ")}`);

/* 4. out of the published snapshots, one statement for both edits */
const w4 = await db.query(
  `UPDATE edit_publications p
      SET snapshot = jsonb_set(p.snapshot, '{items}',
            (SELECT jsonb_agg(elem ORDER BY ord)
               FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
              WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
    WHERE p.edit_id = ANY($2::int[])
   RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
  [parkedIds, editsAffected],
);
if (w4.length !== editsAffected.length) fail(`Republished ${w4.length} snapshots, expected ${editsAffected.length}.`);
console.log(`Snapshots rewritten: ${w4.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);

/* 5. positions back to a clean 1..n on the two edits */
const w5 = await db.query(
  `UPDATE edit_items i SET position = s.np
     FROM (SELECT id, row_number() OVER (PARTITION BY edit_id ORDER BY position, id) AS np
             FROM edit_items WHERE edit_id = ANY($1::int[])) s
    WHERE i.id = s.id AND i.position IS DISTINCT FROM s.np
   RETURNING i.id`,
  [editsAffected],
);
console.log(`Positions renumbered: ${w5.length}`);

/* ------------------------------------------------------------- read-back */

const after = await db`SELECT p.edit_id, e.slug, jsonb_array_length(p.snapshot->'items') AS n
                         FROM edit_publications p JOIN edits e ON e.id = p.edit_id
                        WHERE p.edit_id = ANY(${editsAffected}::int[]) ORDER BY p.edit_id`;
console.log("\nAfter:");
for (const r of after) console.log(`  edit ${r.edit_id} ${r.slug}: ${r.n} cards`);

const stillMissing = await db`SELECT count(*)::int AS n FROM products
                               WHERE id = ANY(${ids}::int[]) AND review_count IS NULL`;
console.log(`Rows in the batch still without a count: ${stillMissing[0].n}`);

const parkedNow = await db`SELECT id, is_active, room FROM products WHERE id = ANY(${parkedIds}::int[]) ORDER BY id`;
console.log(`Parked now: ${parkedNow.map((r) => `${r.id} active=${r.is_active} room=${r.room}`).join(", ")}`);
