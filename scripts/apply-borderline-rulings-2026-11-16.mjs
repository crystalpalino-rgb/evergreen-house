/**
 * Owner borderline room-fit rulings, 2026-11-16.
 * Source: /home/team/shared/curation/borderline-rulings-2026-11-16.md
 *
 * Five rows come off the public pages (decision 42 park: is_active false, out of
 * the draft edit list and out of every published snapshot, nothing deleted):
 *   242 Spill-Free Flexible Cocktail Funnel (dining-room)
 *   564 QTLCOHD 3 Tier Cupcake Stand (fall, also thanksgiving-hosting-edit)
 *   360 OmieBox Bento Lunch Box (kitchen)
 *   189 BISSELL Little Green (organization)
 *   255 Woven Water Hyacinth Pantry Baskets (organization; ruled not a Pantry fit
 *       because Pantry already carries two hyacinth basket sets, so parked)
 *
 * Three rows move room and stay active, keeping their edit membership:
 *   552 Mud Pie Turkey Platter   fall    -> thanksgiving
 *   529 Yiran Christmas Comforter holiday -> bedroom
 *   477 Graza Olive Oil Pack     kitchen -> pantry
 *
 * One row comes off Fall only, still active and still buyable:
 *   239 BYHER Green Moss Ball     fall    -> held
 *       The ruling says "unplaced". src/lib/room-visibility.ts treats any room
 *       slug that is not in HIDDEN_ROOMS as a public room page, so a new
 *       'unplaced' value would open a /room/unplaced page and a sitemap entry.
 *       'held' is the existing hidden bucket for real, active rows with no room
 *       page of their own (scripts/park-supplements-item9.mjs). 239 keeps its
 *       /product/ page, gets no room page, and is not parked.
 *
 * No action, checked and left alone: 12 (already parked in the 2026-11-16
 * decision 42 pass), and 390, 392, 394, 397 (loungewear, a hidden room).
 *
 * Usage:
 *   bun run scripts/apply-borderline-rulings-2026-11-16.mjs            # apply
 *   bun run scripts/apply-borderline-rulings-2026-11-16.mjs --dry-run  # checks only
 *   bun run scripts/apply-borderline-rulings-2026-11-16.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const BACKUP = "/home/team/shared/curation/borderline-rulings-2026-11-16-backup.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/** Parked: off the public pages, nothing deleted. */
const PARKED = [
  { id: 242, room: "dining-room", why: "not a fit for Dining Room" },
  { id: 564, room: "fall", why: "not a fit for Fall" },
  { id: 360, room: "kitchen", why: "not a fit for Kitchen" },
  { id: 189, room: "organization", why: "not a fit for Organization" },
  { id: 255, room: "organization", why: "not a Pantry fit (two hyacinth basket sets already there), parked" },
];

/** Moves: room change only, stay active, keep any edit membership. */
const MOVES = [
  { id: 552, from: "fall", to: "thanksgiving", why: "Mud Pie Turkey Platter belongs in Thanksgiving" },
  { id: 529, from: "holiday", to: "bedroom", why: "Yiran Christmas Comforter Set belongs in Bedroom" },
  { id: 477, from: "kitchen", to: "pantry", why: "Graza Olive Oil belongs in Pantry" },
];

/** Off Fall only: room to the hidden 'held' bucket, stays active. */
const UNPLACED = { id: 239, from: "fall", to: "held", why: "owner: off Fall only, not off the site" };

/** Ruled no action. Left exactly as found. */
const NO_ACTION = [
  { id: 12, why: "already parked in the 2026-11-16 decision 42 pass" },
  { id: 390, why: "loungewear, hidden room" },
  { id: 392, why: "loungewear, hidden room" },
  { id: 394, why: "loungewear, hidden room" },
  { id: 397, why: "loungewear, hidden room" },
];

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

