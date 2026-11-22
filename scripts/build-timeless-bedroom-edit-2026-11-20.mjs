/**
 * The Timeless Bedroom Edit, 2026-11-20.
 * Source: /home/team/shared/curation/timeless-bedroom-2026-11-20.json
 * (merchandiser curation, owner approved all seven new picks by number).
 *
 * Three things happen here, in this order, all reversible:
 *   1. seven new picks are imported as products, active, room bedroom, every
 *      number the live Amazon read dated 2026-11-20 (image_url filled after by
 *      scripts/fetch-amazon-images.ts, which only ever writes that column);
 *   2. three existing catalog rows are refreshed to the manifest's live read
 *      (433 Foindtower covers, 251 MIULEE lumbar, 258 framed abstract art);
 *   3. the collection is created and published: `edits`, `edit_items` (the
 *      draft) and `edit_publications` (the snapshot the public page renders),
 *      with the ten pieces in the owner's stated order.
 *
 * The product rows carry `seo_slug` set to the manifest slug, because four of
 * the seven clean names slugify differently from the curated slug (Amazon
 * "Simple and Opulence" -> "simple-and-opulence" where the curation file says
 * "simple-opulence"). Without it the card link and the product route disagree
 * and the card 404s.
 *
 * Usage:
 *   bun run scripts/build-timeless-bedroom-edit-2026-11-20.mjs            # apply
 *   bun run scripts/build-timeless-bedroom-edit-2026-11-20.mjs --dry-run  # checks only
 *   bun run scripts/build-timeless-bedroom-edit-2026-11-20.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes, no en-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const MANIFEST = "/home/team/shared/curation/timeless-bedroom-2026-11-20.json";
const BACKUP = "/home/team/shared/curation/timeless-bedroom-2026-11-20-backup.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

const BATCH = "timeless-bedroom-2026-11-20";
const CHECKED_AT = "2026-11-20";
const HERO = "/images/timeless-bedroom-hero";
const TAG = "?tag=crystalcost09-20";
const SORT_ORDER = 8;

/** One editorial line per new product, used as the product page meta
 *  description (editor_note is sliced to 160 characters there). */
const NOTES = {
  B01L8BZLXA:
    "Washed white French flax duvet cover with two shams, soft from the first night and cool through summer.",
  B0CSFM63LK:
    "A pre washed cotton coverlet in charcoal, quilted and light enough to fold from the middle of the bed to the foot.",
  B0FC668VX3:
    "A chunky chenille knit in camel brown, heavy enough to stay put across the foot of the bed.",
  B094N1GLL1:
    "Two white washed linen euro shams at 26 inches square, the pair that props up the sleeping pillows.",
  B097XL8XS9:
    "A ceramic table lamp with a cream fabric shade, 21 inches tall, for warm light on a nightstand.",
  B0DSWC1HQM:
    "A low pile washable rug in faded beige with a vintage floral pattern, sized to sit under a king bed.",
  B0GS5N19HF:
    "Walnut nightstands with two drawers and a charging station, a matched pair for either side of the bed.",
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
function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const collection = manifest.collections[0];
const items = collection.items.slice().sort((a, b) => a.position - b.position);
const NEW = items.filter((i) => i.new_pick);
const CATALOG = items.filter((i) => !i.new_pick && Number.isInteger(i.id));

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

  if (back.products.length > 0) {
    const restored = await db`
      UPDATE products AS p
         SET price = v.price,
             rating = v.rating,
             review_count = v.review_count,
             availability = v.availability,
             price_checked_at = v.price_checked_at
        FROM jsonb_to_recordset(${JSON.stringify(back.products)}::jsonb)
             AS v(id int, price numeric, rating numeric, review_count int, availability text, price_checked_at text)
       WHERE p.id = v.id
      RETURNING p.id`;
    console.log(`Catalog rows restored: ${restored.map((r) => r.id).join(", ")}`);
  }

  console.log("\nRevert done.");
  process.exit(0);
}

/* ---------------------------------------------------------------- checks */

