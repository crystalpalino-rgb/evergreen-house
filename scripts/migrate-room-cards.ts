/**
 * Room Card Standard migration (2026-11-04).
 *
 * Adds the four card columns the owner's Room Card Standard needs, all nullable
 * so nothing existing changes shape:
 *
 *   display_title    clean human title for the card (never a truncated Amazon
 *                    listing title). NULL means "use products.name".
 *   card_hook        one short editorial line for the card. NULL means "derive
 *                    one from editor_note".
 *   price_checked_at date the price and rating were last read from the product's
 *                    Amazon page. NULL means "never verified" (the card then
 *                    shows no date, never a guess).
 *   pin_rank         ordering weight for Pinterest-rotation products. Lower sorts
 *                    first. NULL sorts last.
 *
 * Additive only, idempotent: safe to re-run.
 *
 * Usage: DATABASE_URL="<url>" bun run scripts/migrate-room-cards.ts
 */
import { sql } from "../src/db";

const db = sql();

async function main() {
  console.log("=== Migration: Room Card Standard columns ===\n");

  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_title TEXT`;
  console.log("  ok display_title");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS card_hook TEXT`;
  console.log("  ok card_hook");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_checked_at DATE`;
  console.log("  ok price_checked_at");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pin_rank INTEGER`;
  console.log("  ok pin_rank");

  // Room pages read products filtered by room and ordered pin_rank first.
  await db`CREATE INDEX IF NOT EXISTS products_room_pin_rank_idx ON products (room, pin_rank NULLS LAST, quality_score DESC NULLS LAST)`;
  console.log("  ok index products_room_pin_rank_idx");

  const cols = await db`SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name IN ('display_title', 'card_hook', 'price_checked_at', 'pin_rank')
    ORDER BY column_name`;
  console.log("\nVerified columns:");
  for (const c of cols as any[]) {
    console.log(`  ${c.column_name} ${c.data_type} nullable=${c.is_nullable}`);
  }
  if ((cols as any[]).length !== 4) {
    throw new Error(`expected 4 columns, found ${(cols as any[]).length}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
