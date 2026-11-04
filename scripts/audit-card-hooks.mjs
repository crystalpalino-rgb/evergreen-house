/**
 * Audit the auto-derived card hook lines.
 *
 * Loads every ACTIVE product that carries no authored card_hook, runs the real
 * derivation from src/lib/card-copy.ts (same module the card ships), and prints
 * the numbers a human needs to judge whether those lines can ship:
 *
 *   - how many rows were checked
 *   - how many lines are under 30 characters or over HOOK_MAX (110)
 *   - how many still end on a stopword / colon / semicolon / bare hyphen
 *     (hookEndsCleanly is the exact rule the card relies on, so this is 0 by
 *     construction unless the module itself regresses)
 *   - how many fell back to the generic "An Evergreen House pick for the ..."
 *   - the 25 shortest and the 25 longest lines, so the worst of both ends can
 *     be read rather than trusted
 *
 * Usage (from the site directory):
 *   bun run scripts/audit-card-hooks.mjs
 *   bun run scripts/audit-card-hooks.mjs --all      # print every line
 *
 * DATABASE_URL comes from the environment, or from site/.env.local when it is
 * not already set, so the script runs by hand without exporting anything.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import {
  cardHookLine,
  cardRoomLabel,
  hookEndsCleanly,
  HOOK_MAX,
} from "../src/lib/card-copy.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = join(HERE, "..");
const PRINT_ALL = process.argv.includes("--all");

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(SITE_ROOT, ".env.local"), "utf8");
    for (const line of env.split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (!match) continue;
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local: fall through to the error below */
  }
  throw new Error("DATABASE_URL is not set and site/.env.local has no DATABASE_URL");
}

const sql = neon(resolveDatabaseUrl());

const rows = await sql`
  SELECT id, name, display_title, editor_note, room, card_hook
  FROM products
  WHERE is_active = true
`;

const total = rows.length;
const authored = rows.filter((row) => (row.card_hook || "").trim());
const derived = rows.filter((row) => !(row.card_hook || "").trim());

const lines = derived.map((row) => ({
  id: row.id,
  name: row.display_title || row.name || "",
  hasNote: Boolean((row.editor_note || "").trim()),
  line: cardHookLine(row.editor_note || null, row.name || null, cardRoomLabel(row.room)),
}));

const under30 = lines.filter((row) => row.line.length < 30);
const overMax = lines.filter((row) => row.line.length > HOOK_MAX);
const unclean = lines.filter((row) => !hookEndsCleanly(row.line));
const fallback = lines.filter((row) => /^An Evergreen House pick/.test(row.line));

function printList(title, list) {
  console.log(`\n${title} (${list.length})`);
  if (!list.length) {
    console.log("  (none)");
    return;
  }
  for (const row of list) {
    console.log(`  ${String(row.line.length).padStart(3)}  ${row.line}`);
  }
}

const byLength = [...lines].sort((a, b) => a.line.length - b.line.length);

console.log("CARD HOOK DERIVATION AUDIT");
console.log("==========================");
console.log(`active products            ${total}`);
console.log(`  with authored card_hook  ${authored.length}`);
console.log(`  derived here             ${derived.length}`);
console.log("");
console.log(`under 30 characters        ${under30.length}`);
console.log(`over ${HOOK_MAX} characters        ${overMax.length}`);
console.log(`not a finished thought     ${unclean.length}   (stopword / colon / semicolon / bare hyphen at the end)`);
console.log(`generic room fallback      ${fallback.length}`);
console.log(`  of those, with no note   ${fallback.filter((row) => !row.hasNote).length}`);
console.log(`  of those, note rejected  ${fallback.filter((row) => row.hasNote).length}`);

if (unclean.length) {
  console.log("\nUNCLEAN LINES (this must be 0):");
  for (const row of unclean) console.log(`  ${row.line}`);
}

printList("25 SHORTEST", byLength.slice(0, 25));
printList("25 LONGEST", byLength.slice(-25).reverse());

if (PRINT_ALL) {
  console.log(`\nALL DERIVED LINES (${lines.length})`);
  for (const row of lines) console.log(`  ${row.line}`);
}
