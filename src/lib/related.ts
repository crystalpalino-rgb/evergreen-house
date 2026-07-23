/**
 * Related Products Engine for Evergreen House.
 *
 * Given a product or room, finds related products by room and collection overlap.
 * Used to power "You Might Also Love" sections on product, room, and collection pages.
 */

import { sql } from "~/db";
import type { Product } from "~/lib/types";

/** A related product with its relationship type */
export interface RelatedProduct {
  id: number;
  name: string;
  seo_slug: string | null;
  image_url: string | null;
  price: number | null;
  room: string;
  relation_type: "same-room+collection" | "same-room" | "same-collection";
  quality_score: number;
}

/**
 * Get related products for a given product.
 *
 * Strategy:
 * 1. Find the source product by id
 * 2. Find all collection_rules that match this product (by room and style)
 * 3. Find products in the same room that also match the same collections (same-room+collection)
 * 4. Fill remaining slots with same-room products
 * 5. If still not enough, fill with same-collection products from other rooms
 * 6. Fall back to high-quality products in any room
 */
export async function getRelatedProducts(
  productId: number,
  limit: number = 6,
): Promise<RelatedProduct[]> {
  const db = sql();

  // 1. Get the source product
  const sourceRows =
    await db`SELECT id, room, style FROM products WHERE id = ${productId} AND is_active = true LIMIT 1`;
  if (sourceRows.length === 0) return [];

  const source = sourceRows[0] as unknown as { id: number; room: string; style: string[] };
  const sourceRoom = source.room;
  const sourceStyles = source.style || [];

  // 2. Find which collection slugs this product belongs to
  // A product belongs to a collection if it matches the collection's rules
  const matchedCollections: string[] = [];

  // Room-based collections
  const roomRules =
    await db`SELECT collection_slug FROM collection_rules WHERE rule_type = 'room' AND rule_operator = 'equals' AND rule_value = ${sourceRoom}`;
  for (const r of roomRules as any[]) {
    matchedCollections.push(r.collection_slug);
  }

  // Style-based collections
  if (sourceStyles.length > 0) {
    const styleRules =
      await db`SELECT collection_slug, rule_value FROM collection_rules WHERE rule_type = 'style' AND rule_operator = 'contains'`;
    for (const r of styleRules as any[]) {
      if (
        typeof r.rule_value === "string" &&
        sourceStyles.some(
          (s) => s.toLowerCase() === (r.rule_value as string).toLowerCase(),
        )
      ) {
        matchedCollections.push(r.collection_slug);
      }
    }
  }

  const uniqueCollections = [...new Set(matchedCollections)];

  const results: RelatedProduct[] = [];
  const seenIds = new Set<number>();
  seenIds.add(productId);

  // 3. Find products in same room AND same collection (tier 1)
  if (uniqueCollections.length > 0) {
    // Find which other rooms are covered by these collections
    const otherRoomRules =
      await db`SELECT rule_value FROM collection_rules WHERE collection_slug = ANY(${uniqueCollections}) AND rule_type = 'room' AND rule_operator = 'equals'`;
    const collectionRooms = new Set<string>();
    collectionRooms.add(sourceRoom);
    for (const r of otherRoomRules as any[]) {
      if (typeof r.rule_value === "string") collectionRooms.add(r.rule_value);
    }

    // Find style rules for these collections
    const styleRuleValues =
      await db`SELECT rule_value FROM collection_rules WHERE collection_slug = ANY(${uniqueCollections}) AND rule_type = 'style' AND rule_operator = 'contains'`;
    const collectionStyles = new Set<string>();
    for (const r of styleRuleValues as any[]) {
      if (typeof r.rule_value === "string") collectionStyles.add(r.rule_value);
    }

    // Products in the same room that also match collection style rules
    const roomProducts =
      await db`SELECT id, name, seo_slug, image_url, price, room, style, quality_score FROM products WHERE room = ${sourceRoom} AND is_active = true AND id != ${productId} ORDER BY quality_score DESC NULLS LAST LIMIT ${limit * 3}`;

    for (const p of roomProducts as any[]) {
      if (seenIds.has(p.id)) continue;
      if (results.length >= limit) break;

      // Check if this product shares a collection with the source
      const pStyles: string[] = p.style || [];
      let sharesCollection = false;

      if (collectionRooms.has(p.room)) {
        sharesCollection = true;
      }
      if (
        !sharesCollection &&
        collectionStyles.size > 0 &&
        pStyles.some((s: string) => collectionStyles.has(s))
      ) {
        sharesCollection = true;
      }

      const relationType = sharesCollection
        ? "same-room+collection"
        : "same-room";

      if (relationType === "same-room+collection" || results.length < Math.ceil(limit / 2)) {
        seenIds.add(p.id);
        results.push({
          id: p.id,
          name: p.name,
          seo_slug: p.seo_slug,
          image_url: p.image_url,
          price: p.price,
          room: p.room,
          relation_type: relationType,
          quality_score: Number(p.quality_score) || 0,
        });
      }
    }
  }

  // 4. Fill remaining with same-room products (tier 2)
  if (results.length < limit) {
    const moreRoom =
      await db`SELECT id, name, seo_slug, image_url, price, room, style, quality_score FROM products WHERE room = ${sourceRoom} AND is_active = true AND id != ${productId} ORDER BY quality_score DESC NULLS LAST LIMIT ${limit}`;

    for (const p of moreRoom as any[]) {
      if (seenIds.has(p.id)) continue;
      if (results.length >= limit) break;
      seenIds.add(p.id);
      results.push({
        id: p.id,
        name: p.name,
        seo_slug: p.seo_slug,
        image_url: p.image_url,
        price: p.price,
        room: p.room,
        relation_type: "same-room",
        quality_score: Number(p.quality_score) || 0,
      });
    }
  }

  // 5. Fill remaining with same-collection products from other rooms (tier 3)
  if (results.length < limit && uniqueCollections.length > 0) {
    // Find rooms covered by the matched collections
    const collRoomRules =
      await db`SELECT rule_value FROM collection_rules WHERE collection_slug = ANY(${uniqueCollections}) AND rule_type = 'room' AND rule_operator = 'equals'`;
    const collRooms = new Set<string>();
    for (const r of collRoomRules as any[]) {
      if (typeof r.rule_value === "string") collRooms.add(r.rule_value);
    }
    collRooms.delete(sourceRoom); // we already have same-room

    if (collRooms.size > 0) {
      const roomsArr = [...collRooms];
      const otherRoomProducts =
        await db`SELECT id, name, seo_slug, image_url, price, room, style, quality_score FROM products WHERE room = ANY(${roomsArr}) AND is_active = true ORDER BY quality_score DESC NULLS LAST LIMIT ${limit}`;

      for (const p of otherRoomProducts as any[]) {
        if (seenIds.has(p.id)) continue;
        if (results.length >= limit) break;
        seenIds.add(p.id);
        results.push({
          id: p.id,
          name: p.name,
          seo_slug: p.seo_slug,
          image_url: p.image_url,
          price: p.price,
          room: p.room,
          relation_type: "same-collection",
          quality_score: Number(p.quality_score) || 0,
        });
      }
    }
  }

  // 6. Final fallback: popular products
  if (results.length < limit) {
    const fallback =
      await db`SELECT id, name, seo_slug, image_url, price, room, style, quality_score FROM products WHERE is_active = true AND id != ${productId} ORDER BY quality_score DESC NULLS LAST LIMIT ${limit}`;

    for (const p of fallback as any[]) {
      if (seenIds.has(p.id)) continue;
      if (results.length >= limit) break;
      seenIds.add(p.id);
      results.push({
        id: p.id,
        name: p.name,
        seo_slug: p.seo_slug,
        image_url: p.image_url,
        price: p.price,
        room: p.room,
        relation_type: "same-room",
        quality_score: Number(p.quality_score) || 0,
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Get related products for a room page.
 * Returns top products from related rooms.
 */
export async function getRelatedProductsForRoom(
  room: string,
  limit: number = 6,
): Promise<RelatedProduct[]> {
  const db = sql();

  const rows =
    await db`SELECT id, name, seo_slug, image_url, price, room, quality_score FROM products WHERE room = ${room} AND is_active = true ORDER BY quality_score DESC NULLS LAST LIMIT ${limit}`;

  return (rows as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    seo_slug: p.seo_slug,
    image_url: p.image_url,
    price: p.price,
    room: p.room,
    relation_type: "same-room" as const,
    quality_score: Number(p.quality_score) || 0,
  }));
}

/**
 * Define room relationships for cross-linking.
 * e.g., Living Room ↔ Entryway, Kitchen ↔ Dining Room
 */
export const ROOM_RELATIONSHIPS: Record<string, string[]> = {
  "living-room": ["entryway", "dining-room", "bedroom"],
  bedroom: ["bathroom", "living-room", "office"],
  kitchen: ["dining-room", "pantry", "laundry"],
  bathroom: ["bedroom", "laundry"],
  office: ["living-room", "bedroom"],
  patio: ["living-room", "dining-room"],
  entryway: ["living-room", "dining-room"],
  "dining-room": ["kitchen", "living-room", "patio"],
  laundry: ["kitchen", "bathroom"],
  pantry: ["kitchen", "laundry"],
  storage: ["bedroom", "office", "laundry"],
  organization: ["office", "bedroom", "kitchen"],
};

/** Human-readable room labels */
export const ROOM_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  office: "Home Office",
  patio: "Patio & Outdoor",
  entryway: "Entryway",
  "dining-room": "Dining Room",
  laundry: "Laundry Room",
  pantry: "Pantry",
  storage: "Storage",
  organization: "Organization",
  holiday: "Holiday",
  summer: "Summer",
  fall: "Fall",
  spring: "Spring",
  nursery: "Nursery",
};

/**
 * Get related rooms for a given room slug.
 * Returns 2-3 related rooms with labels and slugs.
 */
export function getRelatedRooms(
  room: string,
): { slug: string; label: string }[] {
  const related = ROOM_RELATIONSHIPS[room] || [];
  const seen = new Set<string>();
  const result: { slug: string; label: string }[] = [];

  for (const r of related) {
    if (!seen.has(r)) {
      seen.add(r);
      result.push({ slug: r, label: ROOM_LABELS[r] || r });
    }
  }

  // If no relationships defined, suggest top rooms
  if (result.length === 0) {
    const defaults = ["living-room", "bedroom", "kitchen"];
    for (const d of defaults) {
      if (d !== room && !seen.has(d)) {
        seen.add(d);
        result.push({ slug: d, label: ROOM_LABELS[d] || d });
      }
    }
  }

  return result.slice(0, 3);
}

/**
 * Generate a product page slug from a product name.
 * Mirrors the pattern used by canonical_url in the DB.
 */
export function productSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
