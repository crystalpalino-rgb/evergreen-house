#!/usr/bin/env node
/**
 * Place Crystal's 2026-11-22 photographs on the Vintage Christmas and Timeless
 * Bedroom edits.
 *
 * Both fields live in two places and both have to move together:
 *
 *   edits.hero_image / edits.card_image
 *       the DRAFT working copy the admin screens read and write.
 *   edit_publications.snapshot->>'hero_image' / ->>'card_image'
 *       the published snapshot, and the only thing the public page and the
 *       cards that link to it render. The page reads the snapshot alone, so a
 *       draft write on its own would change nothing a reader sees.
 *
 * Paths are stored without an extension; src/lib/edits.ts artSources() appends
 * .jpg and .webp. Nothing is deleted: the v1 files stay in public/images.
 *
 * Usage:
 *   node scripts/place-crystal-hero-swap-2026-11-22.mjs --dry-run
 *   node scripts/place-crystal-hero-swap-2026-11-22.mjs
 *   node scripts/place-crystal-hero-swap-2026-11-22.mjs --revert
 *
 * The apply pass writes the exact previous values to
 * curation/edits-image-swap-backup-2026-11-22.json before it touches a row, and
 * --revert replays that file. Every write is verified by a fresh read.
 */
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BACKUP = path.join(ROOT, "curation", "edits-image-swap-backup-2026-11-22.json");

const PLAN = [
  {
    slug: "vintage-christmas-edit",
    hero_image: "/images/vintage-christmas-hero-v2",
    card_image: "/images/vintage-christmas-card-v2",
  },
  {
    slug: "timeless-bedroom-edit",
    hero_image: "/images/timeless-bedroom-hero-v2",
    card_image: "/images/timeless-bedroom-card-v2",
  },
];

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const line = env.match(/^DATABASE_URL=(.*)$/m);
  if (!line) throw new Error("DATABASE_URL not found in the environment or .env");
  return line[1].trim().replace(/^"|"$/g, "");
}

const sql = neon(databaseUrl());

const READ = `
  SELECT e.id, e.slug, e.status, e.hero_image, e.card_image,
         p.published_at,
         p.snapshot->>'hero_image' AS snapshot_hero_image,
         p.snapshot->>'card_image' AS snapshot_card_image
    FROM edits e
    LEFT JOIN edit_publications p ON p.edit_id = e.id
   WHERE e.slug = ANY($1::text[])
   ORDER BY e.slug`;

async function readRows(slugs) {
  return await sql.query(READ, [slugs]);
}

function show(label, rows) {
  console.log(`\n${label}`);
  for (const row of rows) {
    console.log(
      [
        `  ${row.slug} (${row.status})`,
        `    edits.hero_image              ${row.hero_image}`,
        `    edits.card_image              ${row.card_image}`,
        `    snapshot.hero_image           ${row.snapshot_hero_image}`,
        `    snapshot.card_image           ${row.snapshot_card_image}`,
      ].join("\n"),
    );
  }
}

/* One statement per collection, so the draft row and its published snapshot
   move together or not at all. Four values: the draft pair, then the snapshot
   pair, which are the same on an apply and are replayed as they were on a
   revert. */
const APPLY = `
  WITH updated AS (
    UPDATE edits
       SET hero_image = $2, card_image = $3, updated_at = NOW()
     WHERE slug = $1
    RETURNING id
  )
  UPDATE edit_publications p
     SET snapshot = jsonb_set(
                      jsonb_set(p.snapshot, '{hero_image}', to_jsonb($4::text), true),
                      '{card_image}', to_jsonb($5::text), true)
   WHERE p.edit_id IN (SELECT id FROM updated)
  RETURNING p.edit_id`;

function expectRows(rows, slugs) {
  if (rows.length !== slugs.length) {
    throw new Error(
      `expected ${slugs.length} edit rows (${slugs.join(", ")}), read ${rows.length}`,
    );
  }
  for (const row of rows) {
    if (row.id == null || row.published_at == null) {
      throw new Error(`${row.slug} has no published snapshot, refusing to continue`);
    }
  }
}

