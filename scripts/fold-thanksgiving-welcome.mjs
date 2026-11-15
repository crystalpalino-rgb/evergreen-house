/**
 * Shop audit item 4, last piece: fold The Thanksgiving Welcome Edit into Entryway.
 *
 * What it does, in one statement so it lands whole or not at all:
 *   1. moves the 12 products that make up the edit from room = 'thanksgiving'
 *      to room = 'entryway', which is what puts them on /collection/entryway and
 *      /room/entryway (both resolve the entryway collection rule on products.room);
 *   2. retires the edit itself by setting edits.status = 'draft'. The Shop the
 *      Edits row on the homepage and the Edits row on /collections read
 *      getEditSummaries(), which only returns published rows, so the tile comes
 *      off both in the same moment. The row is not deleted: --revert puts it back.
 *
 * The page URL keeps working: /collections/thanksgiving-welcome-edit and the old
 * short path /collections/thanksgiving-welcome both answer a permanent redirect
 * to /collection/entryway (src/lib/legacy-redirects.ts, serve.ts, vercel.json),
 * so the live Pinterest pin lands on the page that now carries the set.
 *
 * Run:  node scripts/fold-thanksgiving-welcome.mjs [--dry-run | --revert]
 * Nothing else in the catalog is touched. The oatmeal lounge set stays on
 * Bedroom (owner decision 3) and is not in scope here.
 */
import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

const EDIT_SLUG = "thanksgiving-welcome-edit";
const FROM_ROOM = "thanksgiving";
const TO_ROOM = "entryway";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    /* fall through */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());
const fail = (msg) => {
  console.error(`\nABORT - nothing was written.\n  ${msg}\n`);
  process.exit(1);
};

/* ── the set: read from the edit itself, not from a copy ─────────────────── */

const editRows = await db`
  SELECT id, slug, title, status, sort_order
    FROM edits
   WHERE slug = ${EDIT_SLUG}
   LIMIT 1`;
const edit = editRows[0];
if (!edit) fail(`there is no edit with slug "${EDIT_SLUG}".`);

const items = await db`
  SELECT ei.position, p.id, p.name, p.room, p.is_active, p.pin_rank, p.amazon_url
    FROM edit_items ei
    JOIN products p ON p.id = ei.product_id
   WHERE ei.edit_id = ${edit.id}
   ORDER BY ei.position`;

if (items.length === 0) fail(`edit ${EDIT_SLUG} has no items.`);
const ids = items.map((r) => Number(r.id));
if (new Set(ids).size !== ids.length) fail("the edit repeats a product id.");

/* ── validation: every row is exactly where the fold expects it ──────────── */

for (const r of items) {
  if (!r.is_active) fail(`${r.id} (${r.name}) is not active.`);
  if (r.pin_rank !== null) fail(`${r.id} (${r.name}) carries pin_rank ${r.pin_rank} and must not move.`);
  if (r.room !== FROM_ROOM) fail(`${r.id} (${r.name}) sits in room "${r.room}", not "${FROM_ROOM}".`);
}

/* Nothing moved may be printed by another edit, a holiday set, the hidden list
   or a blog post: the fold has to leave every other page exactly as it is. */
const elsewhere = await db`
  SELECT edit_id, product_id FROM edit_items
   WHERE product_id = ANY(${ids}::int[]) AND edit_id <> ${edit.id}`;
if (elsewhere.length) {
  fail(`products in this set are also in other edits: ${elsewhere.map((r) => `${r.product_id} in edit ${r.edit_id}`).join(", ")}.`);
}

const repo = new URL("..", import.meta.url);
const readJson = (rel) => {
  try {
    return JSON.parse(readFileSync(new URL(rel, repo), "utf8"));
  } catch {
    return null;
  }
};

const holidaySets = readJson("src/data/holiday-sets.json");
const setHits = [];
for (const set of holidaySets?.sets || []) {
  for (const id of set.productIds || []) {
    if (ids.includes(Number(id))) setHits.push(`${id} in set ${set.slug || set.id}`);
  }
}
if (setHits.length) fail(`products in this set are also in a holiday set: ${setHits.join(", ")}.`);

