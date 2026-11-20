/**
 * Review counts batch 4 and batch 5 (2026-11-16), the last 80 cards.
 *
 * Sources of truth:
 *   /home/team/shared/curation/review-counts-batch4-2026-11-16.json  (60 rows:
 *     office 12, patio 16, pantry 18, books 3, fall 8, games 1, organization 2)
 *   /home/team/shared/curation/review-counts-batch5-2026-11-16.json  (20 rows:
 *     organization 9, spring 3, summer 8)
 *
 *   - every active row with a count_read gets that count, never an estimate
 *   - every row whose live rating differs gets the live read, and
 *     price_checked_at = 2026-11-16, so the row says when it was read
 *   - rows already parked (is_active false) are skipped untouched
 *   - owner decision 42: any row the batch reads below 4.3 stars, or without a
 *     live buy box, or whose listing could not be read at all (so no buy box
 *     could be confirmed), is parked - is_active false, pulled from the draft
 *     edit items and the published snapshots. Pinned rows are the only
 *     exception and are refused here. Nothing is deleted.
 *
 * Usage:
 *   bun run scripts/apply-review-counts-batch4-5-2026-11-16.mjs            # apply
 *   bun run scripts/apply-review-counts-batch4-5-2026-11-16.mjs --dry-run  # checks only
 *   bun run scripts/apply-review-counts-batch4-5-2026-11-16.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BATCHES = [
  "/home/team/shared/curation/review-counts-batch4-2026-11-16.json",
  "/home/team/shared/curation/review-counts-batch5-2026-11-16.json",
];
const BACKUP = "/home/team/shared/curation/review-counts-batch4-5-backup-2026-11-16.json";
const CHECKED = "2026-11-16";
const BAR = 4.3;

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const name of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(name, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    } catch {
      /* next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
const day = (v) =>
  v ? (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10)) : null;
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  const res = await db`
    UPDATE products AS p
       SET is_active = v.is_active,
           rating = v.rating,
           review_count = v.review_count,
           price_checked_at = v.price_checked_at
      FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
           AS v(id int, is_active boolean, rating numeric, review_count int, price_checked_at date)
     WHERE p.id = v.id
    RETURNING p.id`;
  console.log(`Products restored: ${res.length}`);

  if (back.edit_items.length > 0) {
    const back2 = await db`
      INSERT INTO edit_items (edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at)
      SELECT edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at
        FROM jsonb_to_recordset(${JSON.stringify(back.edit_items)}::jsonb)
             AS t(edit_id int, product_id int, position int, display_title text, hook text, slug text, name text, raw_name boolean, price_override numeric, price_set_at timestamptz)
      RETURNING id`;
    console.log(`Edit items reinserted: ${back2.length}`);
  }

  if (back.snapshots.length > 0) {
    const back3 = await db`
      UPDATE edit_publications p
         SET snapshot = v.snapshot::jsonb
        FROM jsonb_to_recordset(${JSON.stringify(back.snapshots)}::jsonb)
             AS v(edit_id int, snapshot text)
       WHERE p.edit_id = v.edit_id
      RETURNING p.edit_id`;
    console.log(`Snapshots restored: ${back3.length}`);
  }

  console.log("\nRevert done.");
  process.exit(0);
}

/* ------------------------------------------------------------------ read */

const rows = [];
const flagRows = [];
for (const file of BATCHES) {
  const batch = JSON.parse(readFileSync(file, "utf8"));
  for (const r of batch.rows || []) rows.push({ ...r, batch: file.split("/").pop() });
  for (const f of batch.flags || []) flagRows.push({ ...f, batch: file.split("/").pop() });
}
if (rows.length !== 80) fail(`Expected 80 batch rows, read ${rows.length}.`);

const ids = [...new Set(rows.map((r) => Number(r.product_id)))];
if (new Set(rows.map((r) => Number(r.product_id))).size !== ids.length) {
  fail("The two batches name the same product twice.");
}

console.log(`Batches: ${BATCHES.length} files, ${rows.length} rows, ${ids.length} products\n`);

/* ---------------------------------------------------------------- checks */