function verify(rows, expected) {
  const failures = [];
  for (const want of expected) {
    const row = rows.find((r) => r.slug === want.slug);
    if (!row) {
      failures.push(`${want.slug} is missing`);
      continue;
    }
    const pairs = [
      ["edits.hero_image", row.hero_image, want.hero_image],
      ["edits.card_image", row.card_image, want.card_image],
      ["snapshot.hero_image", row.snapshot_hero_image, want.hero_image],
      ["snapshot.card_image", row.snapshot_card_image, want.card_image],
    ];
    for (const [field, got, expectedValue] of pairs) {
      if (got !== expectedValue) failures.push(`${want.slug} ${field} is ${got}, wanted ${expectedValue}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`verification failed:\n  ${failures.join("\n  ")}`);
  }
}

async function main() {
  const mode = process.argv.includes("--revert")
    ? "revert"
    : process.argv.includes("--dry-run")
      ? "dry-run"
      : "apply";

  const slugs = PLAN.map((p) => p.slug);
  const before = await readRows(slugs);
  expectRows(before, slugs);
  show("Before (database):", before);

  if (mode === "dry-run") {
    show("Would become:", PLAN.map((want) => {
      const row = before.find((r) => r.slug === want.slug);
      return {
        slug: want.slug,
        status: row.status,
        hero_image: want.hero_image,
        card_image: want.card_image,
        snapshot_hero_image: want.hero_image,
        snapshot_card_image: want.card_image,
      };
    }));
    console.log("\nDry run: nothing written.");
    return;
  }

  if (mode === "revert") {
    if (!fs.existsSync(BACKUP)) {
      throw new Error(`no backup at ${path.relative(ROOT, BACKUP)}, cannot revert`);
    }
    const backup = JSON.parse(fs.readFileSync(BACKUP, "utf8"));
    console.log(`\nReverting from ${path.relative(ROOT, BACKUP)}`);
    for (const saved of backup.rows) {
      const result = await sql.query(APPLY, [
        saved.slug,
        saved.hero_image,
        saved.card_image,
        saved.snapshot_hero_image,
        saved.snapshot_card_image,
      ]);
      console.log(`  ${saved.slug}: ${result.length} row(s) written`);
    }
    const restored = await readRows(slugs);
    verify(
      restored,
      backup.rows.map((r) => ({
        slug: r.slug,
        hero_image: r.hero_image,
        card_image: r.card_image,
        snapshot_hero_image: r.snapshot_hero_image,
        snapshot_card_image: r.snapshot_card_image,
      })),
    );
    show("After revert (database):", restored);
    console.log("\nRevert verified.");
    return;
  }

  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  const backup = {
    taken_at: new Date().toISOString(),
    script: "scripts/place-crystal-hero-swap-2026-11-22.mjs",
    rows: before.map((row) => ({
      slug: row.slug,
      hero_image: row.hero_image,
      card_image: row.card_image,
      snapshot_hero_image: row.snapshot_hero_image,
      snapshot_card_image: row.snapshot_card_image,
      published_at: row.published_at,
    })),
  };
  fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 2) + "\n");
  console.log(`\nBackup written: ${path.relative(ROOT, BACKUP)}`);

  for (const want of PLAN) {
    const result = await sql.query(APPLY, [
      want.slug,
      want.hero_image,
      want.card_image,
      want.hero_image,
      want.card_image,
    ]);
    if (result.length !== 1) {
      throw new Error(`${want.slug}: expected 1 published snapshot updated, got ${result.length}`);
    }
    console.log(`  ${want.slug}: draft row and snapshot written`);
  }

  const after = await readRows(slugs);
  verify(after, PLAN);
  show("After (database):", after);
  console.log("\nApply verified.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
