#!/usr/bin/env node
/**
 * Replace the parked sage felt board card (product 302) in
 * "14 Cheap Things That Make Your Home Look Expensive" with product 256,
 * a verified active product that fits the same section.
 *
 * Why: 302 was parked under decision 42 (its row reads 4.0 stars, the card
 * claimed 4.8) so the post was featuring a product we had taken off the site.
 *
 * The replacement was read live on Amazon on 2026-11-20:
 *   product 256 - Yalikop 3 Link Wood Knot Decor, White
 *   4.5 out of 5 stars, 2,328 reviews, $15.99, add-to-cart present.
 *
 * The card count stays at fourteen: one card out, one card in.
 *
 * Usage:
 *   node scripts/replace-blog-card-302-2026-11-20.mjs --dry-run
 *   node scripts/replace-blog-card-302-2026-11-20.mjs
 *   node scripts/replace-blog-card-302-2026-11-20.mjs --revert
 *
 * A timestamped backup of the file is written before any change, and --revert
 * restores the newest backup byte for byte.
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TARGET = path.join(
  REPO,
  "src/routes/blog/cheap-things-that-make-your-home-look-expensive.tsx"
);
const BACKUP_DIR = "/home/team/shared/backups";

const OLD_ID = 302;
const NEW_ID = 256;
const EXPECTED_CARDS = 14;

/** Matches the whole object literal for the card we are replacing. */
const OLD_BLOCK_RE = new RegExp(
  String.raw`      \{\n        id: ${OLD_ID},\n[\s\S]*?\n      \},\n`
);

const NEW_BLOCK = `      {
        id: ${NEW_ID},
        name: "Carved Wood Chain Link Decor, Set of 3, White",
        price: 15.99,
        rating: 4.5,
        productUrl:
          "/product/yalikop-3-link-wood-knot-decor-rustic-home-d-cor-accents-hand-carved-coffee-table-decoration-boho-chain-link-decoration-",
        amazonUrl: "https://www.amazon.com/dp/B0BBH5ZDP4?tag=crystalcost09-20",
        imageUrl: "https://m.media-amazon.com/images/I/71xPtXlo4NL._AC_SL1500_.jpg",
        note: "The last thing a shelf needs is another useful object, and these three carved white links are the opposite of useful in the best way. They sit on a coffee table beside a stack of books, or run across a console as one loose chain, and the set splits so two rooms can share them. Carved wood, not resin, at a price that makes them an easy yes.",
      },
`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const revert = args.includes("--revert");

function cardIds(source) {
  return [...source.matchAll(/^        id: (\d+),$/gm)].map((m) => Number(m[1]));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function newestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("cheap-things-that-make-your-home-look-expensive.tsx."))
    .sort();
  return files.length ? path.join(BACKUP_DIR, files[files.length - 1]) : null;
}

if (revert) {
  const backup = newestBackup();
  if (!backup) fail(`no backup found in ${BACKUP_DIR}`);
  fs.copyFileSync(backup, TARGET);
  console.log(`reverted ${TARGET} from ${backup}`);
  console.log(`cards now: ${cardIds(fs.readFileSync(TARGET, "utf8")).join(", ")}`);
  process.exit(0);
}

const original = fs.readFileSync(TARGET, "utf8");

if (original.includes(`id: ${NEW_ID},`)) {
  fail(`product ${NEW_ID} is already in the post; nothing to do`);
}

const matches = original.match(OLD_BLOCK_RE) || [];
if (matches.length !== 1) {
  fail(`expected exactly one card block for product ${OLD_ID}, found ${matches.length}`);
}

const updated = original.replace(OLD_BLOCK_RE, NEW_BLOCK);

// --- guards ---------------------------------------------------------------
const ids = cardIds(updated);
if (ids.length !== EXPECTED_CARDS) {
  fail(`card count is ${ids.length}, expected ${EXPECTED_CARDS}`);
}
if (ids.includes(OLD_ID)) fail(`product ${OLD_ID} still present`);
if (!ids.includes(NEW_ID)) fail(`product ${NEW_ID} not written`);
if (new Set(ids).size !== ids.length) fail("duplicate product id in the post");
if (/[\u2014\u2013]/.test(NEW_BLOCK)) fail("em dash or en dash in the new card");
if (!NEW_BLOCK.includes("?tag=crystalcost09-20")) fail("affiliate tag missing");
if (updated.length <= original.length - 2000) fail("unexpectedly large shrink");

if (dryRun) {
  console.log(`DRY RUN ok: ${OLD_ID} -> ${NEW_ID}, cards ${ids.length}`);
  console.log(ids.join(", "));
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(
  BACKUP_DIR,
  `cheap-things-that-make-your-home-look-expensive.tsx.${stamp}.bak`
);
fs.copyFileSync(TARGET, backup);

fs.writeFileSync(TARGET, updated);
console.log(`backup: ${backup}`);
console.log(`wrote ${TARGET}`);
console.log(`cards (${ids.length}): ${ids.join(", ")}`);
