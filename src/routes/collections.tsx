import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getAllCollections, getCollectionProductCount } from "~/lib/intelligence";
import { generateStaticMetadata } from "~/lib/seo";
import type { Collection } from "~/lib/types";

export const Route = createFileRoute("/collections")({
  loader: async () => {
    try {
      const collections = await getAllCollections();

      // Fetch product counts for each collection in parallel
      const withCounts = await Promise.all(
        collections.map(async (col: Collection) => {
          try {
            const count = await getCollectionProductCount(col.slug);
            return { ...col, productCount: count };
          } catch {
            return { ...col, productCount: 0 };
          }
        })
      );

      // Group by type
      const roomCollections = withCounts.filter((c) => c.type === "room");
      const styleCollections = withCounts.filter((c) => c.type === "style");
      const otherCollections = withCounts.filter(
        (c) => c.type !== "room" && c.type !== "style"
      );

      return { roomCollections, styleCollections, otherCollections };
    } catch (err) {
      console.error("Collections loader error:", err);
      return {
        roomCollections: [] as (Collection & { productCount: number })[],
        styleCollections: [] as (Collection & { productCount: number })[],
        otherCollections: [] as (Collection & { productCount: number })[],
      };
    }
  },
  head: () => {
    const seo = generateStaticMetadata(
      "Collections",
      "Browse all Evergreen House collections — thoughtfully curated finds for every room, style, and season.",
      "/collections"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: CollectionsPage,
});

const typeLabels: Record<string, string> = {
  room: "By Room",
  style: "By Style",
  guide: "Buying Guides",
};

function CollectionCard({ col }: { col: Collection & { productCount: number } }) {
  const label = col.display_name || col.name;
  return (
    <a
      href={`/collection/${col.slug}`}
      className="group rounded-2xl border border-beige/20 bg-white shadow-sm ring-1 ring-beige/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md overflow-hidden"
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] overflow-hidden bg-cream-dark">
        {col.image_url ? (
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${col.image_url})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-5xl text-beige/30 italic">
              {label.charAt(0)}
            </span>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-taupe">
          {typeLabels[col.type] || col.type}
        </span>
        <h2 className="mt-1 font-serif text-xl font-semibold text-warm-dark">
          {label}
        </h2>
        {col.description && (
          <p className="mt-2 text-sm leading-relaxed text-warm-gray line-clamp-2">
            {col.description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-taupe">
            {col.productCount} {col.productCount === 1 ? "product" : "products"}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-terracotta transition-colors group-hover:text-terracotta-dark">
            Explore
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

function CollectionsPage() {
  const { roomCollections, styleCollections, otherCollections } =
    Route.useLoaderData();

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Collections" },
          ]}
        />
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
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
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
              Collections
            </h1>
            <p className="mt-4 text-lg text-warm-gray max-w-2xl">
              Thoughtfully curated collections for every room, style, and season.
              Each piece is editor-approved — chosen for quality, longevity, and
              the way it makes a space feel.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Room collections */}
            {roomCollections.length > 0 && (
              <div className="mb-14">
                <h2 className="font-serif text-2xl font-semibold text-warm-dark mb-6">
                  By Room
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {roomCollections.map((col) => (
                    <CollectionCard key={col.slug} col={col} />
                  ))}
                </div>
              </div>
            )}

            {/* Style collections */}
            {styleCollections.length > 0 && (
              <div className="mb-14">
                <h2 className="font-serif text-2xl font-semibold text-warm-dark mb-6">
                  By Style
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {styleCollections.map((col) => (
                    <CollectionCard key={col.slug} col={col} />
                  ))}
                </div>
              </div>
            )}

            {/* Other collections */}
            {otherCollections.length > 0 && (
              <div className="mb-14">
                <h2 className="font-serif text-2xl font-semibold text-warm-dark mb-6">
                  More Collections
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {otherCollections.map((col) => (
                    <CollectionCard key={col.slug} col={col} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {roomCollections.length === 0 &&
              styleCollections.length === 0 &&
              otherCollections.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-lg text-warm-gray">No collections yet.</p>
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
      </main>
      <Footer />
    </>
  );
}
