/**
 * Name the Christmas/Holiday hub (owner spec item 1, 2026-11-14).
 *
 * /collection/holiday is where the HOLIDAY nav, the homepage banner, the hero
 * button and the /seasonal tile all land, so it must read as the named
 * Christmas hub rather than as a season page called Winter Nesting. The page
 * title, description, meta description and /collections tile all read from this
 * one row, so this script is the whole visible change.
 *
 * It is all-or-nothing. Before it writes anything it checks:
 *   - the row exists and its slug is exactly "holiday"
 *   - the new description is 140 to 160 characters, so generateCollectionMetadata
 *     uses it whole instead of slicing it with an ellipsis
 *   - it matches exactly one row
 * If any of those fail it throws and changes nothing. Re-running it is safe: the
 * same values re-apply and the log shows the row already carries them.
 *
 * Usage:
 *   bun run scripts/name-holiday-hub.mjs
 *
 * DATABASE_URL falls back to site/.env.local, then site/.env, the same way
 * scripts/apply-card-hooks.mjs and scripts/apply-card-data.mjs do.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const SLUG = "holiday";
const NAME = "Christmas & Holiday";
const DESCRIPTION =
  "Christmas, collected: tartan throws, brass bells, fresh garland and candlelight for a table worth gathering at and a home that feels warm for years.";

function resolveDatabaseUrl() {
  const fromEnv = (process.env.DATABASE_URL || "").trim();
  if (fromEnv.startsWith("postgres")) return fromEnv;
  for (const file of ["../.env.local", "../.env"]) {
    try {
      const raw = readFileSync(new URL(file, import.meta.url), "utf8");
      const line = raw.split("\n").find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) {
        const value = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
        if (value.startsWith("postgres")) return value;
      }
    } catch {
      /* try the next file */
    }
  }
  throw new Error("DATABASE_URL is not set and no site/.env file carries one.");
}

const db = neon(resolveDatabaseUrl());

async function readRow() {
  const rows = await db.query(
    `SELECT slug, name, display_name, description
       FROM collections
      WHERE slug = $1`,
    [SLUG]
  );
  return rows;
}

async function main() {
  if (DESCRIPTION.length < 140 || DESCRIPTION.length > 160) {
    throw new Error(
      `Description is ${DESCRIPTION.length} characters; it must be 140 to 160.`
    );
  }

  const before = await readRow();
  if (before.length !== 1) {
    throw new Error(`Expected exactly one collection with slug "${SLUG}", found ${before.length}.`);
  }
  console.log("before:", JSON.stringify(before[0]));
  console.log("after: ", JSON.stringify({ name: NAME, display_name: NAME, description: DESCRIPTION }));

  const updated = await db.query(
    `UPDATE collections
        SET name = $2,
            display_name = $3,
            description = $4
      WHERE slug = $1
      RETURNING slug, name, display_name, description`,
    [SLUG, NAME, NAME, DESCRIPTION]
  );

  if (updated.length !== 1) {
    throw new Error(`Expected to update exactly one row, updated ${updated.length}.`);
  }
  console.log("written:", JSON.stringify(updated[0]));

  const after = await readRow();
  const row = after[0];
  const ok =
    after.length === 1 &&
    row.name === NAME &&
    row.display_name === NAME &&
    row.description === DESCRIPTION;
  if (!ok) throw new Error("Read-back does not match the intended values.");
  console.log("verified: /collection/holiday is named", NAME);
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
