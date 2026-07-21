/**
 * Evergreen Intelligence Layer — Single resolver library.
 *
 * All resolvers use the shared `sql()` factory from `~/db`.
 * Import `Product` and `ProductFilters` from `~/lib/types`.
 */

import { sql } from "~/db";
import type { Product, Collection, CollectionRule, FilterOptions, FilterOption } from "~/lib/types";

// ── Filter types ──

export interface ProductFilters {
  room?: string;
  style?: string;
  productType?: string;
  material?: string;
  color?: string;
  mood?: string;
  season?: string;
  editorPick?: boolean;
  isTrending?: boolean;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: "price" | "rating" | "created_at" | "name" | "trend_score";
  orderDir?: "asc" | "desc";
}

// ── Query helpers ──

function buildFilterClauses(filters?: ProductFilters): {
  clauses: string[];
  vals: unknown[];
} {
  const clauses: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (!filters) return { clauses, vals };

  if (filters.room) {
    clauses.push(`room = $${idx++}`);
    vals.push(filters.room);
  }
  if (filters.style) {
    clauses.push(`$${idx++} = ANY(style)`);
    vals.push(filters.style);
  }
  if (filters.productType) {
    clauses.push(`product_type = $${idx++}`);
    vals.push(filters.productType);
  }
  if (filters.material) {
    clauses.push(`$${idx++} = ANY(materials)`);
    vals.push(filters.material);
  }
  if (filters.color) {
    clauses.push(`$${idx++} = ANY(colors)`);
    vals.push(filters.color);
  }
  if (filters.mood) {
    clauses.push(`$${idx++} = ANY(moods)`);
    vals.push(filters.mood);
  }
  if (filters.season) {
    clauses.push(`$${idx++} = ANY(seasons)`);
    vals.push(filters.season);
  }
  if (filters.editorPick !== undefined) {
    clauses.push(`editor_pick = $${idx++}`);
    vals.push(filters.editorPick);
  }
  if (filters.isTrending !== undefined) {
    clauses.push(`is_trending = $${idx++}`);
    vals.push(filters.isTrending);
  }
  if (filters.isActive !== undefined) {
    clauses.push(`is_active = $${idx++}`);
    vals.push(filters.isActive);
  }
  if (filters.minPrice !== undefined) {
    clauses.push(`price >= $${idx++}`);
    vals.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    clauses.push(`price <= $${idx++}`);
    vals.push(filters.maxPrice);
  }
  if (filters.minRating !== undefined) {
    clauses.push(`rating >= $${idx++}`);
    vals.push(filters.minRating);
  }
  if (filters.search) {
    clauses.push(
      `(name ILIKE $${idx} OR editor_note ILIKE $${idx} OR brand ILIKE $${idx})`,
    );
    vals.push(`%${filters.search}%`);
    idx++;
  }

  return { clauses, vals };
}

function buildOrderClause(filters?: ProductFilters): string {
  const orderBy = filters?.orderBy ?? "id";
  const orderDir = filters?.orderDir ?? "asc";
  const col =
    orderBy === "trend_score"
      ? "trend_score"
      : orderBy === "price"
        ? "price"
        : orderBy === "rating"
          ? "rating"
          : orderBy === "name"
            ? "name"
            : orderBy === "created_at"
              ? "created_at"
              : "id";
  return `ORDER BY ${col} ${orderDir === "desc" ? "DESC" : "ASC"}`;
}

function buildLimitClause(
  filters?: ProductFilters,
): { limitClause: string; offsetClause: string } {
  const limit = filters?.limit;
  const offset = filters?.offset;
  return {
    limitClause: limit !== undefined ? `LIMIT ${limit}` : "",
    offsetClause: offset !== undefined ? `OFFSET ${offset}` : "",
  };
}

// ── Resolvers ──