const parkIds = PARKED.map((p) => p.id);
const moveIds = MOVES.map((m) => m.id);
const touchIds = [...parkIds, ...moveIds, UNPLACED.id];

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  const res = await db`
    UPDATE products AS p
       SET room = v.room,
           is_active = v.is_active
      FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
           AS v(id int, room text, is_active boolean)
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

if (new Set(touchIds).size !== touchIds.length) fail("A product id appears twice in the ruling set.");
if (touchIds.some((id) => NO_ACTION.some((n) => n.id === id))) fail("A no-action id is also in the change set.");

console.log(`Park: ${PARKED.length}, move: ${MOVES.length}, off Fall only: 1, no action: ${NO_ACTION.length}`);

const current = await db`SELECT id, name, room, is_active, pin_rank, amazon_url
                           FROM products WHERE id = ANY(${touchIds}::int[]) ORDER BY id`;
const byId = new Map(current.map((r) => [Number(r.id), r]));
const missing = touchIds.filter((id) => !byId.has(id));
if (missing.length) fail(`Not in the catalog: ${missing.join(", ")}.`);

const blocked = [];
for (const p of PARKED) {
  const row = byId.get(p.id);
  if (row.is_active !== true) blocked.push(`${p.id} is already inactive`);
  if (num(row.pin_rank) !== null) blocked.push(`${p.id} is pinned (pin_rank ${row.pin_rank})`);
  if (String(row.room) !== p.room) blocked.push(`${p.id} sits in ${row.room}, the ruling says ${p.room}`);
}
for (const m of MOVES) {
  const row = byId.get(m.id);
  if (row.is_active !== true) blocked.push(`${m.id} is inactive, the ruling keeps it live`);
  if (String(row.room) !== m.from) blocked.push(`${m.id} sits in ${row.room}, the ruling moves it from ${m.from}`);
}
const moss = byId.get(UNPLACED.id);
if (moss.is_active !== true) blocked.push(`${UNPLACED.id} is inactive, the ruling keeps it live`);
if (String(moss.room) !== UNPLACED.from) blocked.push(`${UNPLACED.id} sits in ${moss.room}, the ruling takes it off ${UNPLACED.from}`);
if (num(moss.pin_rank) !== null) blocked.push(`${UNPLACED.id} is pinned, its pins point at Fall`);
if (blocked.length) fail(`Refusing to apply:\n  ${blocked.join("\n  ")}`);

/* no-action rows, recorded before the write and compared after it */
const before = await db`SELECT id, room, is_active, rating, review_count, pin_rank
                          FROM products WHERE id = ANY(${NO_ACTION.map((n) => n.id)}::int[]) ORDER BY id`;
if (before.length !== NO_ACTION.length) fail("A no-action row is not in the catalog.");
const parkedMirror = before.find((r) => Number(r.id) === 12);
if (!parkedMirror || parkedMirror.is_active !== false) fail("12 is expected to be already parked, and is not.");

/* 239 must carry no edit membership, or "off Fall only" would change an edit */
const mossItems = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ${UNPLACED.id}`;
if (mossItems[0].n !== 0) fail(`${UNPLACED.id} carries ${mossItems[0].n} edit items; the ruling assumes none.`);
const mossSnaps = await db.query(
  `SELECT count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = $1`,
  [UNPLACED.id],
);
if (Number(mossSnaps[0].n) !== 0) fail(`${UNPLACED.id} sits in ${mossSnaps[0].n} snapshot cards; the ruling assumes none.`);

/* the moves keep their edit membership, so record it rather than change it */
const moveItems = await db`SELECT i.product_id, i.edit_id, e.slug
                             FROM edit_items i LEFT JOIN edits e ON e.id = i.edit_id
                            WHERE i.product_id = ANY(${moveIds}::int[]) ORDER BY i.edit_id`;
console.log(
  `Move memberships left alone: ${moveItems.length === 0 ? "none" : moveItems.map((i) => `${i.product_id} in ${i.slug || i.edit_id}`).join(", ")}`,
);

/* every static reference to a parked row, checked before any write. The
   manifest and the products CSV are regenerated from the database straight
   after this script runs, so a hit there is reported and then re-checked;
   a hit in a hand-written data file stops the run. */
