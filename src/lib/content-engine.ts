/**
 * Content Generation Engine — Phase D
 * Template-driven editorial content generation for SEO, Pinterest, and AI enrichment.
 * Evergreen House voice: editorial, warm, trustworthy, timeless, intentional.
 */

import type { Product } from "./types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Format a room name for display: "living-room" → "Living Room" */
function fmtRoom(room: string): string {
  return room
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Format a product type for display: "wall-art" → "Wall Art" */
function fmtType(pt: string | null): string {
  if (!pt) return "Decor";
  return pt
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Get primary style string from product */
function primaryStyle(p: Product): string {
  if (!p.style || p.style.length === 0) return "Timeless";
  return p.style[0].charAt(0).toUpperCase() + p.style[0].slice(1);
}

/** Get primary material string from product */
function primaryMaterial(p: Product): string {
  const mats = p.materials || [];
  if (mats.length === 0) {
    // Infer from product type
    const pt = p.product_type;
    if (pt === "textile") return "Soft";
    if (pt === "lighting") return "Elegant";
    if (pt === "seating") return "Comfortable";
    if (pt === "table") return "Solid";
    if (pt === "storage") return "Practical";
    return "Quality";
  }
  return mats[0].charAt(0).toUpperCase() + mats[0].slice(1);
}

/** Format price for display */
function fmtPrice(p: Product): string {
  if (p.price == null) return "currently priced";
  return `at $${Math.round(p.price)}`;
}

/** Get the best primary mood */
function primaryMood(p: Product): string {
  if (!p.moods || p.moods.length === 0) return "warm";
  return p.moods[0];
}

/** Clean room prefix for readable room names */
function readableRoom(room: string): string {
  if (room === "living-room") return "living room";
  if (room === "dining-room") return "dining room";
  return room;
}

// ─── Part 1: SEO Template Engine ───────────────────────────────────────────────

/** Title templates by product_type */
const SEO_TITLE_TEMPLATES: Record<string, (p: Product) => string> = {
  seating: (p) =>
    `${p.name} | ${primaryStyle(p)} ${fmtType(p.product_type)} for ${fmtRoom(p.room)} | Evergreen House`,
  lighting: (p) =>
    `${p.name} — ${primaryMaterial(p)} ${fmtType(p.product_type)} | ${fmtRoom(p.room)} Lighting | Evergreen House`,
  decor: (p) =>
    `${p.name} — ${primaryStyle(p)} ${fmtType(p.product_type)} for ${fmtRoom(p.room)} | Evergreen House`,
  textile: (p) =>
    `${p.name} — ${primaryMaterial(p)} ${fmtType(p.product_type)} | ${fmtRoom(p.room)} Essentials | Evergreen House`,
  table: (p) =>
    `${p.name} — ${primaryMaterial(p)} ${fmtType(p.product_type)} for ${fmtRoom(p.room)} | Evergreen House`,
  kitchenware: (p) =>
    `${p.name} — ${fmtType(p.product_type)} for ${fmtRoom(p.room)} | Evergreen House`,
  storage: (p) =>
    `${p.name} — ${fmtRoom(p.room)} Organization | Evergreen House`,
  default: (p) =>
    `${p.name} — Editor-Approved ${fmtRoom(p.room)} Find | Evergreen House`,
};

export function generateSEOTitle(product: Product): string {
  const pt = product.product_type || "default";
  const template = SEO_TITLE_TEMPLATES[pt] || SEO_TITLE_TEMPLATES.default;
  return template(product);
}

/** Generate meta description (150-160 chars) — warm, editorial voice */
export function generateSEODescription(product: Product): string {
  const room = readableRoom(product.room);
  const pt = fmtType(product.product_type);
  const style = primaryStyle(product);
  const price = fmtPrice(product);
  const rating = product.rating ? `Rated ${product.rating} stars. ` : "";
  const editorPick = product.editor_pick ? "An editor favorite, " : "";

  const base = (): string => {
    const pt2 = product.product_type;
    if (pt2 === "seating") {
      return `${editorPick}The ${product.name} brings ${style.toLowerCase()} comfort to your ${room}. ${rating}Shop this timeless ${pt.toLowerCase()} ${price} at Evergreen House.`;
    }
    if (pt2 === "lighting") {
      return `${editorPick}The ${product.name} casts a warm, ${style.toLowerCase()} glow in any ${room}. ${rating}Discover this ${pt.toLowerCase()} ${price} at Evergreen House.`;
    }
    if (pt2 === "textile") {
      return `${editorPick}The ${product.name} adds ${style.toLowerCase()} texture and warmth to your ${room}. ${rating}Find this ${pt.toLowerCase()} ${price} at Evergreen House.`;
    }
    if (pt2 === "table") {
      return `${editorPick}The ${product.name} anchors your ${room} with ${style.toLowerCase()} presence. ${rating}Shop this ${pt.toLowerCase()} ${price} at Evergreen House.`;
    }
    if (pt2 === "kitchenware") {
      return `${editorPick}The ${product.name} elevates everyday moments in your ${room}. ${rating}Discover this ${pt.toLowerCase()} ${price} at Evergreen House.`;
    }
    if (pt2 === "storage") {
      return `${editorPick}The ${product.name} brings quiet order to your ${room}. ${rating}Shop this organization find ${price} at Evergreen House.`;
    }
    // decor and default
    return `${editorPick}The ${product.name} — a ${style.toLowerCase()} ${pt.toLowerCase()} that feels right at home in any ${room}. ${rating}Shop ${price} at Evergreen House.`;
  };

  let desc = base();
  // Trim to 150-160 chars
  if (desc.length > 160) {
    desc = desc.slice(0, 157).replace(/\s+\S*$/, "") + "...";
  }
  if (desc.length < 120) {
    desc = `${desc} Thoughtfully curated for timeless, beautiful living.`;
  }
  return desc.slice(0, 160);
}

/** Generate image alt text */
export function generateImageAlt(product: Product): string {
  const room = readableRoom(product.room);
  const style = primaryStyle(product);
  const pt = fmtType(product.product_type);
  const material = primaryMaterial(product);
  const colors = (product.colors || []).slice(0, 2).join(" and ") || "neutral";

  if (product.product_type === "seating") {
    return `${style} ${pt.toLowerCase()} in ${colors} tones — ${product.name} styled in a ${room}`;
  }
  if (product.product_type === "lighting") {
    return `${material} ${pt.toLowerCase()} — ${product.name} illuminating a ${style.toLowerCase()} ${room}`;
  }
  if (product.product_type === "textile") {
    return `${style} ${colors} ${pt.toLowerCase()} — ${product.name} draped in a cozy ${room} setting`;
  }
  return `${style} ${pt.toLowerCase()} in ${colors} — ${product.name} styled in a ${room} at Evergreen House`;
}

// ─── Part 2: Pinterest Engine ─────────────────────────────────────────────────

export function generatePinterestTitle(product: Product): string {
  const room = fmtRoom(product.room);
  const type = fmtType(product.product_type);
  const style = primaryStyle(product);
  return `${product.name} | ${room} ${type} Ideas | ${style} Style`;
}

export function generatePinterestDescription(product: Product): string {
  const room = readableRoom(product.room);
  const type = fmtType(product.product_type);
  const style = primaryStyle(product);
  const price = fmtPrice(product);
  const mood = primaryMood(product);

  let desc = `Love this ${mood} ${type.toLowerCase()} for the ${room}? The ${product.name} brings ${style.toLowerCase()} charm with everyday practicality. `;

  if (product.editor_note) {
    desc += `${product.editor_note.slice(0, 100).replace(/\.$/, "")}. `;
  }

  desc += `Shop this and more timeless home finds at Evergreen House. ${price}.`;

  // Pinterest descriptions should be 200-300 chars
  if (desc.length > 300) {
    desc = desc.slice(0, 297).replace(/\s+\S*$/, "") + "...";
  }
  return desc;
}

export function generatePinterestHashtags(product: Product): string[] {
  const tags: Set<string> = new Set();

  // Room-based tags
  const room = product.room;
  if (room === "living-room") tags.add("#LivingRoomDecor");
  else if (room === "bedroom") tags.add("#BedroomDecor");
  else if (room === "kitchen") tags.add("#KitchenDecor");
  else if (room === "bathroom") tags.add("#BathroomDecor");
  else if (room === "dining-room") tags.add("#DiningRoomDecor");
  else if (room === "entryway") tags.add("#EntrywayDecor");
  else if (room === "office") tags.add("#HomeOfficeDecor");
  else if (room === "patio" || room === "outdoor") tags.add("#OutdoorLiving");
  else if (room === "laundry") tags.add("#LaundryRoomDecor");
  else if (room === "nursery") tags.add("#NurseryDecor");
  else tags.add("#HomeDecor");

  // Style-based
  (product.style || []).forEach((s) => {
    if (s === "modern") tags.add("#ModernHome");
    else if (s === "minimalist") tags.add("#MinimalistStyle");
    else if (s === "coastal") tags.add("#CoastalDecor");
    else if (s === "farmhouse") tags.add("#FarmhouseStyle");
    else if (s === "boho") tags.add("#BohoDecor");
    else if (s === "traditional") tags.add("#TraditionalHome");
    else if (s === "industrial") tags.add("#IndustrialStyle");
    else if (s === "scandinavian") tags.add("#ScandiStyle");
    else if (s === "mid-century") tags.add("#MidCenturyModern");
    else if (s === "cozy") tags.add("#CozyHome");
    else if (s === "glam") tags.add("#GlamDecor");
    else if (s === "rustic") tags.add("#RusticHome");
  });

  // Product type
  const pt = product.product_type;
  if (pt === "seating") tags.add("#SeatingIdeas");
  else if (pt === "lighting") tags.add("#LightingDesign");
  else if (pt === "textile") tags.add("#HomeTextiles");
  else if (pt === "table") tags.add("#TableStyling");
  else if (pt === "kitchenware") tags.add("#KitchenFinds");
  else if (pt === "storage") tags.add("#HomeOrganization");
  else if (pt === "wall-art") tags.add("#WallArtDecor");
  else if (pt === "mirror") tags.add("#MirrorDecor");
  else if (pt === "rug") tags.add("#RugStyle");
  else tags.add("#HomeFinds");

  // Evergreen + price
  tags.add("#EvergreenHouse");
  if (product.price != null && product.price < 50) tags.add("#AffordableDecor");
  if (product.price != null && product.price < 25) tags.add("#BudgetFriendly");
  if (product.editor_pick) tags.add("#EditorPick");
  if (product.is_trending) tags.add("#TrendingNow");

  // Season tags
  (product.seasons || []).forEach((s) => {
    const t = s.toLowerCase();
    if (t === "spring") tags.add("#SpringDecor");
    else if (t === "summer") tags.add("#SummerStyle");
    else if (t === "fall" || t === "autumn") tags.add("#FallDecor");
    else if (t === "winter") tags.add("#WinterHome");
    else if (t === "holiday") tags.add("#HolidayDecor");
  });

  return Array.from(tags).slice(0, 10);
}

/** Suggest overlay text for Pinterest pin */
export function suggestPinOverlay(product: Product): string {
  if (product.price != null && product.price < 25) return "Under $25";
  if (product.price != null && product.price < 50) return "Under $50";
  if (product.price != null && product.price < 100) return "Under $100";
  if (product.editor_pick) return "Editor's Pick";
  if (product.is_trending) return "Trending Now";
  const rating = product.rating;
  if (rating != null && rating >= 4.5) return `★ ${rating}`;
  const style = primaryStyle(product);
  if (style && style !== "Timeless") return `${style} Find`;
  return "Shop Now";
}

// ─── Part 3: AI Content Generation ────────────────────────────────────────────

/** 2-3 sentence editorial blurb using all available product metadata */
export function generateAISummary(product: Product): string {
  const room = readableRoom(product.room);
  const style = primaryStyle(product);
  const type = fmtType(product.product_type);
  const price = fmtPrice(product);
  const material = primaryMaterial(product);
  const mood = primaryMood(product);

  // Sentence 1: What it is + context
  const s1 = `The ${product.name} is a ${style.toLowerCase()} ${type.toLowerCase()} that brings ${mood} character to any ${room}.`;

  // Sentence 2: Material/quality callout OR editor note
  const colors = (product.colors || []).slice(0, 1);
  const colorStr = colors.length > 0 ? ` in ${colors.join(", ")}` : "";
  const editorNote = product.editor_note
    ? product.editor_note.replace(/^"|"$/g, "").replace(/\.$/, "")
    : null;
  const s2 = editorNote
    ? `${editorNote}.`
    : `With its ${material.toLowerCase()} construction and ${style.toLowerCase()} aesthetic${colorStr}, it's designed to feel at home in curated, lived-in spaces.`;

  // Sentence 3: Value proposition
  const s3 = product.editor_pick
    ? `An editor favorite ${price} — a piece that earns its place.`
    : product.is_trending
      ? `Trending now ${price} — a timely addition to your collection.`
      : `Thoughtfully selected ${price} for those who believe in buying better, not more.`;

  return `${s1} ${s2} ${s3}`;
}

/** 3-4 paragraph buying guide for the product category */
export function generateBuyingGuide(product: Product): string {
  const type = fmtType(product.product_type);
  const room = readableRoom(product.room);
  const style = primaryStyle(product);
  const price = fmtPrice(product);

  // Intro paragraph
  const intro = `Finding the right ${type.toLowerCase()} for your ${room} doesn't have to be overwhelming. The ${product.name} is a ${style.toLowerCase()} choice ${price} that balances beauty with everyday practicality. Here's what to consider when choosing a ${type.toLowerCase()} for your home.`;

  // Material & quality paragraph
  const material = primaryMaterial(product);
  const matPara = `Material matters. ${material} construction offers durability and a natural presence that synthetic alternatives can't match. Look for solid craftsmanship — smooth seams, even finishes, and materials that develop character over time rather than showing wear. The best ${type.toLowerCase()}s feel substantial without being heavy, refined without feeling precious.`;

  // Style & fit paragraph
  const stylePara = `Consider how the piece fits into your existing space. A ${style.toLowerCase()} ${type.toLowerCase()} like the ${product.name} works beautifully in ${room}s that lean warm and collected rather than stark and showroom-perfect. Scale is everything — measure your space before committing, and remember that one well-chosen piece makes more impact than several forgettable ones.`;

  // Practical usage paragraph
  const usagePara = product.editor_tip
    ? `A note from our editors: ${product.editor_tip}`
    : product.editor_note
      ? `Our editors note: ${product.editor_note}`
      : `The ${product.name} is designed for real life — morning light, evening gatherings, quiet Sunday afternoons. It's the kind of ${type.toLowerCase()} that quietly improves your day without demanding attention.`;

  // Closing
  const closing =
    product.price != null && product.price < 100
      ? `At under $${Math.round(product.price!)}, the ${product.name} is an accessible way to elevate your ${room} without a full redesign.`
      : `The ${product.name} ${price} — an investment in a home that feels considered, comfortable, and entirely yours.`;

  return `${intro}\n\n${matPara}\n\n${stylePara}\n\n${usagePara}\n\n${closing}`;
}

/** 3-5 relevant FAQ questions with detailed answers */
export function generateFAQ(product: Product): { question: string; answer: string }[] {
  const type = fmtType(product.product_type);
  const room = readableRoom(product.room);
  const style = primaryStyle(product);
  const material = primaryMaterial(product);
  const price = product.price ? `$${Math.round(product.price)}` : "a reasonable price";
  const typeLower = type.toLowerCase();

  const faqs: { question: string; answer: string }[] = [
    {
      question: `Is the ${product.name} good for a ${room}?`,
      answer: `Absolutely. The ${product.name} was chosen specifically for ${room} spaces where ${style.toLowerCase()} style and everyday function need to coexist. Its ${material.toLowerCase()} design means it blends beautifully with both neutral palettes and more collected, layered interiors.`,
    },
    {
      question: `What style is the ${product.name}?`,
      answer: `The ${product.name} leans ${style.toLowerCase()}. It pairs well with ${room} decor that favors clean lines, natural materials, and a warm, lived-in feel — think linen textures, wood tones, and soft lighting rather than stark minimalism.`,
    },
    {
      question: `How do I care for this ${typeLower}?`,
      answer: `Like any quality ${typeLower}, the ${product.name} benefits from regular, gentle care. Follow the manufacturer's cleaning instructions, avoid harsh chemicals, and address spills or marks promptly. With proper care, this piece will age gracefully and remain a staple in your ${room} for years.`,
    },
    {
      question: `Why choose this over a cheaper option?`,
      answer: `We believe in buying fewer, better things. The ${product.name} ${price} offers ${material.toLowerCase()} quality and thoughtful design that discount alternatives simply can't match. It's the difference between something you'll replace in a year and something you'll still love in five.`,
    },
  ];

  // Add a product-specific question if we have enough metadata
  if (product.editor_note) {
    faqs.push({
      question: `What makes the ${product.name} special?`,
      answer: `Our editors selected the ${product.name} because ${product.editor_note.charAt(0).toLowerCase() + product.editor_note.slice(1).replace(/\.$/, "")}. It earned its place through a combination of ${style.toLowerCase()} design, practical function, and that indefinable quality of feeling right at home.`,
    });
  }

  // Only return 3-5
  return faqs.slice(0, 5);
}

/** Pros and cons extracted from editor_note and product metadata */
export function generateProsCons(product: Product): { pros: string[]; cons: string[] } {
  const style = primaryStyle(product);
  const material = primaryMaterial(product);
  const price = product.price;
  const rating = product.rating;

  const pros: string[] = [];
  const cons: string[] = [];

  // Style pro
  if (product.style && product.style.length > 0) {
    pros.push(`${style} design that complements a range of interiors`);
  } else {
    pros.push(`Timeless design that works with evolving decor`);
  }

  // Material pro
  pros.push(`${material} construction for lasting quality`);

  // Price pro
  if (price != null && price < 50) {
    pros.push(`Accessible price point under $${Math.round(price)}`);
  } else if (price != null && price < 100) {
    pros.push(`Excellent value at under $${Math.round(price)}`);
  } else if (price != null) {
    pros.push(`Investment-quality piece at $${Math.round(price)}`);
  }

  // Rating pro
  if (rating != null && rating >= 4.5) {
    pros.push(`Highly rated (${rating}/5 stars) by verified buyers`);
  } else if (rating != null) {
    pros.push(`Solid ${rating}/5 star rating from real customers`);
  }

  // Editor pick pro
  if (product.editor_pick) {
    pros.push(`Handpicked by Evergreen House editors`);
  }

  // Versatility
  const moods = product.moods || [];
  if (moods.length >= 2) {
    pros.push(`Versatile ${moods.slice(0, 2).join(" and ")} aesthetic`);
  }

  // Cons
  if (price != null && price > 200) {
    cons.push(`Higher price point may not suit all budgets`);
  } else if (price != null && price < 25) {
    cons.push(`Budget-friendly price reflects simpler construction`);
  }

  if (product.colors && product.colors.length <= 1) {
    cons.push(`Limited color options`);
  }

  if (product.product_type === "decor" && !product.materials?.length) {
    cons.push(`Decorative item — prioritize styling over utility`);
  }

  if (product.product_type === "textile") {
    cons.push(`May require specific care to maintain appearance`);
  }

  // Always add at least one minor con for balance
  if (cons.length === 0) {
    cons.push(`Limited availability — popular items can sell out quickly`);
  }

  return { pros: pros.slice(0, 5), cons: cons.slice(0, 3) };
}

// ─── Part 4: Content Scoring ──────────────────────────────────────────────────

export function calculateContentScores(product: Product): {
  completeness_score: number;
  quality_score: number;
  seo_score: number;
  pinterest_score: number;
} {
  // completeness_score: based on filled fields
  let completeness = 0;

  // Core fields (20 pts)
  if (product.name) completeness += 5;
  if (product.room) completeness += 5;
  if (product.product_type) completeness += 5;
  if (product.price != null) completeness += 5;

  // Imagery (15 pts)
  if (product.image_url) completeness += 10;
  if (product.image_alt) completeness += 5;

  // SEO (20 pts)
  if (product.seo_title) completeness += 10;
  if (product.seo_description) completeness += 10;

  // Pinterest (15 pts)
  if (product.pinterest_title) completeness += 5;
  if (product.pinterest_description) completeness += 5;
  if (product.pinterest_hashtags && product.pinterest_hashtags.length > 0) completeness += 5;

  // AI content (20 pts)
  if (product.ai_summary) completeness += 5;
  if (product.ai_keywords && product.ai_keywords.length > 0) completeness += 5;
  if (product.pros && product.pros.length > 0) completeness += 5;
  if (product.cons && product.cons.length > 0) completeness += 5;

  // Editorial (10 pts)
  if (product.editor_note) completeness += 5;
  if (product.editor_pick) completeness += 5;

  // quality_score: based on rating (0-10 scale)
  const quality = product.rating != null ? Math.min(10, Math.round((product.rating / 5) * 10)) : 5;

  // seo_score: based on SEO field presence
  let seoScore = 0;
  if (product.seo_title && product.seo_title !== `${product.name} — Evergreen House`) seoScore += 50;
  else if (product.seo_title) seoScore += 25;
  if (product.seo_description && product.seo_description.length >= 120) seoScore += 35;
  else if (product.seo_description) seoScore += 15;
  if (product.image_alt) seoScore += 15;

  // pinterest_score: based on Pinterest field presence
  let pinScore = 0;
  if (product.pinterest_title) pinScore += 30;
  if (product.pinterest_description && product.pinterest_description.length >= 150) pinScore += 30;
  else if (product.pinterest_description) pinScore += 15;
  if (product.pinterest_hashtags && product.pinterest_hashtags.length >= 3) pinScore += 25;
  else if (product.pinterest_hashtags && product.pinterest_hashtags.length > 0) pinScore += 10;
  if (product.pinterest_board) pinScore += 15;

  return {
    completeness_score: Math.min(100, completeness),
    quality_score: quality,
    seo_score: Math.min(100, seoScore),
    pinterest_score: Math.min(100, pinScore),
  };
}
