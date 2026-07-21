import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { getProductsByRoom } from "~/lib/intelligence";
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/lifestyle/")({
  loader: async () => {
    try {
      const rooms = ["storage", "dining-room", "office"];
      const allProducts = await Promise.all(
        rooms.map((room) => getProductsByRoom(room))
      );
      const seen = new Set<number>();
      const products = allProducts.flat().filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      return { products };
    } catch (err) {
      console.error("Lifestyle loader error:", err);
      return { products: [] as Product[] };
    }
  },
  head: () => ({
    meta: [
      { title: "Shop by Lifestyle — Evergreen House" },
      {
        name: "description",
        content:
          "Curated home finds for real life — Small Space Living, Organization, Hosting, and Work From Home.",
      },
    ],
  }),
  component: LifestylePage,
});

function LifestylePage() {
  const { products } = Route.useLoaderData();

  return (
    <>
      {/* Hero */}
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
            Shop by Lifestyle
          </h1>
          <p className="mt-4 text-lg text-warm-gray">
            {products.length} {products.length === 1 ? "product" : "products"}{" "}
            curated for real life — small spaces, organization, hosting &amp;
            working from home
          </p>

          {/* Quick links to lifestyle sub-pages */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/lifestyle/small-spaces"
              className="inline-block rounded-full border border-beige/50 bg-white/60 px-4 py-2 text-sm font-medium text-warm-dark transition-colors hover:bg-white hover:text-terracotta"
            >
              Small Space Living
            </a>
            <a
              href="/lifestyle/organization"
              className="inline-block rounded-full border border-beige/50 bg-white/60 px-4 py-2 text-sm font-medium text-warm-dark transition-colors hover:bg-white hover:text-terracotta"
            >
              Organization
            </a>
            <a
              href="/lifestyle/hosting"
              className="inline-block rounded-full border border-beige/50 bg-white/60 px-4 py-2 text-sm font-medium text-warm-dark transition-colors hover:bg-white hover:text-terracotta"
            >
              Hosting
            </a>
            <a
              href="/lifestyle/work-from-home"
              className="inline-block rounded-full border border-beige/50 bg-white/60 px-4 py-2 text-sm font-medium text-warm-dark transition-colors hover:bg-white hover:text-terracotta"
            >
              Work From Home
            </a>
          </div>
        </div>
      </section>

      {/* Products grid */}
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
                No products found yet.
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
    </>
  );
}
