/**
 * Owner decision 42 (2026-11-15), second pass 2026-11-16: five more rows off
 * the public pages.
 *
 * Live reads on 2026-11-16:
 *   495 Sweet Water Decor Cozy Season candle (fall) now reads 4.1 from 528
 *       reviews against a stored 4.3 from 140. Below the 4.3 bar.
 *   370 Water Hyacinth Pantry Baskets (pantry), 13 Wooden Lazy Susan (kitchen),
 *       175 Silicone Toothbrush Holders (bathroom), 12 Gold Round Wall Mirror
 *       (living-room): every one shows the out-of-stock block with no add to
 *       cart, so no live buy box.
 *
 * Parked, never deleted: is_active goes false, the row leaves its draft edit
 * list and every published collection snapshot, and 495's stored rating and
 * review count are corrected to the live read and dated 2026-11-16. Pinned
 * rows (pin_rank) are the only exception to decision 42 and are refused here.
 *
 * Usage:
 *   bun run scripts/park-decision42-2026-11-16.mjs            # apply
 *   bun run scripts/park-decision42-2026-11-16.mjs --dry-run  # checks only
 *   bun run scripts/park-decision42-2026-11-16.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BACKUP = "/home/team/shared/curation/decision42-park-2026-11-16-backup.json";
const CHECKED = "2026-11-16";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/** The five rows this pass parks, and why each one fails. */
const PARKED = [
  { id: 495, reason: "live rating 4.1 from 528 reviews on 2026-11-16, below the 4.3 bar" },
  { id: 370, reason: "no live buy box (out of stock) in the 2026-11-16 read" },
  { id: 13, reason: "no live buy box (out of stock) in the 2026-11-16 read" },
  { id: 175, reason: "no live buy box (out of stock) in the 2026-11-16 read" },
  { id: 12, reason: "no live buy box (out of stock) in the 2026-11-16 read" },
];

/** The stored numbers 495 carries today, and the live read that replaces them. */
const RATING_FIX = {
  id: 495,
  from: { rating: 4.3, review_count: 140 },
  to: { rating: 4.1, review_count: 528, checked: CHECKED },
};

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
const day = (v) => (v ? String(v).slice(0, 10) : null);
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

/* ---------------------------------------------------------------- checks */

const ids = PARKED.map((p) => p.id);
if (new Set(ids).size !== ids.length) fail("The park list names the same product twice.");
if (!ids.includes(RATING_FIX.id)) fail("The rating fix names a row that is not being parked.");

console.log(`Park list: ${ids.length} rows`);
for (const p of PARKED) console.log(`  ${p.id}: ${p.reason}`);

const current = await db`SELECT id, name, room, rating, review_count, is_active, pin_rank, price_checked_at, amazon_url
                           FROM products WHERE id = ANY(${ids}::int[]) ORDER BY id`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) fail(`Not in the catalog: ${missing.join(", ")}.`);

const blocked = [];
for (const p of PARKED) {
  const row = byId.get(p.id);
  if (row.is_active !== true) blocked.push(`${p.id} is already inactive`);
  if (num(row.pin_rank) !== null) blocked.push(`${p.id} is pinned (pin_rank ${row.pin_rank})`);
}
if (blocked.length) fail(`Refusing to park:\n  ${blocked.join("\n  ")}`);

const candle = byId.get(RATING_FIX.id);
if (
  num(candle.rating) !== RATING_FIX.from.rating ||
  num(candle.review_count) !== RATING_FIX.from.review_count
) {
  fail(
    `${RATING_FIX.id} stores rating ${candle.rating} from ${candle.review_count} reviews, ` +
      `not the expected ${RATING_FIX.from.rating} from ${RATING_FIX.from.review_count}: the row moved.`,
  );
}

/* every static reference, checked before any write */
const REF_FILES = [
  "../src/data/edits/manifest.json",
  "../src/data/holiday-sets.json",
  "../src/data/holiday-hidden-products.json",
];
const idPattern = new RegExp(`(?:\\bid|productId|product_id)["']?\\s*[:=]\\s*(${ids.join("|")})\\b`);
for (const rel of REF_FILES) {
  let text = "";
  try {
    text = readFileSync(new URL(rel, import.meta.url), "utf8");
  } catch {
    continue;
  }
  const hit = text.match(idPattern);
  if (hit) fail(`${rel} still names product ${hit[1]}.`);
}
console.log(`Static id references: none (checked ${REF_FILES.length} data files).`);

/* blog posts hardcode Amazon links, so they are matched on ASIN, never on id */
const asins = current
  .map((r) => (String(r.amazon_url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1])
  .filter(Boolean);
const blogDir = new URL("../src/routes/blog/", import.meta.url).pathname;
const blogHits = [];
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith(".tsx")) continue;
  const text = readFileSync(blogDir + file, "utf8");
  for (const asin of asins) if (text.includes(asin)) blogHits.push(`${file} -> ${asin}`);
}
if (blogHits.length) {
  console.log(`WARNING - a hardcoded blog card still names a parked row (not a catalog render):`);
  for (const hit of blogHits) console.log(`  ${hit}`);
  console.log("  Left in place: taking the card out changes an owner-approved headline count.");
} else {
  console.log(`Blog posts: none of the ${asins.length} ASINs appear.`);
}

/* the draft edit lists that carry these rows, and their published snapshots */
const items = await db`SELECT i.id, i.edit_id, i.product_id, i.position, i.display_title, i.hook,
                              i.slug, i.name, i.raw_name, i.price_override, i.price_set_at
                         FROM edit_items i WHERE i.product_id = ANY(${ids}::int[]) ORDER BY i.edit_id, i.position`;
