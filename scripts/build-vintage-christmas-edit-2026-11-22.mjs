/**
 * The Vintage Christmas Edit, 2026-11-22.
 * Source: /home/team/shared/curation/vintage-christmas-2026-11-22.json
 * (merchandiser verification pass, all nine pieces read live on 2026-11-22 and
 * approved by the owner by number, decision 48).
 *
 * Three things happen here, in this order, all reversible:
 *   1. the nine pieces are imported as products, active, room holiday, every
 *      number the live Amazon read dated 2026-11-22 (image_url filled after by
 *      scripts/fetch-amazon-images.ts, which only ever writes that column);
 *   2. the collection is created: `edits` and `edit_items` (the draft), nine
 *      rows in the owner's order, each carrying its own hook line;
 *   3. the collection is published: `edit_publications` (the snapshot the public
 *      page renders), nine cards.
 *
 * The product rows carry `seo_slug` set to the manifest slug so the card link
 * and the product route cannot disagree.
 *
 * The hero art (vintage-christmas-hero, -mobile and -card) is already on main in
 * public/images; this script only points the collection at it.
 *
 * Usage:
 *   bun run scripts/build-vintage-christmas-edit-2026-11-22.mjs            # apply
 *   bun run scripts/build-vintage-christmas-edit-2026-11-22.mjs --dry-run  # checks only
 *   bun run scripts/build-vintage-christmas-edit-2026-11-22.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes, no en-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const MANIFEST = "/home/team/shared/curation/vintage-christmas-2026-11-22.json";
const BACKUP = "/home/team/shared/curation/vintage-christmas-2026-11-22-backup.json";
const SITE = "/home/team/shared/site";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

const BATCH = "vintage-christmas-2026-11-22";
const CHECKED_AT = "2026-11-22";
const HERO = "/images/vintage-christmas-hero";
const CARD = "/images/vintage-christmas-hero-card";
const MOBILE = "/images/vintage-christmas-hero-mobile";
const ROOM = "holiday";
const COLLECTION = "holiday-look";
const SORT_ORDER = 9;

/** One editorial line per product, used as the product page meta description
 *  (editor_note is sliced to 160 characters there). */
const NOTES = {
  "1917694210":
    "A Christmas Carol in the 1843 illustrated edition, the ghost story the season was built on, read aloud by lamplight.",
  "0785232222":
    "Classic Christmas stories and seasonal poetry in one giftable volume, the book that gets passed around the room.",
  B0C5RZN5D3:
    "The Rudolph of the 1964 special, blown glass and hand painted, boxed for the years it will be kept.",
  B0FHJTG4KD:
    "Two cotton kitchen towels printed with an old fashioned tree and snowman, 16 by 24 inches, hung on the oven door.",
  B01FPT2R9C:
    "A weathered green tin bowl with a vintage sleigh ride advert, 4 by 6.5 inches, for keys at the door or candy canes.",
  B0FCRMDSJK:
    "Ten golden bells on velvet bows, a set to hang through the tree and along a mantel with no tinsel in sight.",
  B0H953R88K:
    "A winter village printed like an old postage stamp, framed in wood at 12 by 16 inches for the entryway.",
  B0FKT6PMKF:
    "A low pile green runner with a tree print, 2 by 6 feet, washable, so the tree greets you at the front door.",
  B0HGY5F6WC:
    "A small framed nutcracker canvas, 8 by 10 inches, the print that finishes a narrow wall above a bench.",
};

/** product_type is free text in the catalog, but keep to the vocabulary the
 *  other holiday rows already use. */
const TYPE_MAP = { art: "wall-art", ornament: "decor" };

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

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const collection = manifest.collections[0];
const items = collection.items.slice().sort((a, b) => a.position - b.position);
const NEW = items.filter((i) => i.new_pick);

/* ---------------------------------------------------------- revert path */

