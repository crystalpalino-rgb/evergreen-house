/**
 * JSON-LD structured data generators for Evergreen House.
 * Each function returns a plain object suitable for JSON.stringify().
 */

const SITE_URL = "https://evergreenhouse.co";
const SITE_NAME = "Evergreen House";
const SITE_DESCRIPTION =
  "Thoughtfully curated home collections to help you create a timeless home.";

/** Organization schema — used in __root.tsx */
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

/** WebSite schema with SearchAction — used in __root.tsx */
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

/** CollectionPage schema — for collections, rooms, styles */
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
      item: item.url || undefined,
    })),
  };
}

/** Product schema — for standalone product pages */
export function getProductSchema(
  product: {
    name: string;
    description?: string | null;
    image_url?: string | null;
    price?: number | null;
    brand?: string | null;
    rating?: number | null;
    review_count?: number | null;
  },
  url: string
) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
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
  if (product.price) {
    schema.offers = {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
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

/** Article (BlogPosting) schema — for blog posts */
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

/** FAQ schema — for collection/room pages with FAQ content */
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
