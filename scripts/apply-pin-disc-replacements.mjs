/**
 * Pin disc replacements, 2026-11-04: the two owner-approved products that close
 * the last two "not available" numbers on the Pinterest landing pages.
 *
 *   slot 1  ASIN B09BV75CL3  White Glass Christmas Ball Ornaments, Set of 9
 *           replaces id 81  (VioraWhite white pearl, no buy box)  -> luxe number 2
 *   slot 2  ASIN B000VA4D1G  Cut Crystal Glass Pitcher, 46 Oz
 *           replaces id 483 (Spode tree pitcher, no buy box)     -> hosting-table number 1
 *
 * The figures are the merchandiser's live reads of 2026-11-04, taken from
 * /home/team/shared/curation/pin-disc-replacements-2026-11-04.json (slot 1 and
 * slot 2, candidate rank 1). This script re-checks its own constants against that
 * file, so a drifted number fails loudly instead of being written.
 *
 * It inserts two product rows and nothing else. The retired rows (81, 483) are
 * left exactly as they are: suppressed, not deleted (owner decision 10).
 *
 * What it writes per row: name, full_name, room, amazon_url, price, rating,
 * review_count, availability, price_checked_at, brand, editor_note, seo_slug,
 * seo_title, seo_description, image_alt, display_title, card_hook,
 * quality_score, import_batch, is_active, data_version, updated_at, image_url
 * (image_url only after the image has been downloaded and decoded), then the
 * full_text_search backfill using the exact expression in
 * scripts/backfill-search.ts.
 *
 * Safety:
 *   - dry run by default, `--apply` to commit
 *   - every check runs before anything is written, and any failure aborts with
 *     nothing written
 *   - one transaction (INSERT + search backfill): a failure half way leaves the
 *     table exactly as it was
 *   - idempotent: a row already imported by this batch is reused, never
 *     inserted twice, and an ASIN that lives on any other row fails loudly
 *
 * Usage:
 *   bun run scripts/apply-pin-disc-replacements.mjs           # dry run
 *   bun run scripts/apply-pin-disc-replacements.mjs --apply   # commit
 *
 * DATABASE_URL falls back to site/.env.local, then site/.env.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const BATCH = "pin-disc-replacements-2026-11-04";
const CHECKED_AT = "2026-11-04";
const TAG = "?tag=crystalcost09-20";
const CURATION = "/home/team/shared/curation/pin-disc-replacements-2026-11-04.json";
const PROOF = "/home/team/shared/pin-disc-replacements-apply-2026-11-04.json";

/* ── the two approved rows ───────────────────────────────────────────────── */

