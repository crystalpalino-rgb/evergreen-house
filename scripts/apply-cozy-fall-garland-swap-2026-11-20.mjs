/**
 * Cozy Fall post: the 6 Ft Fall Garland card comes off.
 *
 * /blog/cozy-fall-decor-finds "Light on the mantel" opens on product 427, the
 * 6 Ft Fall Garland with Lights and Timer. The card claimed 4.5 stars and
 * $20.97; the products row reads 4.1 with 57 reviews, under the 4.3 bar
 * (decision 42). PR #144 fixed the other sixteen unread card numbers and left
 * this one for an owner call; this is that call, answered by taking the card
 * out rather than publishing a 4.1 on a public page.
 *
 * Replacement, same section, same slot, card count unchanged at 13:
 *   567 Romadedi Gold Glass Hurricane Candle Holders, Set of 3
 *   Read live on Amazon 2026-11-20: 4.7 stars, 307 reviews, $28.99 (the
 *   buy-box price to pay; the add-to-cart form carries 28.99), In Stock,
 *   "Sold by Romadedi-US and Fulfilled by Amazon".
 *   Row is active, room fall, in stock, 4.7 stars.
 *
 * The card carries the post's existing dated stamp (verifiedOn), set to the
 * day the numbers were read. Nothing else in the post changes: the intro line
 * about a felt garland over a mantel still describes 455 Felt Pumpkin Bead
 * Garland, which stays in the section, and the acorn note's "costs more than a
 * garland" still refers to that same $12.99 garland two cards up.
 *
 * Note: products.price for 567 still reads 25.99 from the 2026-11-04 pass, so
 * the card shows the live 28.99 read and the row is flagged for the January
 * price re-verification. Nothing in the products table is written here.
 *
 * Usage:
 *   bun run scripts/apply-cozy-fall-garland-swap-2026-11-20.mjs --dry-run
 *   bun run scripts/apply-cozy-fall-garland-swap-2026-11-20.mjs
 *   bun run scripts/apply-cozy-fall-garland-swap-2026-11-20.mjs --revert
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";

const POST = new URL("../src/routes/blog/cozy-fall-decor-finds.tsx", import.meta.url);
const BACKUP_DIR = "/home/team/shared/curation/cozy-fall-garland-swap-2026-11-20";
const BACKUP_FILE = `${BACKUP_DIR}/cozy-fall-decor-finds.before.tsx`;
const MANIFEST_FILE = `${BACKUP_DIR}/manifest.json`;

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/** The card that comes out. */
const OUT = {
  id: 427,
  name: "6 Ft Fall Garland with Lights and Timer",
  cardRating: 4.5,
  cardPrice: 20.97,
};

/** The card that goes in. Live values read on Amazon 2026-11-20. */
const IN = {
  id: 567,
  name: "Gold Glass Hurricane Candle Holders, Set of 3",
  price: 28.99,
  rating: 4.7,
  reviews: 307,
  verifiedOn: "2026-11-20",
  productUrl: "/product/romadedi-gold-hurricane-candlesticks-set-of-3",
  amazonUrl: "https://www.amazon.com/dp/B0DB1S56Q4?tag=crystalcost09-20",
  imageUrl: "https://m.media-amazon.com/images/I/61+mCajVrAL._AC_SL1500_.jpg",
  note:
    "Three matte gold candlesticks with clear hurricane glass, at 17.7, 15.7 and 13.6 inches, which is the detail that makes a mantel read lit rather than decorated: a taper at three heights instead of one lamp. The glass shields the flame, so they hold up beside a door or on a porch, and they are just as at home on a table, a sideboard or a coffee table. Warm metal, clear glass, nothing trendy to date them.",
};

const CARD = `      {
        id: ${IN.id},
        name: "${IN.name}",
        price: ${IN.price},
        rating: ${IN.rating},
        verifiedOn: "${IN.verifiedOn}",
        productUrl: "${IN.productUrl}",
        amazonUrl: "${IN.amazonUrl}",
        imageUrl: "${IN.imageUrl}",
        note: "${IN.note}",
      },
`;

const CARD_START = `      {
        id: ${OUT.id},
`;

function sha(text) {
  return createHash("sha256").update(text).digest("hex");
}

function count(haystack, needle) {
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n += 1;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
}

function fail(message) {
  console.error(`ABORT - nothing was written. ${message}`);
  process.exit(1);
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const file of [new URL("../.env", import.meta.url), new URL("../.env.local", import.meta.url)]) {
    if (!existsSync(file)) continue;
    const match = readFileSync(file, "utf8").match(/^DATABASE_URL=(.*)$/m);
    if (match) return match[1].trim().replace(/^"|"$/g, "");
  }
  return null;
}

if (REVERT) {
  if (!existsSync(BACKUP_FILE)) fail(`no backup at ${BACKUP_FILE}`);
  const backup = readFileSync(BACKUP_FILE, "utf8");
  const current = readFileSync(POST, "utf8");
  if (current === backup) {
    console.log("Already at the pre-swap file. Nothing to revert.");
    process.exit(0);
  }
  if (DRY) {
    console.log(`DRY RUN - would restore ${BACKUP_FILE} over the post (${backup.length} bytes).`);
    process.exit(0);
  }
  writeFileSync(POST, backup);
  console.log(`Reverted. ${POST.pathname} restored from ${BACKUP_FILE}.`);
  process.exit(0);
}

const src = readFileSync(POST, "utf8");
const problems = [];
let oldRowRating = null;

