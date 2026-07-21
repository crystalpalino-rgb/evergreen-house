/**
 * Phase A database migrations for the Evergreen Intelligence Layer.
 * All additive-only — uses IF NOT EXISTS / IF NOT EXISTS everywhere. Idempotent.
 *
 * Usage: DATABASE_URL="<url>" bun run scripts/run-migrations.ts
 */
import { sql } from "../src/db";

const db = sql();

async function main() {
  console.log("=== Phase A: Evergreen Intelligence Layer Migrations ===\n");

  // ── Migration 001: Extend products table ──
  console.log("Migration 001 — Extending products table...");

  // Classification
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT`;
  console.log("  ✓ brand");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS model_number TEXT`;
  console.log("  ✓ model_number");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS materials TEXT[] DEFAULT '{}'`;
  console.log("  ✓ materials");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[] DEFAULT '{}'`;
  console.log("  ✓ colors");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS moods TEXT[] DEFAULT '{}'`;
  console.log("  ✓ moods");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}'`;
  console.log("  ✓ seasons");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT`;
  console.log("  ✓ product_type");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}'`;
  console.log("  ✓ lifestyle_tags");

  // Commerce
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_original DECIMAL`;
  console.log("  ✓ price_original");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS price_currency TEXT DEFAULT 'USD'`;
  console.log("  ✓ price_currency");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INT`;
  console.log("  ✓ review_count");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_prime BOOLEAN DEFAULT false`;
  console.log("  ✓ is_prime");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'in_stock'`;
  console.log("  ✓ availability");

  // Editorial
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS editor_why TEXT`;
  console.log("  ✓ editor_why");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS editor_tip TEXT`;
  console.log("  ✓ editor_tip");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS founder_note TEXT`;
  console.log("  ✓ founder_note");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}'`;
  console.log("  ✓ pros");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}'`;
  console.log("  ✓ cons");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS best_for TEXT`;
  console.log("  ✓ best_for");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS editor_pick BOOLEAN DEFAULT false`;
  console.log("  ✓ editor_pick");

  // Imagery
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alt TEXT`;
  console.log("  ✓ image_alt");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_width INT`;
  console.log("  ✓ image_width");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_height INT`;
  console.log("  ✓ image_height");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_gallery JSONB DEFAULT '[]'`;
  console.log("  ✓ image_gallery");

  // SEO
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT`;
  console.log("  ✓ seo_title");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT`;
  console.log("  ✓ seo_description");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_slug TEXT`;
  console.log("  ✓ seo_slug");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS canonical_url TEXT`;
  console.log("  ✓ canonical_url");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS schema_type TEXT`;
  console.log("  ✓ schema_type");

  // Pinterest
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pinterest_description TEXT`;
  console.log("  ✓ pinterest_description");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT`;
  console.log("  ✓ pinterest_image_url");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pinterest_board TEXT`;
  console.log("  ✓ pinterest_board");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS pinterest_hashtags TEXT[] DEFAULT '{}'`;
  console.log("  ✓ pinterest_hashtags");

  // AI
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_summary TEXT`;
  console.log("  ✓ ai_summary");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_keywords TEXT[] DEFAULT '{}'`;
  console.log("  ✓ ai_keywords");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_content_generated_at TIMESTAMPTZ`;
  console.log("  ✓ ai_content_generated_at");

  // Scoring
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS completeness_score INT DEFAULT 0`;
  console.log("  ✓ completeness_score");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS quality_score DECIMAL DEFAULT 0`;
  console.log("  ✓ quality_score");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS trend_score DECIMAL DEFAULT 0`;
  console.log("  ✓ trend_score");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS evergreen_score DECIMAL DEFAULT 0`;
  console.log("  ✓ evergreen_score");

  // Flags & metadata
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
  console.log("  ✓ is_active");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS data_version INT DEFAULT 1`;
  console.log("  ✓ data_version");
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS import_batch TEXT`;
  console.log("  ✓ import_batch");

  // Full-text search
  await db`ALTER TABLE products ADD COLUMN IF NOT EXISTS full_text_search TSVECTOR`;
  console.log("  ✓ full_text_search");

  console.log("Migration 001 complete.\n");

  // ── Migration 002: New tables ──
  console.log("Migration 002 — Creating new tables...");

  await db`CREATE TABLE IF NOT EXISTS collection_rules (
    id SERIAL PRIMARY KEY,
    collection_slug TEXT REFERENCES collections(slug),
    rule_type TEXT,
    rule_operator TEXT,
    rule_value JSONB,
    priority INT DEFAULT 0
  )`;
  console.log("  ✓ collection_rules");

  await db`CREATE TABLE IF NOT EXISTS related_products (
    product_id INT,
    related_product_id INT,
    relationship_type TEXT DEFAULT 'similar',
    score DECIMAL DEFAULT 0,
    is_editorial BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    UNIQUE(product_id, related_product_id)
  )`;
  console.log("  ✓ related_products");

  await db`CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    url TEXT,
    alt_text TEXT,
    width INT,
    height INT,
    image_type TEXT DEFAULT 'product',
    sort_order INT DEFAULT 0
  )`;
  console.log("  ✓ product_images");

  await db`CREATE TABLE IF NOT EXISTS product_scores (
    product_id INT PRIMARY KEY REFERENCES products(id),
    completeness_score INT,
    quality_score DECIMAL,
    trend_score DECIMAL,
    evergreen_score DECIMAL,
    computed_at TIMESTAMPTZ DEFAULT NOW()
  )`;
  console.log("  ✓ product_scores");

  console.log("Migration 002 complete.\n");

  // ── Migration 003: Indexes ──
  console.log("Migration 003 — Creating indexes...");

  await db`CREATE INDEX IF NOT EXISTS idx_products_style ON products USING GIN (style)`;
  console.log("  ✓ style (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_materials ON products USING GIN (materials)`;
  console.log("  ✓ materials (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_colors ON products USING GIN (colors)`;
  console.log("  ✓ colors (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_moods ON products USING GIN (moods)`;
  console.log("  ✓ moods (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_seasons ON products USING GIN (seasons)`;
  console.log("  ✓ seasons (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_lifestyle_tags ON products USING GIN (lifestyle_tags)`;
  console.log("  ✓ lifestyle_tags (GIN)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_room ON products (room)`;
  console.log("  ✓ room (B-tree)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_product_type ON products (product_type)`;
  console.log("  ✓ product_type (B-tree)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_editor_pick ON products (id) WHERE editor_pick = true`;
  console.log("  ✓ editor_pick (partial)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (id) WHERE is_active = true`;
  console.log("  ✓ is_active (partial)");
  await db`CREATE INDEX IF NOT EXISTS idx_products_full_text_search ON products USING GIN (full_text_search)`;
  console.log("  ✓ full_text_search (GIN)");

  console.log("Migration 003 complete.\n");
  console.log("=== All Phase A migrations complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((err: Error) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });
