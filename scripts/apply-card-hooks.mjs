/**
 * Apply an authored card_hook batch to the products table.
 *
 * Source of truth: the card-hook copy file the marketing and merchandiser work
 * produced, one line per product id:
 *
 *   { batch, written_at, count, hooks: [{ id, room, hook }], needs_human: [...] }
 *
 * This script copies the hook text exactly as written. It never rewrites,
 * trims for style, or invents copy, and it never touches price, rating or
 * review_count.
 *
 * It is all-or-nothing. Before it writes anything it checks:
 *   - the file's count field equals the number of hooks in it
 *   - no id appears twice
 *   - every id exists in products, and its room matches the room in the file
 *   - the number of rows matched in the database equals the number of hooks
 * If any of those fail it throws, names the offending ids, and changes nothing.
 *
 * Usage:
 *   bun run scripts/apply-card-hooks.mjs [path/to/card-hooks.json]
 * Default file: /home/team/shared/curation/card-hooks-batch1-2026-11-04.json
 *
 * DATABASE_URL falls back to site/.env.local when it is not already in the
 * environment, the same way scripts/apply-card-data.mjs does.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const FILE =
  process.argv[2] || "/home/team/shared/curation/card-hooks-batch1-2026-11-04.json";
const ROOMS = ["fall", "bedroom", "dining-room"];

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) {
      return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local - fall through to the error below */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL line.");
}

const db = neon(resolveDatabaseUrl());

/** Active products in the three rooms that still have no authored hook. */
async function countMissingHooks() {
  const rows = await db.query(
    `SELECT room, count(*)::int AS n
       FROM products
      WHERE is_active = true
        AND room = ANY($1::text[])
        AND (card_hook IS NULL OR btrim(card_hook) = '')
      GROUP BY room`,
    [ROOMS],
  );
  const byRoom = Object.fromEntries(ROOMS.map((room) => [room, 0]));
  for (const row of rows) byRoom[row.room] = Number(row.n);
  const total = Object.values(byRoom).reduce((a, b) => a + b, 0);
  return { byRoom, total };
}

function printMissing(label, counts) {
  const parts = ROOMS.map((room) => `${room} ${counts.byRoom[room]}`).join(", ");
  console.log(`${label}: ${counts.total} active products without a card_hook (${parts})`);
}

async function main() {
  const file = JSON.parse(readFileSync(FILE, "utf8"));
  const hooks = Array.isArray(file.hooks) ? file.hooks : [];
  console.log(`Source file: ${FILE}`);
  console.log(`Batch: ${file.batch || "-"}  written_at: ${file.written_at || "-"}`);
  console.log(`Hooks in file: ${hooks.length}  count field: ${file.count}\n`);

  // ---- Validation. Nothing below this block runs if it throws. ----
  if (!hooks.length) throw new Error("file carries no hooks");
  if (Number(file.count) !== hooks.length) {
    throw new Error(
      `count field is ${file.count} but the file carries ${hooks.length} hooks: refusing to apply`,
    );
  }

  const ids = hooks.map((h) => Number(h.id));
  const seen = new Set();
  const duplicates = [];
  for (const id of ids) {
    if (seen.has(id)) duplicates.push(id);
    seen.add(id);
  }
  if (duplicates.length) {
    throw new Error(`duplicate ids in file: ${duplicates.join(", ")}: refusing to apply`);
  }

  const badText = hooks.filter((h) => {
    const hook = String(h.hook || "");
    return (
      !hook.trim() ||
      hook !== hook.trim() ||
      hook.includes("\u2014") ||
      hook.includes("\u2013") ||
      !/^[\x20-\x7E]+$/.test(hook)
    );
  });
  if (badText.length) {
    throw new Error(
      `hooks with empty, untrimmed, dashed or non-ASCII text: ${badText
        .map((h) => h.id)
        .join(", ")}: refusing to apply`,
    );
  }

  const existing = await db.query(
    "SELECT id, room, is_active, card_hook FROM products WHERE id = ANY($1::int[])",
    [ids],
  );
  const byId = new Map(existing.map((row) => [Number(row.id), row]));

  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    throw new Error(`ids not found in products: ${missing.join(", ")}: refusing to apply`);
  }

  const roomMismatch = hooks
    .filter((h) => byId.get(Number(h.id)).room !== h.room)
    .map((h) => `${h.id} file=${h.room} db=${byId.get(Number(h.id)).room}`);
  if (roomMismatch.length) {
    throw new Error(
      `room mismatch between file and products: ${roomMismatch.join(", ")}: refusing to apply`,
    );
  }

  if (existing.length !== hooks.length) {
    throw new Error(
      `file carries ${hooks.length} hooks but ${existing.length} rows matched in products: refusing to apply`,
    );
  }
  console.log(`Validated: ${hooks.length} hooks, ${existing.length} rows matched, rooms agree.\n`);

  const before = await countMissingHooks();
  printMissing("Before", before);

  // ---- Apply, in one statement so a half-applied batch cannot happen. ----
  const values = hooks
    .map((_, i) => `($${i * 2 + 1}::int, $${i * 2 + 2}::text)`)
    .join(", ");
  const params = hooks.flatMap((h) => [Number(h.id), String(h.hook)]);
  await db.query(
    `UPDATE products AS p
        SET card_hook = v.hook
       FROM (VALUES ${values}) AS v(id, hook)
      WHERE p.id = v.id`,
    params,
  );

  const after = await countMissingHooks();
  printMissing("After", after);

  // ---- Proof: every hook is stored exactly as written. ----
  const stored = await db.query(
    "SELECT id, card_hook FROM products WHERE id = ANY($1::int[])",
    [ids],
  );
  const storedById = new Map(stored.map((row) => [Number(row.id), row.card_hook]));
  const notStored = hooks.filter((h) => storedById.get(Number(h.id)) !== h.hook);
  if (notStored.length) {
    throw new Error(`hooks not stored exactly as written: ${notStored.map((h) => h.id).join(", ")}`);
  }
  console.log(`\nVerified: ${hooks.length} of ${hooks.length} hooks stored exactly as written.`);
  if (after.total !== 0) {
    console.log(
      `\nNote: ${after.total} active products in these rooms still have no authored hook. They are outside this batch.`,
    );
  }

  // Sample, so a run leaves rendered-looking copy in the log.
  console.log("\nSample of applied hooks:");
  for (const h of hooks.slice(0, 10)) {
    console.log(`  ${h.id} [${h.room}] ${storedById.get(Number(h.id))}`);
  }
}

main().catch((error) => {
  console.error(`\nFAILED: ${error.message}`);
  process.exit(1);
});