const APPROVED = [
  {
    slot: 1,
    asin: "B09BV75CL3",
    replaces: 81,
    pinPage: "/pin/luxe-christmas-tree",
    pinNumber: 2,
    discLabel: "WHITE GLASS ORNAMENTS",
    collection: "luxe-christmas-tree-edit",
    room: "holiday",
    name: "White Glass Christmas Ball Ornaments, Set of 9",
    display_title: "White Glass Christmas Ball Ornaments, Set of 9",
    full_name: 'DN DECONATION White Glass Christmas Ball Ornaments, 3.15" 9PCS Hanging Ball Ornaments for Xmas Tree',
    brand: "DN DECONATION",
    seo_slug: "white-glass-christmas-ball-ornaments-set-of-9",
    seo_title: "White Glass Christmas Ball Ornaments, Set of 9 | Evergreen House",
    seo_description:
      "Nine plain white glass Christmas balls, chosen for the Luxe Christmas Tree Edit: real glass, no glitter and no motif, so a lit tree stays quiet.",
    image_alt: "Nine white glass Christmas ball ornaments with silver caps",
    card_hook: "Nine white glass balls that keep a lit tree quiet instead of busy.",
    editor_note:
      "Nine white glass ornaments for a tree that is already carrying its share of gold. They are real glass rather than plastic, plain white with a soft sheen and nothing glittered, printed or flocked, which is what lets them sit beside champagne bows without turning the tree busy. At three inches across they hold their own on a four foot tree, and nine is enough to lift a bare branch or two without crowding the rest. Store them back in their own divided box, because glass chips.",
    price: 17.99,
    rating: 4.6,
    review_count: 776,
    image_url: "https://m.media-amazon.com/images/I/61hH94SGBsL._AC_SL1500_.jpg",
  },
  {
    slot: 2,
    asin: "B000VA4D1G",
    replaces: 483,
    pinPage: "/pin/holiday-hosting-table",
    pinNumber: 1,
    discLabel: "CUT CRYSTAL PITCHER",
    collection: "holiday-hosting-edit",
    room: "dining-room",
    name: "Cut Crystal Glass Pitcher with Handle, 46 Oz",
    display_title: "Cut Crystal Glass Pitcher with Handle, 46 Oz",
    full_name: "Godinger Pitcher, Crystal, 46 Oz",
    brand: "Godinger",
    seo_slug: "cut-crystal-glass-pitcher-with-handle-46-oz",
    seo_title: "Cut Crystal Glass Pitcher with Handle, 46 Oz | Evergreen House",
    seo_description:
      "A cut crystal pitcher with a handle that holds 46 ounces, chosen for the Holiday Hosting Edit at Evergreen House: weight in the hand, clarity on the table.",
    image_alt: "Cut crystal glass pitcher with a handle, 46 ounces",
    card_hook: "Cut crystal that echoes the votives and holds a whole batch of eggnog.",
    editor_note:
      "A cut crystal pitcher for the drinks nobody wants to pour twice. Forty six ounces is a full batch of eggnog, a jug of cider or water for six, so it goes to the table once and stays there. The cut pattern catches the candlelight the way the votives on the same table do, and the handle is wide enough to take a full pitcher one handed. Crystal rather than soda glass, so it is heavier than it looks and should be washed by hand.",
    price: 24.99,
    rating: 4.8,
    review_count: 939,
    image_url: "https://m.media-amazon.com/images/I/81+ZfrK21tL._AC_SL1500_.jpg",
  },
];

for (const row of APPROVED) {
  row.amazon_url = `https://www.amazon.com/dp/${row.asin}${TAG}`;
  row.availability = "in_stock";
  row.quality_score = 9;
  row.import_batch = BATCH;
}

/* ── database ────────────────────────────────────────────────────────────── */

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

function asinOf(url) {
  const m = String(url || "").match(/\/dp\/([A-Z0-9]{10})/);
  return m ? m[1] : null;
}

function money(value) {
  if (value === null || value === undefined) return "-";
  return `$${Number(value).toFixed(2)}`;
}

/** House style: no em-dashes, no en-dashes, no curly quotes, no British -our. */
const SPELLING = [
  [/\u2014/, "em-dash"],
  [/\u2013/, "en-dash"],
  [/[\u2018\u2019]/, "curly quote"],
  [/[\u201c\u201d]/, "curly quote"],
  [/\bfibres\b/i, "fibres"],
  [/\bfibre\b/i, "fibre"],
  [/\bcolours\b/i, "colours"],
  [/\bcolour\b/i, "colour"],
  [/\bgrey\b/i, "grey"],
  [/\bcentre\b/i, "centre"],
  [/\bcentres\b/i, "centres"],
  [/\bfavourite\b/i, "favourite"],
  [/\bjewellery\b/i, "jewellery"],
  [/\bflavour\b/i, "flavour"],
  [/\btheatre\b/i, "theatre"],
  [/\borganisation\b/i, "organisation"],
  [/\bpersonalised\b/i, "personalised"],
  [/\blitre\b/i, "litre"],
  [/\bmetre\b/i, "metre"],
  [/\bdefence\b/i, "defence"],
  [/\bcatalogue\b/i, "catalogue"],
  [/\bcosy\b/i, "cosy"],
  [/\bmoulded\b/i, "moulded"],
  [/\bmoulding\b/i, "moulding"],
];

function houseStyle(value, label) {
  const text = String(value ?? "");
  for (const [pattern, name] of SPELLING) {
    if (pattern.test(text)) fail(`${label} carries a house-style breach: ${name}`);
  }
  return text;
}

/* ── 1. the approved figures still match the merchandiser's file ─────────── */

