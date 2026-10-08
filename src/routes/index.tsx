import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Hero } from "~/components/Hero";
import { TrendingProducts } from "~/components/TrendingProducts";
import { ShopTheLook } from "~/components/ShopTheLook";
import { FeaturedStory } from "~/components/FeaturedStory";
import { BrowseByRoom } from "~/components/BrowseByRoom";
import { EmailSignup } from "~/components/EmailSignup";
import { Footer } from "~/components/Footer";
import { getAllProducts, getTrendingProducts } from "~/lib/intelligence";
import { generateHomeMetadata } from "~/lib/seo";
import { getOrganizationSchema, getWebSiteSchema, SITE_URL } from "~/lib/schema";
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/")({
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
        {/* Seasonal announcement strip */}
        <div className="w-full border-b border-beige/25 bg-cream-dark">
          <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs leading-relaxed text-warm-gray sm:px-6 sm:text-sm">
            The Holiday Shop is live. Warm, curated finds for the season.{" "}
            <a
              href="/collection/holiday"
              className="font-medium text-terracotta underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
            >
              Shop Holiday
            </a>
            <span className="mx-2 text-beige" aria-hidden="true">
              /
            </span>
            <a
              href="/collection/fall"
              className="font-medium text-terracotta underline-offset-2 transition-colors hover:text-terracotta-dark hover:underline"
            >
              Shop Fall
            </a>
          </p>
        </div>
        <Hero />
        <BrowseByRoom />
        <ShopTheLook products={products} collections={[]} />
        <TrendingProducts products={trending} />
        <FeaturedStory />
        <EmailSignup />
      </main>
      <Footer />
    </>
  );
}