const current = await db`SELECT id, name, room, rating, review_count, is_active, pin_rank,
                                price_checked_at, amazon_url
                           FROM products WHERE id = ANY(${ids}::int[]) ORDER BY id`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) fail(`Not in the catalog: ${missing.join(", ")}.`);

/* rows already parked are skipped untouched (lead: skip any parked row) */
const skipped = rows.filter((r) => byId.get(Number(r.product_id)).is_active !== true);
const applied = rows.filter((r) => byId.get(Number(r.product_id)).is_active === true);

const counted = applied.filter((r) => num(r.review_count_read) !== null);
const rated = counted.filter((r) => r.rating_match === false && num(r.rating_read) !== null);

for (const r of counted) {
  const row = byId.get(Number(r.product_id));
  if (num(row.review_count) !== null) {
    fail(`Product ${r.product_id} already carries review_count ${row.review_count}: the batch expected it empty.`);
  }
  if (num(row.rating) !== num(r.current_rating)) {
    fail(`Product ${r.product_id} stores rating ${row.rating}, batch says ${r.current_rating}: the row moved since the file was written.`);
  }
  if (r.rating_match === false && num(r.rating_read) === null) {
    fail(`Product ${r.product_id} is flagged as drifted but carries no live rating.`);
  }
}

/* decision 42: below the bar, no live buy box, or no readable listing at all.
   A no-buy-box read lives in the batch's flags list, not on the row status. */
const PARK_STATUSES = new Set(["below_gate", "no_buy_box", "buy_box_unclear", "listing_not_readable"]);
const parkReasons = new Map();
const note = (id, why) => {
  const row = byId.get(id);
  if (!row || row.is_active !== true) return;
  const prev = parkReasons.get(id) || { id, name: row.name, room: row.room, why: new Set() };
  for (const w of why) prev.why.add(w);
  parkReasons.set(id, prev);
};
for (const r of rows) {
  const why = [];
  if (PARK_STATUSES.has(r.status)) why.push(r.status);
  if (num(r.rating_read) !== null && num(r.rating_read) < BAR) why.push(`rating ${r.rating_read} below ${BAR}`);
  if (why.length) note(Number(r.product_id), why);
}
for (const f of flagRows) {
  if (PARK_STATUSES.has(f.status)) note(Number(f.product_id), [f.status]);
}
const parked = [...parkReasons.values()].map((p) => ({ ...p, why: [...p.why] })).sort((a, b) => a.id - b.id);

const blocked = [];
for (const p of parked) {
  const row = byId.get(p.id);
  if (num(row.pin_rank) !== null) blocked.push(`${p.id} is pinned (pin_rank ${row.pin_rank})`);
}
if (blocked.length) fail(`Refusing to park a pinned row:\n  ${blocked.join("\n  ")}`);

const parkIds = parked.map((p) => p.id);

console.log(`Rows skipped, already parked: ${skipped.length}${skipped.length ? ` (${skipped.map((r) => r.product_id).join(", ")})` : ""}`);
console.log(`Rows applied: ${applied.length}, carrying a count: ${counted.length}, rating corrected: ${rated.length}`);
console.log(`Decision 42 park list: ${parked.length} rows`);
for (const p of parked) console.log(`  ${p.id} (${p.room}): ${p.why.join("; ")}`);

/* static data files must not name a parked row */
const REF_FILES = [
  "../src/data/edits/manifest.json",
  "../src/data/holiday-sets.json",
  "../src/data/holiday-hidden-products.json",
];
if (parkIds.length > 0) {
  const idPattern = new RegExp(`(?:\\bid|productId|product_id)["']?\\s*[:=]\\s*(${parkIds.join("|")})\\b`);
  for (const rel of REF_FILES) {
    let text = "";
    try {
      text = readFileSync(new URL(rel, import.meta.url), "utf8");
    } catch {
      continue;
    }
    const hit = text.match(idPattern);
    if (hit) console.log(`NOTE - ${rel} still names product ${hit[1]}; the manifest is regenerated after the write.`);
  }
}

