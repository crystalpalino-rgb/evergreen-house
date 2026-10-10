import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Hero } from "~/components/Hero";
import { ShopTheEdits } from "~/components/ShopTheEdits";
import { TrendingProducts } from "~/components/TrendingProducts";
import { ShopTheLook } from "~/components/ShopTheLook";
import { BrowseByRoom } from "~/components/BrowseByRoom";
import { FromTheJournal } from "~/components/FromTheJournal";
import { EmailSignup } from "~/components/EmailSignup";
import { Footer } from "~/components/Footer";
import { getAllProducts, getTrendingProducts } from "~/lib/intelligence";
import { generateHomeMetadata } from "~/lib/seo";
import { getOrganizationSchema, getWebSiteSchema, SITE_URL } from "~/lib/schema";
import type { Product } from "~/lib/types";

type HomeSearch = { hero?: "b" | "c" };

export const Route = createFileRoute("/")({
  /* ?hero=a|b|c selects one of the three owner-reviewable hero directions.
     Anything else (including no param) falls back to concept A. */
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const raw = typeof search.hero === "string" ? search.hero.toLowerCase() : "";
    if (raw === "b" || raw === "c") return { hero: raw };
    return {};
  },
  head: () => {
    const seo = generateHomeMetadata();
    return {
      meta: seo.meta,
      links: seo.links,
    };
  },
  loader: async () => {
    try {
      const [products, trending] = await Promise.all([
        getAllProducts(),
        getTrendingProducts(6),
      ]);
      return { products, trending };
    } catch (err) {
      console.error("Loader error:", err);
      return {
        products: [] as Product[],
        trending: [] as Product[],
      };
    }
  },
  component: Home,
});

function Home() {
  const { products, trending } = Route.useLoaderData();
  const { hero } = Route.useSearch();
  const heroConcept = hero ?? "a";

  // Homepage-specific JSON-LD
  const homeSchema = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@graph": [
        getWebSiteSchema(`${SITE_URL}/search`),
        getOrganizationSchema(),
      ],
    },
    null,
    0
  );

  return (
    <>
      <Header />
      <main>
        {/* Homepage-specific schema (overrides __root.tsx default with more context) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: homeSchema }}
        />
        {/* Seasonal announcement strip - owner palette: midnight navy band,
            antique gold links */}
        <div className="w-full border-b border-soft-white/10 bg-midnight">
          <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs leading-relaxed text-soft-white/80 sm:px-6 sm:text-sm">
            The Holiday Shop is live. Warm, curated finds for the season.{" "}
            <a
              href="/collection/holiday"
              className="font-semibold uppercase tracking-[0.1em] text-antique-gold underline-offset-2 transition-colors hover:text-soft-white hover:underline"
            >
              Shop Holiday
            </a>
            <span className="mx-2 text-soft-white/40" aria-hidden="true">
              /
            </span>
            <a
              href="/collection/fall"
              className="font-semibold uppercase tracking-[0.1em] text-antique-gold underline-offset-2 transition-colors hover:text-soft-white hover:underline"
            >
              Shop Fall
            </a>
          </p>
        </div>
        {/* Owner-approved homepage hierarchy, top to bottom:
            1 hero, 2 shop the edits, 3 trending finds, 4 shop the look,
            5 explore by room, 6 from the journal, 7 email signup. */}
        <Hero concept={heroConcept} />
        <ShopTheEdits />
        <TrendingProducts products={trending} />
        <ShopTheLook products={products} collections={[]} />
        <BrowseByRoom />
        <FromTheJournal />
        <EmailSignup />
      </main>
      <Footer />
    </>
  );
}
