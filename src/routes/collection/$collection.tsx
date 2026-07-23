import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getCollection, getCollectionProducts } from "~/lib/intelligence";
import { generateCollectionMetadata } from "~/lib/seo";
import { getCollectionPageSchema, getFAQSchema, SITE_URL } from "~/lib/schema";
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/collection/$collection")({
  loader: async ({ params }) => {
    const slug = params.collection;
    try {
      const [collection, products] = await Promise.all([getCollection(slug), getCollectionProducts(slug)]);
      const label = collection?.display_name || collection?.name || slug;
      const description = collection?.description || null;
      return { products, collection: slug, label, description };
    } catch (err) {
      console.error("Collection loader error:", err);
      return { products: [] as Product[], collection: slug, label: slug, description: null };
    }
  },
  head: ({ loaderData }) => {
    const name = loaderData?.label || "Collection";
    const desc = loaderData?.description;
    const seo = generateCollectionMetadata(name, desc);
    return { meta: seo.meta, links: seo.links };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { products, label, description } = Route.useLoaderData();
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }, { label }];
  const collectionUrl = `${SITE_URL}/collection/${Route.useLoaderData().collection}`;
  const collectionSchema = getCollectionPageSchema({ name: label, display_name: label, description }, collectionUrl);
  const faqSchema = getFAQSchema([
    { question: `What is the ${label} collection?`, answer: `The ${label} collection is a thoughtfully curated selection of home products selected by Evergreen House editors for quality, longevity, and timeless style.${description ? " " + description : ""}` },
    { question: `How are products chosen for the ${label} collection?`, answer: `Every product is hand-selected by our editorial team based on quality, design, durability, and value.` },
  ]);

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [collectionSchema, faqSchema] }) }} />
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a href="/collections" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              All Collections
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{label}</h1>
            {description && <p className="mt-4 max-w-2xl text-lg text-warm-gray">{description}</p>}
            <p className="mt-2 text-sm text-taupe">{products.length} {products.length === 1 ? "product" : "products"} in this curated collection</p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => (<ProductCard key={product.id} product={product} />))}</div>
            ) : (
              <div className="py-16 text-center"><p className="text-lg text-warm-gray">No products found for this collection yet.</p><a href="/collections" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all collections →</a></div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
