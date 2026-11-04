/**
 * Thanksgiving 2026 - insert the 52 new product rows and refresh the 20
 * carried-over rows to the figures verified live on Amazon on 2026-11-04.
 *
 * Source of truth: the four set files and the copy file written by the
 * merchandiser and reviewed by the lead in
 * /home/team/shared/thanksgiving-2026/build/. This script never invents a
 * figure. Price, star rating, review count and availability are copied from
 * the set file verbatim; the card line is copied from copy-2026-11-04.json
 * keyed by ASIN. If a set ASIN has no authored line, the script aborts rather
 * than templating one.
 *
 * What it writes, for the 52 new rows:
 *   room = 'thanksgiving'   (hidden from the room index by
 *                            src/lib/room-visibility.ts HIDDEN_ROOMS)
 *   name, display_title     the set file's clean human title
 *   full_name               the Amazon listing title, for search weight only
 *   card_hook               copy-2026-11-04.json, keyed by ASIN
 *   editor_note             the set file's what_it_is line
 *   price, rating, review_count, availability, price_checked_at = 2026-11-04
 *   amazon_url              https://www.amazon.com/dp/<ASIN>?tag=crystalcost09-20
 *   seo_slug, seo_title, image_alt, quality_score, import_batch
 *   full_text_search        the same expression scripts/backfill-search.ts uses
 * and for the 20 carried-over rows (7 Moody, 13 hosting):
 *   price, rating, review_count, availability, price_checked_at
 *
 * Safety:
 *   - dry run by default, `--apply` to commit
 *   - every check runs before anything is written, and any failure aborts with
 *     nothing written
 *   - the whole apply is one transaction (INSERT, UPDATE, search backfill), so
 *     a failure half way leaves the table exactly as it was
 *   - idempotent: a row already imported by this batch is skipped, never
 *     inserted twice, and a repeated ASIN fails loudly
 *
 * Usage:
 *   bun run scripts/apply-thanksgiving-2026.mjs           # dry run, prints the plan
 *   bun run scripts/apply-thanksgiving-2026.mjs --apply   # commit
 *
 * DATABASE_URL falls back to site/.env.local, then site/.env, so it can be run
 * by hand without exporting anything.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const BUILD_DIR = "/home/team/shared/thanksgiving-2026/build";
const BATCH = "thanksgiving-2026";
const CHECKED_AT = "2026-11-04";
const TAG = "?tag=crystalcost09-20";

/* The four sets. `new` is the number of rows this set imports; the rest of the
   items in the file carry existing_product_id and are updated instead. */
