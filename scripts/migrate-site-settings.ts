/**
 * Creates the `site_settings` table: key/value rows the owner edits from the
 * admin screens (the head injection snippet and the ads.txt publisher ID).
 * Additive and idempotent - safe to run again.
 *
 * Usage: bun run scripts/migrate-site-settings.ts
 */
import { sql } from "../src/db";

const db = sql();

await db`
  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const rows = (await db`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'site_settings' ORDER BY ordinal_position
`) as Array<{ column_name: string; data_type: string }>;

console.log("site_settings columns:", rows.map((r) => `${r.column_name} ${r.data_type}`).join(", "));

const existing = (await db`SELECT key, value FROM site_settings ORDER BY key`) as Array<{
  key: string;
  value: string;
}>;
console.log("site_settings rows:", existing.length);
for (const row of existing) {
  console.log(`  ${row.key} = ${JSON.stringify(row.value)}`);
}