if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No back-up at ${BACKUP}: nothing to revert.`);
  const back = JSON.parse(readFileSync(BACKUP, "utf8"));

  const editRow = await db`SELECT id FROM edits WHERE slug = ${back.slug}`;
  if (editRow.length === 1) {
    await db`DELETE FROM edit_publications WHERE edit_id = ${editRow[0].id}`;
    await db`DELETE FROM edit_items WHERE edit_id = ${editRow[0].id}`;
    await db`DELETE FROM edits WHERE id = ${editRow[0].id}`;
    console.log(`Removed the collection (edits id ${editRow[0].id}, items, snapshot).`);
  } else {
    console.log("No collection row to remove.");
  }

  if (back.inserted_product_ids.length > 0) {
    const del = await db`DELETE FROM products WHERE id = ANY(${back.inserted_product_ids}::int[])
                          RETURNING id`;
    console.log(`Removed ${del.length} imported product(s): ${del.map((r) => r.id).join(", ")}`);
  }

  console.log("\nRevert done.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

if (collection.slug !== "vintage-christmas-edit") fail(`Unexpected collection slug ${collection.slug}.`);
if (items.length !== 9) fail(`Manifest carries ${items.length} items, expected 9.`);
if (collection.item_count !== 9) fail(`Manifest item_count is ${collection.item_count}, expected 9.`);
if (NEW.length !== 9) fail(`Manifest carries ${NEW.length} new picks, expected 9.`);

const positions = items.map((i) => i.position);
if (new Set(positions).size !== 9) fail("Manifest positions are not unique.");
if (positions.join(",") !== "1,2,3,4,5,6,7,8,9") fail(`Positions are ${positions.join(",")}, expected 1 to 9.`);

const bad = [];
for (const item of items) {
  const text = [item.name, item.hook, item.raw_amazon_title, NOTES[item.asin], collection.headline, collection.intro, collection.title]
    .filter(Boolean)
    .join(" ");
  if (/[\u2014\u2013]/.test(text)) bad.push(`${item.position}: contains an em-dash or en-dash`);
  if (!item.amazon_url.includes("tag=crystalcost09-20")) bad.push(`${item.position}: amazon_url has no affiliate tag`);
  if (!item.amazon_url.includes(`/dp/${item.asin}`)) bad.push(`${item.position}: amazon_url is not the ${item.asin} dp link`);
  if (num(item.rating) === null || num(item.rating) < 4.3) bad.push(`${item.position}: rating ${item.rating} is below the 4.3 bar`);
  if (num(item.price) === null) bad.push(`${item.position}: no price`);
  if (num(item.review_count) === null) bad.push(`${item.position}: no review count`);
  if (item.verified_date !== CHECKED_AT) bad.push(`${item.position}: verified ${item.verified_date}, expected ${CHECKED_AT}`);
  if (item.buy_box !== "live") bad.push(`${item.position}: buy box is ${item.buy_box}`);
  if (!item.hook || item.hook.length < 20) bad.push(`${item.position}: hook line is missing or too short`);
  const note = NOTES[item.asin];
  if (!note) bad.push(`${item.position}: no editor note for ${item.asin}`);
  else if (note.length > 160) bad.push(`${item.position}: editor note is ${note.length} chars, over 160`);
}
if (bad.length) fail(`Manifest will not pass the card gates:\n  ${bad.join("\n  ")}`);

for (const file of [HERO, CARD, MOBILE]) {
  for (const ext of ["jpg", "webp"]) {
    if (!existsSync(`${SITE}/public${file}.${ext}`)) bad.push(`missing art public${file}.${ext}`);
  }
}
if (bad.length) fail(`Hero art is incomplete:\n  ${bad.join("\n  ")}`);

const existingEdit = await db`SELECT id, slug, status FROM edits WHERE slug = ${collection.slug}`;
if (existingEdit.length > 0) fail(`An edit with slug ${collection.slug} already exists (id ${existingEdit[0].id}).`);

const asins = NEW.map((i) => i.asin);
const clashes = await db`SELECT id, name, amazon_url FROM products WHERE amazon_url ~ ${asins.join("|")}`;
if (clashes.length > 0) fail(`Already in the catalog: ${clashes.map((c) => `${c.id} ${c.name}`).join("; ")}`);

const slugClashes = await db`SELECT id, name, seo_slug FROM products WHERE seo_slug = ANY(${NEW.map((i) => i.slug)})`;
if (slugClashes.length > 0) fail(`Slug already taken: ${slugClashes.map((c) => `${c.id} ${c.seo_slug}`).join("; ")}`);

console.log(`Checks passed: ${NEW.length} new picks, 9 positions, no dashes, hero art present.`);

if (DRY) {
  console.log(`\nDry run: no write. Back-up would go to ${BACKUP}`);
  for (const item of NEW) {
    console.log(`  import ${item.position}. ${item.asin} ${item.name} (${item.price}, ${item.rating}, ${item.review_count})`);
  }
  console.log(`\nWould import ${NEW.length} and publish ${collection.slug} with ${items.length} pieces at sort_order ${SORT_ORDER}.`);
  process.exit(0);
}

/* ---------------------------------------------------------------- backup */

const backup = {
  collection: BATCH,
  written_at: new Date().toISOString(),
  slug: collection.slug,
  products: [],
  inserted_product_ids: [],
};
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
console.log(`\nBack-up written: ${BACKUP}`);

/* ------------------------------------------------------ 1. import products */

const cols = [
  "name", "full_name", "room", "collection", "amazon_url", "price", "rating", "review_count",
  "availability", "price_currency", "price_checked_at", "editor_note", "seo_slug",
  "image_alt", "display_title", "card_hook", "product_type", "quality_score",
  "import_batch", "is_active", "data_version", "updated_at",
];
const params = [];
const tuples = NEW.map((item) => {
  const values = [
    item.name,
    item.raw_amazon_title || item.name,
    ROOM,
    COLLECTION,
    item.amazon_url,
    Number(item.price),
    Number(item.rating),
    Number(item.review_count),
    "in_stock",
    "USD",
    CHECKED_AT,
    NOTES[item.asin],
    item.slug,
    `${item.name} styled for Christmas at Evergreen House`,
    item.name,
    item.hook,
    TYPE_MAP[item.product_type] || item.product_type || null,
    9,
    BATCH,
    true,
    1,
    new Date().toISOString(),
  ];
  const placeholders = values.map((v) => {
    params.push(v);
    return `$${params.length}`;
  });
  return `(${placeholders.join(", ")})`;
});
const inserted = await db.query(
  `INSERT INTO products (${cols.join(", ")}) VALUES ${tuples.join(", ")}
   RETURNING id, name, seo_slug, amazon_url, price, rating, review_count, is_active, room`,
  params,
);
if (inserted.length !== NEW.length) fail(`Imported ${inserted.length} products, expected ${NEW.length}.`);
console.log(`\nImported ${inserted.length} products:`);
for (const r of inserted) console.log(`  ${r.id} ${r.name} (${r.price}, ${r.rating}, ${r.review_count})`);

backup.inserted_product_ids = inserted.map((r) => Number(r.id));
writeFileSync(BACKUP, JSON.stringify(backup, null, 2));

/* ------------------------------------------------- 2. the collection itself */

const editInsert = await db`
  INSERT INTO edits (slug, title, headline, intro, art_note, hero_image, card_image, related, status, sort_order, updated_at)
  VALUES (${collection.slug}, ${collection.title}, ${collection.headline}, ${collection.intro},
          ${collection.art_note}, ${HERO}, ${CARD}, NULL, 'published', ${SORT_ORDER}, now())
  RETURNING id, slug, status, sort_order`;
if (editInsert.length !== 1) fail("The collection row was not written.");
const editId = Number(editInsert[0].id);
console.log(`\nCollection row written: id ${editId}, slug ${editInsert[0].slug}, status ${editInsert[0].status}, sort_order ${editInsert[0].sort_order}`);

/* The nine pieces, in the owner's order, keyed on the id the import returned. */
const idByAsin = new Map(inserted.map((r) => [(String(r.amazon_url).match(/\/dp\/([A-Z0-9]{10})/) || [])[1], Number(r.id)]));
const resolved = items.map((item) => ({ item, productId: idByAsin.get(item.asin) }));
const unresolved = resolved.filter((r) => !Number.isInteger(r.productId));
if (unresolved.length) fail(`No product id for position(s) ${unresolved.map((u) => u.item.position).join(", ")}.`);

const itemParams = [];
const itemTuples = resolved.map(({ item, productId }) => {
  const values = [editId, productId, item.position, item.name, item.raw_amazon_title || item.name, item.slug, item.hook, Boolean(item.raw_name)];
  const placeholders = values.map((v) => {
    itemParams.push(v);
    return `$${itemParams.length}`;
  });
  return `(${placeholders.join(", ")})`;
});
const itemRows = await db.query(
  `INSERT INTO edit_items (edit_id, product_id, position, display_title, name, slug, hook, raw_name)
   VALUES ${itemTuples.join(", ")}
   RETURNING id, product_id, position, display_title, slug, hook`,
  itemParams,
);
if (itemRows.length !== items.length) fail(`Wrote ${itemRows.length} edit items, expected ${items.length}.`);
console.log(`Edit items written: ${itemRows.length}`);
for (const r of itemRows.slice().sort((a, b) => a.position - b.position)) {
  console.log(`  ${r.position}. ${r.display_title} -> product ${r.product_id} (${r.slug})`);
  console.log(`     hook: ${r.hook}`);
}

/* The snapshot the public page renders. Same shape `setEditPublication` writes
   in src/lib/admin-edits.ts, so the admin screen reads it back unchanged. */
const snapshot = {
  slug: collection.slug,
  title: collection.title,
  headline: collection.headline,
  intro: collection.intro,
  art_note: collection.art_note,
  hero_image: HERO,
  card_image: CARD,
  items: resolved.map(({ item, productId }) => ({
    id: productId,
    slug: item.slug,
    name: item.raw_amazon_title || item.name,
    display_title: item.name,
    hook: item.hook,
    raw_name: Boolean(item.raw_name),
  })),
};
const published = await db.query(
  `INSERT INTO edit_publications (edit_id, published_at, snapshot)
   VALUES ($1, NOW(), $2::jsonb)
   ON CONFLICT (edit_id) DO UPDATE SET published_at = NOW(), snapshot = EXCLUDED.snapshot
   RETURNING edit_id, jsonb_array_length(snapshot->'items') AS n`,
  [editId, JSON.stringify(snapshot)],
);
console.log(`Snapshot published: edit ${published[0].edit_id}, ${published[0].n} cards`);

/* ------------------------------------------------------------- read-back */

const live = await db`
  SELECT e.slug, e.status, e.hero_image, e.card_image, e.sort_order,
         jsonb_array_length(p.snapshot->'items') AS n
    FROM edits e JOIN edit_publications p ON p.edit_id = e.id
   WHERE e.id = ${editId}`;
if (live.length !== 1 || live[0].status !== "published") fail("Read-back: the collection is not published.");
if (Number(live[0].n) !== 9) fail(`Read-back: snapshot carries ${live[0].n} cards, expected 9.`);
console.log(`\nRead-back: ${live[0].slug} is ${live[0].status}, ${live[0].n} cards, hero ${live[0].hero_image}, card ${live[0].card_image}, sort_order ${live[0].sort_order}`);

const withImages = await db`SELECT count(*)::int AS n FROM products WHERE id = ANY(${backup.inserted_product_ids}::int[]) AND image_url IS NOT NULL`;
console.log(`Imported rows with an image so far: ${withImages[0].n} of ${backup.inserted_product_ids.length} (scripts/fetch-amazon-images.ts fills the rest)`);