const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))].sort((a, b) => a - b);

const snapHits = await db.query(
  `SELECT p.edit_id, count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])
    GROUP BY p.edit_id ORDER BY p.edit_id`,
  [ids],
);
const snapshotEdits = snapHits.map((r) => Number(r.edit_id));
const snapshotCards = snapHits.reduce((a, r) => a + Number(r.n), 0);

console.log(`Draft items naming a parked row: ${items.length}${editsAffected.length ? ` (edits ${editsAffected.join(", ")})` : ""}`);
console.log(`Snapshot cards naming a parked row: ${snapshotCards}${snapshotEdits.length ? ` (edits ${snapshotEdits.join(", ")})` : ""}`);

if (DRY) {
  console.log("\nDry run: no write. Back-up would be written to " + BACKUP);
  for (const p of PARKED) {
    const row = byId.get(p.id);
    console.log(`  park ${p.id} (${row.room}, rating ${row.rating ?? "none"}, reviews ${row.review_count ?? "none"}): ${p.reason}`);
  }
  console.log(
    `  set ${RATING_FIX.id} rating ${RATING_FIX.from.rating} -> ${RATING_FIX.to.rating}, ` +
      `reviews ${RATING_FIX.from.review_count} -> ${RATING_FIX.to.review_count}, dated ${CHECKED}`,
  );
  console.log(
    `\nWould park ${PARKED.length} products, correct 1 rating, remove ${items.length} draft items and ${snapshotCards} snapshot cards.`,
  );
  process.exit(0);
}

/* ----------------------------------------------------------------- write */

const backup = {
  decision: 42,
  pass: "2026-11-16",
  written_at: new Date().toISOString(),
  products: PARKED.map((p) => {
    const row = byId.get(p.id);
    return {
      id: p.id,
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

/* 1. the live numbers on 495, dated to the read */
const w1 = await db`
  UPDATE products SET rating = ${RATING_FIX.to.rating},
                      review_count = ${RATING_FIX.to.review_count},
                      price_checked_at = ${CHECKED}::date
   WHERE id = ${RATING_FIX.id}
     AND rating = ${RATING_FIX.from.rating}
     AND review_count = ${RATING_FIX.from.review_count}
  RETURNING id, rating, review_count, price_checked_at`;
if (w1.length !== 1) fail(`Corrected ${w1.length} ratings, expected 1.`);
console.log(
  `Rating corrected: ${w1[0].id} now ${w1[0].rating} from ${w1[0].review_count} reviews, dated ${day(w1[0].price_checked_at)}`,
);

/* 2. the product rows */
const w2 = await db`UPDATE products SET is_active = false
                     WHERE id = ANY(${ids}::int[]) AND is_active = true
                    RETURNING id`;
if (w2.length !== PARKED.length) fail(`Parked ${w2.length} products, expected ${PARKED.length}.`);
console.log(`Products parked: ${w2.length}`);

/* 3. out of the draft lists */
const w3 = await db`DELETE FROM edit_items WHERE product_id = ANY(${ids}::int[])
                    RETURNING id`;
if (w3.length !== items.length) fail(`Removed ${w3.length} draft items, expected ${items.length}.`);
console.log(`Draft items removed: ${w3.length}`);

/* 4. out of the published snapshots, one statement for every affected edit */
if (snapshotEdits.length > 0) {
  const w4 = await db.query(
    `UPDATE edit_publications p
        SET snapshot = jsonb_set(p.snapshot, '{items}',
              (SELECT jsonb_agg(elem ORDER BY ord)
                 FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
                WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
      WHERE p.edit_id = ANY($2::int[])
     RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
    [ids, snapshotEdits],
  );
  if (w4.length !== snapshotEdits.length) fail(`Rewrote ${w4.length} snapshots, expected ${snapshotEdits.length}.`);
  console.log(`Snapshots rewritten: ${w4.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);
} else {
  console.log("Snapshots rewritten: 0 (no published snapshot named a parked row)");
}

/* ------------------------------------------------------------- read-back */

const parked = await db`SELECT count(*)::int AS n FROM products
                         WHERE id = ANY(${ids}::int[]) AND is_active = false`;
if (parked[0].n !== PARKED.length) fail(`Read-back: ${parked[0].n} of ${PARKED.length} rows are inactive.`);
console.log(`\nInactive now: ${parked[0].n} of ${PARKED.length}`);

const leftItems = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ANY(${ids}::int[])`;
console.log(`Draft items still naming a parked row: ${leftItems[0].n}`);

const leftSnaps = await db.query(
  `SELECT p.edit_id, count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])
    GROUP BY p.edit_id ORDER BY p.edit_id`,
  [ids],
);
console.log(
  `Snapshot cards still naming a parked row: ${leftSnaps.length === 0 ? 0 : leftSnaps.map((r) => `${r.edit_id}: ${r.n}`).join(", ")}`,
);

const after = await db`SELECT id, rating, review_count, price_checked_at FROM products WHERE id = ${RATING_FIX.id}`;
console.log(
  `495 stored: rating ${after[0].rating}, reviews ${after[0].review_count}, dated ${day(after[0].price_checked_at)}`,
);

const activeLow = await db`SELECT count(*)::int AS n FROM products
                            WHERE is_active = true AND pin_rank IS NULL AND (rating IS NULL OR rating < 4.3)`;
console.log(`Active unpinned rows still below 4.3 sitewide: ${activeLow[0].n}`);
