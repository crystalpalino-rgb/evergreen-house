#!/usr/bin/env bun
/**
 * Evergreen House Content Generator CLI
 *
 * Generates TikTok/social content packages for a given room.
 *
 * Usage:
 *   bun run scripts/generate-content.ts --room bedroom --count 5
 *   bun run scripts/generate-content.ts --room living-room --count 3 --style editorial
 *   bun run scripts/generate-content.ts --room kitchen --count 4 --min-score 85
 *
 * Output:
 *   A markdown file at /home/team/shared/tiktok-batch-{n}.md
 */

import { sql } from "../src/db";
import { generateContentFromProducts } from "../src/lib/content-engine/generator";
import { validateContent } from "../src/lib/content-engine/brand-guardian";
import { markProductsUsed } from "../src/lib/content-engine/diversity";
import { HOOKS, type HookStyle } from "../src/lib/content-engine/hooks";
import type { Product } from "../src/lib/types";
import * as fs from "node:fs";

// ─── CLI argument parsing ───────────────────────────────────────────────────

function parseArgs(): {
  room: string;
  count: number;
  style?: HookStyle;
  minScore?: number;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) {
      params[key] = value;
    }
  }

  const room = params["room"];
  if (!room) {
    console.error("❌ Missing required argument: --room");
    console.error("   Usage: bun run scripts/generate-content.ts --room <room> --count <n>");
    process.exit(1);
  }

  const count = parseInt(params["count"] || "5", 10);
  if (isNaN(count) || count < 1 || count > 20) {
    console.error("❌ --count must be between 1 and 20");
    process.exit(1);
  }

  const style = params["style"] as HookStyle | undefined;
  if (style && !HOOKS.some((h) => h.style === style)) {
    console.error(`❌ Unknown hook style: "${style}". Valid styles: ${[...new Set(HOOKS.map(h => h.style))].join(", ")}`);
    process.exit(1);
  }

  const minScore = params["min-score"]
    ? parseInt(params["min-score"], 10)
    : undefined;

  return {
    room,
    count,
    style,
    minScore,
    dryRun: process.argv.includes("--dry-run"),
  };
}

// ─── DB row type ────────────────────────────────────────────────────────────

interface ProductRow {
  id: number;
  name: string;
  full_name: string | null;
  brand: string | null;
  room: string;
  style: string[];
  materials: string[];
  colors: string[];
  moods: string[];
  seasons: string[];
  product_type: string | null;
  lifestyle_tags: string[];
  amazon_url: string;
  price: number | null;
  price_original: number | null;
  rating: number | null;
  review_count: number | null;
  is_prime: boolean;
  availability: string;
  editor_note: string | null;
  editor_why: string | null;
  editor_tip: string | null;
  founder_note: string | null;
  pros: string[];
  cons: string[];
  best_for: string | null;
  editor_pick: boolean;
  image_url: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  image_gallery: unknown;
  seo_title: string | null;
  seo_description: string | null;
  seo_slug: string | null;
  canonical_url: string | null;
  schema_type: string | null;
  pinterest_title: string | null;
  pinterest_description: string | null;
  pinterest_image_url: string | null;
  pinterest_board: string | null;
  pinterest_hashtags: string[];
  ai_summary: string | null;
  ai_keywords: string[];
  ai_content_generated_at: string | null;
  completeness_score: number;
  quality_score: number;
  trend_score: number;
  evergreen_score: number;
  is_trending: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  data_version: number;
  import_batch: string | null;
}

function rowToProduct(row: ProductRow): Product {
  return {
    ...row,
    price: row.price != null ? Number(row.price) : null,
    price_original: row.price_original != null ? Number(row.price_original) : null,
    rating: row.rating != null ? Number(row.rating) : null,
    review_count: row.review_count != null ? Number(row.review_count) : null,
    image_width: row.image_width != null ? Number(row.image_width) : null,
    image_height: row.image_height != null ? Number(row.image_height) : null,
    quality_score: Number(row.quality_score),
    trend_score: Number(row.trend_score),
    evergreen_score: Number(row.evergreen_score),
  };
}

// ─── Star rating helper ─────────────────────────────────────────────────────

function starRating(score: number): string {
  if (score >= 90) return "★★★★★";
  if (score >= 80) return "★★★★";
  if (score >= 70) return "★★★";
  if (score >= 60) return "★★";
  return "★";
}

// ─── Output formatting (TikTok-ready, matching batch 1) ─────────────────────

