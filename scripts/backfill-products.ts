/**
 * Product Backfill Script — Evergreen Intelligence Layer
 *
 * For each existing product without seo_slug, infers and populates:
 *   SEO fields, Pinterest fields, product_type, materials, colors, moods, scores.
 *
 * Idempotent: skips products that already have seo_slug populated.
 *
 * Usage: DATABASE_URL="<url>" bun run scripts/backfill-products.ts
 */

import { sql } from "../src/db";

const db = sql();

// ── Slugify ──
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s/]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// ── Room label for display ──
function roomLabel(room: string): string {
  const map: Record<string, string> = {
    "living-room": "living room",
    bedroom: "bedroom",
    kitchen: "kitchen",
    bathroom: "bathroom",
    office: "home office",
    patio: "patio",
    "dining-room": "dining room",
    entryway: "entryway",
  };
  return map[room] ?? room;
}

// ── Product type inference ──
function inferProductType(name: string): string {
  const n = name.toLowerCase();
  // Order matters: check more specific patterns first
  if (/\b(candle|diffuser)\b/.test(n)) return "decor";
  if (/\b(towel|mat|shower)\b/.test(n)) return "bath";
  if (/\b(fan|heater|purifier)\b/.test(n)) return "appliance";
  if (/\b(lamp|light|sconce|chandelier|pendant)\b/.test(n)) return "lighting";
  if (/\b(mirror)\b/.test(n)) return "mirror";
  if (/\b(vase|planter|decor\b|ornament)\b/.test(n)) return "decor";
  if (
    /\b(plate|bowl|dish|glass|mug|cup|utensil|cutlery|flatware|dinnerware)\b/.test(
      n,
    )
  )
    return "kitchenware";
  if (/\b(frame|print\b|art\b|canvas|wall\s*art)\b/.test(n)) return "wall-art";
  if (/\b(rug|carpet|runner)\b/.test(n)) return "rug";
  if (/\b(sofa|couch|loveseat|sectional)\b/.test(n)) return "seating";
  if (/\b(chair|stool|ottoman|bench|pouf|recliner)\b/.test(n)) return "seating";
  if (
    /\b(basket|bin|organizer|stand|shelf|rack|hanger|hook|storage)\b/.test(n)
  )
    return "storage";
  if (/\b(table|desk|nightstand|console|end\s*table|coffee\s*table)\b/.test(n))
    return "table";
  if (/\b(pillow|cushion|throw|blanket|duvet|sheet|duvet\s*cover|quilt|comforter|sham)\b/.test(n))
    return "textile";
  if (/\b(tray)\b/.test(n)) return "decor";
  if (/\b(bookend|book\b|notebook|journal)\b/.test(n)) return "book";
  if (
    /\b(curtain|drape|valance|window\s*treatment)\b/.test(
      n,
    )
  )
    return "textile";
  if (/\b(clock)\b/.test(n)) return "decor";
  if (/\b(headboard|bed\s*frame)\b/.test(n)) return "furniture";
  return "decor";
}

// ── Material inference ──
function inferMaterials(name: string): string[] {
  const n = name.toLowerCase();
  const materials: string[] = [];

  if (/\b(wood|acacia|oak|walnut|bamboo|teak|mahogany|birch|pine)\b/.test(n))
    materials.push("wood");
  if (/\b(glass|crystal)\b/.test(n)) materials.push("glass");
  if (
    /\b(metal|steel|iron|aluminum|gold|brass|copper|stainless|chrome)\b/.test(
      n,
    )
  )
    materials.push("metal");
  if (
    /\b(ceramic|porcelain|stoneware|earthenware|terra\s*cotta|terracotta)\b/.test(
      n,
    )
  )
    materials.push("ceramic");
  if (
    /\b(linen|cotton|wool|velvet|silk|fabric|microfiber|fleece|chenille|polyester)\b/.test(
      n,
    )
  )
    materials.push("fabric");
  if (/\b(rattan|wicker|jute|seagrass|bamboo|hemp|sisal)\b/.test(n))
    materials.push("natural-fiber");
  if (
    /\b(marble|stone|concrete|travertine|granite|slate|quartz|soapstone)\b/.test(
      n,
    )
  )
    materials.push("stone");
  if (/\b(leather|faux\s*leather|pleather)\b/.test(n)) materials.push("leather");
  if (/\b(plastic|acrylic|resin|silicone|vinyl|polycarbonate)\b/.test(n))
    materials.push("synthetic");

  return materials;
}

// ── Color inference ──
function inferColors(name: string): string[] {
  const n = name.toLowerCase();
  const colors: string[] = [];

  if (/\b(white|cream|ivory|off-white|off\s*white)\b/.test(n)) colors.push("white");
  if (/\b(black|charcoal|onyx|ebony)\b/.test(n)) colors.push("black");
  if (/\b(grey|gray|charcoal|slate|silver|pewter)\b/.test(n)) colors.push("gray");
  if (/\b(brown|walnut|acorn|espresso|coffee|chestnut|mocha|cocoa|mahogany)\b/.test(n))
    colors.push("brown");
  if (
    /\b(beige|taupe|tan|sand|oatmeal|natural|linen|cream|bone|ecru)\b/.test(n)
  )
    colors.push("beige");
  if (/\b(blue|navy|indigo|denim|teal|cobalt|sky)\b/.test(n)) colors.push("blue");
  if (/\b(green|sage|olive|emerald|forest|mint|hunter)\b/.test(n))
    colors.push("green");
  if (/\b(gold|brass)\b/.test(n)) colors.push("gold");

  return colors;
}

