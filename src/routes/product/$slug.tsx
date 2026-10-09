import {
  createFileRoute,
  notFound,
  isNotFound,
  isRedirect,
  redirect,
} from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getRelatedProducts } from "~/lib/related";
import { generateProductMetadata } from "~/lib/seo";
import {
  getProductSchema,
  getBreadcrumbSchema,
  SITE_URL,
  merchantListingName,
  amazonAsin,
} from "~/lib/schema";
import { sql } from "~/db";
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const db = sql();
    const slug = params.slug;

    try {
      // Find product by matching generated slug
      const rows = await db`
        SELECT * FROM products
        WHERE is_active = true
        ORDER BY id
      `;
      const allProducts = rows as unknown as Product[];

      const canonicalSlugOf = (p: Product) =>
        p.seo_slug || productNameToSlug(p.name);

      // Match by generated slug since seo_slug is mostly null
      const product = allProducts.find((p) => canonicalSlugOf(p) === slug);

      if (!product) {
        // ── Legacy URL rescue: 301 instead of 404 so old indexed links keep working ──
        // 1. Legacy numeric product IDs, e.g. /product/233 -> canonical slug URL.
        if (/^\d+$/.test(slug)) {
          const byNumericId = allProducts.find((p) => String(p.id) === slug);
          if (byNumericId) {
            throw redirect({
              href: `/product/${canonicalSlugOf(byNumericId)}`,
              statusCode: 301,
            });
          }
        }

        // 2. Normalized slug variants (case, doubled dashes, stray separators).
        //    Only redirect when EXACTLY ONE product matches - no fuzzy/prefix
        //    matching, which would misdirect on shared 120-char prefixes.
        const normalizedIncoming = normalizeSlug(slug);
        if (normalizedIncoming) {
          const candidates = allProducts.filter(
            (p) => normalizeSlug(canonicalSlugOf(p)) === normalizedIncoming
          );
          if (candidates.length === 1) {
            throw redirect({
              href: `/product/${canonicalSlugOf(candidates[0])}`,
              statusCode: 301,
            });
          }
        }

        throw notFound();
      }

      const related = await getRelatedProducts(product.id, 6);

      return { product, related, slug };
    } catch (err) {
      // Never swallow router control-flow signals (404 or 301 redirect).
      if (isNotFound(err)) throw err;
      if (isRedirect(err)) throw err;
      console.error("Product loader error:", err);
      return { product: null, related: [], slug };
    }
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return {
        meta: [{ title: "Product Not Found | Evergreen House" }],
        links: [],
      };
    }
    const seo = generateProductMetadata(
      {
        name: product.name,
        editor_note: product.editor_note,
        room: product.room,
        brand: product.brand,
        seo_title: product.seo_title,
        seo_description: product.seo_description,
      },
      product.seo_slug || productNameToSlug(product.name)
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: ProductPage,
});

function productNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/**
 * Canonical form of a slug for comparison purposes: lowercase, separators
 * collapsed to single dashes, leading/trailing dashes trimmed. Reuses
 * productNameToSlug so legacy variants resolve to the same URL the site links.
 */
function normalizeSlug(slug: string): string {
  return productNameToSlug(slug || "");
}