function formatTikTokContent(
  pkg: ReturnType<typeof generateContentFromProducts>,
  batchNum: number,
): string {
  const roomDisplay = pkg.room.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  let out = "";
  out += `# Evergreen House — TikTok Content Batch #${batchNum}\n`;
  out += `*Created ${new Date(pkg.generatedAt).toISOString().split("T")[0]} | Faceless video script | All products sourced from live database*\n\n`;
  out += `---\n\n`;

  // ── Single video section ──
  out += `## Video 1: ${roomDisplay} Pieces Worth Keeping\n`;
  out += `**Hook:** ${pkg.hook}\n`;
  out += `**Music vibe:** ${pkg.musicVibe}\n\n`;
  out += `**Visual sequence:** ${pkg.visualSequence}\n\n`;

  for (let i = 0; i < pkg.products.length; i++) {
    const { product, caption } = pkg.products[i];
    out += `${i + 1}. **${product.name}** — ${caption}\n`;
    if (product.image_url) {
      out += `   Image: ${product.image_url}\n`;
    }
    out += `   Link: ${product.amazon_url}\n\n`;
  }

  out += `**Closing:** Evergreen House — Browse the full curated collection at EvergreenHouse.co\n\n`;
  out += `---\n\n`;

  // ── Scoring summary table ──
  out += `## Product Scoring Summary\n`;
  out += `All products scored on timelessness, visual quality, material quality, lifestyle appeal, and photography before selection.\n\n`;
  out += `| Product | Rating | Price | Timelessness | Visual | Material | Lifestyle | Photo |\n`;
  out += `|---------|--------|-------|:---:|:---:|:---:|:---:|:---:|\n`;

  for (const { product, score } of pkg.products) {
    const rating = product.rating ? product.rating.toFixed(1) : "—";
    const price = product.price ? `$${product.price.toFixed(2)}` : "—";
    out += `| ${product.name} | ${rating} | ${price} | ${starRating(score.timelessness)} | ${starRating(score.visualQuality)} | ${starRating(score.materialQuality)} | ${starRating(score.lifestyleAppeal)} | ${starRating(score.photography)} |\n`;
  }

  out += `\n`;

  // ── Production notes ──
  out += `## Production Notes\n\n`;
  out += `- **Format:** 9:16 vertical, ideal for TikTok + Reels + Shorts\n`;
  out += `- **Pacing:** 3–4 seconds per product, slow zooms or gentle panning on still images\n`;
  out += `- **Text overlay:** One caption per product, centered lower-third, serif or clean sans-serif font\n`;
  out += `- **No talking heads:** All b-roll or still-image slideshow with music\n`;
  out += `- **Product images:** Amazon-hosted URLs above — download and crop to 9:16 for best results\n`;
  out += `- **Affiliate disclosure:** Include "#affiliate" or "commission earned" per platform guidelines\n`;

  return out;
}

// ─── Find next batch number ─────────────────────────────────────────────────

function getNextBatchNumber(): number {
  const dir = "/home/team/shared";
  let maxN = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const match = file.match(/^tiktok-batch-(\d+)\.md$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxN) maxN = n;
      }
    }
  } catch {
    // Ignore read errors
  }
  return maxN + 1;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const { room, count, style, minScore, dryRun } = parseArgs();

  console.log("🌿 Evergreen House — Content Generator");
  console.log(`   Room: ${room}`);
  console.log(`   Count: ${count}`);
  console.log(`   Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  if (style) console.log(`   Hook style: ${style}`);
  if (minScore) console.log(`   Min score: ${minScore}`);
  console.log("");

  // Fetch products for this room
  const db = sql();
  console.log("📦 Querying products...");

  const rows = (await db`
    SELECT * FROM products
    WHERE room = ${room}
      AND is_active = true
    ORDER BY evergreen_score DESC NULLS LAST
  `) as ProductRow[];

  console.log(`   Found ${rows.length} products in "${room}"\n`);

  if (rows.length === 0) {
    console.log("❌ No products found for this room. Available rooms:");
    const roomRows = await db`
      SELECT DISTINCT room FROM products WHERE is_active = true ORDER BY room
    `;
    for (const r of roomRows as { room: string }[]) {
      console.log(`   - ${r.room}`);
    }
    process.exit(1);
  }

  // Convert to Product objects
  const products: Product[] = rows.map(rowToProduct);

  // Generate content
  console.log("🎯 Scoring and selecting products...");
  const pkg = generateContentFromProducts(room, products, count, {
    hookStyle: style,
    minScore,
  });

  console.log(`   Hook: "${pkg.hook}"`);
  console.log(`   Music vibe: ${pkg.musicVibe}`);
  console.log(`   Visual sequence: ${pkg.visualSequence}`);
  console.log(`   Selected: ${pkg.products.length} products\n`);

  if (pkg.products.length === 0) {
    console.log("❌ No products met the quality threshold. Try a lower --min-score.");
    process.exit(1);
  }

  // Validate
  console.log("🔍 Validating content...");
  const validation = validateContent(pkg);
  console.log(`   ${validation.summary}`);

  for (const issue of validation.issues) {
    const icon = issue.type === "error" ? "❌" : "⚠️";
    console.log(`   ${icon} [${issue.field}] ${issue.message}`);
  }

  if (!validation.passed) {
    console.log("\n❌ Validation failed — fix errors before publishing.");
    if (dryRun) {
      console.log("   (Dry run — content was NOT saved)");
    }
    process.exit(1);
  }

  // Output
  console.log("");

  for (let i = 0; i < pkg.products.length; i++) {
    const { product, score, caption } = pkg.products[i];
    const price = product.price ? `$${Math.round(product.price)}` : "N/A";
    console.log(
      `   ${i + 1}. ${product.name.slice(0, 50).padEnd(50)} | Score: ${String(score.overall).padStart(3)} | ${price}`,
    );
    console.log(`      "${caption}"`);
    console.log(`      ${product.amazon_url}`);
    if (product.image_url) {
      console.log(`      Image: ${product.image_url.slice(0, 60)}...`);
    }
    console.log("");
  }

  if (dryRun) {
    console.log("🏁 Dry run complete — content was NOT saved.");
    return;
  }

  // Write output file
  const batchNum = getNextBatchNumber();
  const outputPath = `/home/team/shared/tiktok-batch-${batchNum}.md`;
  const markdown = formatTikTokContent(pkg, batchNum);

  fs.writeFileSync(outputPath, markdown, "utf-8");
  console.log(`📄 Output written to: ${outputPath}`);

  // Mark products as used
  const productIds = pkg.products.map((p) => p.product.id);
  markProductsUsed(productIds, room, pkg.hook);
  console.log(`📝 Marked ${productIds.length} products as used in diversity tracker`);

  console.log("\n✨ Done.");
}

main().catch((err) => {
  console.error("❌ Content generation failed:", err);
  process.exit(1);
});
