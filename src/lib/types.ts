/**
 * Unified Product interface — the single type that replaces both DBProduct and StaticProduct.
 * Maps 1:1 to the products table schema (snake_case column names).
 */
export interface Product {
  // ── Core identity ──
  id: number;
  name: string;
  full_name: string | null;
  brand: string | null;

  // ── Classification ──
  room: string;
  style: string[];
  materials: string[];
  colors: string[];
  moods: string[];
  seasons: string[];
  product_type: string | null;
  lifestyle_tags: string[];

  // ── Amazon / commerce ──
  amazon_url: string;
  price: number | null;
  price_original: number | null;
  rating: number | null;
  review_count: number | null;
  is_prime: boolean;
  availability: string;

  // ── Editorial ──
  editor_note: string | null;
  editor_why: string | null;
  editor_tip: string | null;
  founder_note: string | null;
  pros: string[];
  cons: string[];
  best_for: string | null;
  editor_pick: boolean;

  // ── Imagery ──
  image_url: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  image_gallery: unknown; // JSONB

  // ── SEO ──
  seo_title: string | null;
  seo_description: string | null;
  seo_slug: string | null;
  canonical_url: string | null;
  schema_type: string | null;

  // ── Pinterest ──
  pinterest_title: string | null;
  pinterest_description: string | null;
  pinterest_image_url: string | null;
  pinterest_board: string | null;
  pinterest_hashtags: string[];

  // ── AI enrichment ──
  ai_summary: string | null;
  ai_keywords: string[];
  ai_content_generated_at: string | null;

  // ── Scoring ──
  completeness_score: number;
  quality_score: number;
  trend_score: number;
  evergreen_score: number;

  // ── Flags ──
  is_trending: boolean;
  is_active: boolean;

  // ── Metadata ──
  created_at: string;
  updated_at: string;
  data_version: number;
  import_batch: string | null;
}

/** Collection entry from the collections table */
export interface Collection {
  slug: string;
  name: string;
  display_name: string | null;
  description: string | null;
  type: string;
  product_ids: number[] | null;
  seo_title: string | null;
  meta_description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Rule that defines which products belong to a collection */
export interface CollectionRule {
  id: number;
  collection_slug: string;
  rule_type: string; // "room" | "style" | "material" | etc.
  rule_operator: string; // "equals" | "contains" | etc.
  rule_value: unknown; // JSONB — the value to match against
  priority: number;
}

/** A single filter option with its active-product count */
export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

/** Available filter options returned by getFilterOptions */
export interface FilterOptions {
  rooms: FilterOption[];
  styles: FilterOption[];
  productTypes: FilterOption[];
  materials: FilterOption[];
  colors: FilterOption[];
  moods: FilterOption[];
  priceRange: { min: number; max: number };
}