/* blog posts hardcode Amazon links, so they are matched on ASIN, never on id */
const asins = parked
  .map((p) => (String(byId.get(p.id).amazon_url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1])
  .filter(Boolean);
const blogDir = new URL("../src/routes/blog/", import.meta.url).pathname;
const blogHits = [];
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith(".tsx")) continue;
  const text = readFileSync(blogDir + file, "utf8");
  for (const asin of asins) if (text.includes(asin)) blogHits.push(`${file} -> ${asin}`);
}
if (blogHits.length) {
  console.log(`WARNING - a hardcoded blog card still names a parked row:`);
  for (const hit of blogHits) console.log(`  ${hit}`);
  console.log("  Left in place: taking the card out changes an owner-approved headline count.");
} else {
  console.log(`Blog posts: none of the ${asins.length} parked ASINs appear.`);
}

/* the draft edit lists that carry parked rows, and their published snapshots */
const items = parkIds.length
  ? await db`SELECT i.id, i.edit_id, i.product_id, i.position, i.display_title, i.hook,
                    i.slug, i.name, i.raw_name, i.price_override, i.price_set_at
               FROM edit_items i WHERE i.product_id = ANY(${parkIds}::int[]) ORDER BY i.edit_id, i.position`
  : [];
const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))].sort((a, b) => a - b);

const snapHits = parkIds.length
  ? await db.query(
      `SELECT p.edit_id, count(*)::int AS n
         FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
        WHERE (elem->>'id')::int = ANY($1::int[])
        GROUP BY p.edit_id ORDER BY p.edit_id`,
      [parkIds],
    )
  : [];
const snapshotEdits = snapHits.map((r) => Number(r.edit_id));
const snapshotCards = snapHits.reduce((a, r) => a + Number(r.n), 0);

console.log(`Draft items naming a parked row: ${items.length}${editsAffected.length ? ` (edits ${editsAffected.join(", ")})` : ""}`);
console.log(`Snapshot cards naming a parked row: ${snapshotCards}${snapshotEdits.length ? ` (edits ${snapshotEdits.join(", ")})` : ""}`);

if (DRY) {
  console.log("\nDry run: no write. Back-up would be written to " + BACKUP);
  for (const r of counted) {
    const moved = r.rating_match === false ? `, rating ${r.current_rating} -> ${r.rating_read}` : "";
    console.log(`  count ${r.product_id} ${String(r.name).slice(0, 40)}: ${r.review_count_read}${moved}`);
  }
  for (const p of parked) console.log(`  park  ${p.id} (${p.room}): ${p.why.join("; ")}`);
  console.log(
    `\nWould write ${counted.length} counts, correct ${rated.length} ratings dated ${CHECKED}, ` +
      `park ${parked.length} products, remove ${items.length} draft items and ${snapshotCards} snapshot cards.`,
  );
  process.exit(0);
}

/* ----------------------------------------------------------------- write */

const touched = [...new Set([...counted.map((r) => Number(r.product_id)), ...parkIds])];
const backup = {
  pass: "review counts batch 4 and 5, decision 42",
  written_at: new Date().toISOString(),
  products: touched.map((id) => {
    const row = byId.get(id);
    return {
      id,
      is_active: row.is_active,
      rating: num(row.rating),
      review_count: num(row.review_count),
      price_checked_at: day(row.price_checked_at),
    };
  }),
  edit_items: items.map((i) => ({
    edit_id: Number(i.edit_id),
    product_id: Number(i.product_id),
    position: Number(i.position),
    display_title: i.display_title,
    hook: i.hook,
    slug: i.slug,
    name: i.name,
    raw_name: i.raw_name,
    price_override: i.price_override,
    price_set_at: i.price_set_at ? new Date(i.price_set_at).toISOString() : null,
  })),
  snapshots: snapHits.length
    ? (
        await db.query(
          `SELECT edit_id, snapshot FROM edit_publications WHERE edit_id = ANY($1::int[]) ORDER BY edit_id`,
          [snapshotEdits],
        )
      ).map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) }))
    : [],
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* 1. counts and corrected ratings, one statement, guarded on the state the
      checks just read: the count must still be empty and the stored rating
      must still be the one the batch saw. */