const hidden = readJson("src/data/holiday-hidden-products.json");
const hiddenHits = (hidden?.hidden || []).filter((r) => ids.includes(Number(r.id)));
if (hiddenHits.length) fail(`products in this set are on the hidden list: ${hiddenHits.map((r) => r.id).join(", ")}.`);

const asinOf = (url) => (String(url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1] || null;
const asins = items.map((r) => asinOf(r.amazon_url)).filter(Boolean);
const blogDir = new URL("src/routes/blog/", repo);
const blogHits = [];
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith(".tsx")) continue;
  const text = readFileSync(new URL(file, blogDir), "utf8");
  for (const asin of asins) if (text.includes(asin)) blogHits.push(`${asin} in ${file}`);
}
if (blogHits.length) fail(`products in this set appear in a blog post: ${blogHits.join(", ")}.`);

/* ── report the plan ────────────────────────────────────────────────────── */

console.log(`edit            ${edit.id} ${edit.slug} "${edit.title}" status=${edit.status} sort_order=${edit.sort_order}`);
console.log(`items           ${items.length} products, ${FROM_ROOM} -> ${TO_ROOM}`);
console.log(`  ids           ${ids.join(", ")}`);
console.log(`references      no other edit, no holiday set, no hidden list, no blog post`);

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  const back = await db`
    UPDATE products SET room = ${FROM_ROOM}, updated_at = now()
     WHERE id = ANY(${ids}::int[]) AND room = ${TO_ROOM}
    RETURNING id`;
  const republished = await db`
    UPDATE edits SET status = 'published', updated_at = now()
     WHERE id = ${edit.id} AND status = 'draft'
    RETURNING id`;
  console.log(`\nreverted ${back.length} product(s) to room "${FROM_ROOM}", edit ${republished.length ? "republished" : "left as it was"}.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

/* ── the write: one statement, both halves or neither ───────────────────── */

const [written] = await db`
  WITH moved AS (
    UPDATE products
       SET room = ${TO_ROOM}, updated_at = now()
     WHERE id = ANY(${ids}::int[])
       AND room = ${FROM_ROOM}
       AND is_active = true
       AND pin_rank IS NULL
    RETURNING id
  ), retired AS (
    UPDATE edits
       SET status = 'draft', updated_at = now()
     WHERE id = ${edit.id}
       AND status = 'published'
       AND (SELECT count(*) FROM moved) = ${ids.length}
    RETURNING id
  )
  SELECT (SELECT count(*) FROM moved)::int AS moved,
         (SELECT count(*) FROM retired)::int AS retired`;

if (written.moved !== ids.length || written.retired !== 1) {
  console.error(
    `\nWARNING: expected ${ids.length} products moved and 1 edit retired; the database reports ${written.moved} moved and ${written.retired} retired. Run --revert and inspect before doing anything else.`,
  );
}

/* ── read back ──────────────────────────────────────────────────────────── */

const after = await db`
  SELECT room, count(*)::int AS n FROM products
   WHERE is_active = true AND room = ANY(${[FROM_ROOM, TO_ROOM]}::text[])
   GROUP BY 1 ORDER BY 1`;
console.log("\nread back (active rows per room):");
for (const r of after) console.log(`  ${r.room}: ${r.n}`);

const still = await db`SELECT count(*)::int AS n FROM products WHERE id = ANY(${ids}::int[]) AND is_active = true`;
console.log(`  the ${ids.length} folded products are still active and buyable: ${still[0].n}`);

const state = await db`SELECT status FROM edits WHERE id = ${edit.id}`;
console.log(`  edit ${edit.id} status: ${state[0].status}`);

const published = await db`SELECT count(*)::int AS n FROM edits WHERE status = 'published'`;
console.log(`  published edits left (the Shop the Edits tiles): ${published[0].n}`);

console.log("\nDone. /collections/thanksgiving-welcome-edit and /collections/thanksgiving-welcome both 301 to /collection/entryway.");
