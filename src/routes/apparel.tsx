import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { AnalyticsList } from "~/components/AnalyticsList";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getAllProducts } from "~/lib/intelligence";
import { generateStaticMetadata } from "~/lib/seo";
import { getCollectionPageSchema, getFAQSchema, SITE_URL } from "~/lib/schema";
import {
  APPAREL_BUCKETS,
  APPAREL_FALLBACK_BUCKET,
  apparelBucketId,
  apparelBucketMeta,
} from "~/lib/apparel";
import type { Product } from "~/lib/types";

const APPAREL_TITLE = "Apparel & Loungewear";
const APPAREL_INTRO =
  "The pieces our editors actually wear while living in the rooms we write about: soft pajama sets and robes for slow mornings, cardigans and oversize sweatshirts for the cold months, and boots that handle a real winter. Same standard as everything else in the house - natural fabrics where they matter, colors that stay quiet, and cuts that will still look right in five years.";
const APPAREL_DESCRIPTION =
  "Shop our editors' apparel and loungewear finds for women: pajama sets, robes, cardigans, sweaters, jackets, boots, and everyday basics chosen to feel as considered as the rest of your home.";

const APPAREL_FAQS = [
  {
    question: "How are apparel pieces chosen for Evergreen House?",
    answer:
      "The same way we choose everything else in the house. Our editors look for pieces in soft, natural fabrics where they matter, quiet colors that layer with what you already own, and a cut that will still look right years from now. Nothing here is chosen because it trends - it is chosen because we wear it.",
  },
  {
    question: "What should I look for in loungewear and sleepwear?",
    answer:
      "Look for fabrics that soften with every wash - cotton, modal, satin, and brushed fleece all behave well - plus a relaxed cut that does not twist or cling overnight. Pockets are worth having, elastic waists should sit flat, and a color that matches your bedding makes the whole set feel intentional.",
  },
  {
    question: "Which layers work best for a cold house in winter?",
    answer:
      "Start with a fine knit or cotton long sleeve tee against the skin, then a cardigan, fleece pullover, or sweatshirt, and finish with a quilted jacket, shacket, or vest for outdoors. Natural fibers breathe when the heat is on, and a half zip or button front lets you adjust through the day.",
  },
];

export const Route = createFileRoute("/apparel")({
  loader: async () => {
    try {
      const products = await getAllProducts({
        productType: "apparel",
        isActive: true,
      });
      // Same ordering rule the room pages use: best editor score first.
      const sorted = [...products].sort((a, b) => {
        const qa = a.quality_score ?? -1;
        const qb = b.quality_score ?? -1;
        if (qb !== qa) return qb - qa;
        return (b.rating ?? 0) - (a.rating ?? 0);
      });
      return { products: sorted };
    } catch (err) {
      console.error("Apparel loader error:", err);
      return { products: [] as Product[] };
    }
  },
  head: () => {
    const seo = generateStaticMetadata(APPAREL_TITLE, APPAREL_DESCRIPTION, "/apparel");
    return { meta: seo.meta, links: seo.links };
  },
  component: ApparelPage,
});

function ApparelPage() {
  const { products } = Route.useLoaderData();

  // Group in memory so the section order matches APPAREL_BUCKETS, not the query order.
  const grouped = new Map<string, Product[]>();
  for (const product of products) {
    const id = apparelBucketId(product.name);
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id)!.push(product);
  }
  const sections = [...APPAREL_BUCKETS, APPAREL_FALLBACK_BUCKET]
    .map((bucket) => ({ bucket, items: grouped.get(bucket.id) || [] }))
    .filter((section) => section.items.length > 0);

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: APPAREL_TITLE }];
  const collectionSchema = getCollectionPageSchema(
    { name: APPAREL_TITLE, display_name: APPAREL_TITLE, description: APPAREL_DESCRIPTION },
    `${SITE_URL}/apparel`
  );
  const faqSchema = getFAQSchema(APPAREL_FAQS);

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
              "@graph": [collectionSchema, faqSchema],
            }),
          }}
        />

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-beige/20">
          <div className="absolute inset-0 bg-cream-dark" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <a
              href="/"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              {APPAREL_TITLE}
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              {products.length} {products.length === 1 ? "piece" : "pieces"} chosen for softness,
              fit, and a quiet palette
            </p>
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-warm-gray">
              {APPAREL_INTRO}
            </p>
          </div>
        </section>

        {/* Jump links to the groups below */}
        {sections.length > 0 && (
          <section aria-label="Apparel categories" className="border-b border-beige/20 bg-cream/40 py-6">
            <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 sm:px-6 lg:px-8">
              {sections.map(({ bucket, items }) => (
                <a
                  key={bucket.id}
                  href={`#${bucket.id}`}
                  className="rounded-full border border-beige/50 bg-white px-4 py-1.5 text-sm font-medium text-warm-gray transition-colors hover:border-terracotta hover:text-terracotta"
                >
                  {bucket.label} ({items.length})
                </a>
              ))}
            </div>
          </section>
        )}

        {/* One section per group */}
        {products.length > 0 ? (
          sections.map(({ bucket, items }) => (
            <section
              key={bucket.id}
              id={bucket.id}
              aria-labelledby={`${bucket.id}-heading`}
              className="scroll-mt-24 border-b border-beige/20 py-8 sm:py-12"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h2
                  id={`${bucket.id}-heading`}
                  className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
                >
                  {bucket.label}
                </h2>
                <p className="mt-2 max-w-3xl text-warm-gray">{apparelBucketMeta(bucket.id).intro}</p>
                <p className="mt-2 text-sm text-taupe">
                  {items.length} {items.length === 1 ? "piece" : "pieces"}
                </p>
                <div className="mt-6">
                  <AnalyticsList
                    id={`apparel-${bucket.id}`}
                    name={`${bucket.label} apparel`}
                    context="apparel"
                    items={items}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </AnalyticsList>
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-lg text-warm-gray">Apparel picks are being restocked.</p>
              <a
                href="/rooms"
                className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
              >
                Browse every room →
              </a>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="bg-cream/30 py-8 sm:py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 id="faq-heading" className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-warm-gray">How we choose the apparel we recommend.</p>
            <dl className="mt-8 space-y-6">
              {APPAREL_FAQS.map((faq) => (
                <div key={faq.question} className="rounded-xl border border-beige/20 bg-white p-5 shadow-sm">
                  <dt className="font-serif text-base font-semibold text-warm-dark">{faq.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-warm-gray">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Keep exploring the house */}
        <section aria-labelledby="more-rooms-heading" className="border-t border-beige/20 py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2
              id="more-rooms-heading"
              className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
            >
              Keep Exploring the House
            </h2>
            <p className="mt-2 text-warm-gray">
              The rooms these pieces belong to, and the seasonal edits they pair with.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Bedroom", href: "/room/bedroom" },
                { label: "Living Room", href: "/room/living-room" },
                { label: "Fall", href: "/collection/fall" },
                { label: "Collections", href: "/collections" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-beige/20 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="font-serif text-lg font-semibold text-warm-dark transition-colors group-hover:text-terracotta">
                    {link.label}
                  </h3>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-taupe transition-colors group-hover:text-terracotta">
                    Explore
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