const curation = JSON.parse(readFileSync(CURATION, "utf8"));
for (const row of APPROVED) {
  const slot = curation.slots.find((s) => Number(s.slot) === row.slot);
  if (!slot) {
    fail(`curation file has no slot ${row.slot}`);
    continue;
  }
  if (Number(slot.replaces_product_id) !== row.replaces) {
    fail(`slot ${row.slot}: curation file replaces id ${slot.replaces_product_id}, script says ${row.replaces}`);
  }
  const candidate = (slot.candidates || []).find((c) => Number(c.rank) === 1);
  if (!candidate) {
    fail(`slot ${row.slot}: curation file has no candidate rank 1`);
    continue;
  }
  const checks = [
    ["asin", candidate.asin, row.asin],
    ["price", Number(candidate.price_usd), row.price],
    ["rating", Number(candidate.rating), row.rating],
    ["review_count", Number(candidate.review_count), row.review_count],
    ["display_title", candidate.display_title, row.display_title],
    ["card_line", candidate.card_line, row.card_hook],
    ["image", candidate.main_image_url, row.image_url],
  ];
  for (const [field, fromFile, fromScript] of checks) {
    if (String(fromFile) !== String(fromScript)) {
      fail(`slot ${row.slot} ${field}: curation file says "${fromFile}", script says "${fromScript}"`);
    }
  }
  if (!String(candidate.availability || "").toLowerCase().includes("in stock")) {
    fail(`slot ${row.slot}: curation file does not record In Stock`);
  }
  if (String(candidate.verified_on) !== CHECKED_AT) {
    fail(`slot ${row.slot}: curation file verified_on ${candidate.verified_on}, expected ${CHECKED_AT}`);
  }
}

/* ── 2. per-row sanity, before touching the database ─────────────────────── */

for (const row of APPROVED) {
  houseStyle(row.name, `${row.asin} name`);
  houseStyle(row.full_name, `${row.asin} full_name`);
  houseStyle(row.display_title, `${row.asin} display_title`);
  houseStyle(row.card_hook, `${row.asin} card_hook`);
  houseStyle(row.editor_note, `${row.asin} editor_note`);
  houseStyle(row.seo_title, `${row.asin} seo_title`);
  houseStyle(row.seo_description, `${row.asin} seo_description`);
  houseStyle(row.image_alt, `${row.asin} image_alt`);
  houseStyle(row.seo_slug, `${row.asin} seo_slug`);
  if (row.amazon_url !== `https://www.amazon.com/dp/${row.asin}${TAG}`) {
    fail(`${row.asin}: amazon_url does not carry the Associates tag`);
  }
  if (!(row.rating >= 4.3)) fail(`${row.asin}: rating ${row.rating} is below the 4.3 gate`);
  if (!(row.price > 0)) fail(`${row.asin}: price must be a real number`);
  if (!(row.review_count > 0)) fail(`${row.asin}: review count must be a real number`);
  if (row.seo_slug !== productNameToSlug(row.name)) {
    fail(`${row.asin}: seo_slug "${row.seo_slug}" is not productNameToSlug(name) "${productNameToSlug(row.name)}"`);
  }
}

/* ── 3. the images are real, downloaded and decoded ──────────────────────── */

const imageFacts = new Map();
for (const row of APPROVED) {
  try {
    const res = await fetch(row.image_url, { headers: { "user-agent": "Mozilla/5.0" } });
    const type = res.headers.get("content-type") || "";
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!res.ok) fail(`${row.asin}: image returned HTTP ${res.status}`);
    if (!type.startsWith("image/")) fail(`${row.asin}: image content-type is "${type}"`);
    if (bytes.length <= 5120) fail(`${row.asin}: image is only ${bytes.length} bytes (placeholder trap)`);
    const meta = await sharp(bytes).metadata();
    if (!meta.width || !meta.height) fail(`${row.asin}: image does not decode`);
    else if (meta.width < 800 || meta.height < 800) {
      fail(`${row.asin}: image is only ${meta.width}x${meta.height}`);
    }
    imageFacts.set(row.asin, { status: res.status, type, bytes: bytes.length, width: meta.width, height: meta.height, format: meta.format });
  } catch (err) {
    fail(`${row.asin}: image could not be downloaded or decoded (${err.message})`);
  }
}

