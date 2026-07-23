/**
 * SEO metadata generators for Evergreen House.
 * Every route should use these to produce unique, descriptive metadata per page type.
 */

const SITE_URL = "https://evergreenhouse.co";
const SITE_NAME = "Evergreen House";
const OG_IMAGE_URL = `${SITE_URL}/og-image.jpg`;

/** Shared OG/Twitter boilerplate merged into every page's meta */
function baseMeta(overrides: {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image";
}) {
  const ogTitle = overrides.ogTitle || overrides.title;
  const ogDesc = overrides.ogDescription || overrides.description;
  const ogType = overrides.ogType || "website";
  const twitterCard = overrides.twitterCard || "summary_large_image";

  return {
    meta: [
      { title: overrides.title },
      { name: "description", content: overrides.description },
      // Open Graph
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDesc },
      { property: "og:type", content: ogType },
      { property: "og:url", content: overrides.ogUrl || SITE_URL },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      // Twitter
      { name: "twitter:card", content: twitterCard },
      { name: "twitter:title", content: ogTitle },
      { name: "twitter:description", content: ogDesc },
      { name: "twitter:image", content: OG_IMAGE_URL },
      { name: "twitter:site", content: "@evergreenhouse" },
    ] as Array<Record<string, string>>,
    links: [
      { rel: "canonical", href: overrides.ogUrl || SITE_URL },
    ] as Array<Record<string, string>>,
  };
}

/** Generate metadata for a room page (e.g. /room/living-room) */
export function generateRoomMetadata(roomName: string, productCount: number) {
  const title = `Timeless ${roomName} Ideas & Decor | Evergreen House`;
  const description = `Shop timeless ${roomName.toLowerCase()} furniture, decor, and organization ideas curated by Evergreen House. ${productCount} editor-approved finds.`;
  return baseMeta({
    title,
    description,
    ogUrl: `${SITE_URL}/room/${roomName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

/** Generate metadata for a collection page (e.g. /collection/cozy-bedroom) */
export function generateCollectionMetadata(
  collectionName: string,
  description?: string | null
) {
  const title = `${collectionName} — Curated Finds | Evergreen House`;
  const desc =
    description && description.length >= 140 && description.length <= 160
      ? description
      : description && description.length > 0
        ? `${description.slice(0, 157)}...`
        : `Explore our ${collectionName.toLowerCase()} collection — thoughtfully curated home finds that stand the test of time.`;
  return baseMeta({
    title,
    description: desc,
    ogTitle: `${collectionName} — Evergreen House`,
    ogDescription: desc,
    ogUrl: `${SITE_URL}/collection/${collectionName.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

/** Generate metadata for a standalone product page */
export function generateProductMetadata(product: {
  name: string;
  editor_note?: string | null;
  room?: string;
  brand?: string | null;
}) {
  const title = `${product.name} | Evergreen House`;
  const description =
    product.editor_note ||
    (product.room
      ? `Discover the ${product.name}${product.brand ? ` by ${product.brand}` : ""} — a timeless ${product.room} essential curated by Evergreen House.`
      : `Discover the ${product.name} — a timeless home essential curated by Evergreen House.`);
  return baseMeta({
    title,
    description: description.slice(0, 160),
    ogUrl: `${SITE_URL}/product/${product.name.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

/** Generate metadata for a blog post */
export function generateBlogMetadata(post: {
  title: string;
  content?: string | null;
  id?: number;
  created_at?: string;
}) {
  const title = `${post.title} | Evergreen House Journal`;
  const excerpt = post.content
    ? post.content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160)
    : "A blog post from Evergreen House.";
  return baseMeta({
    title,
    description: excerpt,
    ogType: "article",
    ogUrl: post.id ? `${SITE_URL}/blog/${post.id}` : `${SITE_URL}/blog`,
    twitterCard: "summary",
  });
}

/** Generate metadata for a style page (e.g. /style/modern) */
export function generateStyleMetadata(styleName: string) {
  const title = `${styleName} Home Decor & Inspiration | Evergreen House`;
  const description = `Explore ${styleName.toLowerCase()} home decor and design inspiration — curated finds that embody the ${styleName.toLowerCase()} aesthetic. Editor-approved picks from Evergreen House.`;
  return baseMeta({
    title,
    description,
    ogUrl: `${SITE_URL}/style/${styleName.toLowerCase()}`,
  });
}

/** Generate static page metadata */
export function generateStaticMetadata(
  pageTitle: string,
  pageDescription: string,
  path: string
) {
  const title = `${pageTitle} | Evergreen House`;
  return baseMeta({
    title,
    description: pageDescription,
    ogUrl: `${SITE_URL}${path}`,
  });
}

/** Homepage metadata */
export function generateHomeMetadata() {
  return baseMeta({
    title: `${SITE_NAME} — Beautiful Things That Never Go Out of Style`,
    description:
      "Thoughtfully curated home collections to help you create a timeless home. Editor-approved furniture, decor, and organization finds.",
  });
}

export { SITE_URL, SITE_NAME, OG_IMAGE_URL };