function ProductPage() {
  const { product, related } = Route.useLoaderData();

  if (!product) {
    return (
      <>
        <Header />
        <main>
          <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
            <h1 className="font-serif text-3xl font-bold text-warm-dark">Product Not Found</h1>
            <p className="mt-4 text-warm-gray">The product you're looking for isn't available or may have been removed.</p>
            <a href="/" className="mt-6 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">
              Browse all products →
            </a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const p = product as any;
  // Google's Merchant listings validation caps the product name at 150
  // characters and compares the marked up name against the visible title, so the
  // schema name and the H1 render the identical trimmed string.
  const displayName = merchantListingName(p.name);
  const roomLabel = roomLabels[p.room] || p.room?.replace(/-/g, " ")?.replace(/\b\w/g, (c: string) => c.toUpperCase()) || "";
  const productUrl = `${SITE_URL}/product/${p.seo_slug || productNameToSlug(p.name)}`;
  const price = p.price ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(p.price) : null;
  const imageUrl = p.image_url || "";
  const hasAmazonUrl = p.amazon_url && p.amazon_url.startsWith("http");

  const productSchema = getProductSchema(
    {
      name: displayName,
      description: p.editor_note,
      image_url: imageUrl,
      price: p.price,
      brand: p.brand,
      rating: p.rating,
      review_count: p.review_count,
      sku: amazonAsin(p.amazon_url),
    },
    productUrl,
  );

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Rooms", href: "/rooms" },
    { label: roomLabel, href: `/room/${p.room}` },
    { label: displayName.length > 40 ? displayName.slice(0, 40) + "..." : displayName },
  ];

  const breadcrumbSchema = getBreadcrumbSchema(
    breadcrumbItems.map((item) => ({ name: item.label, url: item.href })),
  );

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [productSchema, breadcrumbSchema],
            }),
          }}
        />

        {/* Product hero */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              {/* Image */}
              <div className="overflow-hidden rounded-2xl bg-cream">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${displayName} - Evergreen House`}
                    className="h-full w-full object-contain p-6"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center">
                    <span className="font-serif text-6xl text-beige/40 italic">
                      {p.name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-col justify-center">
                {p.brand && (
                  <p className="text-sm font-medium uppercase tracking-wider text-taupe">
                    {p.brand}
                  </p>
                )}
                <h1 className="mt-2 font-serif text-2xl font-bold leading-tight text-warm-dark sm:text-3xl">
                  {displayName}
                </h1>

                {/* Rating */}
                {p.rating && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={i < Math.round(p.rating) ? "#C9B99A" : "none"}
                          stroke="#C9B99A"
                          strokeWidth="1.5"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-taupe">
                      {p.rating} {p.review_count ? `(${p.review_count} reviews)` : ""}
                    </span>
                  </div>
                )}

                {/* Price */}
                {price && (
                  <p className="mt-4 font-serif text-2xl font-semibold text-terracotta">
                    {price}
                  </p>
                )}

                {/* Room & style tags */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.room && (
                    <a
                      href={`/room/${p.room}`}
                      className="inline-block rounded-full bg-cream px-3 py-1 text-xs font-medium text-warm-dark transition-colors hover:bg-cream-dark"
                    >
                      {roomLabel}
                    </a>
                  )}
                  {p.style?.map((s: string) => (
                    <a
                      key={s}
                      href={`/style/${s}`}
                      className="inline-block rounded-full bg-cream px-3 py-1 text-xs font-medium text-taupe transition-colors hover:bg-cream-dark"
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </a>
                  ))}
                </div>

                {/* Editor note */}
                {p.editor_note && (
                  <div className="mt-6 rounded-xl border border-beige/30 bg-cream/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-taupe">
                      Editor's Note
                    </p>
                    <p className="mt-2 text-sm leading-relaxed italic text-warm-dark">
                      "{p.editor_note}"
                    </p>
                  </div>
                )}

                {/* Why we chose it */}
                {p.editor_why && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-taupe">
                      Why We Chose It
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-warm-dark">
                      {p.editor_why}
                    </p>
                  </div>
                )}

                {/* Pro tips */}
                {p.editor_tip && (
                  <div className="mt-4 rounded-lg bg-sage/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage">
                      Stylist Tip
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-warm-dark">
                      {p.editor_tip}
                    </p>
                  </div>
                )}

                {/* Amazon CTA */}
                {hasAmazonUrl && (
                  <a
                    href={p.amazon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-terracotta-dark self-start"
                  >
                    View on Amazon
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                )}

                {/* Amazon disclosure */}
                {hasAmazonUrl && (
                  <>
                    <p className="mt-3 text-xs text-taupe/70">
                      As an Amazon Associate, Evergreen House earns from qualifying purchases.
                    </p>
                    <p className="mt-2 text-xs text-taupe/70">
                      Shipping and returns are handled by Amazon. Standard US shipping usually
                      arrives in 3 to 7 days, and most items can be returned within 30 days at no
                      cost.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* You Might Also Love */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="border-t border-beige/20 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2
                id="related-heading"
                className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
              >
                You Might Also Love
              </h2>
              <p className="mt-2 text-warm-gray">
                Pieces that pair beautifully with this {roomLabel.toLowerCase()} find - chosen by our editors for the same timeless aesthetic.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {related.slice(0, 4).map((item) => (
                  <ProductCard
                    key={item.id}
                    product={{
                      id: item.id,
                      name: item.name,
                      image_url: item.image_url,
                      price: item.price,
                      room: item.room,
                      rating: null,
                      amazon_url: "",
                      editor_note: null,
                    } as Product}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Browse by Room */}
        <section aria-labelledby="browse-room-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="browse-room-heading"
              className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
            >
              Explore More {roomLabel} Finds
            </h2>
            <p className="mt-2 text-warm-gray">
              Browse our full {roomLabel.toLowerCase()} collection - every piece editor-approved for quality and timeless style.
            </p>
            <a
              href={`/room/${p.room}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
            >
              View all {roomLabel.toLowerCase()} products
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

const roomLabels: Record<string, string> = {
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
};