if (collection.slug !== "timeless-bedroom-edit") fail(`Unexpected collection slug ${collection.slug}.`);
if (items.length !== 10) fail(`Manifest carries ${items.length} items, expected 10.`);
if (collection.item_count !== 10) fail(`Manifest item_count is ${collection.item_count}, expected 10.`);
if (NEW.length !== 7) fail(`Manifest carries ${NEW.length} new picks, expected 7.`);
if (CATALOG.length !== 3) fail(`Manifest carries ${CATALOG.length} catalog rows, expected 3.`);

const positions = items.map((i) => i.position);
if (new Set(positions).size !== 10) fail("Manifest positions are not unique.");

const bad = [];
for (const item of items) {
  const text = [item.name, item.hook, item.raw_amazon_title, NOTES[item.asin], collection.headline, collection.intro, collection.title]
    .filter(Boolean)
    .join(" ");
  if (/[\u2014\u2013]/.test(text)) bad.push(`${item.position}: contains an em-dash or en-dash`);
  if (!item.amazon_url.includes("tag=crystalcost09-20")) bad.push(`${item.position}: amazon_url has no affiliate tag`);
  if (num(item.rating) === null || num(item.rating) < 4.3) bad.push(`${item.position}: rating ${item.rating} is below the 4.3 bar`);
  if (num(item.price) === null) bad.push(`${item.position}: no price`);
  if (num(item.review_count) === null) bad.push(`${item.position}: no review count`);
  if (item.new_pick) {
    const note = NOTES[item.asin];
    if (!note) bad.push(`${item.position}: no editor note for ${item.asin}`);
    else if (note.length > 160) bad.push(`${item.position}: editor note is ${note.length} chars, over 160`);
  }
}
if (bad.length) fail(`Manifest will not pass the card gates:\n  ${bad.join("\n  ")}`);

const existingEdit = await db`SELECT id, slug, status FROM edits WHERE slug = ${collection.slug}`;
if (existingEdit.length > 0) fail(`An edit with slug ${collection.slug} already exists (id ${existingEdit[0].id}).`);

const asins = NEW.map((i) => i.asin);
const clashes = await db`SELECT id, name, amazon_url FROM products WHERE amazon_url ~ ${asins.join("|")}`;
if (clashes.length > 0) fail(`Already in the catalog: ${clashes.map((c) => `${c.id} ${c.name}`).join("; ")}`);

const catalogIds = CATALOG.map((i) => i.id);
const catalogRows = await db`SELECT id, name, price, rating, review_count, availability, price_checked_at
                              FROM products WHERE id = ANY(${catalogIds}::int[]) ORDER BY id`;
if (catalogRows.length !== 3) fail(`Expected 3 catalog rows, found ${catalogRows.length}.`);
const byId = new Map(catalogRows.map((r) => [Number(r.id), r]));
for (const item of CATALOG) {
  const row = byId.get(item.id);
  if (!row) fail(`Product ${item.id} is not in the catalog.`);
  const slugRow = await db`SELECT seo_slug FROM products WHERE id = ${item.id}`;
  const storedSlug = (slugRow[0]?.seo_slug || "").trim();
  if (storedSlug && storedSlug !== item.slug) {
    fail(`Product ${item.id} carries seo_slug ${storedSlug}, the manifest says ${item.slug}.`);
  }
}

console.log(`Checks passed: ${NEW.length} new picks, ${CATALOG.length} catalog rows, 10 positions, no dashes.`);
for (const row of catalogRows) {
  const want = CATALOG.find((c) => c.id === Number(row.id));
  console.log(
    `  refresh ${row.id}: price ${row.price} -> ${want.price}, ` +
      `rating ${row.rating} -> ${want.rating}, ` +
      `reviews ${row.review_count} -> ${want.review_count}`,
  );
}

if (DRY) {
  console.log(`\nDry run: no write. Back-up would go to ${BACKUP}`);
  for (const item of NEW) {
    console.log(`  import ${item.asin} ${item.name} (${item.price}, ${item.rating}, ${item.review_count})`);
  }
  console.log(`\nWould import ${NEW.length}, refresh ${CATALOG.length}, and publish ${collection.slug} with ${items.length} pieces at sort_order ${SORT_ORDER}.`);
  process.exit(0);
}

/* ---------------------------------------------------------------- backup */

