/**
 * JSON-LD structured data generators for Evergreen House.
 * Each function returns a plain object suitable for JSON.stringify().
 */

const SITE_URL = "https://evergreenhouse.co";
const SITE_NAME = "Evergreen House";
const SITE_DESCRIPTION =
  "Thoughtfully curated home collections to help you create a timeless home.";

/** Organization schema - used in __root.tsx */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  };
}

/** WebSite schema with SearchAction - used in __root.tsx */
export function getWebSiteSchema(searchUrl: string = `${SITE_URL}/search`) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** CollectionPage schema - for collections, rooms, styles */
export function getCollectionPageSchema(
  collection: { name?: string; display_name?: string | null; description?: string | null },
  url: string
) {
  const name = collection.display_name || collection.name || "Collection";
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: collection.description || `Curated ${name.toLowerCase()} collection from Evergreen House.`,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/** BreadcrumbList schema */
export function getBreadcrumbSchema(
  items: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? { "@id": item.url, name: item.name } : undefined,
    })),
  };
}

/**
 * Google's Merchant listings report reads the Product name field as a Merchant
 * Center product title, which is capped at 150 characters
 * (https://support.google.com/merchants/answer/6324415). Longer values are
 * reported as "Invalid string length", so a longer name is trimmed at a word
 * boundary. The product page H1 renders this same helper: Google compares the
 * marked up name against the visible title, so both must be identical.
 */
export const MERCHANT_LISTING_NAME_MAX = 150;

export function merchantListingName(name: string | null | undefined): string {
  const value = (name || "").replace(/\s+/g, " ").trim();
  if (value.length <= MERCHANT_LISTING_NAME_MAX) {
    return value;
  }
  const clipped = value.slice(0, MERCHANT_LISTING_NAME_MAX);
  const lastSpace = clipped.lastIndexOf(" ");
  const cut = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;
  // Drop separators left dangling by the cut so the trimmed name reads cleanly.
  return cut.replace(/[,;:&|/+-]+$/, "").trim();
}

/**
 * ASIN from a normalized Amazon affiliate URL
 * (https://www.amazon.com/dp/<ASIN>?tag=...). It is the strongest identifier we
 * hold, so it is emitted as Product.sku and Offer.sku. It is not a global
 * identifier, so Google's missing gtin/mpn recommendation stays open by design.
 */
export function amazonAsin(amazonUrl: string | null | undefined): string | null {
  const match = /\/dp\/([A-Za-z0-9]{10})(?=[/?]|$)/.exec(amazonUrl || "");
  return match ? match[1].toUpperCase() : null;
}

/**
 * Shipping and return terms belong to the merchant the buyer actually transacts
 * with (Amazon), so they are identical on every product page:
 * - US delivery, standard transit time quoted conservatively as 3 to 7 days.
 * - No shippingRate is published. Amazon's cost varies by order (free above its
 *   free-shipping threshold, free with Prime, otherwise priced) and we hold no
 *   honest per-item rate, so we do not invent one. Google lists shippingRate as
 *   required only for the optional shipping details enhancement.
 * - Amazon's published standard return window: 30 days, free, by mail.
 */
const MERCHANT_SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingDestination: {
    "@type": "DefinedRegion",
    addressCountry: "US",
  },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: 3,
      maxValue: 7,
      unitCode: "DAY",
    },
  },
};

const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "US",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 30,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
};

/** Product schema - for standalone product pages */
export function getProductSchema(
  product: {
    name: string;
    description?: string | null;
    image_url?: string | null;
    price?: number | string | null;
    brand?: string | null;
    rating?: number | null;
    review_count?: number | null;
    sku?: string | null;
  },
  url: string
) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: merchantListingName(product.name),
    url,
  };
  if (product.description) {
    schema.description = product.description;
  }
  if (product.image_url) {
    schema.image = product.image_url;
  }
  if (product.brand) {
    schema.brand = {
      "@type": "Brand",
      name: product.brand,
    };
  }
  if (product.sku) {
    schema.sku = product.sku;
  }
  if (product.price) {
    schema.offers = {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      shippingDetails: MERCHANT_SHIPPING_DETAILS,
      hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    };
    if (product.sku) {
      schema.offers.sku = product.sku;
    }
  }
  if (product.rating) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.review_count || 0,
    };
  }
  return schema;
}

/** Article (BlogPosting) schema - for blog posts */
export function getArticleSchema(
  post: {
    title: string;
    content?: string | null;
    created_at?: string;
    updated_at?: string;
    id?: number;
  },
  url: string,
  authorName: string = "Evergreen House"
) {
  const excerpt = post.content
    ? post.content
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160)
    : "";

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: excerpt,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Organization",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/** FAQ schema - for collection/room pages with FAQ content */
export function getFAQSchema(
  questions: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export { SITE_URL, SITE_NAME };