export async function getProduct(id: number): Promise<Product | null> {
  const db = sql();
  const rows = await db`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
  if (rows.length === 0) return null;
  return rows[0] as unknown as Product;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = sql();
  const rows =
    await db`SELECT * FROM products WHERE seo_slug = ${slug} LIMIT 1`;
  if (rows.length === 0) return null;
  return rows[0] as unknown as Product;
}

export async function getAllProducts(
  filters?: ProductFilters,
): Promise<Product[]> {
  const db = sql();
  const { clauses, vals } = buildFilterClauses(filters);
  const where =
    clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const order = buildOrderClause(filters);
  const { limitClause, offsetClause } = buildLimitClause(filters);

  const query = `SELECT * FROM products ${where} ${order} ${limitClause} ${offsetClause}`;
  const rows = await db.query(query, vals);
  return rows as unknown as Product[];
}

export async function getTrendingProducts(
  limit: number = 12,
): Promise<Product[]> {
  const db = sql();
  const rows =
    await db`SELECT * FROM products WHERE is_trending = true AND is_active = true ORDER BY trend_score DESC NULLS LAST LIMIT ${limit}`;
  return rows as unknown as Product[];
}

export async function getEditorsPicks(
  limit: number = 12,
): Promise<Product[]> {
  const db = sql();
  const rows =
    await db`SELECT * FROM products WHERE editor_pick = true AND is_active = true ORDER BY quality_score DESC NULLS LAST LIMIT ${limit}`;
  return rows as unknown as Product[];
}

export async function getProductsByRoom(room: string): Promise<Product[]> {
  const db = sql();
  const rows =
    await db`SELECT * FROM products WHERE room = ${room} AND is_active = true ORDER BY quality_score DESC NULLS LAST`;
  return rows as unknown as Product[];
}

export async function getProductsByStyle(style: string): Promise<Product[]> {
  const db = sql();
  const rows =
    await db`SELECT * FROM products WHERE ${style} = ANY(style) AND is_active = true ORDER BY quality_score DESC NULLS LAST`;
  return rows as unknown as Product[];
}

// ── Collection Resolvers ──

/** Fetch a single collection by slug */
export async function getCollection(slug: string): Promise<Collection | null> {
  const db = sql();
  const rows =
    await db`SELECT * FROM collections WHERE slug = ${slug} AND is_active = true LIMIT 1`;
  if (rows.length === 0) return null;
  return rows[0] as unknown as Collection;
}

/** Fetch all active collections, ordered by sort_order then name */
export async function getAllCollections(): Promise<Collection[]> {
  const db = sql();
  const rows =
    await db`SELECT * FROM collections WHERE is_active = true ORDER BY sort_order, name`;
  return rows as unknown as Collection[];
}

/**
 * Build a dynamic WHERE clause from collection_rules and execute it against the
 * products table. Rules with the same rule_type are OR'd; different rule_types
 * are AND'd together. If the collection has product_ids (editorial override),
 * the results are intersected with that id set.
 */
export async function getCollectionProducts(slug: string): Promise<Product[]> {
  const db = sql();

  // 1. Fetch the collection
  const collRows =
    await db`SELECT * FROM collections WHERE slug = ${slug} LIMIT 1`;
  if (collRows.length === 0) return [];
  const collection = collRows[0] as unknown as Collection;

  // 2. Fetch rules ordered by priority
  const rules =
    await db`SELECT * FROM collection_rules WHERE collection_slug = ${slug} ORDER BY priority`;
  const typedRules = rules as unknown as CollectionRule[];

  // 3. Build dynamic WHERE clause from rules
  const clauses: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  // Group rules by type — same-type rules are OR'd, different types AND'd
  const rulesByType = new Map<string, CollectionRule[]>();
  for (const rule of typedRules) {
    const existing = rulesByType.get(rule.rule_type) || [];
    existing.push(rule);
    rulesByType.set(rule.rule_type, existing);
  }

  for (const [ruleType, typeRules] of rulesByType) {
    const subClauses: string[] = [];
    for (const rule of typeRules) {
      if (ruleType === "room" && rule.rule_operator === "equals") {
        const roomVal =
          typeof rule.rule_value === "string" ? rule.rule_value : String(rule.rule_value);
        subClauses.push(`room = $${idx++}`);
        vals.push(roomVal);
      } else if (ruleType === "style" && rule.rule_operator === "contains") {
        const styleVal =
          typeof rule.rule_value === "string" ? rule.rule_value : String(rule.rule_value);
        subClauses.push(`$${idx++} = ANY(style)`);
        vals.push(styleVal);
      } else if (ruleType === "material" && rule.rule_operator === "contains") {
        const matVal =
          typeof rule.rule_value === "string" ? rule.rule_value : String(rule.rule_value);
        subClauses.push(`$${idx++} = ANY(materials)`);
        vals.push(matVal);
      }
      // extend with more rule_types as needed
    }
    if (subClauses.length > 0) {
      clauses.push(`(${subClauses.join(" OR ")})`);
    }
  }

  // Always require is_active
  clauses.push(`is_active = $${idx++}`);
  vals.push(true);

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const query = `SELECT * FROM products ${where} ORDER BY quality_score DESC NULLS LAST`;

  let rows = await db.query(query, vals);
  let products = rows as unknown as Product[];

  // 4. If collection has product_ids (editorial override), intersect
  if (collection.product_ids && Array.isArray(collection.product_ids) && collection.product_ids.length > 0) {
    const idSet = new Set(collection.product_ids);
    products = products.filter((p) => idSet.has(p.id));
  }

  return products;
}

/** Get product count for a collection (used by collections index) */
export async function getCollectionProductCount(slug: string): Promise<number> {
  const products = await getCollectionProducts(slug);
  return products.length;
}

// ── Full-Text Search ──

/**
 * Search products using PostgreSQL full-text search with ts_rank.
 * Falls back to ILIKE when the tsvector column is empty.
 */
export async function searchProducts(
  query: string,
  filters?: ProductFilters,
  limit?: number,
  offset?: number,
): Promise<{ products: Product[]; total: number }> {
  const db = sql();
  const trimmed = query.trim();

  if (!trimmed) {
    // No query — return filtered products
    const { clauses, vals } = buildFilterClauses({ ...filters, isActive: true });
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const countQuery = `SELECT count(*)::int as total FROM products ${where}`;
    const countRows = await db.query(countQuery, vals);
    const total = (countRows as any[])[0]?.total ?? 0;

    const order = buildOrderClause(filters);
    const { limitClause, offsetClause } = buildLimitClause({
      ...filters,
      limit: limit ?? 12,
      offset: offset ?? 0,
    });
    const selectQuery = `SELECT * FROM products ${where} ${order} ${limitClause} ${offsetClause}`;
    const rows = await db.query(selectQuery, vals);
    return { products: rows as unknown as Product[], total };
  }

  // Build filter clauses (excluding search, which FTS handles)
  const { clauses, vals } = buildFilterClauses({ ...filters, isActive: true, search: undefined });
  let idx = vals.length + 1;

  // Check if any products have NULL tsvector
  const nullCheck = await db`
    SELECT EXISTS(SELECT 1 FROM products WHERE full_text_search IS NULL AND is_active = true) as has_null
  `;
  const hasNull = (nullCheck as any[])[0]?.has_null ?? true;

  let whereClause: string;
  let queryVals = [...vals];

  if (!hasNull) {
    // Pure FTS
    const pIdx = idx;
    whereClause = clauses.length > 0
      ? `${clauses.join(" AND ")} AND full_text_search @@ plainto_tsquery('english', $${pIdx})`
      : `full_text_search @@ plainto_tsquery('english', $${pIdx})`;
    queryVals.push(trimmed);
    idx++;

    const countQuery = `SELECT count(*)::int as total FROM products WHERE ${whereClause}`;
    const countRows = await db.query(countQuery, queryVals);
    const total = (countRows as any[])[0]?.total ?? 0;

    const tsRank = `ts_rank(full_text_search, plainto_tsquery('english', $${pIdx}))`;
    const selectQuery = `SELECT *, ${tsRank} AS rank FROM products WHERE ${whereClause} ORDER BY rank DESC LIMIT ${limit ?? 12} OFFSET ${offset ?? 0}`;
    const rows = await db.query(selectQuery, queryVals);
    return { products: rows as unknown as Product[], total };
  }

  // Mixed: ILIKE fallback for NULL tsvector + FTS for populated ones
  const likeVal = `%${trimmed}%`;
  const qIdx = idx;
  const lIdx = idx + 1;
  const searchClause = `(full_text_search @@ plainto_tsquery('english', $${qIdx}) OR (full_text_search IS NULL AND (name ILIKE $${lIdx} OR editor_note ILIKE $${lIdx} OR brand ILIKE $${lIdx})))`;
  queryVals.push(trimmed, likeVal);
  idx += 2;

  whereClause = clauses.length > 0
    ? `${clauses.join(" AND ")} AND ${searchClause}`
    : `WHERE ${searchClause}`;

  const countQuery = `SELECT count(*)::int as total FROM products ${whereClause}`;
  const countRows = await db.query(countQuery, queryVals);
  const total = (countRows as any[])[0]?.total ?? 0;

  const selectQuery = `SELECT * FROM products ${whereClause} ORDER BY quality_score DESC NULLS LAST LIMIT ${limit ?? 12} OFFSET ${offset ?? 0}`;
  const rows = await db.query(selectQuery, queryVals);
  return { products: rows as unknown as Product[], total };
}

// ── Filter Options ──

const ROOM_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  patio: "Patio",
  storage: "Storage",
  laundry: "Laundry",
  entryway: "Entryway",
  organization: "Organization",
  "dining-room": "Dining Room",
  "home-office": "Home Office",
};

function labelFor(value: string, map: Record<string, string>): string {
  return map[value] ?? value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns filter counts for all facet dimensions, scoped by optional context.
 * Each option shows how many active products match within the current context.
 */
export async function getFilterOptions(
  context?: { room?: string; style?: string; collection?: string },
): Promise<FilterOptions> {
  const db = sql();

  // Build context WHERE clause
  const ctxClauses: string[] = [];
  const ctxVals: unknown[] = [];
  let ci = 1;

  ctxClauses.push(`is_active = $${ci++}`);
  ctxVals.push(true);

  if (context?.room) {
    ctxClauses.push(`room = $${ci++}`);
    ctxVals.push(context.room);
  }
  if (context?.style) {
    ctxClauses.push(`$${ci++} = ANY(style)`);
    ctxVals.push(context.style);
  }
  if (context?.collection) {
    // Collection context: use collection rules to identify products
    const coll = await getCollection(context.collection);
    if (coll) {
      const rules = await db`SELECT * FROM collection_rules WHERE collection_slug = ${context.collection} ORDER BY priority`;
      const typedRules = rules as unknown as CollectionRule[];

      const rulesByType = new Map<string, CollectionRule[]>();
      for (const rule of typedRules) {
        const existing = rulesByType.get(rule.rule_type) || [];
        existing.push(rule);
        rulesByType.set(rule.rule_type, existing);
      }

      for (const [, typeRules] of rulesByType) {
        const subClauses: string[] = [];
        for (const rule of typeRules) {
          if (rule.rule_type === "room" && rule.rule_operator === "equals") {
            subClauses.push(`room = $${ci++}`);
            ctxVals.push(typeof rule.rule_value === "string" ? rule.rule_value : String(rule.rule_value));
          } else if (rule.rule_type === "style" && rule.rule_operator === "contains") {
            subClauses.push(`$${ci++} = ANY(style)`);
            ctxVals.push(typeof rule.rule_value === "string" ? rule.rule_value : String(rule.rule_value));
          }
        }
        if (subClauses.length > 0) ctxClauses.push(`(${subClauses.join(" OR ")})`);
      }

      if (coll.product_ids && Array.isArray(coll.product_ids) && coll.product_ids.length > 0) {
        // Will filter in JS after query; not practical to filter in SQL for counts
      }
    }
  }

  const ctxWhere = ctxClauses.length > 0 ? `WHERE ${ctxClauses.join(" AND ")}` : "";

  // ── Single query to get all facet counts ──
  // Room counts
  const roomRows = await db.query(
    `SELECT room, count(*)::int as count FROM products ${ctxWhere} GROUP BY room ORDER BY count DESC`,
    ctxVals,
  );
  const rooms: FilterOption[] = (roomRows as any[]).map((r) => ({
    value: r.room,
    label: ROOM_LABELS[r.room] ?? labelFor(r.room, {}),
    count: r.count,
  }));

  // Style counts (unnest the style array)
  const styleRows = await db.query(
    `SELECT s, count(*)::int as count FROM products, unnest(style) AS s ${ctxWhere} GROUP BY s ORDER BY count DESC`,
    ctxVals,
  );
  const styles: FilterOption[] = (styleRows as any[]).map((r) => ({
    value: r.s,
    label: labelFor(r.s, {}),
    count: r.count,
  }));

  // Product type counts
  const ptRows = await db.query(
    `SELECT product_type, count(*)::int as count FROM products ${ctxWhere} AND product_type IS NOT NULL GROUP BY product_type ORDER BY count DESC`,
    ctxVals,
  );
  const productTypes: FilterOption[] = (ptRows as any[]).map((r) => ({
    value: r.product_type,
    label: labelFor(r.product_type, {}),
    count: r.count,
  }));

  // Material counts
  const matRows = await db.query(
    `SELECT m, count(*)::int as count FROM products, unnest(materials) AS m ${ctxWhere} GROUP BY m ORDER BY count DESC`,
    ctxVals,
  );
  const materials: FilterOption[] = (matRows as any[]).map((r) => ({
    value: r.m,
    label: labelFor(r.m, {}),
    count: r.count,
  }));

  // Color counts
  const colorRows = await db.query(
    `SELECT c, count(*)::int as count FROM products, unnest(colors) AS c ${ctxWhere} GROUP BY c ORDER BY count DESC`,
    ctxVals,
  );
  const colors: FilterOption[] = (colorRows as any[]).map((r) => ({
    value: r.c,
    label: labelFor(r.c, {}),
    count: r.count,
  }));

  // Mood counts
  const moodRows = await db.query(
    `SELECT m, count(*)::int as count FROM products, unnest(moods) AS m ${ctxWhere} GROUP BY m ORDER BY count DESC`,
    ctxVals,
  );
  const moods: FilterOption[] = (moodRows as any[]).map((r) => ({
    value: r.m,
    label: labelFor(r.m, {}),
    count: r.count,
  }));

  // Price range
  const priceRows = await db.query(
    `SELECT min(price)::float as min, max(price)::float as max FROM products ${ctxWhere}`,
    ctxVals,
  );
  const priceRange = {
    min: (priceRows as any[])[0]?.min ?? 0,
    max: (priceRows as any[])[0]?.max ?? 1000,
  };

  return { rooms, styles, productTypes, materials, colors, moods, priceRange };
}