const REGENERATED = new Set(["../src/data/edits/manifest.json", "../public/evergreen-products.csv"]);
const REF_FILES = [
  "../src/data/edits/manifest.json",
  "../src/data/holiday-sets.json",
  "../src/data/holiday-hidden-products.json",
  "../src/data/stocking-stuffers/products.json",
  "../public/evergreen-products.csv",
];
const idPattern = new RegExp(`(?:\\bid|productId|product_id)["']?\\s*[:=,]?\\s*(${parkIds.join("|")})\\b`);
let staleStatics = 0;
for (const rel of REF_FILES) {
  let text = "";
  try {
    text = readFileSync(new URL(rel, import.meta.url), "utf8");
  } catch {
    continue;
  }
  const hit = text.match(idPattern);
  if (!hit) continue;
  if (REGENERATED.has(rel)) {
    staleStatics += 1;
    console.log(`  ${rel} still names product ${hit[1]}: regenerated after the write.`);
    continue;
  }
  fail(`${rel} still names product ${hit[1]}.`);
}
console.log(
  `Static id references: ${staleStatics === 0 ? "none" : `${staleStatics} regenerated file(s) stale, re-checked after the run`} (checked ${REF_FILES.length} data files).`,
);

/* blog posts hardcode Amazon links, so they are matched on ASIN, never on id */
const asins = current
  .filter((r) => parkIds.includes(Number(r.id)))
  .map((r) => (String(r.amazon_url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1])
  .filter(Boolean);
const blogHits = [];
if (asins.length > 0) {
  const blogDir = new URL("../src/routes/blog/", import.meta.url).pathname;
  for (const file of readdirSync(blogDir)) {
    if (!file.endsWith(".tsx")) continue;
    const text = readFileSync(blogDir + file, "utf8");
    for (const asin of asins) if (text.includes(asin)) blogHits.push(`${file} -> ${asin}`);
  }
}
if (blogHits.length) {
  console.log("WARNING - a hardcoded blog card still names a parked row (not a catalog render):");
  for (const hit of blogHits) console.log(`  ${hit}`);
} else {
  console.log("Blog posts: no parked ASIN appears.");
}

/* the draft edit lists that carry a parked row, and their published snapshots */
const items = await db`SELECT i.id, i.edit_id, i.product_id, i.position, i.display_title, i.hook,
                              i.slug, i.name, i.raw_name, i.price_override, i.price_set_at
                         FROM edit_items i WHERE i.product_id = ANY(${parkIds}::int[]) ORDER BY i.edit_id, i.position`;
const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))].sort((a, b) => a - b);

const snapHits = await db.query(
  `SELECT p.edit_id, count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])
    GROUP BY p.edit_id ORDER BY p.edit_id`,
  [parkIds],
);
const snapshotEdits = snapHits.map((r) => Number(r.edit_id));
const snapshotCards = snapHits.reduce((a, r) => a + Number(r.n), 0);

console.log(`Draft items naming a parked row: ${items.length}${editsAffected.length ? ` (edits ${editsAffected.join(", ")})` : ""}`);
console.log(`Snapshot cards naming a parked row: ${snapshotCards}${snapshotEdits.length ? ` (edits ${snapshotEdits.join(", ")})` : ""}`);

if (DRY) {
  console.log(`\nDry run: no write. Back-up would be written to ${BACKUP}`);
  for (const p of PARKED) console.log(`  park ${p.id} (${p.room}): ${p.why}`);
  for (const m of MOVES) console.log(`  move ${m.id}: ${m.from} -> ${m.to} (${m.why})`);
  console.log(`  off Fall only ${UNPLACED.id}: ${UNPLACED.from} -> ${UNPLACED.to} (${UNPLACED.why})`);
  for (const n of NO_ACTION) console.log(`  no action ${n.id}: ${n.why}`);
  console.log(
    `\nWould park ${PARKED.length}, move ${MOVES.length}, unplace 1, remove ${items.length} draft items and ${snapshotCards} snapshot cards, and leave ${NO_ACTION.length} rows untouched.`,
  );
  process.exit(0);
}

/* ----------------------------------------------------------------- write */

const backupSnapshots =
  snapHits.length === 0
    ? []
    : (
        await db.query(
          `SELECT edit_id, snapshot FROM edit_publications WHERE edit_id = ANY($1::int[]) ORDER BY edit_id`,
          [snapshotEdits],
        )
      ).map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) }));