/* ── 4. the catalog: ASINs, slugs, the retired rows, the rooms ───────────── */

const all = await db`SELECT id, name, seo_slug, amazon_url, room, is_active, display_title, import_batch, quality_score, price, rating, review_count FROM products`;
const byId = new Map(all.map((r) => [Number(r.id), r]));
const totalBefore = all.length;
const activeBefore = all.filter((r) => r.is_active).length;

const storedSlugs = new Map();
const derivedSlugs = new Map();
for (const r of all) {
  const stored = typeof r.seo_slug === "string" ? r.seo_slug.trim() : "";
  if (stored) storedSlugs.set(stored, Number(r.id));
  const derived = productNameToSlug(r.name);
  if (derived && !derivedSlugs.has(derived)) derivedSlugs.set(derived, Number(r.id));
}

const existing = new Map();
for (const row of APPROVED) {
  const holders = all.filter((r) => asinOf(r.amazon_url) === row.asin);
  const ours = holders.filter((r) => r.import_batch === BATCH);
  if (holders.length > 0 && ours.length === 0) {
    fail(`${row.asin} already lives on row ${holders.map((r) => r.id).join(", ")}, which is not this batch`);
  }
  if (ours.length > 1) fail(`${row.asin} is already on ${ours.length} rows of this batch`);
  if (ours.length === 1) {
    existing.set(row.asin, ours[0]);
    notes.push(`${row.asin} is already imported as id ${ours[0].id}: it will be reused, not inserted again`);
  }
  const clashStored = storedSlugs.get(row.seo_slug);
  if (clashStored !== undefined && !ours.some((r) => Number(r.id) === clashStored)) {
    fail(`${row.asin}: seo_slug "${row.seo_slug}" is already stored on id ${clashStored}`);
  }
  const clashDerived = derivedSlugs.get(row.seo_slug);
  if (clashDerived !== undefined && !ours.some((r) => Number(r.id) === clashDerived)) {
    fail(`${row.asin}: seo_slug "${row.seo_slug}" collides with productNameToSlug(name) of id ${clashDerived}`);
  }
}
if (APPROVED[0].seo_slug === APPROVED[1].seo_slug) fail("the two new rows share one seo_slug");

/* the retired rows must still exist and must still be off the lists */
for (const row of APPROVED) {
  const retired = byId.get(row.replaces);
  if (!retired) fail(`retired row ${row.replaces} is missing from the catalog`);
  else if (retired.import_batch === BATCH) fail(`row ${row.replaces} is in this batch, which is wrong`);
  else notes.push(`retired row ${row.replaces} ("${retired.display_title}") stays in the catalog untouched: id ${retired.id}, active ${retired.is_active}, room ${retired.room}`);
}

/* room pages: what changes, counted the way each page counts */
const hidden = JSON.parse(readFileSync(new URL("../src/data/holiday-hidden-products.json", import.meta.url), "utf8"));
const hiddenIds = new Set(hidden.hidden.map((h) => Number(h.id)));

function roomActive(room) {
  return all.filter((r) => r.room === room && r.is_active).length;
}
function holidayRendered() {
  return all.filter((r) => r.room === "holiday" && r.is_active && !hiddenIds.has(Number(r.id))).length;
}

const roomReport = [
  {
    room: "holiday",
    page: "/room/holiday",
    adding: APPROVED.filter((r) => r.room === "holiday").length,
    before: holidayRendered(),
    after: holidayRendered() + APPROVED.filter((r) => r.room === "holiday").length,
    note: "the holiday page renders its three sets from src/data/holiday-sets.json and puts everything else in More Christmas Finds, so a new holiday row lands in that last bucket and the three sets keep their exact membership",
  },
  {
    room: "dining-room",
    page: "/room/dining-room",
    adding: APPROVED.filter((r) => r.room === "dining-room").length,
    before: roomActive("dining-room"),
    after: roomActive("dining-room") + APPROVED.filter((r) => r.room === "dining-room").length,
    note: "a plain room grid sorted by pin_rank then quality_score, so the new row sorts after the four pinned rows",
  },
];

