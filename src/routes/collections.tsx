import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { EditCard } from "~/components/EditCard";
import { getEditSummaries, type EditCardData } from "~/lib/edits";
import { getAllCollections, getCollectionProductCount } from "~/lib/intelligence";
import { RETIRED_COLLECTION_SLUGS } from "~/lib/legacy-redirects";
import { generateStaticMetadata } from "~/lib/seo";
import type { Collection } from "~/lib/types";

/* Which collection sits in which group on this index (owner decision 37,
   2026-11-14). Grouping only: no URL changes, so every one of these pages keeps
   the path it already had.

   - By Style is retired (one point of view, not five styles), so the index
     never renders a style group or a style collection.
   - Autumn Warmth, Spring Refresh, Summer Living and Winter Nesting are
     seasons, not rooms, so they get their own "By Season" group. The order is
     the order the owner listed them in.
   - Home Essentials is neither a room nor a season: it gets its own group.
   - A collection with 0 products gets no tile (the empty Nursery tile), and
     neither does one whose page is retired and redirects (Outdoor Living). */
const SEASON_SLUGS: readonly string[] = ["fall", "spring", "summer", "holiday"];
const ESSENTIALS_SLUGS: readonly string[] = ["home-essentials"];

type CollectionWithCount = Collection & { productCount: number };

export const Route = createFileRoute("/collections")({
  loader: async () => {
    /* The curated edits come from the `edits` table (collection admin, phase 1)
       and are loaded before the room/style collections so a failure there still
       leaves the edits row on the page, and vice versa. */
    let edits: EditCardData[] = [];
    try {
      edits = await getEditSummaries();
    } catch (err) {
      console.error("Edits loader error:", err);
    }
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

      const retired = new Set(RETIRED_COLLECTION_SLUGS);
      const live = withCounts.filter(
        (c) =>
          c.type !== "style" && c.productCount > 0 && !retired.has(c.slug)
      );

      // Group for the page
      const roomCollections = live.filter(
        (c) =>
          c.type === "room" &&
          !SEASON_SLUGS.includes(c.slug) &&
          !ESSENTIALS_SLUGS.includes(c.slug)
      );
      const seasonCollections = SEASON_SLUGS.map((slug) =>
        live.find((c) => c.slug === slug)
      ).filter((c): c is CollectionWithCount => Boolean(c));
      const essentialsCollections = live.filter((c) =>
        ESSENTIALS_SLUGS.includes(c.slug)
      );
      const otherCollections = live.filter((c) => c.type !== "room");

      return {
        edits,
        roomCollections,
        seasonCollections,
        essentialsCollections,
        otherCollections,
      };
    } catch (err) {
      console.error("Collections loader error:", err);
      return {
        edits,
        roomCollections: [] as CollectionWithCount[],
        seasonCollections: [] as CollectionWithCount[],
        essentialsCollections: [] as CollectionWithCount[],
        otherCollections: [] as CollectionWithCount[],
      };
    }
  },
  head: ({ matches }) => {
    /* /collections is the parent route of /collections/<edit-slug>, and a nested
       route's links are appended after its parent's, not merged over them. If
       this index head emitted its own canonical while an edit page was matched,
       the edit page would ship two <link rel="canonical"> tags with the index
       first, and Google would read every edit page as a duplicate of
       /collections. The edit page's head owns the canonical and og:url for those
       URLs, so this head stays silent whenever the child route is in the lane. */
    /* `matches` is typed as this route's own match union, but at runtime it is
       the whole lane from the root down, so the child's route id is not part of
       the type here. */
    const editPageMatched = matches.some(
      (m) => (m.routeId as string) === "/collections/$editSlug"
    );
    if (editPageMatched) return {};
    const seo = generateStaticMetadata(
      "Collections",
      "Browse all Evergreen House collections - thoughtfully curated finds for every room and season.",
      "/collections"
    );
    return { meta: seo.meta, links: seo.links };
  },
  component: CollectionsPage,
});

const typeLabels: Record<string, string> = {
  room: "By Room",
  season: "By Season",
  guide: "Buying Guides",
};

function CollectionCard({
  col,
  eyebrow,
}: {
  col: Collection & { productCount: number };
  eyebrow?: string;
}) {
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
          {eyebrow || typeLabels[col.type] || col.type}
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
  const {
    edits,
    roomCollections,
    seasonCollections,
    essentialsCollections,
    otherCollections,
  } = Route.useLoaderData();
  /* /collections is also the parent of /collections/<edit-slug>. When an edit
     page is matched, this index renders only the outlet. */
  const matches = useMatches();
  if (matches.some((m) => m.routeId === "/collections/$editSlug")) {
    return <Outlet />;
  }

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
        {/* Header. This page has no hero photo, so it gets the compact text
            band rather than a tall empty cream panel. */}
        <section className="border-b border-beige/20 bg-cream/40">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
              Thoughtfully curated collections for every room and season.
              Each piece is editor-approved - chosen for quality, longevity, and
              the way it makes a space feel.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Curated edits (the SHOP THE EDITS destination) first: these are
                the editorial collections the nav points at. Eight edits since
                2026-11-04 (four holiday, four Thanksgiving), so four up on
                desktop keeps them in two even rows with no widow. */}
            <div className="mb-14">
              <h2 className="mb-6 font-serif text-2xl font-semibold text-warm-dark">
                Shop the Edits
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {edits.map((edit, i) => (
                  <EditCard
                    key={edit.slug}
                    edit={edit}
                    eager={i === 0}
                    showCount
                  />
                ))}
              </div>
            </div>

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

            {/* Season collections. Not rooms: they get their own group and the
                tile says so, even though the rows carry type "room" in the
                database. Grouping only - every URL here is unchanged. */}
            {seasonCollections.length > 0 && (
              <div className="mb-14">
                <h2 className="font-serif text-2xl font-semibold text-warm-dark mb-6">
                  By Season
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {seasonCollections.map((col) => (
                    <CollectionCard
                      key={col.slug}
                      col={col}
                      eyebrow="By Season"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Home Essentials: the everyday-utility set. Its own group rather
                than a room, because it spans rooms. */}
            {essentialsCollections.length > 0 && (
              <div className="mb-14">
                <h2 className="font-serif text-2xl font-semibold text-warm-dark mb-6">
                  Home Essentials
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {essentialsCollections.map((col) => (
                    <CollectionCard
                      key={col.slug}
                      col={col}
                      eyebrow="Home Essentials"
                    />
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
              seasonCollections.length === 0 &&
              essentialsCollections.length === 0 &&
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
