/**
 * Take the clothing off /room/bedroom.
 *
 * Reads the owner-facing decision file
 *   /home/team/shared/curation/bedroom-scope-2026-11-04.json
 * and applies it to the catalog in ONE atomic UPDATE:
 *
 *   hold  -> room = 'loungewear', is_active stays true
 *            (still in the catalog, still on /apparel, still linked, still
 *            recoverable; a future loungewear collection picks them up with
 *            WHERE room = 'loungewear')
 *   halloween -> seasons gains 'halloween', so the pieces read as off season
 *            everywhere the catalog is browsed
 *   keep  -> untouched
 *
 * Why not is_active = false (the way the Valentine's pieces are held):
 * /apparel selects product_type = 'apparel' AND is_active = true, and 30 of its
 * 39 cards are these bedroom garments. Deactivating them would empty a page
 * that is linked from the header and the footer. Moving the room removes them
 * from /room/bedroom and leaves every other page exactly as it is.
 *
 * Every check runs before the write. Any failure aborts with nothing changed.
 *
 * Usage:
 *   node scripts/hold-bedroom-apparel.mjs --dry-run
 *   node scripts/hold-bedroom-apparel.mjs
 *   node scripts/hold-bedroom-apparel.mjs --revert     (puts them back on bedroom)
 */
