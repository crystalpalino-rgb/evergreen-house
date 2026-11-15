import { createFileRoute, notFound, isNotFound, redirect } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { AnalyticsList } from "~/components/AnalyticsList";
import { AmazonDisclosure } from "~/components/AmazonDisclosure";
import { ContentUnavailable } from "~/components/ContentUnavailable";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { HolidaySets } from "~/components/HolidaySets";
import { hideUnbuyableHolidayProducts } from "~/lib/holiday";
import { getCollection, getCollectionProducts, getAllCollections } from "~/lib/intelligence";
import { MERGED_COLLECTION_REDIRECTS, RETIRED_STYLE_REDIRECTS } from "~/lib/legacy-redirects";
import { isRoomPublic } from "~/lib/room-visibility";
import { generateCollectionMetadata } from "~/lib/seo";
import { getCollectionPageSchema, getFAQSchema, SITE_URL } from "~/lib/schema";
import type { Product, Collection } from "~/lib/types";

/* Room-specific FAQ copy.
   A collection appears here only when the answers are true of that room. There
   is no default set and no fallback: a collection without copy of its own
   renders no FAQ block at all, so a sofa tip can never land on the laundry
   page again (audit item 3). */
type FAQ = { question: string; answer: string };

const COLLECTION_FAQS: Record<string, FAQ[]> = {
  bedroom: [
    {
      question: "How do I make a bedroom feel calm?",
      answer:
        "Keep the palette to two or three tones, layer linen and wool where you touch the room most, and use two low lamps instead of one overhead light. Storage that closes hides the daily clutter so the room reads quiet.",
    },
    {
      question: "Which bedroom pieces are worth spending more on?",
      answer:
        "Bedding and the mattress layer first, then the nightstand and the lamps you look at from the bed. A bench or a mirror can wait; the pieces you touch every night cannot.",
    },
  ],
  bathroom: [
    {
      question: "How do I make a small bathroom feel considered?",
      answer:
        "Repeat one material. A stone or ceramic tray on the counter, closed storage under the sink and one warm metal finish do more than extra shelves, and a good towel weight makes the room feel finished.",
    },
    {
      question: "What belongs on the bathroom counter?",
      answer:
        "Only what you use daily: soap, a tray for the small things, and one object you like looking at. Everything else lives in a drawer or a basket.",
    },
  ],
  "dining-room": [
    {
      question: "How do I set a table that feels special without fuss?",
      answer:
        "Start with a runner or a cloth, then add one low centerpiece, candles and glassware you enjoy holding. Keep the center low, because height in the middle of the table is what stops conversation.",
    },
    {
      question: "How many place settings should I own?",
      answer:
        "Eight is the honest number for most homes: enough for a holiday table, not so many that the extras sit unused. Add serving pieces before you add settings.",
    },
  ],
  entryway: [
    {
      question: "What does an entryway actually need?",
      answer:
        "Somewhere to sit or lean while you take off shoes, a surface for keys and mail, a hook for the bag you carry daily, and a mat that can take wet boots. Everything else is decoration.",
    },
    {
      question: "How do I keep an entryway from becoming a pile?",
      answer:
        "Give every item a home within arm's reach of the door, and keep one basket for whatever has no home yet. A basket can be emptied; a pile spreads.",
    },
  ],
  kitchen: [
    {
      question: "How do I keep kitchen counters clear?",
      answer:
        "Store by use. The things you reach for daily stay out, everything else goes in a drawer or a labeled jar, and a single tray holds oil, salt and utensils without hiding them.",
    },
    {
      question: "Which kitchen pieces earn their counter space?",
      answer:
        "Stoneware that moves from oven to table, glass storage that shows what is inside, and tools you use weekly. Anything you reach for twice a year belongs in a cupboard.",
    },
  ],
  laundry: [
    {
      question: "How do I make a laundry room work harder?",
      answer:
        "Sort at the source with labeled bins, keep a folding surface at waist height, and put detergent and stain spray where you can reach them with one hand.",
    },
    {
      question: "What should stay out of the laundry room?",
      answer:
        "Anything that cannot take heat or damp: wool, silk and the good towels. Keep a small drying rack for those and the room stays a workroom.",
    },
  ],
  "living-room": [
    {
      question: "How do I layer a living room without clutter?",
      answer:
        "Build from the rug up: rug, seating, one table within reach of each seat, then lighting and texture. Add throws and pillows last and keep them to two textures.",
    },
    {
      question: "How do I choose the right rug size?",
      answer:
        "The rug should sit under the front legs of every seat in the grouping. A rug that floats in the middle of the room makes the whole space read smaller.",
    },
  ],
  office: [
    {
      question: "How do I make a home office feel less corporate?",
      answer:
        "Warm the light, keep something living or made by hand within sight, and leave only what you use that day on the desk. An adjustable lamp does more for the room than an overhead fixture.",
    },
    {
      question: "What does a home office actually need?",
      answer:
        "A surface at the right height, a chair that supports your back, light you can aim, and storage that closes. Everything else is optional.",
    },
  ],
  patio: [
    {
      question: "How do I make an outdoor space feel like a room?",
      answer:
        "Anchor it with a rug or a defined seating zone, then add light at two heights and something that grows. Outdoor fabric and weather-resistant wood age better than anything that has to be carried inside.",
    },
    {
      question: "What should I look for in outdoor pieces?",
      answer:
        "Materials that improve with weather: teak, powder-coated metal and solution-dyed fabric. Check the seat depth before you check the color.",
    },
  ],
  holiday: [
    {
      question: "Where do I start with Christmas decor?",
      answer:
        "Start with the tree and the light, then the mantel, then the table. Three places done properly read warmer than a whole house covered in small things.",
    },
    {
      question: "How do I keep holiday decor from looking like a store display?",
      answer:
        "Choose one palette and one material story, then repeat it. Real greenery, brass and wool hold up year after year and never look dated.",
    },
  ],
};

