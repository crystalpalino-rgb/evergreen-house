/**
 * Blog card numbers (2026-11-20).
 *
 * Blog post cards hardcode a star rating per product. Seventeen of those
 * numbers across four posts were never read from the listing they claim to
 * describe. This script reads the value from the products table instead and
 * writes it into the card, together with the row's verification date
 * (products.price_checked_at) so the card says when the number was read.
 *
 *   - a row that is parked (is_active = false) is left alone and listed
 *   - a row whose live rating is below 4.3 is left alone and listed, so the
 *     owner decides whether it comes off the post rather than this script
 *   - no rating is invented, rounded or carried over from the old card
 *
 * Source of truth: the products table (Neon), read live at run time.
 * Backup: /home/team/shared/curation/blog-card-numbers-backup-2026-11-20.json
 *
 * Usage:
 *   bun run scripts/apply-blog-card-numbers-2026-11-20.mjs            # apply
 *   bun run scripts/apply-blog-card-numbers-2026-11-20.mjs --dry-run  # checks only
 *   bun run scripts/apply-blog-card-numbers-2026-11-20.mjs --revert   # undo
 *
 * Every check runs before the first write. Any failure prints
 * "ABORT - nothing was written" and exits 1. No em-dashes.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const ROOT = new URL("../", import.meta.url);
const BACKUP = "/home/team/shared/curation/blog-card-numbers-backup-2026-11-20.json";

const DRY = process.argv.includes("--dry-run");
const REVERT = process.argv.includes("--revert");

/** Post slug -> the card ids this pass is responsible for. */
const SPEC = {
  "cheap-things-that-make-your-home-look-expensive": [30, 24, 272, 64, 307, 28],
  "cozy-fall-decor-finds": [427, 197, 65],
  "cozy-neutral-holiday-decor-finds": [429, 436, 438, 421, 447, 450],
  "how-to-make-your-bed-look-expensive": [197, 44],
};

const BAR = 4.3;

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const f of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(f, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    } catch {
      /* try the next file */
    }
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

function fail(msg) {
  console.log("\nABORT - nothing was written.");
  console.log(msg);
  process.exit(1);
}

function filePath(slug) {
  return new URL(`src/routes/blog/${slug}.tsx`, ROOT);
}

const isoDay = (v) => (v ? new Date(v).toISOString().slice(0, 10) : null);

/** Split one post source into product object blocks, keyed by card id. */
function readCards(src) {
  const starts = [...src.matchAll(/^(\s*)id: (\d+),$/gm)].map((m) => ({
    at: m.index,
    id: Number(m[2]),
  }));
  const cards = new Map();
  starts.forEach((s, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].at : src.length;
    const block = src.slice(s.at, end);
    const rating = block.match(/^(\s*)rating: ([\d.]+),$/m);
    const verified = block.match(/^(\s*)verifiedOn: "([^"]*)",$/m);
    if (!rating) return;
    if (cards.has(s.id)) cards.set(s.id, null); // duplicate id in one file is a defect
    else
      cards.set(s.id, {
        id: s.id,
        start: s.at,
        end,
        indent: rating[1],
        rating: Number(rating[2]),
        ratingText: rating[0],
        verifiedText: verified ? verified[0] : null,
        verifiedOn: verified ? verified[2] : null,
      });
  });
  return cards;
}

function applyToSource(src, card, newRating, date) {
  const ratingLine = `${card.indent}rating: ${newRating},`;
  const verifiedLine = `${card.indent}verifiedOn: "${date}",`;
  const block = src.slice(card.start, card.end);
  let next = block.replace(/^\s*rating: [\d.]+,$/m, ratingLine);
  if (card.verifiedText) next = next.replace(/^\s*verifiedOn: "[^"]*",$/m, verifiedLine);
  else next = next.replace(ratingLine, `${ratingLine}\n${verifiedLine}`);
  return src.slice(0, card.start) + next + src.slice(card.end);
}