const values = counted
  .map((r) => {
    const moved = r.rating_match === false && num(r.rating_read) !== null;
    return `(${Number(r.product_id)}, ${num(r.review_count_read)}, ${num(r.current_rating)}, ` +
      `${moved ? num(r.rating_read) : "NULL"}, ${moved ? `'${CHECKED}'` : "NULL"})`;
  })
  .join(", ");

const w1 = await db.query(
  `UPDATE products AS p
      SET review_count = v.rc,
          rating = COALESCE(v.new_rating, v.rating),
          price_checked_at = COALESCE(v.checked::date, p.price_checked_at)
     FROM (VALUES ${values}) AS v(id, rc, rating, new_rating, checked)
    WHERE p.id = v.id AND p.review_count IS NULL AND p.rating = v.rating
   RETURNING p.id`,
  [],
);
if (w1.length !== counted.length) fail(`Wrote ${w1.length} product rows, expected ${counted.length}.`);
console.log(`Counts written: ${w1.length}`);

/* 2. decision 42: the rows come off the public pages, never deleted */
if (parkIds.length > 0) {
  const w2 = await db`UPDATE products SET is_active = false
                       WHERE id = ANY(${parkIds}::int[]) AND is_active = true
                      RETURNING id`;
  if (w2.length !== parkIds.length) fail(`Parked ${w2.length} products, expected ${parkIds.length}.`);
  console.log(`Products parked: ${w2.length}`);

  const w3 = await db`DELETE FROM edit_items WHERE product_id = ANY(${parkIds}::int[]) RETURNING id`;
  if (w3.length !== items.length) fail(`Removed ${w3.length} draft items, expected ${items.length}.`);
  console.log(`Draft items removed: ${w3.length}`);

  if (snapshotEdits.length > 0) {
    const w4 = await db.query(
      `UPDATE edit_publications p
          SET snapshot = jsonb_set(p.snapshot, '{items}',
                (SELECT jsonb_agg(elem ORDER BY ord)
                   FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
                  WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
        WHERE p.edit_id = ANY($2::int[])
       RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
      [parkIds, snapshotEdits],
    );
    if (w4.length !== snapshotEdits.length) fail(`Rewrote ${w4.length} snapshots, expected ${snapshotEdits.length}.`);
    console.log(`Snapshots rewritten: ${w4.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);
  } else {
    console.log("Snapshots rewritten: 0 (no published snapshot named a parked row)");
  }
} else {
  console.log("Products parked: 0");
}

/* ------------------------------------------------------------- read-back */

const after = await db`SELECT id, rating, review_count, is_active, price_checked_at FROM products
                        WHERE id = ANY(${counted.map((r) => Number(r.product_id))}::int[]) ORDER BY id`;
const bad = after.filter((r) => {
  const want = counted.find((c) => Number(c.product_id) === Number(r.id));
  return num(r.review_count) !== num(want.review_count_read);
});
if (bad.length) fail(`Read-back mismatch on ${bad.map((r) => r.id).join(", ")}.`);
console.log(`\nRows now carrying their count: ${after.length - bad.length} of ${counted.length}`);
const dated = after.filter((r) => day(r.price_checked_at) === CHECKED).length;
console.log(`Rows re-dated ${CHECKED} (rating corrected): ${dated} of ${rated.length}`);

if (parkIds.length > 0) {
  const still = await db`SELECT count(*)::int AS n FROM products
                          WHERE id = ANY(${parkIds}::int[]) AND is_active = true`;
  console.log(`Parked rows still active: ${still[0].n} of ${parkIds.length}`);
  const leftItems = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ANY(${parkIds}::int[])`;
  console.log(`Draft items still naming a parked row: ${leftItems[0].n}`);
}

const stillNull = await db`SELECT count(*)::int AS n FROM products
                            WHERE is_active = true AND rating IS NOT NULL AND review_count IS NULL`;
console.log(`Active rated rows still without a count, sitewide: ${stillNull[0].n}`);
const belowBar = await db`SELECT count(*)::int AS n FROM products
                           WHERE is_active = true AND (rating IS NULL OR rating < ${BAR})`;
console.log(`Active rows below ${BAR} or unrated, sitewide: ${belowBar[0].n}`);