const SETS = [
  { key: "table", file: "table-set-2026-11-04.json", collection: "thanksgiving-table-edit", new: 20 },
  { key: "moody", file: "moody-set-2026-11-04.json", collection: "moody-thanksgiving-edit", new: 13 },
  { key: "hosting", file: "hosting-set-2026-11-04.json", collection: "thanksgiving-hosting-edit", new: 7 },
  { key: "welcome", file: "welcome-set-2026-11-04.json", collection: "thanksgiving-welcome-edit", new: 12 },
];

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const candidate of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(candidate, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) {
        const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
        if (value.startsWith("postgres")) return value;
      }
    } catch {
      /* try the next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);

/* ── helpers ─────────────────────────────────────────────────────────────── */

/** The site's own slug rule (src/lib/product-slug.ts productNameToSlug). */
function productNameToSlug(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** The site's canonical product URL rule (canonicalProductSlug). */
function canonicalSlug(row) {
  const stored = typeof row.seo_slug === "string" ? row.seo_slug.trim() : "";
  return stored || productNameToSlug(row.name);
}

function asinOf(url) {
  const m = String(url || "").match(/\/dp\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}

/** $56.13 style, exactly the cents the set file carries. */
function money(value) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toFixed(2)}`;
}

/** House style: no em-dashes, no en-dashes, no curly quotes, no British -our. */
const SPELLING = [
  [/\bfibres\b/gi, "fibers"],
  [/\bfibre\b/gi, "fiber"],
  [/\bcolours\b/gi, "colors"],
  [/\bcolour\b/gi, "color"],
  [/\bgrey\b/gi, "gray"],
  [/\bcentre\b/gi, "center"],
  [/\bfavourite\b/gi, "favorite"],
  [/\bjewellery\b/gi, "jewelry"],
  [/\borganised\b/gi, "organized"],
  [/\bmetres\b/gi, "meters"],
  [/\bmetre\b/gi, "meter"],
];

/** Normalise a copied string: plain hyphens, ASCII quotes, US spelling. */
function houseStyle(text, where) {
  if (text === null || text === undefined) return text;
  let out = String(text);
  const before = out;
  out = out.replace(/[\u2014\u2013]/g, "-");
  out = out.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
  for (const [re, to] of SPELLING) out = out.replace(re, to);
  if (out !== before) notes.push(`house style normalised in ${where}: ${JSON.stringify(before.slice(0, 90))} -> ${JSON.stringify(out.slice(0, 90))}`);
  if (/[\u2014\u2013]/.test(out)) fail(`${where} still carries an em-dash or en-dash after normalisation.`);
  return out;
}

/* ── load and validate the set files ─────────────────────────────────────── */

const copy = JSON.parse(readFileSync(`${BUILD_DIR}/copy-2026-11-04.json`, "utf8"));
const hooks = new Map();
for (const entry of copy.hooks || []) {
  if (!entry.asin || !entry.hook || !String(entry.hook).trim()) {
    fail(`copy file entry ${JSON.stringify(entry).slice(0, 80)} has no asin or no hook.`);
    continue;
  }
  if (hooks.has(entry.asin)) fail(`copy file repeats ASIN ${entry.asin}.`);
  hooks.set(entry.asin, entry);
}

const newItems = [];
const carriedItems = [];

for (const set of SETS) {
  const doc = JSON.parse(readFileSync(`${BUILD_DIR}/${set.file}`, "utf8"));
  const items = doc.items || [];
  const fresh = items.filter((i) => !i.existing_product_id);
  const carried = items.filter((i) => i.existing_product_id);
  if (fresh.length !== set.new) {
    fail(`${set.file} carries ${fresh.length} new items, the brief says ${set.new}.`);
  }
  for (const item of items) {
    for (const field of ["asin", "listing_title", "display_title", "price", "rating", "review_count", "availability", "verified_at"]) {
      if (item[field] === null || item[field] === undefined || item[field] === "") {
        fail(`${set.file} ${item.asin || "(no asin)"} is missing ${field}.`);
      }
    }
    if (item.verified_at !== CHECKED_AT) {
      fail(`${set.file} ${item.asin} was verified ${item.verified_at}, not ${CHECKED_AT}.`);
    }
    if (asinOf(item.amazon_url) !== item.asin) {
      fail(`${set.file} ${item.asin} has an amazon_url that does not carry that ASIN: ${item.amazon_url}`);
    }
    if (item.availability !== "In Stock") {
      fail(`${set.file} ${item.asin} is "${item.availability}" - the gates only pass in-stock rows, so this file needs a decision, not a silent insert.`);
    }
    if (!(Number(item.rating) >= 4.3)) {
      fail(`${set.file} ${item.asin} is rated ${item.rating}, under the 4.3 gate.`);
    }
    if (!(Number(item.price) > 0)) {
      fail(`${set.file} ${item.asin} has no usable price (${item.price}).`);
    }
    if (Number.isInteger(item.review_count) === false || Number(item.review_count) < 0) {
      fail(`${set.file} ${item.asin} has no integer review_count (${item.review_count}).`);
    }
  }
  for (const item of fresh) newItems.push({ set: set.key, collection: set.collection, item });
  for (const item of carried) carriedItems.push({ set: set.key, collection: set.collection, item });
}

if (newItems.length !== 52) fail(`the four sets carry ${newItems.length} new items, the brief says 52.`);
if (carriedItems.length !== 20) fail(`the four sets carry ${carriedItems.length} carried-over items, the brief says 20.`);

/* every new ASIN needs its authored line, and nothing else may supply it */
for (const { item } of newItems) {
  const entry = hooks.get(item.asin);
  if (!entry) {
    fail(`${item.asin} (${item.display_title}) has no authored card line in copy-2026-11-04.json. Stopping rather than inventing one.`);
    continue;
  }
  if (entry.display_title && entry.display_title.trim() !== String(item.display_title).trim()) {
    fail(`${item.asin} is titled "${item.display_title}" in the set file and "${entry.display_title}" in the copy file.`);
  }
  const hook = String(entry.hook).trim();
  if (hook.length < 40) fail(`${item.asin} has a card line that is too short to be authored copy: ${JSON.stringify(hook)}`);
}

/* ASIN uniqueness across the four sets, and inside the batch */
const asinSeen = new Map();
for (const { set, item } of [...newItems, ...carriedItems]) {
  if (asinSeen.has(item.asin)) {
    fail(`ASIN ${item.asin} appears twice (${asinSeen.get(item.asin)} and ${set}). amazon_url is UNIQUE, so this would half-insert.`);
  }
  asinSeen.set(item.asin, set);
}

/* carried-over ids unique and complete */
const carriedIds = carriedItems.map(({ item }) => Number(item.existing_product_id));
if (new Set(carriedIds).size !== carriedIds.length) fail("a carried-over product id appears twice.");

/* ── read the current table ──────────────────────────────────────────────── */

const existing = await db`
  SELECT id, name, seo_slug, amazon_url, price, rating, review_count, availability,
         price_checked_at, room, is_active, import_batch, card_hook, display_title, image_url
  FROM products ORDER BY id`;

const byId = new Map(existing.map((r) => [r.id, r]));
const byAsin = new Map();
const byCanonicalSlug = new Map();
const byStoredSlug = new Map();
const byNameSlug = new Map();
const push = (map, key, id) => {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(id);
};
for (const row of existing) {
  const asin = asinOf(row.amazon_url);
  if (asin) push(byAsin, asin, row.id);
  push(byCanonicalSlug, canonicalSlug(row), row.id);
  if (row.seo_slug) push(byStoredSlug, row.seo_slug, row.id);
  push(byNameSlug, productNameToSlug(row.name), row.id);
}

/* which new rows are already in the table from an earlier run of this script */
const alreadyImported = new Set();
const toInsert = [];
for (const entry of newItems) {
  const owners = byAsin.get(entry.item.asin) || [];
  if (owners.length === 0) {
    toInsert.push(entry);
    continue;
  }
  const ours = owners.filter((id) => byId.get(id).import_batch === BATCH);
  if (ours.length === 1 && owners.length === 1) {
    alreadyImported.add(entry.item.asin);
    continue;
  }
  fail(`ASIN ${entry.item.asin} is already in the table as id ${owners.join(", ")} (batch ${owners.map((id) => byId.get(id).import_batch || "none").join(", ")}).`);
}

/* carried-over rows must exist, keep their identity, and still be active */
for (const { item } of carriedItems) {
  const row = byId.get(Number(item.existing_product_id));
  if (!row) {
    fail(`carried-over id ${item.existing_product_id} (${item.asin}) is not in the table.`);
    continue;
  }
  const asin = asinOf(row.amazon_url);
  if (asin !== item.asin) {
    fail(`carried-over id ${row.id} is ASIN ${asin} in the table but ${item.asin} in the set file.`);
  }
  if (!row.is_active) notes.push(`carried-over id ${row.id} is currently is_active = false; only its verified figures are updated.`);
}

/* ── slug plan: derived from the display title, checked against the table ── */

const slugPlan = new Map();
const batchSlugs = new Map();
for (const entry of newItems) {
  const { item } = entry;
  const slug = productNameToSlug(item.display_title);
  if (!slug) {
    fail(`${item.asin} produces an empty slug from "${item.display_title}".`);
    continue;
  }
  if (slug !== item.display_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")) {
    fail(`${item.asin} slug was altered beyond the 120 character cap: ${slug}`);
  }
  slugPlan.set(item.asin, slug);
  if (batchSlugs.has(slug)) fail(`two new rows derive the same slug "${slug}" (${batchSlugs.get(slug)} and ${item.asin}).`);
  batchSlugs.set(slug, item.asin);

  /* The route resolves a product by canonical slug, first match by id, and the
     new rows get the highest ids in the table. Any existing row already
     answering to this slug would shadow the new row, so it is a hard failure.
     Both the stored seo_slug and the name-derived slug are checked, as the
     brief requires. */
  const ownId = (byAsin.get(item.asin) || [])[0];
  const hits = [
    ...(byCanonicalSlug.get(slug) || []).map((id) => ({ kind: "canonical", id })),
    ...(byStoredSlug.get(slug) || []).map((id) => ({ kind: "seo_slug", id })),
    ...(byNameSlug.get(slug) || []).map((id) => ({ kind: "name_slug", id })),
  ].filter((h) => h.id !== ownId);
  if (hits.length) {
    fail(`${item.asin} slug "${slug}" collides with id ${[...new Set(hits.map((h) => h.id))].join(", ")} (${[...new Set(hits.map((h) => h.kind))].join(", ")}).`);
  }
}

/* ── prepare the exact text that will be written ─────────────────────────── */

/* Runs before the abort check on purpose: if normalising a copied line still
   leaves an em-dash or an en-dash, that is a failure and nothing is written. */
for (const entry of newItems) {
  const { item } = entry;
  entry.prepared = {
    displayTitle: houseStyle(String(item.display_title).trim(), `${item.asin} display_title`),
    listingTitle: houseStyle(String(item.listing_title).trim(), `${item.asin} listing_title`),
    hook: houseStyle(hooks.get(item.asin) ? hooks.get(item.asin).hook.trim() : "", `${item.asin} card_hook`),
    note: houseStyle(String(item.what_it_is || "").trim(), `${item.asin} editor_note`),
  };
  if (!entry.prepared.hook) fail(`${item.asin} ends up with an empty card line.`);
}

/* ── the plan, printed before anything is written ────────────────────────── */

const perSet = SETS.map((set) => ({
  set: set.key,
  collection: set.collection,
  new: newItems.filter((e) => e.set === set.key).length,
  toInsert: toInsert.filter((e) => e.set === set.key).length,
  carried: carriedItems.filter((e) => e.set === set.key).length,
}));

console.log("Thanksgiving 2026 product import");
console.log(`  mode              ${APPLY ? "APPLY (one transaction)" : "dry run (nothing is written)"}`);
console.log(`  verified at       ${CHECKED_AT}`);
console.log(`  new rows          ${newItems.length} (${toInsert.length} to insert, ${alreadyImported.size} already imported by this batch)`);
console.log(`  carried rows      ${carriedItems.length}`);
console.log(`  table now         ${existing.length} rows, ${existing.filter((r) => r.is_active).length} active`);
console.log("");
console.log("  set                        new  to insert  carried  collection");
for (const row of perSet) {
  console.log(
    `  ${row.set.padEnd(26)} ${String(row.new).padStart(3)}  ${String(row.toInsert).padStart(9)}  ${String(row.carried).padStart(7)}  ${row.collection}`,
  );
}

/* carried-over before / after, every one of the 20 */
console.log("");
console.log("Carried-over rows, current table values -> 2026-11-04 verified values");
console.log("  id   set      ASIN        price                    rating         reviews            availability        checked");
for (const { set, item } of carriedItems) {
  const row = byId.get(Number(item.existing_product_id));
  if (!row) continue;
  const price = `${money(row.price)} -> ${money(item.price)}`;
  const rating = `${row.rating} -> ${item.rating}`;
  const reviews = `${row.review_count} -> ${item.review_count}`;
  const avail = `${row.availability} -> in_stock`;
  const checked = `${row.price_checked_at ? String(row.price_checked_at).slice(0, 10) : "never"} -> ${CHECKED_AT}`;
  const cheaper = Number(item.price) < Number(row.price) - 0.005 ? "  (cheaper now)" : Number(item.price) > Number(row.price) + 0.005 ? "  (dearer now)" : "";
  console.log(
    `  ${String(row.id).padEnd(4)} ${set.padEnd(8)} ${item.asin}  ${price.padEnd(24)} ${rating.padEnd(14)} ${reviews.padEnd(18)} ${avail.padEnd(19)} ${checked}${cheaper}`,
  );
}

/* the 52 new rows, as they will be written */
console.log("");
console.log("New rows (all room = thanksgiving, price_checked_at 2026-11-04, import_batch thanksgiving-2026)");
console.log("  set      ASIN        price      rating  reviews   slug");
for (const { set, item } of newItems) {
  console.log(
    `  ${set.padEnd(8)} ${item.asin}  ${money(item.price).padEnd(9)} ${String(item.rating).padEnd(6)} ${String(item.review_count).padEnd(8)} ${slugPlan.get(item.asin) || "(none)"}`,
  );
}

if (notes.length) {
  console.log("");
  console.log("Notes");
  for (const note of notes) console.log(`  - ${note}`);
}

if (problems.length) {
  console.log("");
  console.error(`ABORT - ${problems.length} problem(s), nothing was written.`);
  for (const p of problems) console.error(`  * ${p}`);
  process.exit(1);
}

if (!APPLY) {
  console.log("");
  console.log("Dry run complete. Re-run with --apply to write this in one transaction.");
  process.exit(0);
}

/* ── write: one transaction, or nothing ──────────────────────────────────── */

const now = new Date().toISOString();

/** The insert, one statement, one row per set item. */
function buildInsert(entries) {
  const cols = [
    "name", "full_name", "room", "amazon_url", "price", "rating", "review_count",
    "availability", "price_checked_at", "editor_note", "seo_slug", "seo_title",
    "image_alt", "display_title", "card_hook", "quality_score", "import_batch",
    "is_active", "data_version", "updated_at",
  ];
  const params = [];
  const tuples = entries.map(({ item, prepared }) => {
    const displayTitle = prepared.displayTitle;
    const listingTitle = prepared.listingTitle;
    const hook = prepared.hook;
    const note = prepared.note;
    const values = [
      displayTitle,
      listingTitle,
      "thanksgiving",
      `https://www.amazon.com/dp/${item.asin}${TAG}`,
      Number(item.price),
      Number(item.rating),
      Number(item.review_count),
      "in_stock",
      CHECKED_AT,
      note || null,
      slugPlan.get(item.asin),
      displayTitle,
      `${displayTitle} from the Thanksgiving 2026 collection at Evergreen House`,
      displayTitle,
      hook,
      9,
      BATCH,
      true,
      1,
      now,
    ];
    const placeholders = values.map((v) => {
      params.push(v);
      return `$${params.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const text = `INSERT INTO products (${cols.join(", ")}) VALUES ${tuples.join(", ")}
    RETURNING id, name, seo_slug, amazon_url, price, rating, review_count, availability, price_checked_at, card_hook, room, import_batch`;
  return db.query(text, params);
}

/** The carried-over refresh, one statement, one row per set item. */
function buildCarriedUpdate(entries) {
  const params = [];
  const tuples = entries.map(({ item }) => {
    const values = [Number(item.existing_product_id), Number(item.price), Number(item.rating), Number(item.review_count), "in_stock", CHECKED_AT];
    const placeholders = values.map((v, i) => {
      params.push(v);
      return `$${params.length}${["::int", "::numeric", "::numeric", "::int", "::text", "::date"][i]}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const text = `UPDATE products AS p SET
      price = v.price,
      rating = v.rating,
      review_count = v.review_count,
      availability = v.availability,
      price_checked_at = v.price_checked_at,
      updated_at = now()
    FROM (VALUES ${tuples.join(", ")}) AS v(id, price, rating, review_count, availability, price_checked_at)
    WHERE p.id = v.id
    RETURNING p.id, p.price, p.rating, p.review_count, p.availability, p.price_checked_at`;
  return db.query(text, params);
}

/** Same expression scripts/backfill-search.ts uses, scoped to this batch. */
function buildSearchBackfill() {
  return db.query(
    `UPDATE products SET full_text_search =
        setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(full_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(editor_note, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(brand, '')), 'B')
      WHERE import_batch = $1 AND full_text_search IS NULL
      RETURNING id`,
    [BATCH],
  );
}

const statements = [];
if (toInsert.length) statements.push(buildInsert(toInsert));
if (carriedItems.length) statements.push(buildCarriedUpdate(carriedItems));
statements.push(buildSearchBackfill());

let results;
try {
  results = await db.transaction(statements);
} catch (error) {
  console.error("");
  console.error(`ABORT - the transaction rolled back, nothing was written.\n  ${error.message}`);
  process.exit(1);
}

const inserted = toInsert.length ? results[0] : [];
const updated = carriedItems.length ? results[toInsert.length ? 1 : 0] : [];
const backfilled = results[results.length - 1] || [];

console.log("");
console.log("Applied in one transaction");
console.log(`  inserted   ${inserted.length} rows`);
console.log(`  updated    ${updated.length} carried-over rows`);
console.log(`  search     ${backfilled.length} rows got a full_text_search vector`);
console.log("");
console.log("Inserted rows");
console.log("  id   ASIN        price      rating  reviews   room          checked      slug");
for (const row of inserted) {
  console.log(
    `  ${String(row.id).padEnd(4)} ${String(asinOf(row.amazon_url) || "?").padEnd(11)} ${money(row.price).padEnd(9)} ` +
      `${String(row.rating).padEnd(6)} ${String(row.review_count).padEnd(8)} ${String(row.room).padEnd(13)} ` +
      `${String(row.price_checked_at).slice(0, 10)}  ${row.seo_slug}`,
  );
}
console.log("");
console.log("Updated carried-over rows");
for (const row of updated) {
  console.log(
    `  ${String(row.id).padEnd(4)} ${money(row.price).padEnd(9)} ${String(row.rating).padEnd(6)} ${String(row.review_count).padEnd(8)} ${String(row.availability).padEnd(11)} ${String(row.price_checked_at).slice(0, 10)}`,
  );
}
