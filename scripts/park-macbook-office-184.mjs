/**
 * Owner decision 43 / Site Standard rule 10, 2026-11-15.
 *
 * Product 184, "Apple 2025 MacBook Air 15", sits in room "office" on 4.8 stars
 * and a live buy box. It passes every numeric gate and still does not belong:
 * a laptop is not a home decor product, so it comes off /room/office and off
 * every other surface the catalog feeds. Nothing is deleted.
 *
 * The park is the same shape as the decision 42 pass:
 *
 * 1. products.is_active = false. That is what takes it off /room/office, the
 *    room and collection grids, /search, the sitemaps, the merchant feed and
 *    the product page itself (every public read filters is_active = true).
 * 2. Out of edit_items, so it cannot reappear on an Edit page draft.
 * 3. Out of every published snapshot that carries it, so a live Edit page
 *    loses the card too (the snapshot renders by product id and never filters
 *    is_active).
 * 4. Positions on any edit touched are renumbered back to a clean 1..n.
 *
 * At the time of writing the row is on no edit list and in no published
 * snapshot and no collections row names it; the script still checks all three
 * and would clean them if the row had moved, and it refuses rather than
 * guessing if the lists disagree with each other.
 *
 * Usage:
 *   node scripts/park-macbook-office-184.mjs            # apply
 *   node scripts/park-macbook-office-184.mjs --dry-run  # checks only
 *   node scripts/park-macbook-office-184.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 *
 * The generated statics (sitemaps, merchant feed, products csv) read
 * is_active = true, so after an apply or a revert regenerate them:
 *   bun run scripts/generate-sitemaps.ts
 *   bun run scripts/generate-merchant-feed.ts
 *   node scripts/generate-products-csv.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const PRODUCT_ID = 184;
const BACKUP = "/home/team/shared/curation/park-macbook-office-184-backup-2026-11-15.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const file of ["../.env", "../.env.local"]) {
    try {
      const raw = readFileSync(new URL(file, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) {
        return line
          .slice(line.indexOf("=") + 1)
          .trim()
          .replace(/^["']|["']$/g, "")
          .replace(/[?&]channel_binding=require/, "");
      }
    } catch {
      /* try the next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env(.local) has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

const snapshotHasProduct = (snapshot) =>
  (snapshot.items || []).some((i) => Number(i.id) === PRODUCT_ID);

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  const restored = await db`
    UPDATE products AS p
       SET is_active = v.is_active, room = v.room
      FROM jsonb_to_recordset(${JSON.stringify(back.product)}::jsonb)
           AS v(id int, is_active boolean, room text)
     WHERE p.id = v.id
    RETURNING p.id, p.is_active, p.room`;
  console.log(`Product restored: ${restored.map((r) => `${r.id} active=${r.is_active} room=${r.room}`).join(", ")}`);

  if (back.edit_items.length > 0) {
    const res = await db`
      INSERT INTO edit_items (edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at)
      SELECT edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at
        FROM jsonb_to_recordset(${JSON.stringify(back.edit_items)}::jsonb)
             AS t(edit_id int, product_id int, position int, display_title text, hook text, slug text, name text, raw_name boolean, price_override numeric, price_set_at timestamptz)
      RETURNING id`;
    console.log(`Edit items reinserted: ${res.length}`);
  }

  for (const snap of back.snapshots) {
    const res = await db`
      UPDATE edit_publications p SET snapshot = ${snap.snapshot}::jsonb
       WHERE p.edit_id = ${snap.edit_id}
      RETURNING p.edit_id`;
    console.log(`Snapshot restored: ${res.map((r) => r.edit_id).join(", ")}`);
  }

  console.log("\nRevert done. Regenerate the statics so the row returns to them.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

const rows = await db`SELECT id, name, room, is_active, pin_rank FROM products WHERE id = ${PRODUCT_ID}`;
if (rows.length !== 1) fail(`Product ${PRODUCT_ID} is not in the catalog.`);
const product = rows[0];

if (product.is_active !== true) fail(`Product ${PRODUCT_ID} is already inactive.`);
if (product.pin_rank !== null && product.pin_rank !== undefined) {
  fail(`Product ${PRODUCT_ID} is in the Pinterest rotation (pin_rank ${product.pin_rank}): not parkable.`);
}
if (product.room !== "office") {
  console.log(`Note: product ${PRODUCT_ID} now sits in room "${product.room}", not "office". Parking anyway.`);
}

const items = await db`
  SELECT edit_id, product_id, position, display_title, hook, slug, name, raw_name, price_override, price_set_at
    FROM edit_items WHERE product_id = ${PRODUCT_ID} ORDER BY edit_id`;

const editsAffected = [...new Set(items.map((i) => Number(i.edit_id)))];
const pubs =
  editsAffected.length === 0
    ? []
    : await db`SELECT p.edit_id, e.slug, p.snapshot FROM edit_publications p
                 JOIN edits e ON e.id = p.edit_id
                WHERE p.edit_id = ANY(${editsAffected}::int[]) ORDER BY p.edit_id`;
if (pubs.length !== editsAffected.length) {
  fail(`Expected ${editsAffected.length} published snapshots, read ${pubs.length}.`);
}

/* every edit that carries the row must carry it in its published snapshot too */
for (const editId of editsAffected) {
  const pub = pubs.find((p) => Number(p.edit_id) === editId);
  if (!snapshotHasProduct(pub.snapshot)) {
    fail(`Edit ${editId} has a draft item for ${PRODUCT_ID} but its snapshot does not: the lists are out of step.`);
  }
}