// ---------------------------------------------------------------- revert
if (REVERT) {
  if (!existsSync(BACKUP)) fail(`No backup at ${BACKUP} - nothing to revert from.`);
  const backup = JSON.parse(readFileSync(BACKUP, "utf8"));
  if (!backup.rows?.length) fail("Backup has no rows - nothing to revert.");
  const byFile = new Map();
  for (const row of backup.rows) {
    if (!byFile.has(row.file)) byFile.set(row.file, []);
    byFile.get(row.file).push(row);
  }
  const sources = new Map();
  for (const [file, rows] of byFile) {
    const url = filePath(file);
    sources.set(file, readFileSync(url, "utf8"));
    for (const row of rows) {
      const src = sources.get(file);
      const cards = readCards(src);
      const card = cards.get(row.id);
      if (!card) fail(`${file}: card id ${row.id} no longer resolves.`);
      sources.set(file, applyToSource(src, card, row.beforeRating, null));
      // drop the verifiedOn line entirely on revert
      const after = sources.get(file);
      const block = after.slice(card.start, card.end);
      sources.set(
        file,
        after.slice(0, card.start) +
          block.replace(/^\s*verifiedOn: "[^"]*",\n/m, "") +
          after.slice(card.end),
      );
    }
  }
  for (const [file, src] of sources) writeFileSync(filePath(file), src);
  console.log(`Reverted ${backup.rows.length} cards across ${sources.size} posts.`);
  process.exit(0);
}

// ---------------------------------------------------------------- plan
const allIds = [...new Set(Object.values(SPEC).flat())];
const db = neon(resolveDatabaseUrl());
const rows = await db`
  SELECT id, is_active, rating, review_count, price_checked_at
  FROM products WHERE id = ANY(${allIds})
`;
const byId = new Map(rows.map((r) => [Number(r.id), r]));

if (rows.length !== allIds.length) {
  fail(`Only ${rows.length} of ${allIds.length} card ids exist in the products table.`);
}

const plan = [];
const skipped = [];
for (const [slug, ids] of Object.entries(SPEC)) {
  const url = filePath(slug);
  if (!existsSync(url)) fail(`Missing post file: src/routes/blog/${slug}.tsx`);
  const src = readFileSync(url, "utf8");
  const cards = readCards(src);
  for (const id of ids) {
    const card = cards.get(id);
    if (card === undefined) fail(`${slug}: no card with id ${id}.`);
    if (card === null) fail(`${slug}: id ${id} appears on more than one card.`);
    const row = byId.get(id);
    const live = row.rating === null ? null : Number(row.rating);
    const date = isoDay(row.price_checked_at);
    if (row.is_active !== true) {
      skipped.push({ slug, id, reason: "parked (is_active = false)" });
      continue;
    }
    if (live === null) {
      skipped.push({ slug, id, reason: "no rating read" });
      continue;
    }
    if (live < BAR) {
      skipped.push({ slug, id, reason: `below ${BAR} stars (DB says ${live})` });
      continue;
    }
    if (!date) fail(`${slug}: id ${id} has no verification date.`);
    plan.push({
      slug,
      file: slug,
      id,
      beforeRating: card.rating,
      afterRating: live,
      beforeVerifiedOn: card.verifiedOn,
      verifiedOn: date,
      reviewCount: row.review_count === null ? null : Number(row.review_count),
    });
  }
}

console.log(`Cards in scope: ${allIds.length} unique rows, ${plan.length + skipped.length} cards.`);
console.log(`To correct: ${plan.length}`);
for (const p of plan) {
  const mark = p.beforeRating === p.afterRating ? "same" : "CHANGE";
  console.log(
    `  ${p.slug} #${p.id}: ${p.beforeRating} -> ${p.afterRating} (${p.reviewCount} reviews, read ${p.verifiedOn}) [${mark}]`,
  );
}
if (skipped.length) {
  console.log(`Left alone and listed: ${skipped.length}`);
  for (const s of skipped) console.log(`  ${s.slug} #${s.id}: ${s.reason}`);
}

if (DRY) {
  console.log("\nDry run - nothing was written.");
  process.exit(0);
}

// ---------------------------------------------------------------- write
const sources = new Map();
for (const p of plan) {
  if (!sources.has(p.file)) sources.set(p.file, readFileSync(filePath(p.file), "utf8"));
  const src = sources.get(p.file);
  const card = readCards(src).get(p.id);
  if (!card) fail(`${p.file}: card id ${p.id} vanished mid-run.`);
  sources.set(p.file, applyToSource(src, card, p.afterRating, p.verifiedOn));
}

writeFileSync(
  BACKUP,
  JSON.stringify(
    {
      task: "blog card numbers to products DB values",
      appliedOn: new Date().toISOString(),
      source: "products.rating / products.price_checked_at",
      rows: plan,
      skipped,
    },
    null,
    1,
  ),
);
for (const [file, src] of sources) writeFileSync(filePath(file), src);

console.log(`\nWrote ${plan.length} cards across ${sources.size} posts.`);
console.log(`Backup: ${BACKUP}`);