/* Outdoor Living was folded into Patio and Outdoor (owner decision 37), so the
   two slugs share one honest set of answers. */
COLLECTION_FAQS.outdoor = COLLECTION_FAQS.patio;

function getCollectionFAQs(slug: string): FAQ[] {
  return COLLECTION_FAQS[slug] ?? [];
}

export const Route = createFileRoute("/collection/$collection")({
  // Retired collection URLs first, before any lookup: By Style is gone and
  // Outdoor Living is folded into Patio & Outdoor (owner decision 37,
  // 2026-11-14), so those paths answer a permanent redirect instead of a 404 or
  // a page the owner has retired. serve.ts and vercel.json answer the same paths
  // from the same maps (src/lib/legacy-redirects.ts); this guard is what makes
  // the dev server answer identically.
  beforeLoad: ({ params }) => {
    const path = `/collection/${params.collection}`;
    const target =
      RETIRED_STYLE_REDIRECTS[path] || MERGED_COLLECTION_REDIRECTS[path];
    if (target) throw redirect({ href: target, statusCode: 301 });
  },
  loader: async ({ params }) => {
    const slug = params.collection;
    // A collection slug can be the same string as a room slug, so the same public
    // room list applies here: a room the owner has not approved is not reachable
    // through /collection either (src/lib/room-visibility.ts).
    if (!isRoomPublic(slug)) {
      throw notFound();
    }
    try {
      const [collection, products, allCollections] = await Promise.all([
        getCollection(slug),
        getCollectionProducts(slug),
        getAllCollections(),
      ]);
      if (!collection) {
        throw notFound();
      }
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

      // The holiday collection drops the products Amazon cannot currently
      // sell. The list comes from src/data/holiday-hidden-products.json.
      const visible = slug === "holiday" ? hideUnbuyableHolidayProducts(products) : products;

      return { products: visible, collection: slug, label, description, imageUrl, collectionType, relatedCollections, unavailable: false };
    } catch (err) {
      if (isNotFound(err)) throw err;
      console.error("Collection loader error:", err);
      // A database outage is NOT an empty collection: flag it so the page says so.
      return { products: [] as Product[], collection: slug, label: slug, description: null, imageUrl: null, collectionType: "room", relatedCollections: [] as Collection[], unavailable: true };
    }
  },
  head: ({ loaderData }) => {
    const name = loaderData?.label || "Collection";
    const desc = loaderData?.description;
    const seo = generateCollectionMetadata(name, desc, loaderData?.collection);
    const links = [...seo.links];
    if (loaderData?.imageUrl) {
      links.push({
        rel: "preload",
        as: "image",
        href: loaderData.imageUrl,
        fetchpriority: "high",
      });
    }
    const meta = loaderData?.unavailable
      ? [...seo.meta, { name: "robots", content: "noindex, follow" }]
      : seo.meta;
    return { meta, links };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { products, label, description, imageUrl, collectionType, relatedCollections, unavailable } = Route.useLoaderData();
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label }];
  const collectionUrl = `${SITE_URL}/collection/${Route.useLoaderData().collection}`;
  const collectionSchema = getCollectionPageSchema({ name: label, display_name: label, description }, collectionUrl);
  /* No default set: a collection with no true copy of its own shows no FAQ
     block and marks up no FAQPage. */
  const faqItems = getCollectionFAQs(Route.useLoaderData().collection);
  const faqSchema = faqItems.length > 0 ? getFAQSchema(faqItems) : null;

  /* One header body for both hero states: the title, description and count do
     not change when the image is missing, only the band around them. */
  const heroBody = (
    <>
      <a href="/collections" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        All Collections
      </a>
      <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{label}</h1>
      {description && <p className="mt-4 max-w-2xl text-lg text-warm-gray">{description}</p>}
      {unavailable ? (
        <p className="mt-2 text-sm text-taupe">Our product library is temporarily unavailable. Please try this page again in a moment.</p>
      ) : (
        <p className="mt-2 text-sm text-taupe">{products.length} {products.length === 1 ? "product" : "products"} in this curated collection</p>
      )}
    </>
  );

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": faqSchema ? [collectionSchema, faqSchema] : [collectionSchema] }) }} />

        {/* Hero. With a hero image the photo runs full width behind the title,
            kept centered so a wide panorama is cropped evenly, and a soft
            left-hand white scrim carries the dark type over both bright and
            dark art. With no image the header is a compact text band, never a
            tall empty cream panel. */}
        {imageUrl ? (
          <section className="relative overflow-hidden">
            <img
              src={imageUrl}
              alt={`${label} - Evergreen House`}
              width={1200}
              height={800}
              fetchpriority="high"
              loading="eager"
              decoding="sync"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-white/60 sm:bg-white/35" />
            <div
              className="absolute inset-0"
              style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 45%, rgba(255,255,255,0.32) 74%, rgba(255,255,255,0) 100%)" }}
            />
            <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">{heroBody}</div>
          </section>
        ) : (
          <section className="border-b border-beige/20 bg-cream/40">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{heroBody}</div>
          </section>
        )}

        {/* Product grid */}
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {unavailable ? (
              <ContentUnavailable message="Our product library could not be reached just now, so this collection is not loading. Nothing has been lost - please try this page again in a moment." />
            ) : products.length > 0 ? (
              <>
                {Route.useLoaderData().collection === "holiday" ? (
                  /* Three owner-approved sets plus More Christmas Finds, one
                     AnalyticsList each, and one disclosure for the page. */
                  <HolidaySets products={products} listPrefix="collection-holiday" />
                ) : (
                  <AnalyticsList id={`collection-${Route.useLoaderData().collection}`} name={label} items={products}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => (<ProductCard key={product.id} product={product} />))}</div>
                  </AnalyticsList>
                )}
                {/* One disclosure for the whole page (Room Card Standard). */}
                <div className="mt-8">
                  <AmazonDisclosure />
                </div>
              </>
            ) : (
              <div className="py-10 text-center"><p className="text-lg text-warm-gray">No products found for this collection yet.</p><a href="/collections" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all collections →</a></div>
            )}
          </div>
        </section>

        {/* FAQ Section. Only a collection with its own true copy gets one. */}
        {faqItems.length > 0 && (
          <section aria-labelledby="faq-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
              <h2 id="faq-heading" className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-warm-gray">
                Straight answers about the {label} collection.
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
        )}

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