/* snapshots that carry the row without a draft item: still has to come off */
const extraPubs = await db`
  SELECT p.edit_id, p.snapshot FROM edit_publications p
   WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(p.snapshot->'items') x
                  WHERE (x->>'id')::int = ${PRODUCT_ID})
   ORDER BY p.edit_id`;
const snapshotsAffected = [...new Set([...pubs, ...extraPubs].map((p) => Number(p.edit_id)))];
const snapshotRows = [...pubs, ...extraPubs].filter(
  (p, i, all) => all.findIndex((q) => Number(q.edit_id) === Number(p.edit_id)) === i,
);

const collectionsWithIds = await db`SELECT slug, product_ids FROM collections WHERE product_ids IS NOT NULL`;
const inCollections = collectionsWithIds.filter((c) =>
  (Array.isArray(c.product_ids) ? c.product_ids.map(Number) : []).includes(PRODUCT_ID),
);
if (inCollections.length > 0) {
  fail(`Collections name product ${PRODUCT_ID}: ${inCollections.map((c) => c.slug).join(", ")}. Clear those first.`);
}

console.log(`Product: ${product.id} ${product.name} | room ${product.room} | active ${product.is_active}`);
console.log(`Draft edit items: ${items.length}`);
console.log(`Published snapshots carrying it: ${snapshotsAffected.length}`);
console.log("Checks passed.");

/* ------------------------------------------------------------- the backup */

const backup = {
  written_at: new Date().toISOString(),
  product_id: PRODUCT_ID,
  product: { id: Number(product.id), is_active: product.is_active, room: product.room },
  edit_items: items.map((i) => ({
    edit_id: Number(i.edit_id),
    product_id: Number(i.product_id),
    position: Number(i.position),
    display_title: i.display_title ?? null,
    hook: i.hook ?? null,
    slug: i.slug ?? null,
    name: i.name ?? null,
    raw_name: i.raw_name ?? null,
    price_override: i.price_override === null || i.price_override === undefined ? null : String(i.price_override),
    price_set_at: i.price_set_at ? new Date(i.price_set_at).toISOString() : null,
  })),
  snapshots: snapshotRows.map((p) => ({ edit_id: Number(p.edit_id), snapshot: JSON.stringify(p.snapshot) })),
};

if (DRY) {
  console.log(`\nDry run: no write. Back-up would be written to ${BACKUP}`);
  console.log(`  park ${PRODUCT_ID}: a laptop is not a home decor product (decision 43, rule 10)`);
  process.exit(0);
}

writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* --------------------------------------------------------------- writes */

const w1 = await db`UPDATE products SET is_active = false, updated_at = now()
                     WHERE id = ${PRODUCT_ID} AND is_active = true
                    RETURNING id`;
if (w1.length !== 1) fail(`Parked ${w1.length} products, expected 1.`);
console.log(`Product parked: ${w1[0].id}`);

const w2 = await db`DELETE FROM edit_items WHERE product_id = ${PRODUCT_ID} RETURNING id`;
console.log(`Draft items removed: ${w2.length}`);

let w3 = [];
if (snapshotsAffected.length > 0) {
  w3 = await db.query(
    `UPDATE edit_publications p
        SET snapshot = jsonb_set(p.snapshot, '{items}',
              (SELECT jsonb_agg(elem ORDER BY ord)
                 FROM jsonb_array_elements(p.snapshot->'items') WITH ORDINALITY AS t(elem, ord)
                WHERE (elem->>'id')::int <> $1))
      WHERE p.edit_id = ANY($2::int[])
     RETURNING p.edit_id, jsonb_array_length(p.snapshot->'items') AS n`,
    [PRODUCT_ID, snapshotsAffected],
  );
  if (w3.length !== snapshotsAffected.length) {
    fail(`Rewrote ${w3.length} snapshots, expected ${snapshotsAffected.length}.`);
  }
}
console.log(`Snapshots rewritten: ${w3.map((r) => `${r.edit_id} (${r.n} cards)`).join(", ") || "none"}`);

let w4 = [];
if (editsAffected.length > 0) {
  w4 = await db.query(
    `UPDATE edit_items i SET position = s.np
       FROM (SELECT id, row_number() OVER (PARTITION BY edit_id ORDER BY position, id) AS np
               FROM edit_items WHERE edit_id = ANY($1::int[])) s
      WHERE i.id = s.id AND i.position IS DISTINCT FROM s.np
     RETURNING i.id`,
    [editsAffected],
  );
}
console.log(`Positions renumbered: ${w4.length}`);

/* ------------------------------------------------------------- read-back */

const after = await db`SELECT id, is_active, room FROM products WHERE id = ${PRODUCT_ID}`;
console.log(`\nAfter: ${after.map((r) => `${r.id} active=${r.is_active} room=${r.room}`).join(", ")}`);

const leftInEdits = await db`SELECT count(*)::int AS n FROM edit_items WHERE product_id = ${PRODUCT_ID}`;
const leftInSnaps = await db`
  SELECT count(*)::int AS n FROM edit_publications p
   WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(p.snapshot->'items') x
                  WHERE (x->>'id')::int = ${PRODUCT_ID})`;
console.log(`Left in draft edit items: ${leftInEdits[0].n}, in published snapshots: ${leftInSnaps[0].n}`);
console.log("\nRegenerate the statics so the row leaves the sitemaps and the feed.");