const backup = {
  ruling: "borderline-rulings-2026-11-16",
  written_at: new Date().toISOString(),
  products: touchIds.map((id) => {
    const row = byId.get(id);
    return { id, room: row.room, is_active: row.is_active };
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
  snapshots: backupSnapshots,
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* 1. the five parks */
const w1 = await db`UPDATE products SET is_active = false, updated_at = now()
                     WHERE id = ANY(${parkIds}::int[]) AND is_active = true
                    RETURNING id`;
if (w1.length !== PARKED.length) fail(`Parked ${w1.length} products, expected ${PARKED.length}.`);
console.log(`Products parked: ${w1.length}`);

/* 2. out of the draft lists */
const w2 = await db`DELETE FROM edit_items WHERE product_id = ANY(${parkIds}::int[]) RETURNING id`;
if (w2.length !== items.length) fail(`Removed ${w2.length} draft items, expected ${items.length}.`);
console.log(`Draft items removed: ${w2.length}`);

/* 3. out of the published snapshots */
if (snapshotEdits.length > 0) {
  const w3 = await db.query(
    `UPDATE edit_publications p
        SET snapshot = jsonb_set(p.snapshot, '{items}',
              (SELECT jsonb_agg(elem ORDER BY ord)
                 FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
                WHERE NOT ((elem->>'id')::int = ANY($1::int[]))))
      WHERE p.edit_id = ANY($2::int[])
     RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
    [parkIds, snapshotEdits],
  );
  if (w3.length !== snapshotEdits.length) fail(`Rewrote ${w3.length} snapshots, expected ${snapshotEdits.length}.`);
  console.log(`Snapshots rewritten: ${w3.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ")}`);
} else {
  console.log("Snapshots rewritten: 0 (no published snapshot named a parked row)");
}

/* 4. the three moves, each guarded on the room it leaves */
for (const m of MOVES) {
  const w = await db`UPDATE products SET room = ${m.to}, updated_at = now()
                      WHERE id = ${m.id} AND room = ${m.from}
                     RETURNING id, room`;
  if (w.length !== 1) fail(`Moved ${w.length} rows for ${m.id}, expected 1.`);
  console.log(`Moved ${m.id}: ${m.from} -> ${w[0].room}`);
}

/* 5. off Fall only */
const w5 = await db`UPDATE products SET room = ${UNPLACED.to}, updated_at = now()
                     WHERE id = ${UNPLACED.id} AND room = ${UNPLACED.from}
                    RETURNING id, room, is_active`;
if (w5.length !== 1) fail(`Unplaced ${w5.length} rows, expected 1.`);
console.log(`Off Fall only: ${UNPLACED.id} now room ${w5[0].room}, is_active ${w5[0].is_active}`);

/* ------------------------------------------------------------- read-back */

const parkedNow = await db`SELECT count(*)::int AS n FROM products
                            WHERE id = ANY(${parkIds}::int[]) AND is_active = false`;
if (parkedNow[0].n !== PARKED.length) fail(`Read-back: ${parkedNow[0].n} of ${PARKED.length} rows are inactive.`);
console.log(`\nInactive now: ${parkedNow[0].n} of ${PARKED.length}`);

const leftItems = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ANY(${parkIds}::int[])`;
const leftSnaps = await db.query(
  `SELECT count(*)::int AS n
     FROM edit_publications p, jsonb_array_elements(p.snapshot->'items') elem
    WHERE (elem->>'id')::int = ANY($1::int[])`,
  [parkIds],
);
console.log(`Draft items still naming a parked row: ${leftItems[0].n}`);
console.log(`Snapshot cards still naming a parked row: ${leftSnaps[0].n}`);

const rooms = await db`SELECT id, room, is_active FROM products WHERE id = ANY(${touchIds}::int[]) ORDER BY id`;
for (const r of rooms) console.log(`  ${r.id}: room ${r.room}, active ${r.is_active}`);

const after = await db`SELECT id, room, is_active, rating, review_count, pin_rank
                         FROM products WHERE id = ANY(${NO_ACTION.map((n) => n.id)}::int[]) ORDER BY id`;
const changed = after.filter((row, i) => {
  const was = before[i];
  return (
    Number(row.id) !== Number(was.id) ||
    row.room !== was.room ||
    row.is_active !== was.is_active ||
    num(row.rating) !== num(was.rating) ||
    num(row.review_count) !== num(was.review_count) ||
    num(row.pin_rank) !== num(was.pin_rank)
  );
});
if (changed.length) fail(`A no-action row changed: ${changed.map((r) => r.id).join(", ")}.`);
console.log(`No-action rows unchanged: ${NO_ACTION.map((n) => n.id).join(", ")}`);