// ---- File checks -------------------------------------------------------
if (count(src, CARD_START) !== 1) problems.push(`expected exactly one "id: ${OUT.id}" card, found ${count(src, CARD_START)}`);
if (count(src, `        id: ${IN.id},\n`) !== 0) problems.push(`product ${IN.id} is already in the post`);
if (!src.includes("verifiedOn?: string;")) problems.push("the post has no verifiedOn field, the stamp would not render");
if (!src.includes("function formatVerified(")) problems.push("the post has no formatVerified helper, the stamp would not render");
for (const bad of ["\u2014", "\u2013"]) if (src.includes(bad)) problems.push("post already contains an em or en dash");

const start = src.indexOf(CARD_START);
const end = start === -1 ? -1 : src.indexOf("      },\n", start) + "      },\n".length;
if (start !== -1 && end > start) {
  const oldCard = src.slice(start, end);
  if (!oldCard.includes(`name: "${OUT.name}"`)) problems.push("the 427 card does not carry the expected name");
  if (oldCard.includes(`id: ${IN.id},`)) problems.push("the 427 card block already holds the replacement");
} else if (start !== -1) {
  problems.push("could not find the end of the 427 card block");
}

// ---- Catalog checks ----------------------------------------------------
const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) {
  problems.push("DATABASE_URL is not set, cannot verify the replacement row");
} else {
  const db = neon(databaseUrl);
  const [row] = await db`select id, name, display_title, room, price, rating, review_count,
      is_active, availability, image_url, amazon_url, seo_slug
    from products where id = ${IN.id}`;
  const [old] = await db`select id, rating, review_count from products where id = ${OUT.id}`;
  if (!row) problems.push(`product ${IN.id} not found`);
  if (!old) problems.push(`product ${OUT.id} not found`);
  if (row) {
    if (!row.is_active) problems.push(`${IN.id} is not active`);
    if (row.room !== "fall") problems.push(`${IN.id} is in room ${row.room}, not fall`);
    if (row.availability !== "in_stock") problems.push(`${IN.id} availability is ${row.availability}`);
    if (Number(row.rating) < 4.3) problems.push(`${IN.id} is below the 4.3 bar at ${row.rating}`);
    if (Number(row.rating) !== IN.rating) problems.push(`${IN.id} row rating ${row.rating} does not match the live read ${IN.rating}`);
    if (!row.review_count) problems.push(`${IN.id} has no review count`);
    if (!row.image_url || row.image_url !== IN.imageUrl) problems.push(`${IN.id} image_url does not match the card`);
    if (row.amazon_url !== IN.amazonUrl) problems.push(`${IN.id} amazon_url does not match the card`);
    if (row.seo_slug !== IN.productUrl.replace("/product/", "")) problems.push(`${IN.id} seo_slug does not match the card productUrl`);
    if (!String(row.amazon_url).includes("tag=crystalcost09-20")) problems.push(`${IN.id} amazon_url is missing the affiliate tag`);
  }
  if (old) oldRowRating = Number(old.rating);
  if (old && Number(old.rating) >= 4.3) problems.push(`427 reads ${old.rating}, which is not under the bar, refusing to touch it`);
}

if (problems.length) fail(`\n  - ${problems.join("\n  - ")}\n`);

const after = src.slice(0, start) + CARD + src.slice(end);

// Guard: nothing else moved.
const idCountBefore = (src.match(/        id: \d+,/g) || []).length;
const idCountAfter = (after.match(/        id: \d+,/g) || []).length;
if (idCountBefore !== idCountAfter) fail(`card count changed from ${idCountBefore} to ${idCountAfter}`);
if (after.includes(`        id: ${OUT.id},`)) fail("the garland card is still in the post");
if (!after.includes(`verifiedOn: "${IN.verifiedOn}"`)) fail("the verification stamp did not land");
if (after.includes("\u2014") || after.includes("\u2013")) fail("the result contains an em or en dash");

if (DRY) {
  console.log("DRY RUN - every check passed, nothing written.");
  console.log(`  out: ${OUT.id} ${OUT.name} (card said ${OUT.cardRating}, row reads ${oldRowRating})`);
  console.log(`  in : ${IN.id} ${IN.name} (${IN.rating}, ${IN.reviews} reviews, $${IN.price}, verified ${IN.verifiedOn})`);
  console.log(`  cards: ${idCountBefore} -> ${idCountAfter}`);
  process.exit(0);
}

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
writeFileSync(BACKUP_FILE, src);
writeFileSync(POST, after);
writeFileSync(
  MANIFEST_FILE,
  JSON.stringify(
    {
      applied_at: new Date().toISOString(),
      post: POST.pathname,
      backup: BACKUP_FILE,
      before_sha256: sha(src),
      after_sha256: sha(after),
      card_count: idCountAfter,
      removed: OUT,
      added: IN,
      live_read: {
        date: IN.verifiedOn,
        source: "https://www.amazon.com/dp/B0DB1S56Q4",
        rating: "4.7 out of 5 stars",
        reviews: 307,
        price: "$28.99 (buy box price to pay, In Stock, Sold by Romadedi-US and Fulfilled by Amazon)",
        note: "products.price for 567 still reads 25.99 from the 2026-11-04 pass; the card shows the 2026-11-20 read. Flagged for the January price re-verification.",
      },
    },
    null,
    2
  ) + "\n"
);

console.log(`Applied. ${POST.pathname}`);
console.log(`  out: ${OUT.id} ${OUT.name}`);
console.log(`  in : ${IN.id} ${IN.name}`);
console.log(`  cards: ${idCountBefore} -> ${idCountAfter}`);
console.log(`  backup: ${BACKUP_FILE}`);
