import manifest from "~/data/pins/manifest.json";

/**
 * The Pinterest landing pages (project P3): /pin/<slug>.
 *
 * Each page mirrors one live Pinterest pin: the same art the visitor tapped,
 * and the same numbered discs in the same order, with each number opening onto
 * the product behind it. The data is generated and checked in by
 * scripts/build-pin-pages.mjs (dry run by default, --apply writes), which reads
 * the pin kit's disc map, the tablescape pin's renderer config and marketing's
 * page copy, and resolves every product id against the destination edit and the
 * no-buy-box list. This module only reads that file.
 *
 * Two rules live here rather than in the page:
 *   - the number on a card is the number printed on the pin, never the card's
 *     index, so a product that drops out leaves its gap instead of silently
 *     taking the next number;
 *   - a number whose product has no Amazon buy box stays on the page with its
 *     numeral, label and image, and carries no link and no price. The page count
 *     always equals the pin count.
 */

export interface PinNumber {
  n: number;
  /** The label printed on the pin disc, in the pin's own wording. */
  label: string;
  productId: number;
  /** Clean human title (edit display title, or the hidden-list title). */
  displayTitle: string;
  /** Canonical /product/<slug> segment, null when the product is off sale. */
  productSlug: string | null;
  hook: string | null;
  /** True when the product has no Amazon buy box: no link, no price. */
  unavailable: boolean;
}

export interface PinPage {
  slug: string;
  /** The edit this pin points at, e.g. /collections/luxe-christmas-tree-edit. */
  destination: string;
  title: string;
  headline: string;
  intro: string;
  alt: string;
  metaDescription: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  numbers: PinNumber[];
}

interface RawNumber {
  n: number;
  label: string;
  product_id: number;
  display_title: string;
  product_slug: string | null;
  hook: string | null;
  unavailable: boolean;
}

interface RawPage {
  slug: string;
  destination: string;
  title: string;
  headline: string;
  intro: string;
  alt: string;
  meta_description: string;
  image: string;
  image_width: number;
  image_height: number;
  numbers: RawNumber[];
}

const PAGES: PinPage[] = (manifest as { pages: RawPage[] }).pages.map((page) => ({
  slug: page.slug,
  destination: page.destination,
  title: page.title,
  headline: page.headline,
  intro: page.intro,
  alt: page.alt,
  metaDescription: page.meta_description,
  image: page.image,
  imageWidth: page.image_width,
  imageHeight: page.image_height,
  numbers: page.numbers.map((n) => ({
    n: n.n,
    label: n.label,
    productId: n.product_id,
    displayTitle: n.display_title,
    productSlug: n.product_slug,
    hook: n.hook,
    unavailable: n.unavailable,
  })),
}));

/**
 * Pin slugs that used to have a page and no longer do, mapped to the page that
 * answers them now. Pinterest keeps serving the old image for years, so a
 * retired pin URL redirects permanently to its edit instead of dead-ending.
 *
 * Empty today: every pin in the kit still has a live page. Add one line here
 * when a pin is retired (the route answers 301 before it can 404).
 */
export const RETIRED_PIN_SLUGS: Record<string, string> = {};

export function getPin(slug: string): PinPage | null {
  return PAGES.find((page) => page.slug === slug) ?? null;
}

export const PIN_SLUGS: string[] = PAGES.map((page) => page.slug);

/** What a /pin/<slug> request resolves to, before any product data is read. */
export type PinSlugResolution =
  | { kind: "pin"; pin: PinPage }
  | { kind: "retired"; destination: string }
  | { kind: "unknown" };

export function resolvePinSlug(slug: string): PinSlugResolution {
  const pin = getPin(slug);
  if (pin) return { kind: "pin", pin };
  const destination = RETIRED_PIN_SLUGS[slug];
  if (destination) return { kind: "retired", destination };
  return { kind: "unknown" };
}
