import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getCollection, getCollectionProducts, getAllCollections } from "~/lib/intelligence";
import { generateCollectionMetadata } from "~/lib/seo";
import { getCollectionPageSchema, getFAQSchema, SITE_URL } from "~/lib/schema";
import type { Product, Collection } from "~/lib/types";

/** Generate collection-specific FAQ pairs based on the collection theme */
function getCollectionFAQs(
  collectionName: string,
  collectionType: string,
  description: string | null,
): { question: string; answer: string }[] {
  const name = collectionName.toLowerCase();

  // Base FAQs every collection gets
  const faqs: { question: string; answer: string }[] = [
    {
      question: `What defines ${name} home decor?`,
      answer: description
        ? `${description} Every piece in this collection reflects that philosophy — chosen for quality, longevity, and the way it makes a space feel.`
        : `${collectionName} design emphasizes intentional choices — pieces that are beautiful, functional, and built to last. Our editors select each item for its ability to elevate everyday living without feeling precious or untouchable.`,
    },
  ];

  // Collection-type-specific Q&A
  if (collectionType === "room") {
    faqs.push({
      question: `How do I style my ${name}?`,
      answer: `Start with a foundation piece — a well-made rug, a comfortable sofa, or beautiful storage — and layer in texture through pillows, throws, and natural materials. The best ${name.toLowerCase()} feel collected over time, not decorated in a weekend. Mix vintage finds with new pieces, keep the palette calm, and let the room breathe.`,
    });
  } else if (collectionType === "style") {
    faqs.push({
      question: `How do I bring ${name} style into my home?`,
      answer: `${collectionName} style is about a feeling more than a rigid set of rules. Start small: swap in a few key pieces that embody the aesthetic — a textural throw, a sculptural vase, or a piece of art that speaks to you. Pay attention to materials and finishes; they do more to define a style than any single color or pattern.`,
    });
  }

  // Universal curation question
  faqs.push({
    question: `How are products chosen for the ${collectionName} collection?`,
    answer: `Every product is hand-selected by our editorial team. We look for pieces that score highly on quality, design, durability, and value — the kind of things we'd recommend to a friend. No algorithm, no trending churn. Just thoughtful curation from people who love home.`,
  });

  return faqs;
}

export const Route = createFileRoute("/collection/$collection")({
  loader: async ({ params }) => {
    const slug = params.collection;
    try {
      const [collection, products, allCollections] = await Promise.all([
        getCollection(slug),
        getCollectionProducts(slug),
        getAllCollections(),
      ]);
      const label = collection?.display_name || collection?.name || slug;
      const description = collection?.description || null;
      const imageUrl = collection?.image_url || null;
      const collectionType = collection?.type || "room";

      // Get 3 related collections (different slugs, same type preferred)
      const relatedCollections = allCollections
        .filter((c) => c.slug !== slug && c.is_active)
        .sort((a, b) => {
          // Prefer same type
          if (a.type === collectionType && b.type !== collectionType) return -1;
          if (a.type !== collectionType && b.type === collectionType) return 1;
          return a.sort_order - b.sort_order;
        })
        .slice(0, 3);

      return { products, collection: slug, label, description, imageUrl, collectionType, relatedCollections };
    } catch (err) {
      console.error("Collection loader error:", err);
      return { products: [] as Product[], collection: slug, label: slug, description: null, imageUrl: null, collectionType: "room", relatedCollections: [] as Collection[] };
    }
  },
  head: ({ loaderData }) => {
    const name = loaderData?.label || "Collection";
    const desc = loaderData?.description;
    const seo = generateCollectionMetadata(name, desc);
    const links = [...seo.links];
    if (loaderData?.imageUrl) {
      links.push({
        rel: "preload",
        as: "image",
        href: loaderData.imageUrl,
        fetchpriority: "high",
      });
    }
    return { meta: seo.meta, links };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { products, label, description, imageUrl, collectionType, relatedCollections } = Route.useLoaderData();
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label }];
  const collectionUrl = `${SITE_URL}/collection/${Route.useLoaderData().collection}`;
  const collectionSchema = getCollectionPageSchema({ name: label, display_name: label, description }, collectionUrl);
  const faqItems = getCollectionFAQs(label, collectionType || "room", description);
  const faqSchema = getFAQSchema(faqItems);

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [collectionSchema, faqSchema] }) }} />

        {/* Hero */}
        <section className="relative overflow-hidden">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={`${label} — Evergreen House`}
                width={1200}
                height={800}
                fetchpriority="high"
                loading="eager"
                decoding="sync"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-white/50" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-cream-dark" />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            </>
          )}
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <a href="/collections" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              All Collections
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{label}</h1>
            {description && <p className="mt-4 max-w-2xl text-lg text-warm-gray">{description}</p>}
            <p className="mt-2 text-sm text-taupe">{products.length} {products.length === 1 ? "product" : "products"} in this curated collection</p>
          </div>
        </section>


        {/* Product grid */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => (<ProductCard key={product.id} product={product} />))}</div>
            ) : (
              <div className="py-10 text-center"><p className="text-lg text-warm-gray">No products found for this collection yet.</p><a href="/collections" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all collections →</a></div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="faq-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 id="faq-heading" className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-warm-gray">
              Everything you need to know about the {label.toLowerCase()} collection.
            </p>
            <dl className="mt-8 space-y-6">
              {faqItems.map((faq, i) => (
                <div key={i} className="rounded-xl border border-beige/20 bg-white p-5 shadow-sm">
                  <dt className="font-serif text-base font-semibold text-warm-dark">
                    {faq.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-warm-gray">
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* More Collections */}
        {relatedCollections.length > 0 && (
          <section aria-labelledby="more-collections-heading" className="border-t border-beige/20 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2
                id="more-collections-heading"
                className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
              >
                More Collections to Explore
              </h2>
              <p className="mt-2 text-warm-gray">
                If you love this collection, you'll find more inspiration in these curated edits.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedCollections.map((col) => (
                  <a
                    key={col.slug}
                    href={`/collection/${col.slug}`}
                    className="group rounded-2xl border border-beige/20 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <h3 className="font-serif text-lg font-semibold text-warm-dark transition-colors group-hover:text-terracotta">
                      {col.display_name || col.name}
                    </h3>
                    {col.description && (
                      <p className="mt-2 text-sm leading-relaxed text-warm-gray line-clamp-2">
                        {col.description}
                      </p>
                    )}
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-taupe transition-colors group-hover:text-terracotta">
                      View collection
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
