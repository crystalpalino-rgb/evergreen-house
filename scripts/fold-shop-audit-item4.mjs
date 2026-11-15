/**
 * Shop audit cleanup, item 4: the removals and merges.
 *
 * Reads the decision file
 *   /home/team/shared/curation/shop-audit-item4-scope-2026-11-15.json
 * and folds each product onto the page it belongs to in ONE atomic UPDATE.
 *
 * Nothing is deleted and nothing is deactivated: every row keeps is_active,
 * so its product page, search result, sitemap entry and merchant feed row are
 * untouched. Only `room` changes, which is what decides which page a product
 * lists on.
 *
 *   laundry        -> emptied, so the Laundry Room tile and page retire
 *                     (2 storage items to Bathroom and Kitchen, trash can to
 *                     Kitchen)
 *   storage        -> emptied, so the Home Essentials tile retires; its one
 *                     product moves to Pantry
 *   bedroom        -> loses the four Big Feelings children's books (to books)
 *   living-room    -> loses the three books (to books) and Monopoly (to games)
 *
 * `books` and `games` are hidden rooms (src/lib/room-visibility.ts): the rows
 * stay active and buyable, and no page is published for them.
 *
 * Every check runs before the write. Any failure aborts with nothing changed.
 *
 * Usage:
 *   node scripts/fold-shop-audit-item4.mjs --dry-run
 *   node scripts/fold-shop-audit-item4.mjs
 *   node scripts/fold-shop-audit-item4.mjs --revert
 */
import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "/home/team/shared/curation/shop-audit-item4-scope-2026-11-15.json";
/* The one product in the audit that must NOT move: it carries a Pinterest pin
   (pin_rank 1) and owner decision 3 (2026-10-19) keeps it on Bedroom. */
const PINNED_KEEP_ID = 413;
/* Products the spec names that are not moved, with the reason, so the script
   proves it looked at them rather than quietly skipping them. */
const REPORTED_ONLY = [413];

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const REVERT = args.has("--revert");

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

/* ── the decision file ──────────────────────────────────────────────────── */

const doc = JSON.parse(readFileSync(FILE, "utf8"));
const rows = doc.rows || [];
if (!rows.length) fail(`${FILE} has no rows.`);

const ids = rows.map((r) => Number(r.id));
if (new Set(ids).size !== ids.length) fail("the decision file repeats a product id.");
for (const r of rows) {
  if (r.decision !== "fold") fail(`row ${r.id} has decision "${r.decision}".`);
  if (!r.reason || !String(r.reason).trim()) fail(`row ${r.id} has no reason.`);
  if (!r.from_room || !r.to_room) fail(`row ${r.id} has no from_room / to_room.`);
  if (r.from_room === r.to_room) fail(`row ${r.id} moves to the room it is already in.`);
}

const dashy = /[\u2013\u2014]/;
if (dashy.test(JSON.stringify(doc))) fail("em dash or en dash in the decision file.");

/* ── validation 1: every row is where the file says it is ───────────────── */

const live = await db.query(
  `SELECT id, name, room, is_active, pin_rank, product_type, amazon_url
     FROM products WHERE id = ANY($1::int[]) ORDER BY id`,
  [ids],
);
const liveById = new Map(live.map((r) => [Number(r.id), r]));
const missing = ids.filter((id) => !liveById.has(id));
if (missing.length) fail(`rows that are not in the catalog: ${missing.join(", ")}`);

for (const r of rows) {
  const row = liveById.get(Number(r.id));
  if (!row.is_active) fail(`${r.id} is not active.`);
  if (row.pin_rank !== null) fail(`${r.id} carries pin_rank ${row.pin_rank} and must not move.`);
  if (row.room !== r.from_room) fail(`${r.id} sits in room "${row.room}", the file says "${r.from_room}".`);
}

/* ── validation 2: the pinned exception is not in the file ──────────────── */

if (ids.includes(PINNED_KEEP_ID)) fail(`${PINNED_KEEP_ID} is pinned and must stay on Bedroom.`);
for (const id of REPORTED_ONLY) {
  const row = liveById.get(id);
  if (row && row.pin_rank === null) fail(`${id} has no pin any more: re-read the audit before moving it.`);
}

/* ── validation 3: nothing moved is referenced by another page ──────────── */

const repo = new URL("..", import.meta.url);

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(new URL(rel, repo), "utf8"));
  } catch {
    return null;
  }
}

const manifest = readJson("src/data/edits/manifest.json");
const editIds = new Set();
for (const collection of manifest?.collections || []) {
  for (const p of collection.products || collection.items || []) {
    const id = Number(typeof p === "object" ? p.id : p);
    if (Number.isFinite(id)) editIds.add(id);
  }
}

