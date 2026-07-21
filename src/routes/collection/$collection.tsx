import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { getCollection, getCollectionProducts } from "~/lib/intelligence";
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/collection/$collection")({
  loader: async ({ params }) => {
    const slug = params.collection;
    try {
      const [collection, products] = await Promise.all([
        getCollection(slug),
        getCollectionProducts(slug),
      ]);
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
    return {
      meta: [
        { title: `${name} — Evergreen House` },
        {
          name: "description",
          content: desc || `Curated ${name.toLowerCase()} collection — editor-approved finds for a beautiful, timeless home.`,
        },
        { property: "og:title", content: `${name} — Evergreen House` },
        {
          property: "og:description",
          content: desc || `Explore our ${name.toLowerCase()} collection — thoughtfully curated home finds that stand the test of time.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `${name} — Evergreen House` },
        {
          name: "twitter:description",
          content: desc || `Explore our ${name.toLowerCase()} collection — thoughtfully curated home finds that stand the test of time.`,
        },
      ],
      links: [
        {
          rel: "canonical",
          href: `https://evergreenhouse.co/collection/${loaderData?.collection}`,
        },
      ],
    };
  },
  component: CollectionPage,
});

function CollectionPage() {
  const { products, label, description } = Route.useLoaderData();
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a
              href="/collections"
              className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6"
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
              All Collections
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              {label}
            </h1>
            {description && (
              <p className="mt-4 max-w-2xl text-lg text-warm-gray">{description}</p>
            )}
            <p className="mt-2 text-sm text-taupe">
              {products.length} {products.length === 1 ? "product" : "products"} in this curated collection
            </p>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-warm-gray">
                  No products found for this collection yet.
                </p>
                <a
                  href="/collections"
                  className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                >
                  Browse all collections →
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
