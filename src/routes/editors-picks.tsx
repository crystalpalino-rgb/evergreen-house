import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { getEditorsPicks, getAllProducts } from "~/lib/intelligence";
import type { Product } from "~/lib/types";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { generateStaticMetadata } from "~/lib/seo";

const SEASONAL_ROOMS = new Set(["seasonal", "seasonal-finds"]);

export const Route = createFileRoute("/editors-picks")({
  loader: async () => {
    try {
      const [editorPicks, allProducts] = await Promise.all([
        getEditorsPicks(20),
        getAllProducts(),
      ]);

      // If editor_pick column has data, use those; otherwise fall back to top-rated non-seasonal
      let products: Product[];
      if (editorPicks.length > 0) {
        products = editorPicks;
      } else {
        const nonSeasonal = allProducts.filter(
          (p) => !SEASONAL_ROOMS.has(p.room)
        );
        nonSeasonal.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        products = nonSeasonal.slice(0, 20);
      }

      const nonSeasonalCount = allProducts.filter(
        (p) => !SEASONAL_ROOMS.has(p.room)
      ).length;

      return { products, totalCount: nonSeasonalCount };
    } catch (err) {
      console.error("Editor's Picks loader error:", err);
      return { products: [] as Product[], totalCount: 0 };
    }
  },
  head: () => {
    const seo = generateStaticMetadata(
      "Crystal's Edit",
      "Our editors' favorite home finds. Top-rated products thoughtfully curated for timeless, beautiful living — no trends, just pieces we love.",
      "/editors-picks"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: EditorsPicksPage,
});

function EditorsPicksPage() {
  const { products, totalCount } = Route.useLoaderData();

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={{ label: "Home", href: "/" }, { label: "Crystal's Edit" }}
        />
        {/* ── Hero section ── */}
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
              href="/"
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
              Back to Home
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              Crystal's Edit
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-warm-gray">
              The pieces we keep coming back to — our editors' most-loved home
              finds across every room. Each one earns its place through
              thoughtful design, lasting quality, and that quiet feeling of
              "just right."
            </p>
            <p className="mt-2 text-sm text-taupe">
              {totalCount > 0
                ? `Showing the top ${products.length} of ${totalCount} timeless products`
                : "Loading our curated picks..."}
            </p>
          </div>
        </section>

        {/* ── Product grid ── */}
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
                  No editor picks available right now. Please check back soon.
                </p>
                <a
                  href="/"
                  className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                >
                  Browse all products →
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="border-t border-beige/20 py-12 sm:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
              Looking for something specific?
            </h2>
            <p className="mt-3 text-warm-gray">
              Browse by room or style to find exactly what your home needs.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/styles"
                className="inline-flex items-center gap-2 rounded-full border border-beige bg-white px-5 py-2.5 text-sm font-medium text-warm-dark transition-all hover:border-terracotta hover:text-terracotta hover:shadow-sm"
              >
                Shop by Style
              </a>
              <a
                href="/#collections"
                className="inline-flex items-center gap-2 rounded-full border border-beige bg-white px-5 py-2.5 text-sm font-medium text-warm-dark transition-all hover:border-terracotta hover:text-terracotta hover:shadow-sm"
              >
                Browse Collections
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