const holidaySets = readJson("src/data/holiday-sets.json");
const holidaySetIds = new Set();
for (const set of holidaySets?.sets || []) {
  for (const id of set.productIds || []) holidaySetIds.add(Number(id));
}
const holidayHidden = readJson("src/data/holiday-hidden-products.json");
const hiddenIds = new Set((holidayHidden?.hidden || []).map((r) => Number(r.id)));

const asinOf = (url) => (String(url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1] || null;
const movedAsins = new Set(live.map((r) => asinOf(r.amazon_url)).filter(Boolean));
const blogDir = new URL("src/routes/blog/", repo);
const blogHits = [];
for (const name of readdirSync(blogDir)) {
  if (!name.endsWith(".tsx")) continue;
  const text = readFileSync(new URL(name, blogDir), "utf8");
  for (const id of ids) {
    if (new RegExp(`\\b(?:id|productId|product_id)\\s*[:=]\\s*${id}\\b`).test(text)) {
      blogHits.push(`${name} (id ${id})`);
    }
  }
  for (const asin of movedAsins) {
    if (text.includes(asin)) blogHits.push(`${name} (asin ${asin})`);
  }
}

const references = [
  ["the Shop the Edits collections", ids.filter((id) => editIds.has(id))],
  ["the holiday sets", ids.filter((id) => holidaySetIds.has(id))],
  ["the holiday hidden list", ids.filter((id) => hiddenIds.has(id))],
];
const blocking = references.filter(([, hits]) => hits.length);
if (blocking.length) {
  fail(
    `moved products are referenced elsewhere: ${blocking
      .map(([where, hits]) => `${where} -> ${hits.join(", ")}`)
      .join("; ")}. Nothing was written; report this instead of breaking the page.`,
  );
}
if (blogHits.length) fail(`moved products appear in a blog post: ${blogHits.join(", ")}.`);

/* ── report the plan ────────────────────────────────────────────────────── */

const byTarget = new Map();
for (const r of rows) {
  const key = `${r.from_room} -> ${r.to_room}`;
  byTarget.set(key, (byTarget.get(key) || 0) + 1);
}

console.log(`decision file   ${FILE}`);
console.log(`moving          ${rows.length} products, none deleted, none deactivated`);
for (const [key, n] of byTarget) console.log(`  ${key}  (${n})`);
console.log(`reported only   ${REPORTED_ONLY.join(", ")} (pinned, stays put)`);
console.log(
  `references      ${editIds.size} edit ids, ${holidaySetIds.size} holiday set ids, ${hiddenIds.size} hidden ids, blog posts clean`,
);

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  const back = await db.query(
    `UPDATE products p
        SET room = v.from_room, updated_at = now()
       FROM (SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS from_room, unnest($3::text[]) AS to_room) v
      WHERE p.id = v.id AND p.room = v.to_room
    RETURNING p.id, p.room`,
    [ids, rows.map((r) => r.from_room), rows.map((r) => r.to_room)],
  );
  console.log(`\nreverted ${back.length} product(s) to their original room.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

/* ── the write: one statement, so it lands whole or not at all ──────────── */

const written = await db.query(
  `UPDATE products p
      SET room = v.to_room, updated_at = now()
     FROM (SELECT unnest($1::int[]) AS id, unnest($2::text[]) AS from_room, unnest($3::text[]) AS to_room) v
    WHERE p.id = v.id
      AND p.room = v.from_room
      AND p.is_active = true
      AND p.pin_rank IS NULL
  RETURNING p.id, p.room`,
  [ids, rows.map((r) => r.from_room), rows.map((r) => r.to_room)],
);

if (written.length !== rows.length) {
  console.error(
    `WARNING: expected ${rows.length} rows, the update touched ${written.length}. Inspect before doing anything else.`,
  );
}

/* ── read back ──────────────────────────────────────────────────────────── */

const after = await db.query(
  `SELECT room, count(*)::int AS n FROM products
    WHERE is_active = true AND room = ANY($1::text[]) GROUP BY 1 ORDER BY 1`,
  [["laundry", "storage", "bathroom", "kitchen", "pantry", "bedroom", "living-room", "books", "games"]],
);
console.log("\nread back (active rows per room):");
for (const r of after) console.log(`  ${r.room}: ${r.n}`);

const stillActive = await db.query(
  `SELECT count(*)::int AS n FROM products WHERE id = ANY($1::int[]) AND is_active = true`,
  [ids],
);
console.log(`  moved products still active in the catalog: ${stillActive[0].n} of ${ids.length}`);

const exception = await db.query(
  `SELECT id, room, is_active, pin_rank FROM products WHERE id = $1`,
  [PINNED_KEEP_ID],
);
const e = exception[0];
console.log(`  pinned exception ${e.id}: room=${e.room} active=${e.is_active} pin_rank=${e.pin_rank}`);

console.log("\nDone. Laundry and Home Essentials resolve 0 products, so their tiles retire.");