/* ── 5. the plan, printed before anything is written ─────────────────────── */

console.log("Pin disc replacements, 2026-11-04");
console.log(`  mode            ${APPLY ? "APPLY (one transaction)" : "dry run (nothing is written)"}`);
console.log(`  verified at     ${CHECKED_AT}`);
console.log(`  rows to insert  ${APPROVED.filter((r) => !existing.has(r.asin)).length} (${existing.size} already imported by this batch)`);
console.log(`  catalog now     ${totalBefore} rows, ${activeBefore} active -> ${totalBefore + APPROVED.filter((r) => !existing.has(r.asin)).length} rows after`);
console.log("");
console.log("  slot  ASIN        price    rating  reviews  room          seo_slug");
for (const row of APPROVED) {
  console.log(
    `  ${String(row.slot).padEnd(5)} ${row.asin.padEnd(11)} ${money(row.price).padEnd(8)} ${String(row.rating).padEnd(7)} ` +
      `${String(row.review_count).padEnd(8)} ${row.room.padEnd(13)} ${row.seo_slug}`,
  );
}
console.log("");
console.log("  pin page                          n  label                     replaces  room page");
for (const row of APPROVED) {
  console.log(
    `  ${row.pinPage.padEnd(32)} ${String(row.pinNumber).padStart(2)} ${row.discLabel.padEnd(25)} ` +
      `${String(row.replaces).padEnd(9)} /room/${row.room}`,
  );
}
console.log("");
console.log("  images downloaded, decoded and verified");
for (const [asin, fact] of imageFacts) {
  console.log(`  ${asin}  HTTP ${fact.status}  ${fact.type}  ${fact.width}x${fact.height}  ${fact.bytes} bytes  ${fact.format}`);
}
console.log("");
console.log("  room pages that change");
for (const r of roomReport) {
  console.log(`  ${r.page.padEnd(22)} ${String(r.before).padStart(3)} -> ${String(r.after).padStart(3)} cards  (+${r.adding})`);
  console.log(`     ${r.note}`);
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

/* ── 6. write: one transaction, or nothing ──────────────────────────────── */

const now = new Date().toISOString();
const toInsert = APPROVED.filter((row) => !existing.has(row.asin));

function buildInsert(rows) {
  const cols = [
    "name", "full_name", "room", "amazon_url", "price", "rating", "review_count",
    "availability", "price_checked_at", "brand", "editor_note", "seo_slug", "seo_title",
    "seo_description", "image_url", "image_alt", "display_title", "card_hook",
    "quality_score", "import_batch", "is_active", "data_version", "updated_at",
  ];
  const params = [];
  const tuples = rows.map((row) => {
    const values = [
      row.name, row.full_name, row.room, row.amazon_url, row.price, row.rating, row.review_count,
      row.availability, CHECKED_AT, row.brand, row.editor_note, row.seo_slug, row.seo_title,
      row.seo_description, row.image_url, row.image_alt, row.display_title, row.card_hook,
      row.quality_score, row.import_batch, true, 1, now,
    ];
    const placeholders = values.map((v) => {
      params.push(v);
      return `$${params.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const text = `INSERT INTO products (${cols.join(", ")}) VALUES ${tuples.join(", ")}
    RETURNING id, name, seo_slug, amazon_url, price, rating, review_count, availability, price_checked_at, card_hook, room, import_batch, image_url, quality_score`;
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
      RETURNING id, seo_slug`,
    [BATCH],
  );
}

const statements = [];
if (toInsert.length) statements.push(buildInsert(toInsert));
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
const backfilled = results[results.length - 1] || [];

/* the ids, whichever way they arrived */
const resolved = [];
for (const row of APPROVED) {
  const fresh = inserted.find((r) => asinOf(r.amazon_url) === row.asin);
  const prior = existing.get(row.asin);
  const id = fresh ? Number(fresh.id) : prior ? Number(prior.id) : null;
  if (!id) fail(`${row.asin} did not come back with an id`);
  resolved.push({ ...row, id });
}

/* read the rows back: the write is only done if the table agrees */
const readBack = await db`SELECT id, name, display_title, room, seo_slug, amazon_url, price, rating, review_count, availability, price_checked_at, card_hook, image_url, is_active, quality_score, full_text_search IS NOT NULL AS has_search, import_batch FROM products WHERE id = ANY(${resolved.map((r) => r.id)})`;
for (const row of resolved) {
  const live = readBack.find((r) => Number(r.id) === row.id);
  if (!live) {
    fail(`id ${row.id} did not read back`);
    continue;
  }
  const checks = [
    ["name", live.name, row.name],
    ["display_title", live.display_title, row.display_title],
    ["seo_slug", live.seo_slug, row.seo_slug],
    ["amazon_url", live.amazon_url, row.amazon_url],
    ["room", live.room, row.room],
    ["card_hook", live.card_hook, row.card_hook],
    ["image_url", live.image_url, row.image_url],
    ["availability", live.availability, "in_stock"],
    ["rating", Number(live.rating), row.rating],
    ["review_count", Number(live.review_count), row.review_count],
    ["price", Number(live.price), row.price],
    ["is_active", live.is_active, true],
    ["import_batch", live.import_batch, BATCH],
  ];
  for (const [field, got, want] of checks) {
    if (String(got) !== String(want)) fail(`id ${row.id} ${field}: table has "${got}", expected "${want}"`);
  }
  if (!live.has_search) fail(`id ${row.id} has no full_text_search vector`);
  /* A date column comes back as a Date from the driver, not a string. */
  const checkedDay = live.price_checked_at instanceof Date
    ? live.price_checked_at.toISOString().slice(0, 10)
    : String(live.price_checked_at).slice(0, 10);
  if (checkedDay !== CHECKED_AT) fail(`id ${row.id} price_checked_at is ${checkedDay}`);
}

if (problems.length) {
  console.error("");
  console.error("The transaction committed but the read-back failed:");
  for (const p of problems) console.error(`  * ${p}`);
  process.exit(1);
}

const after = await db`SELECT count(*)::int AS n, count(*) FILTER (WHERE is_active)::int AS active FROM products`;

const proof = {
  batch: BATCH,
  applied_at: new Date().toISOString(),
  verified_at: CHECKED_AT,
  source: CURATION,
  catalog: { rows_before: totalBefore, rows_after: after[0].n, active_before: activeBefore, active_after: after[0].active },
  rows: resolved.map((row) => ({
    id: row.id,
    asin: row.asin,
    name: row.name,
    display_title: row.display_title,
    room: row.room,
    seo_slug: row.seo_slug,
    amazon_url: row.amazon_url,
    price: row.price,
    rating: row.rating,
    review_count: row.review_count,
    availability: row.availability,
    price_checked_at: CHECKED_AT,
    image_url: row.image_url,
    image: imageFacts.get(row.asin) ?? null,
    card_hook: row.card_hook,
    replaces_product_id: row.replaces,
    pin_page: row.pinPage,
    pin_number: row.pinNumber,
    disc_label: row.discLabel,
    collection: row.collection,
  })),
  rooms: roomReport,
  retired_rows_untouched: APPROVED.map((row) => row.replaces),
};

writeFileSync(PROOF, `${JSON.stringify(proof, null, 2)}\n`);

console.log("");
console.log("Applied in one transaction");
console.log(`  inserted   ${inserted.length} rows`);
console.log(`  search     ${backfilled.length} rows got a full_text_search vector`);
console.log(`  catalog    ${after[0].n} rows, ${after[0].active} active`);
console.log("");
console.log("  id   ASIN        price    rating  reviews  room          checked      slug");
for (const row of resolved) {
  console.log(
    `  ${String(row.id).padEnd(4)} ${row.asin.padEnd(11)} ${money(row.price).padEnd(8)} ${String(row.rating).padEnd(7)} ` +
      `${String(row.review_count).padEnd(8)} ${row.room.padEnd(13)} ${CHECKED_AT}  ${row.seo_slug}`,
  );
}
console.log("");
console.log(`proof written to ${PROOF}`);
console.log("next: bun run scripts/patch-pin-disc-edits.mjs --apply, then bun run scripts/build-pin-pages.mjs --apply");
