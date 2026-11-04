/**
 * Move the off-season products out of the holiday room and hold the
 * Valentine's pieces inactive until January (owner decisions, 2026-11-04).
 *
 * Pure room/is_active bookkeeping on `products`. It never touches copy, price,
 * rating or availability: those come from the verified curation file through
 * scripts/apply-card-data.mjs.
 *
 * Usage: node scripts/apply-holiday-split.mjs [--dry]
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
  if (!line) throw new Error("no DATABASE_URL");
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const DRY = process.argv.includes("--dry");
const db = neon(resolveDatabaseUrl());

/** room moves: id -> destination room */
const MOVES = {
  spring: [185, 186, 187, 188],
  fall: [380, 527],
  "living-room": [528],
  bedroom: [530],
};

/** hold inactive (Valentine's until January; two duplicate blanket listings) */
const INACTIVE = [68, 191, 192, 76, 77];

async function main() {
  const before = await db.query(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE is_active)::int AS active FROM products WHERE room = 'holiday'",
  );
  console.log(`holiday before: ${before[0].total} rows, ${before[0].active} active`);

  for (const [room, ids] of Object.entries(MOVES)) {
    for (const id of ids) {
      const prev = await db.query("SELECT id, room, is_active FROM products WHERE id = $1", [id]);
      if (!prev.length) {
        console.log(`  MISSING id ${id} (expected to move to ${room})`);
        continue;
      }
      if (DRY) {
        console.log(`  would move id ${id} ${prev[0].room} -> ${room}`);
        continue;
      }
      await db.query("UPDATE products SET room = $2 WHERE id = $1", [id, room]);
      console.log(`  moved id ${id} ${prev[0].room} -> ${room}`);
    }
  }

  for (const id of INACTIVE) {
    const prev = await db.query("SELECT id, room, is_active FROM products WHERE id = $1", [id]);
    if (!prev.length) {
      console.log(`  MISSING id ${id} (expected inactive)`);
      continue;
    }
    if (DRY) {
      console.log(`  would set id ${id} inactive (was ${prev[0].is_active})`);
      continue;
    }
    await db.query("UPDATE products SET is_active = false WHERE id = $1", [id]);
    console.log(`  id ${id} is_active ${prev[0].is_active} -> false (room ${prev[0].room})`);
  }

  const after = await db.query(
    "SELECT count(*)::int AS total, count(*) FILTER (WHERE is_active)::int AS active FROM products WHERE room = 'holiday'",
  );
  console.log(`holiday after:  ${after[0].total} rows, ${after[0].active} active`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
