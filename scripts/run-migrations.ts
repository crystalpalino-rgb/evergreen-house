/**
 * Phase A database migrations for the Evergreen Intelligence Layer.
 * All additive-only - uses IF NOT EXISTS / IF NOT EXISTS everywhere. Idempotent.
 *
 * Usage: DATABASE_URL="<url>" bun run scripts/run-migrations.ts
 */
import { sql } from "../src/db";

const db = sql();

async function main() {
  console.log("=== Phase A: Evergreen Intelligence Layer Migrations ===\n");

  // ── Migration 001: Extend products table ──
  console.log("Migration 001 - Extending products table...");

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
  console.log("Migration 002 - Creating new tables...");

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
  console.log("Migration 003 - Creating indexes...");

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

  // ── Migration 004: Collection admin, phase 1 (edits in Postgres) ──
  // The eight curated "Shop the Edit" collections move out of the git-resident
  // manifest (src/data/edits/manifest.json) and into these tables. Additive
  // only: nothing here touches the products, collections or blog tables, and
  // the existing `collections` table is deliberately NOT reused (it backs
  // /collection/<slug> and sitemap-collections.xml, so an edit slug in it would
  // create a second URL for the same page).
  //
  // `edits` holds the set-level editorial copy in the manifest's own key order.
  // `edit_items` holds one row per product in curated order; slug, name and
  // raw_name are carried alongside the product_id so the manifest can be dumped
  // back out byte-for-byte (they are the curated fallbacks, not a copy of the
  // products row).
  // `edits_manifest_meta` holds the manifest's top-level version and note, so
  // the dump script is a pure database read with nothing hardcoded.
  console.log("Migration 004 - Collection admin phase 1 (edits)...");

  await db`CREATE TABLE IF NOT EXISTS edits (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    headline TEXT,
    intro TEXT,
    art_note TEXT,
    hero_image TEXT,
    card_image TEXT,
    related TEXT[],
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    sort_order INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  console.log("  ✓ edits");

  await db`CREATE TABLE IF NOT EXISTS edit_items (
    id SERIAL PRIMARY KEY,
    edit_id INT NOT NULL REFERENCES edits(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id),
    position INT NOT NULL,
    display_title TEXT,
    hook TEXT,
    slug TEXT,
    name TEXT,
    raw_name BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (edit_id, product_id)
  )`;
  console.log("  ✓ edit_items");

  await db`CREATE TABLE IF NOT EXISTS edits_manifest_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  )`;
  console.log("  ✓ edits_manifest_meta");

  await db`CREATE INDEX IF NOT EXISTS idx_edits_status_sort ON edits (status, sort_order, id)`;
  console.log("  ✓ edits (status, sort_order) index");
  await db`CREATE INDEX IF NOT EXISTS idx_edit_items_edit_position ON edit_items (edit_id, position)`;
  console.log("  ✓ edit_items (edit_id, position) index");
  await db`CREATE INDEX IF NOT EXISTS idx_edit_items_product ON edit_items (product_id)`;
  console.log("  ✓ edit_items (product_id) index");

  console.log("Migration 004 complete.\n");

  // ── Migration 005: Collection admin, phase 2a (draft then publish) ──
  // Additive only. Nothing here drops, renames or rewrites an existing column,
  // and a row that existed before this migration keeps working untouched:
  //
  //   edits.published_at      when the collection last went live. NULL on an
  //                           edit that has never been switched live.
  //   edit_items.price_override  the price the owner typed, and
  //   edit_items.price_set_at    the day she typed it. Deliberately separate
  //                           from products.price: a verification pass writes
  //                           products.price, so the typed figure and the
  //                           verified figure can never be confused, and the
  //                           card can print which of the two it is showing.
  //   edit_publications       one row per live collection holding the snapshot
  //                           the public pages render. The edits/edit_items
  //                           tables become the DRAFT working copy, so an
  //                           unsaved-into-public change cannot leak: the
  //                           public read path (src/lib/edits.ts) reads only
  //                           this table, and only for status = 'published'.
  //
  // Backfill: every currently published edit gets a snapshot of exactly what it
  // renders today, so the public pages are unchanged by this migration. Draft
  // edits get no snapshot (they have never been live).
  console.log("Migration 005 - Collection admin phase 2a (draft then publish)...");

  await db`ALTER TABLE edits ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`;
  console.log("  ✓ edits.published_at");
  await db`ALTER TABLE edit_items ADD COLUMN IF NOT EXISTS price_override NUMERIC`;
  console.log("  ✓ edit_items.price_override");
  await db`ALTER TABLE edit_items ADD COLUMN IF NOT EXISTS price_set_at TIMESTAMPTZ`;
  console.log("  ✓ edit_items.price_set_at");

  await db`CREATE TABLE IF NOT EXISTS edit_publications (
    edit_id INT PRIMARY KEY REFERENCES edits(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot JSONB NOT NULL
  )`;
  console.log("  ✓ edit_publications");

  await db`CREATE INDEX IF NOT EXISTS idx_edit_publications_published
             ON edit_publications (published_at)`;
  console.log("  ✓ edit_publications (published_at) index");

  // Backfill: published edits that have no snapshot yet.
  const liveEdits = (await db`
    SELECT e.id, e.slug, e.title, e.headline, e.intro, e.art_note, e.hero_image,
           e.card_image, e.related, e.updated_at
      FROM edits e
      LEFT JOIN edit_publications p ON p.edit_id = e.id
     WHERE e.status = 'published' AND p.edit_id IS NULL
     ORDER BY e.sort_order, e.id
  `) as unknown as {
    id: number;
    slug: string;
    title: string;
    headline: string | null;
    intro: string | null;
    art_note: string | null;
    hero_image: string | null;
    card_image: string | null;
    related: string[] | null;
    updated_at: string | Date;
  }[];

  for (const edit of liveEdits) {
    const items = (await db`
      SELECT product_id, display_title, hook, slug, name, raw_name,
             price_override, price_set_at
        FROM edit_items
       WHERE edit_id = ${edit.id}
       ORDER BY position, id
    `) as unknown as {
      product_id: number;
      display_title: string | null;
      hook: string | null;
      slug: string | null;
      name: string | null;
      raw_name: boolean | null;
      price_override: number | null;
      price_set_at: string | Date | null;
    }[];

    const snapshot: Record<string, unknown> = {
      slug: edit.slug,
      title: edit.title,
      headline: edit.headline ?? "",
      intro: edit.intro ?? "",
      art_note: edit.art_note ?? "",
      hero_image: edit.hero_image ?? "",
      card_image: edit.card_image ?? "",
    };
    if (edit.related && edit.related.length > 0) snapshot.related = edit.related;
    snapshot.items = items.map((item) => {
      const out: Record<string, unknown> = {
        id: Number(item.product_id),
        slug: item.slug ?? "",
        name: item.name ?? "",
        display_title: item.display_title ?? "",
        hook: item.hook ?? "",
        raw_name: Boolean(item.raw_name),
      };
      if (item.price_override != null) {
        out.price_override = Number(item.price_override);
        out.price_set_at = item.price_set_at ? new Date(item.price_set_at).toISOString() : null;
      }
      return out;
    });

    await db`
      INSERT INTO edit_publications (edit_id, published_at, snapshot)
      VALUES (${edit.id}, ${edit.updated_at}, ${JSON.stringify(snapshot)}::jsonb)
      ON CONFLICT (edit_id) DO NOTHING
    `;
    await db`UPDATE edits SET published_at = ${edit.updated_at} WHERE id = ${edit.id} AND published_at IS NULL`;
    console.log(`  ✓ snapshot backfilled: ${edit.slug} (${items.length} items)`);
  }
  if (liveEdits.length === 0) console.log("  ✓ no published edit needed a snapshot");

  console.log("Migration 005 complete.\n");
  console.log("=== All Phase A migrations complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((err: Error) => {
    console.error("Migration failed:", err.message);
    process.exit(1);
  });
