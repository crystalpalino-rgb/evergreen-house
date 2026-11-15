/**
 * Owner decision 42 (2026-11-15): park every active row that fails our own bar.
 *
 * A row comes off the public pages when it sits below 4.3 stars, carries no
 * live buy box, or links to a dead listing. Parked, never deleted: is_active
 * goes false, the row leaves its draft edit list and every published
 * collection snapshot, and nothing else about it changes. Pinned rows
 * (pin_rank) are the only exception and are refused here by name.
 *
 * Sources:
 *   /home/team/shared/curation/decision42-gate-scan-2026-11-15.md
 *     the 44 rows under "Comes off the public pages"
 *   /home/team/shared/curation/review-counts-batch3-2026-11-15.json
 *     three more the scan could not see: 244 dead 404, 59 and 310 no buy box
 *     (310 also reads 4.1 today). The other four batch 3 rows under 4.3
 *     (54, 57, 60, 61) are already in the scan list.
 *
 * The hidden-room rows (377, 362, 394, 386, 395, 402, 403) are left alone: no
 * public page renders them, so there is nothing to park.
 *
 * Why the edit lists are touched: edit pages render the published snapshot by
 * product id and never filter is_active (src/lib/edits.ts getCuratedProducts),
 * so is_active alone would leave those cards on the pages. The product row is
 * parked as well, which is what takes it off the rooms, /collection/holiday,
 * /search, the sitemaps, the feed and the product pages.
 *
 * Usage:
 *   bun run scripts/park-decision42-2026-11-15.mjs            # apply
 *   bun run scripts/park-decision42-2026-11-15.mjs --dry-run  # checks only
 *   bun run scripts/park-decision42-2026-11-15.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BACKUP = "/home/team/shared/curation/decision42-park-backup-2026-11-15.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/**
 * The 47 rows decision 42 parks, and why each one fails. 44 from the gate
 * scan, 3 from the batch 3 live read.
 */
const PARKED = [
  /* gate scan: bathroom */
  { id: 66, reason: "stored rating 3.9 below the 4.3 bar" },
  { id: 359, reason: "stored rating 4.0 below the 4.3 bar" },
  /* bedroom */
  { id: 4, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 16, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 42, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 89, reason: "stored rating 4.2 below the 4.3 bar" },
  /* dining room */
  { id: 503, reason: "stored rating 3.1 below the 4.3 bar" },
  { id: 500, reason: "stored rating 4.1 below the 4.3 bar" },
  { id: 501, reason: "stored rating 4.1 below the 4.3 bar" },
  /* entryway */
  { id: 57, reason: "stored rating 3.8, live read 4.1, both below the 4.3 bar" },
  { id: 418, reason: "stored rating 4.2 below the 4.3 bar" },
  /* fall */
  { id: 412, reason: "stored rating 2.9 below the 4.3 bar" },
  { id: 241, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 341, reason: "stored rating 4.2 below the 4.3 bar" },
  /* holiday */
  { id: 87, reason: "stored rating 3.6 below the 4.3 bar" },
  { id: 115, reason: "stored rating 3.9 below the 4.3 bar" },
  { id: 73, reason: "stored rating 4.0 below the 4.3 bar" },
  { id: 525, reason: "stored rating 4.1 below the 4.3 bar" },
  { id: 526, reason: "stored rating 4.1 below the 4.3 bar" },
  { id: 434, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 514, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 519, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 541, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 549, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 437, reason: "no rating and no review count listed, so it cannot clear the 4.3 bar" },
  /* kitchen */
  { id: 378, reason: "stored rating 3.9 below the 4.3 bar" },
  { id: 381, reason: "stored rating 3.9 below the 4.3 bar" },
  { id: 371, reason: "stored rating 4.0 below the 4.3 bar" },
  { id: 15, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 382, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 462, reason: "stored rating 4.2 below the 4.3 bar" },
  /* living room */
  { id: 502, reason: "stored rating 3.7 below the 4.3 bar" },
  { id: 29, reason: "stored rating 4.0 below the 4.3 bar" },
  { id: 498, reason: "stored rating 4.1 below the 4.3 bar" },
  { id: 499, reason: "stored rating 4.1 below the 4.3 bar" },
  { id: 54, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 60, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 61, reason: "stored rating 4.2 below the 4.3 bar" },
  { id: 486, reason: "stored rating 4.2 below the 4.3 bar" },
  /* office */
  { id: 469, reason: "stored rating 3.0 below the 4.3 bar" },
  { id: 464, reason: "stored rating 3.6 below the 4.3 bar" },
  /* spring */
  { id: 188, reason: "stored rating 1.0 below the 4.3 bar" },
  { id: 229, reason: "stored rating 4.2 below the 4.3 bar" },
  /* summer */
  { id: 220, reason: "stored rating 4.2 below the 4.3 bar" },
  /* batch 3 live read, not visible to the gate scan */
  { id: 59, reason: "no live buy box (out of stock) in the 2026-11-15 read" },
  { id: 310, reason: "live rating 4.1 below the 4.3 bar and no buy box in the 2026-11-15 read" },
  { id: 244, reason: "Amazon answers 404 for the ASIN: dead listing, no rating and no buy box" },
];

/** Rows already sitting in hidden rooms. No public page shows them. */
const HIDDEN = [377, 362, 394, 386, 395, 402, 403];

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
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  if (back.products.length > 0) {
    const res = await db`
      UPDATE products AS p
         SET is_active = v.is_active
        FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
             AS v(id int, is_active boolean)
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

const ids = PARKED.map((p) => p.id);
if (new Set(ids).size !== ids.length) fail("The park list names the same product twice.");
if (ids.some((id) => HIDDEN.includes(id))) fail("A hidden-room row is on the park list: those are left alone.");

console.log(`Park list: ${ids.length} rows`);
for (const p of PARKED) console.log(`  ${p.id}: ${p.reason}`);

const current = await db`SELECT id, name, room, rating, review_count, is_active, pin_rank, price_checked_at
                           FROM products WHERE id = ANY(${ids}::int[]) ORDER BY id`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !byId.has(id));
if (missing.length) fail(`Not in the catalog: ${missing.join(", ")}.`);

const already = [];
for (const p of PARKED) {
  const row = byId.get(p.id);
  if (row.is_active !== true) already.push(`${p.id} is already inactive`);
  if (num(row.pin_rank) !== null) already.push(`${p.id} is pinned (pin_rank ${row.pin_rank})`);
}
if (already.length) fail(`Refusing to park:\n  ${already.join("\n  ")}`);

/* the draft edit lists that carry parked rows, and their published snapshots */
const items = await db`SELECT i.id, i.edit_id, i.product_id, i.position, i.display_title, i.hook,
                              i.slug, i.name, i.raw_name, i.price_override, i.price_set_at
                         FROM edit_items i WHERE i.product_id = ANY(${ids}::int[]) ORDER BY i.edit_id, i.position`;
const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))].sort((a, b) => a - b);

const pubs = await db`SELECT edit_id, snapshot FROM edit_publications
                       WHERE edit_id = ANY(${editsAffected}::int[]) ORDER BY edit_id`;
if (pubs.length !== editsAffected.length) {
  fail(`Expected ${editsAffected.length} published snapshots, read ${pubs.length}.`);
}

const snapshotHits = [];
for (const pub of pubs) {
  const hitIds = (pub.snapshot.items || [])
    .map((it) => Number(it.id))
    .filter((id) => ids.includes(id));
  snapshotHits.push({ edit_id: Number(pub.edit_id), n: hitIds.length, ids: hitIds });
  if (hitIds.length === 0) fail(`Edit ${pub.edit_id} is published but holds none of the parked rows: the lists moved.`);
}

console.log(`\nDraft items to remove: ${items.length} across edits ${editsAffected.join(", ")}`);
console.log(`Snapshot cards to remove: ${snapshotHits.map((s) => `${s.edit_id}: ${s.n}`).join(", ")}`);

if (DRY) {
  console.log("\nDry run: no write. Back-up would be written to " + BACKUP);
  for (const p of PARKED) {
    const row = byId.get(p.id);
    console.log(`  park ${p.id} (${row.room}, rating ${row.rating ?? "none"}, reviews ${row.review_count ?? "none"}): ${p.reason}`);
  }
  console.log(`\nWould park ${PARKED.length} products, remove ${items.length} draft items and ${snapshotHits.reduce((a, s) => a + s.n, 0)} snapshot cards.`);
  process.exit(0);
}

/* ----------------------------------------------------------------- write */

const backup = {
  decision: 42,
  written_at: new Date().toISOString(),
  products: PARKED.map((p) => ({ id: p.id, is_active: byId.get(p.id).is_active })),
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
  snapshots: pubs.map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) })),
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* 1. the product rows */
const w1 = await db`UPDATE products SET is_active = false
                     WHERE id = ANY(${ids}::int[]) AND is_active = true
                    RETURNING id`;
if (w1.length !== PARKED.length) fail(`Parked ${w1.length} products, expected ${PARKED.length}.`);
console.log(`Products parked: ${w1.length}`);

/* 2. out of the draft lists */
const w2 = await db`DELETE FROM edit_items WHERE product_id = ANY(${ids}::int[])
                    RETURNING id, edit_id, product_id`;
if (w2.length !== items.length) fail(`Removed ${w2.length} draft items, expected ${items.length}.`);
console.log(`Draft items removed: ${w2.length}`);

/* 3. out of the published snapshots, one statement for every affected edit */
const w3 = await db.query(
  `UPDATE edit_publications p
      SET snapshot = jsonb_set(p.snapshot, '{items}',
            (SELECT jsonb_agg(elem ORDER BY ord)
               FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
              WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
    WHERE p.edit_id = ANY($2::int[])
   RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
  [ids, editsAffected],
);
if (w3.length !== editsAffected.length) fail(`Rewrote ${w3.length} snapshots, expected ${editsAffected.length}.`);
console.log(`Snapshots rewritten: ${w3.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);

/* 4. positions back to a clean 1..n on the edits we touched */
const w4 = await db.query(
  `UPDATE edit_items i SET position = s.np
     FROM (SELECT id, row_number() OVER (PARTITION BY edit_id ORDER BY position, id) AS np
             FROM edit_items WHERE edit_id = ANY($1::int[])) s
    WHERE i.id = s.id AND i.position IS DISTINCT FROM s.np
   RETURNING i.id`,
  [editsAffected],
);
console.log(`Positions renumbered: ${w4.length}`);

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
console.log(`Snapshot cards still naming a parked row: ${leftSnaps.length === 0 ? 0 : leftSnaps.map((r) => `${r.edit_id}: ${r.n}`).join(", ")}`);

const activeLow = await db`SELECT count(*)::int AS n FROM products
                            WHERE is_active = true AND pin_rank IS NULL AND (rating IS NULL OR rating < 4.3)`;
console.log(`Active unpinned rows still below 4.3 sitewide: ${activeLow[0].n}`);