const backup = {
  collection: BATCH,
  written_at: new Date().toISOString(),
  slug: collection.slug,
  products: catalogRows.map((r) => ({
    id: Number(r.id),
    price: r.price,
    rating: r.rating,
    review_count: Number(r.review_count),
    availability: r.availability,
    price_checked_at: r.price_checked_at ? new Date(r.price_checked_at).toISOString().slice(0, 10) : null,
  })),
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
    "bedroom",
    "bedroom-look",
    item.amazon_url,
    Number(item.price),
    Number(item.rating),
    Number(item.review_count),
    "in_stock",
    "USD",
    CHECKED_AT,
    NOTES[item.asin],
    item.slug,
    `${item.name} styled in a bedroom at Evergreen House`,
    item.name,
    item.hook,
    item.product_type || null,
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

/* --------------------------------------------- 2. refresh the catalog rows */

const refreshed = await db.query(
  `UPDATE products AS p
      SET price = v.price,
          rating = v.rating,
          review_count = v.review_count,
          availability = v.availability,
          price_checked_at = v.price_checked_at::date,
          updated_at = now()
     FROM (VALUES ${CATALOG.map((_, i) => `($${i * 6 + 1}::int, $${i * 6 + 2}::numeric, $${i * 6 + 3}::numeric, $${i * 6 + 4}::int, $${i * 6 + 5}::text, $${i * 6 + 6}::text)`).join(", ")})
       AS v(id, price, rating, review_count, availability, price_checked_at)
    WHERE p.id = v.id
   RETURNING p.id, p.name, p.price, p.rating, p.review_count, p.price_checked_at`,
  CATALOG.flatMap((item) => [
    item.id,
    Number(item.price),
    Number(item.rating),
    Number(item.review_count),
    "in_stock",
    CHECKED_AT,
  ]),
);
if (refreshed.length !== CATALOG.length) fail(`Refreshed ${refreshed.length} rows, expected ${CATALOG.length}.`);
console.log(`\nCatalog rows refreshed to the 2026-11-20 read:`);
for (const r of refreshed) {
  console.log(`  ${r.id} ${r.name}: ${r.price}, ${r.rating}, ${r.review_count}, checked ${new Date(r.price_checked_at).toISOString().slice(0, 10)}`);
}

/* ------------------------------------------------- 3. the collection itself */

const editInsert = await db`
  INSERT INTO edits (slug, title, headline, intro, art_note, hero_image, card_image, related, status, sort_order, updated_at)
  VALUES (${collection.slug}, ${collection.title}, ${collection.headline}, ${collection.intro},
          ${collection.art_note}, ${HERO}, ${HERO}, NULL, 'published', ${SORT_ORDER}, now())
  RETURNING id, slug, status, sort_order`;
if (editInsert.length !== 1) fail("The collection row was not written.");
const editId = Number(editInsert[0].id);
console.log(`\nCollection row written: id ${editId}, slug ${editInsert[0].slug}, status ${editInsert[0].status}, sort_order ${editInsert[0].sort_order}`);

/* The ten pieces, in the owner's order, keyed on the product id the manifest
   names (the three catalog rows) or the id the import just returned. */
const idByAsin = new Map(inserted.map((r) => [(String(r.amazon_url).match(/\/dp\/([A-Z0-9]{10})/) || [])[1], Number(r.id)]));
const resolved = items.map((item) => ({
  item,
  productId: item.new_pick ? idByAsin.get(item.asin) : Number(item.id),
}));
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
   RETURNING id, product_id, position, display_title, slug`,
  itemParams,
);
if (itemRows.length !== items.length) fail(`Wrote ${itemRows.length} edit items, expected ${items.length}.`);
console.log(`Edit items written: ${itemRows.length}`);
for (const r of itemRows.slice().sort((a, b) => a.position - b.position)) {
  console.log(`  ${r.position}. ${r.display_title} -> product ${r.product_id} (${r.slug})`);
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
  card_image: HERO,
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
console.log(`\nRead-back: ${live[0].slug} is ${live[0].status}, ${live[0].n} cards, hero ${live[0].hero_image}, sort_order ${live[0].sort_order}`);

const withImages = await db`SELECT count(*)::int AS n FROM products WHERE id = ANY(${backup.inserted_product_ids}::int[]) AND image_url IS NOT NULL`;
console.log(`Imported rows with an image so far: ${withImages[0].n} of ${backup.inserted_product_ids.length} (scripts/fetch-amazon-images.ts fills the rest)`);
