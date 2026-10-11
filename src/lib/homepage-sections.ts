import { getCuratedProducts, type EditProduct } from "~/lib/edits";

/**
 * The two curated homepage merchandising sections that follow the SHOP THE EDITS
 * row: shop_the_look (The Holiday Hosting Table) and current_edit (The Current
 * Edit).
 *
 * The copy, the order and the product ids are the checked-in curation from
 * /home/team/shared/collections/homepage-manifest-2026-10-10.json (marketing,
 * owner-approved direction 2026-10-10). The editor copy is reproduced verbatim:
 * short display titles for the long Amazon listing names, plus one hook per
 * item. Nothing is generated here and nothing is invented.
 *
 * The database owns the live product facts (image, affiliate URL, canonical
 * slug), fetched by integer id - never by slug, because 21 slugs in the catalog
 * are shared by more than one row.
 *
 * Rules the curated set already satisfies (verified at generation time and
 * re-checked by the proof script): every item is is_active in the DB, no item is
 * off-niche, no price/rating/urgency language, no em-dash, and the two sections
 * share no product (12 distinct ids).
 */

export interface HomepageItem {
  id: number;
  /** Canonical /product/<slug> segment, from the curation file. */
  slug: string;
  /** Short, card-shaped title (the catalog name for the short listings). */
  display_title: string;
  hook: string;
}

export interface HomepageSection {
  /** GA4 item_list_id for the grid, e.g. "shop_the_look". */
  key: string;
  eyebrow: string;
  title: string;
  subcopy: string;
  items: HomepageItem[];
  /** Optional single editorial link that closes the section. */
  link?: { href: string; label: string };
}

/**
 * SHOP THE LOOK: one scene, one table. The six pieces all sit on the same
 * holiday hosting tablescape (the delivered art in /images/shop-the-look-*), so
 * the section reads as a single styled photograph rather than a goods list.
 */
export const SHOP_THE_LOOK: HomepageSection = {
  key: "shop_the_look",
  eyebrow: "Shop the Look",
  title: "The Holiday Hosting Table",
  subcopy:
    "One table, set the way a holiday dinner deserves: holly banded china, walnut tapers and a long run of candlelight.",
  link: { href: "/collections/holiday-hosting-edit", label: "Shop the full edit" },
  items: [
    {
      id: 482,
      slug: "lenox-holiday-porcelain-dinner-plates-set-of-6",
      display_title: "Lenox Holiday Porcelain Dinner Plates, Set of 6",
      hook: "Holly banded porcelain plates that finish the table before the food arrives.",
    },
    {
      id: 483,
      slug: "spode-christmas-tree-glass-pitcher-96-oz",
      display_title: "Spode Christmas Tree Glass Pitcher, 96 oz",
      hook: "Ninety six ounces of eggnog, cider or water, all in one pitcher.",
    },
    {
      id: 490,
      slug: "wooden-christmas-tree-charcuterie-platter",
      display_title: "Wooden Christmas Tree Charcuterie Platter",
      hook: "A tree shaped wooden platter that arranges the cheese for you.",
    },
    {
      id: 419,
      slug: "nuptio-wooden-taper-candle-holders-set-of-3-brown-candlesticks",
      display_title: "NUPTIO Wooden Taper Candle Holders, Set of 3",
      hook: "Warm walnut tapers spaced down the table for the long evenings.",
    },
    {
      id: 90,
      slug: "24-pack-votive-candle-holders-clear",
      display_title: "Clear Glass Votive Candle Holders, Set of 24",
      hook: "Twenty four clear votives so the whole run of table glows.",
    },
    {
      id: 102,
      slug: "libbey-stemless-wine-glasses",
      display_title: "Libbey Stemless Wine Glasses",
      hook: "Stemless glasses for twelve, steady in the hand and dishwasher safe.",
    },
  ],
};

/**
 * THE CURRENT EDIT: the pieces we would buy again, six of them, spanning the
 * seasonal collections by design. Replaces the auto-picked Trending Finds row.
 *
 * Kicker: the curation file names "The Current Edit" as both the h2 and the
 * kicker, and explicitly allows a separate kicker from its alternatives list so
 * the same four words are not printed twice. "In the Edit" is that alternative;
 * the h2 stays exactly as approved.
 */
export const CURRENT_EDIT: HomepageSection = {
  key: "current_edit",
  eyebrow: "In the Edit",
  title: "The Current Edit",
  subcopy:
    "Warm light, quiet texture and a little evergreen: the pieces we would buy again, chosen to sit well past December.",
  items: [
    {
      id: 434,
      slug: "cypress-christmas-tree-in-wicker-basket",
      display_title: "Cypress Christmas Tree in Wicker Basket",
      hook: "A four foot cypress already in its wicker basket, ready in minutes.",
    },
    {
      id: 421,
      slug: "knit-christmas-tree-skirts-neutral-tree-skirt-cozy-christmas-decorations",
      display_title: "Knit Christmas Tree Skirt, Neutral Cream",
      hook: "Cream cable knit tree skirt with the weight of a good sweater.",
    },
    {
      id: 439,
      slug: "velvet-ceramic-christmas-trees-set-of-3",
      display_title: "Velvet Ceramic Christmas Trees, Set of 3",
      hook: "Three sage ceramic trees for a mantel, shelf or sideboard.",
    },
    {
      id: 88,
      slug: "30pcs-velvet-christmas-ball-ornaments-flocked",
      display_title: "Flocked Velvet Christmas Ornaments, Set of 30",
      hook: "Thirty flocked velvet balls in mixed sizes, enough for one tree.",
    },
    {
      id: 114,
      slug: "bell-door-decor-bells-christmas-bells",
      display_title: "Vintage Gold Christmas Cow Bell",
      hook: "A handmade gold cow bell that announces every arrival at the door.",
    },
    {
      id: 491,
      slug: "thymes-frasier-fir-pine-needle-candle",
      display_title: "Thymes Frasier Fir Pine Needle Candle",
      hook: "Frasier fir candle that gives a room the smell of a real tree.",
    },
  ],
};

/** Live product rows for one homepage section, in curated order. */
export async function getSectionProducts(
  section: HomepageSection,
): Promise<EditProduct[]> {
  return getCuratedProducts(section.items);
}