import { readFileSync, readdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE = "/home/team/shared/curation/bedroom-scope-2026-11-04.json";
const OWNER_EXCEPTION_ID = 413; // the Oatmeal Lounge Set, owner decision 2026-10-19 #3
const HALLOWEEN_IDS = [405, 406, 408, 409];
const HOLD_ROOM = "loungewear";
const HOLD_FROM_ROOM = "bedroom";

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

/* ── load the decision file ─────────────────────────────────────────────── */

const doc = JSON.parse(readFileSync(FILE, "utf8"));
const rows = doc.rows || [];
if (!rows.length) fail(`${FILE} has no rows.`);

const ids = rows.map((r) => Number(r.id));
if (new Set(ids).size !== ids.length) fail("the decision file repeats a product id.");
for (const r of rows) {
  if (!["keep", "hold"].includes(r.decision)) fail(`row ${r.id} has decision "${r.decision}".`);
  if (!r.reason || !String(r.reason).trim()) fail(`row ${r.id} has no reason.`);
  if (typeof r.halloween !== "boolean") fail(`row ${r.id} has no boolean halloween flag.`);
}

const holdIds = rows.filter((r) => r.decision === "hold").map((r) => Number(r.id));
const keepIds = rows.filter((r) => r.decision === "keep").map((r) => Number(r.id));
const halloweenIds = rows.filter((r) => r.halloween).map((r) => Number(r.id));

/* ── style rule: no em dashes or en dashes anywhere in the deliverable ──── */

const dashy = /[\u2013\u2014]/;
const jsonText = JSON.stringify(doc);
if (dashy.test(jsonText)) {
  const bad = rows.filter((r) => dashy.test(`${r.title} ${r.reason}`)).map((r) => r.id);
  fail(`em dash or en dash in the decision file (rows ${bad.join(", ") || "metadata"}).`);
}

/* ── validation 1: the decision file matches the live bedroom set ───────── */

const live = await db.query(
  `SELECT id, name, room, is_active, pin_rank, product_type, amazon_url
     FROM products WHERE room = $1 AND is_active = true ORDER BY id`,
  [HOLD_FROM_ROOM],
);
const liveIds = live.map((r) => Number(r.id));

const notOnPage = ids.filter((id) => !liveIds.includes(id));
if (notOnPage.length) fail(`decision rows that are not active bedroom products: ${notOnPage.join(", ")}`);

const uncovered = liveIds.filter((id) => !ids.includes(id));
if (uncovered.length) fail(`active bedroom products with no decision: ${uncovered.join(", ")}`);

if (Number(doc.before_active_bedroom) !== live.length) {
  fail(`decision file says ${doc.before_active_bedroom} bedroom products, the catalog says ${live.length}.`);
}

/* ── validation 2: the owner exception stays ────────────────────────────── */

const exceptionRow = rows.find((r) => Number(r.id) === OWNER_EXCEPTION_ID);
if (!exceptionRow) fail(`the owner exception ${OWNER_EXCEPTION_ID} is missing from the decision file.`);
if (exceptionRow.decision !== "keep") fail(`${OWNER_EXCEPTION_ID} must stay on the bedroom page.`);

/* ── validation 3: halloween ids are exactly the four off-season pieces ─── */

const halloweenSorted = [...halloweenIds].sort((a, b) => a - b).join(",");
if (halloweenSorted !== [...HALLOWEEN_IDS].sort((a, b) => a - b).join(",")) {
  fail(`halloween flags are [${halloweenSorted}], expected [${HALLOWEEN_IDS.join(",")}].`);
}
for (const id of HALLOWEEN_IDS) {
  if (!holdIds.includes(id)) fail(`halloween piece ${id} must be held off the bedroom page.`);
}

/* ── validation 4: nothing held is pinned or referenced elsewhere ───────── */

const pinned = live.filter((r) => r.pin_rank !== null && holdIds.includes(Number(r.id)));
if (pinned.length) {
  fail(`held products still carry a Pinterest pin_rank: ${pinned.map((r) => r.id).join(", ")}`);
}

const repo = new URL("..", import.meta.url);

function readJson(rel) {
  try {
    return JSON.parse(readFileSync(new URL(rel, repo), "utf8"));
  } catch {
    return null;
  }
}

// The six Shop the Edits collections, by product id.
const manifest = readJson("src/data/edits/manifest.json");
const editIds = new Set();
for (const collection of manifest?.collections || []) {
  for (const p of collection.products || collection.items || []) {
    const id = Number(typeof p === "object" ? p.id : p);
    if (Number.isFinite(id)) editIds.add(id);
  }
}

// The holiday sets and the suppressed-with-no-buy-box list, by product id.
const holidaySets = readJson("src/data/holiday-sets.json");
const holidaySetIds = new Set();
for (const set of holidaySets?.sets || []) {
  for (const id of set.productIds || []) holidaySetIds.add(Number(id));
}
const holidayHidden = readJson("src/data/holiday-hidden-products.json");
const hiddenIds = new Set((holidayHidden?.hidden || []).map((r) => Number(r.id)));

// The blog posts hardcode Amazon links, so match on ASIN as well as id.
const asinOf = (url) => (String(url || "").match(/\/dp\/([A-Z0-9]{10})/) || [])[1] || null;
const heldAsins = new Set(
  live.filter((r) => holdIds.includes(Number(r.id))).map((r) => asinOf(r.amazon_url)).filter(Boolean),
);
const blogDir = new URL("src/routes/blog/", repo);
const blogHits = [];
for (const name of readdirSync(blogDir)) {
  if (!name.endsWith(".tsx")) continue;
  const text = readFileSync(new URL(name, blogDir), "utf8");
  for (const id of holdIds) {
    // Only id-shaped references, so a Tailwind class such as text-rose-400
    // cannot be mistaken for product 400.
    if (new RegExp(`\\b(?:id|productId|product_id)\\s*[:=]\\s*${id}\\b`).test(text)) {
      blogHits.push(`${name} (id ${id})`);
    }
  }
  for (const asin of heldAsins) {
    if (text.includes(asin)) blogHits.push(`${name} (asin ${asin})`);
  }
}

const references = [
  ["the six Shop the Edits collections", holdIds.filter((id) => editIds.has(id))],
  ["the holiday sets", holdIds.filter((id) => holidaySetIds.has(id))],
  ["the holiday hidden list", holdIds.filter((id) => hiddenIds.has(id))],
];
const blocking = references.filter(([, hits]) => hits.length);
if (blocking.length) {
  fail(
    `held products are referenced elsewhere: ${blocking
      .map(([where, hits]) => `${where} -> ${hits.join(", ")}`)
      .join("; ")}. Nothing was written; report this instead of breaking the page.`,
  );
}
if (blogHits.length) fail(`held products appear in a blog post: ${blogHits.join(", ")}.`);

/* ── report the plan ────────────────────────────────────────────────────── */

console.log(`decision file      ${FILE}`);
console.log(`bedroom before     ${live.length} active cards`);
console.log(`holding            ${holdIds.length} -> room = ${HOLD_ROOM}`);
console.log(`keeping            ${keepIds.length}`);
console.log(`halloween off-season ${HALLOWEEN_IDS.join(", ")}`);
console.log(`bedroom after      ${live.length - holdIds.length} active cards`);
console.log(`references checked ${[...editIds].length} edit ids, ${holidaySetIds.size} holiday set ids, ${hiddenIds.size} hidden ids, blog posts clean`);

/* ── revert mode ────────────────────────────────────────────────────────── */

if (REVERT) {
  const back = await db.query(
    `UPDATE products SET room = $1 WHERE room = $2 AND is_active = true RETURNING id`,
    [HOLD_FROM_ROOM, HOLD_ROOM],
  );
  console.log(`\nreverted ${back.length} product(s) back to room = ${HOLD_FROM_ROOM}.`);
  process.exit(0);
}

if (DRY_RUN) {
  console.log("\n--dry-run: no rows written.");
  process.exit(0);
}

/* ── the write: one statement, so it lands whole or not at all ──────────── */

const holdParam = holdIds;
const halloweenParam = HALLOWEEN_IDS;

const written = await db.query(
  `UPDATE products
      SET room = CASE
                   WHEN id = ANY($2::int[]) THEN $3
                   ELSE room
                 END,
          seasons = CASE
                      WHEN id = ANY($4::int[])
                       AND NOT ('halloween' = ANY(coalesce(seasons, '{}'::text[])))
                      THEN array_append(coalesce(seasons, '{}'::text[]), 'halloween')
                      ELSE seasons
                    END,
          updated_at = now()
    WHERE id = ANY($1::int[])
      AND room = $5
      AND is_active = true
  RETURNING id, name, room, is_active`,
  [holdParam, holdParam, HOLD_ROOM, halloweenParam, HOLD_FROM_ROOM],
);

if (written.length !== holdIds.length) {
  console.error(
    `WARNING: expected ${holdIds.length} rows, the update touched ${written.length}. Re-run the checks and inspect before doing anything else.`,
  );
}

/* ── read back ──────────────────────────────────────────────────────────── */

const after = await db.query(
  `SELECT room, count(*)::int AS n FROM products WHERE is_active = true AND room IN ($1, $2) GROUP BY 1 ORDER BY 1`,
  [HOLD_FROM_ROOM, HOLD_ROOM],
);
console.log("\nread back:");
for (const r of after) console.log(`  room=${r.room} active=${r.n}`);

const stillActive = await db.query(
  `SELECT count(*)::int AS n FROM products WHERE id = ANY($1::int[]) AND is_active = true`,
  [holdParam],
);
console.log(`  held products still active in the catalog: ${stillActive[0].n} of ${holdIds.length}`);

const exception = await db.query(`SELECT id, room, is_active, pin_rank, rating FROM products WHERE id = $1`, [
  OWNER_EXCEPTION_ID,
]);
const e = exception[0];
console.log(
  `  owner exception ${e.id}: room=${e.room} active=${e.is_active} pin_rank=${e.pin_rank} rating=${Number(e.rating)}`,
);

const halloweenRead = await db.query(`SELECT id, room, seasons FROM products WHERE id = ANY($1::int[]) ORDER BY id`, [
  halloweenParam,
]);
console.log("  off-season pieces:");
for (const r of halloweenRead) console.log(`    ${r.id} room=${r.room} seasons=${JSON.stringify(r.seasons)}`);

console.log("\nDone. /room/bedroom now serves the keep set only.");