// ── Mood inference ──
function inferMoods(room: string, productType: string): string[] {
  const moods: string[] = [];
  const r = room.toLowerCase();
  const pt = productType.toLowerCase();

  if (r === "bedroom" && pt === "textile") {
    moods.push("cozy", "calm");
  } else if (r === "bedroom") {
    moods.push("calm", "restful");
  } else if (r === "living-room" && pt === "seating") {
    moods.push("cozy", "gathering");
  } else if (r === "living-room") {
    moods.push("cozy", "relaxed");
  } else if (r === "kitchen") {
    moods.push("warm", "functional");
  } else if (r === "bathroom") {
    moods.push("spa", "calm");
  } else if (r === "office") {
    moods.push("focused", "calm");
  } else if (r === "patio") {
    moods.push("relaxed", "outdoor");
  } else if (r === "dining-room") {
    moods.push("gathering", "warm");
  } else {
    moods.push("timeless", "warm");
  }

  return moods;
}

// ── Pinterest board mapping ──
function inferPinterestBoard(room: string): string {
  const map: Record<string, string> = {
    "living-room": "Living Room Inspiration",
    bedroom: "Bedroom Style",
    kitchen: "Kitchen & Dining",
    bathroom: "Bathroom Refresh",
    office: "Home Office Ideas",
    patio: "Outdoor Living",
    "dining-room": "Kitchen & Dining",
    entryway: "Entryway & Hallway",
  };
  return map[room] ?? "Home Finds";
}

// ── Format price ──
function formatPrice(price: unknown): string {
  const p = typeof price === "string" ? parseFloat(price) : (price as number);
  if (!p && p !== 0) return "affordable price";
  return `$${p.toFixed(0)}`;
}

// ── Compute completeness score ──
function computeCompleteness(product: Record<string, unknown>): number {
  let score = 0;
  if (product.seo_title) score += 10;
  if (product.seo_description) score += 10;
  if (product.pinterest_title) score += 10;
  if (product.pinterest_description) score += 10;
  if (product.product_type) score += 10;
  if (
    product.materials &&
    Array.isArray(product.materials) &&
    product.materials.length > 0
  )
    score += 10;
  if (
    product.colors &&
    Array.isArray(product.colors) &&
    product.colors.length > 0
  )
    score += 10;
  if (product.moods && Array.isArray(product.moods) && product.moods.length > 0)
    score += 10;
  if (product.editor_note) score += 10;
  if (product.image_url) score += 10;
  return score;
}

// ── Compute quality score ──
function computeQualityScore(rating: unknown): number {
  const r = typeof rating === "string" ? parseFloat(rating) : (rating as number);
  if (!r) return 5;
  return Math.round(r * 2);
}

// ── Main ──
async function main() {
  console.log("=== Product Backfill: Evergreen Intelligence Layer ===\n");

  // Fetch all products that need backfill (no seo_slug)
  const products = await db`
    SELECT * FROM products
    WHERE seo_slug IS NULL
    ORDER BY id
  `;

  console.log(`Found ${products.length} products to backfill.\n`);

  if (products.length === 0) {
    console.log("Nothing to do — all products already have seo_slug.");
    return;
  }

  let updated = 0;
  let errors = 0;

  for (const p of products) {
    try {
      const name: string = p.name || "";
      const room: string = p.room || "living-room";
      const price = p.price;
      const rating = p.rating;
      const editorNote: string = p.editor_note || "";
      const imageUrl: string = p.image_url || "";

      // Slug
      const seoSlug = slugify(name);

      // SEO
      const seoTitle = `${name} — Evergreen House`;
      const roomDisplay = roomLabel(room);
      const priceDisplay = formatPrice(price);
      const seoDescription = `Shop the ${name} — editor-approved ${roomDisplay} find at ${priceDisplay}. Free delivery with Prime.`;
      const canonicalUrl = `https://evergreenhouse.co/product/${seoSlug}`;

      // Pinterest
      const pinterestTitle = `${name} | ${roomDisplay} decor | Evergreen House`;
      const pinterestDescription = `${name}, an editor-approved ${roomDisplay} find. Shop this and more timeless home finds at Evergreen House.`;
      const pinterestBoard = inferPinterestBoard(room);

      // Product type
      const productType = inferProductType(name);

      // Materials
      const materials = inferMaterials(name);

      // Colors
      const colors = inferColors(name);

      // Moods
      const moods = inferMoods(room, productType);

      // Scores
      const completenessScore = computeCompleteness({
        seo_title: seoTitle,
        seo_description: seoDescription,
        pinterest_title: pinterestTitle,
        pinterest_description: pinterestDescription,
        product_type: productType,
        materials,
        colors,
        moods,
        editor_note: editorNote,
        image_url: imageUrl,
      });
      const qualityScore = computeQualityScore(rating);

      // Update in DB
      await db`
        UPDATE products SET
          seo_slug = ${seoSlug},
          seo_title = ${seoTitle},
          seo_description = ${seoDescription},
          canonical_url = ${canonicalUrl},
          pinterest_title = ${pinterestTitle},
          pinterest_description = ${pinterestDescription},
          pinterest_board = ${pinterestBoard},
          product_type = ${productType},
          materials = ${materials},
          colors = ${colors},
          moods = ${moods},
          completeness_score = ${completenessScore},
          quality_score = ${qualityScore},
          is_active = true,
          data_version = 1,
          updated_at = NOW()
        WHERE id = ${p.id}
      `;

      updated++;
      if (updated % 20 === 0) {
        console.log(`  Progress: ${updated}/${products.length}...`);
      }
    } catch (err) {
      errors++;
      console.error(`  Error on product ${p.id} (${p.name}):`, err);
    }
  }

  console.log(`\nDone. ${updated} updated, ${errors} errors.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
