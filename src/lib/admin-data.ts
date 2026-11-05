// Admin dashboard data server functions.
//
// The dashboards used to read this data over the hand-written /api/admin/*
// routes. Those routes only exist in serve.ts (the local sandbox server), so on
// the deployed build every fetch fell through to the SSR handler and came back
// as HTML, which broke res.json(). The same reads now live here as server
// functions, which the SSR handler serves on every host.
//
// Every function carries `.middleware([adminOnly])`, exactly like the marketing
// server functions in ./marketing.ts: no valid admin session cookie means a 401
// before a single row is read.
//
// The return shapes are the ones the admin UI already renders, and the queries
// are the ones serve.ts runs, so no component had to change beyond the call.

import { createServerFn } from "@tanstack/react-start";
import { sql } from "~/db";
import { adminOnly } from "~/lib/admin-fns";

// ── Types ──

export interface AdminProductSummary {
  id: number;
  name: string;
  fullName: string | null;
  room: string;
  price: number | null;
  rating: number | null;
  completenessScore: number;
  qualityScore: number;
  imageUrl: string | null;
  aiSummary: string | null;
  editorNote: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminLowQualityProduct extends AdminProductSummary {
  seoTitle?: string | null;
  pinterestTitle?: string | null;
  issues: string[];
}

export interface AdminSummary {
  totalProducts: number;
  activeProducts: number;
  avgCompleteness: number;
  avgQuality: number;
  missingImages: number;
  missingSEO: number;
  missingAI: number;
  missingPinterest: number;
  collections: number;
  collectionRules: number;
  recentlyAdded: AdminProductSummary[];
  needsAttention: AdminProductSummary[];
}

export interface AdminLowQualityResult {
  products: AdminLowQualityProduct[];
}

// ── Helpers ──

// Postgres numeric columns (price, rating, quality_score) arrive from the Neon
// driver as strings. The UI treats them as numbers (price.toFixed, score maths),
// so coerce here rather than letting a string reach the render.
const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const serializeProduct = (p: any): AdminProductSummary => ({
  id: p.id,
  name: p.name,
  fullName: p.full_name,
  room: p.room,
  price: numOrNull(p.price),
  rating: numOrNull(p.rating),
  completenessScore: num(p.completeness_score),
  qualityScore: num(p.quality_score),
  imageUrl: p.image_url,
  aiSummary: p.ai_summary,
  editorNote: p.editor_note,
  createdAt: String(p.created_at ?? ""),
  updatedAt: String(p.updated_at ?? ""),
});

/** Count rows in a table, or 0 when the table is not part of this database. */
const countOrZero = async (table: "collections" | "collection_rules"): Promise<number> => {
  try {
    const rows: any[] =
      table === "collections"
        ? await sql()`SELECT count(*)::int AS c FROM collections`
        : await sql()`SELECT count(*)::int AS c FROM collection_rules`;
    return num(rows[0]?.c);
  } catch {
    return 0;
  }
};

// ── Dashboard ──

/** Headline counts plus the two short product lists the dashboard shows. */
export const getAdminSummary = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .handler(async (): Promise<AdminSummary> => {
    const [
      totalRows,
      activeRows,
      avgCompRows,
      avgQualRows,
      missingImgRows,
      missingSEORows,
      missingAIRows,
      missingPinRows,
      collections,
      collectionRules,
      recentRows,
      attentionRows,
    ] = await Promise.all([
      sql()`SELECT count(*)::int AS c FROM products`,
      sql()`SELECT count(*)::int AS c FROM products WHERE is_active = true`,
      sql()`SELECT coalesce(avg(completeness_score), 0)::float AS v FROM products`,
      sql()`SELECT coalesce(avg(quality_score), 0)::float AS v FROM products`,
      sql()`SELECT count(*)::int AS c FROM products WHERE image_url IS NULL`,
      sql()`SELECT count(*)::int AS c FROM products WHERE seo_title IS NULL OR seo_description IS NULL`,
      sql()`SELECT count(*)::int AS c FROM products WHERE ai_summary IS NULL`,
      sql()`SELECT count(*)::int AS c FROM products WHERE pinterest_title IS NULL OR pinterest_description IS NULL`,
      countOrZero("collections"),
      countOrZero("collection_rules"),
      sql()`SELECT id, name, full_name, room, price, rating, completeness_score, quality_score, image_url, ai_summary, editor_note, created_at, updated_at FROM products ORDER BY updated_at DESC NULLS LAST LIMIT 8`,
      sql()`SELECT id, name, full_name, room, price, rating, completeness_score, quality_score, image_url, ai_summary, editor_note FROM products WHERE completeness_score < 50 OR image_url IS NULL OR ai_summary IS NULL ORDER BY completeness_score ASC LIMIT 12`,
    ]);

    const avgCompleteness = Math.round(num((avgCompRows as any[])[0]?.v) * 10) / 10;
    const avgQuality = Math.round(num((avgQualRows as any[])[0]?.v) * 10) / 10;

    return {
      totalProducts: num((totalRows as any[])[0]?.c),
      activeProducts: num((activeRows as any[])[0]?.c),
      avgCompleteness,
      avgQuality,
      missingImages: num((missingImgRows as any[])[0]?.c),
      missingSEO: num((missingSEORows as any[])[0]?.c),
      missingAI: num((missingAIRows as any[])[0]?.c),
      missingPinterest: num((missingPinRows as any[])[0]?.c),
      collections,
      collectionRules,
      recentlyAdded: (recentRows as any[]).map(serializeProduct),
      needsAttention: (attentionRows as any[]).map(serializeProduct),
    };
  });

/** The long low-quality list, with the issue tags the dashboard renders. */
export const getAdminLowQuality = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .handler(async (): Promise<AdminLowQualityResult> => {
    const rows: any[] = await sql()`
      SELECT id, name, full_name, room, price, rating, completeness_score, quality_score,
             image_url, ai_summary, editor_note, seo_title, pinterest_title
      FROM products
      WHERE completeness_score < 50 OR image_url IS NULL OR ai_summary IS NULL
      ORDER BY completeness_score ASC
      LIMIT 50
    `;

    return {
      products: rows.map((p) => ({
        ...serializeProduct(p),
        seoTitle: p.seo_title,
        pinterestTitle: p.pinterest_title,
        issues: [
          !p.image_url && "missing-image",
          num(p.completeness_score) < 50 && "low-completeness",
          !p.ai_summary && "missing-ai",
          !p.seo_title && "missing-seo",
          !p.pinterest_title && "missing-pinterest",
        ].filter((issue): issue is string => Boolean(issue)),
      })),
    };
  });
