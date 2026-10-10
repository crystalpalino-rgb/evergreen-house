/**
 * Apparel merchandising groups for the /apparel landing page and its nav menu.
 *
 * The catalogue already carries the clothing rows under `product_type = 'apparel'`,
 * so nothing about the data model had to change to give apparel a home: the page
 * selects that product type through the same resolver library the room, collection
 * and search pages use (`getAllProducts` in ~/lib/intelligence.ts), and this module
 * only decides which of those rows sits in which editorial group.
 *
 * Buckets are keyword matched against the product name (long and short names are the
 * same string in this catalogue). Order matters: the first bucket that matches wins,
 * so outerwear is tested before knitwear and knitwear before tops, which keeps a
 * "sweatshirt" out of Tops and a "flannel shacket" out of Shirts.
 *
 * Keep bucket ids stable: they are the anchor ids on /apparel and the hrefs in the
 * header dropdown. Labels are display only.
 */

export interface ApparelBucket {
  /** Anchor id on /apparel, used by the nav dropdown links. */
  id: string;
  label: string;
  /** One warm editorial line shown under the bucket heading. */
  intro: string;
  /** First match wins, tested in array order. */
  match: RegExp;
}

export const APPAREL_BUCKETS: ApparelBucket[] = [
  {
    id: "shoes-boots",
    label: "Shoes & Boots",
    intro:
      "Weather-ready footwear that still reads as quiet and considered: snow boots, riding boots, and the winter shoes we reach for first.",
    match: /boot|shoe|sneaker|sandal|slipper|heel/i,
  },
  {
    id: "loungewear",
    label: "Loungewear & Sleepwear",
    intro:
      "Soft pieces for slow mornings and early nights: pajama sets, robes, and lounge sets in fabrics that only get better with washing.",
    match: /pajama|pyjama|pjs|robe|loungewear|lounge set|sweatsuit|sleepwear|nightgown|jogger/i,
  },
  {
    id: "jackets-outerwear",
    label: "Jackets & Outerwear",
    intro:
      "Layers with shape: quilted puffers, shackets, fleece vests, and jackets made for the coldest weeks of the year.",
    match: /jacket|shacket|coat|puffer|parka|vest/i,
  },
  {
    id: "sweaters-cardigans",
    label: "Sweaters & Cardigans",
    intro:
      "The layer you live in from October to March: cardigans, knit sweaters, hoodies, and fleece pullovers with a soft hand.",
    match: /sweater|cardigan|sweatshirt|hoodie|pullover|knit/i,
  },
  {
    id: "dresses-skirts",
    label: "Dresses, Skirts & Costumes",
    intro:
      "Occasion pieces with a little more drama: tulle skirts, jumpsuits, and costumes for the nights that call for them.",
    match: /skirt|dress|jumpsuit|costume|gown/i,
  },
  {
    id: "bottoms",
    label: "Bottoms & Leggings",
    intro:
      "Denim, leggings, and tights chosen for an easy line and a comfortable fit through a long day.",
    match: /jeans|denim|pants|trousers|legging|tights|shorts/i,
  },
  {
    id: "tops",
    label: "Tops & Shirts",
    intro:
      "Everyday tops that layer well under knitwear: long sleeve tees, shirts, and soft go-with-everything basics.",
    match: /t-shirt|tee|shirt|blouse|top|tank|bodysuit|leotard/i,
  },
];

/** Rows that match no bucket still get a home rather than disappearing from the page. */
export const APPAREL_FALLBACK_BUCKET = {
  id: "more-apparel",
  label: "More Apparel",
  intro: "Other pieces our editors are loving right now.",
};

/** Pure bucket assignment for one product, by id order of APPAREL_BUCKETS. */
export function apparelBucketId(name: string | null | undefined): string {
  const value = name || "";
  for (const bucket of APPAREL_BUCKETS) {
    if (bucket.match.test(value)) return bucket.id;
  }
  return APPAREL_FALLBACK_BUCKET.id;
}

/** Bucket id plus label for a product name (label is handy for cards and reports). */
export function apparelBucket(name: string | null | undefined): { id: string; label: string } {
  const id = apparelBucketId(name);
  const found = APPAREL_BUCKETS.find((b) => b.id === id) || APPAREL_FALLBACK_BUCKET;
  return { id, label: found.label };
}

/** Bucket metadata (id, label, intro) for a bucket id, including the fallback. */
export function apparelBucketMeta(id: string) {
  return APPAREL_BUCKETS.find((b) => b.id === id) || APPAREL_FALLBACK_BUCKET;
}
