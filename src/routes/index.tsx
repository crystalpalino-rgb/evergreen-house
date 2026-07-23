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
        <Hero trending={trending} />
        <TrendingProducts products={trending} />
        <BrowseByRoom />
        <ShopTheLook products={products} collections={[]} />
        <FeaturedStory />
        <EmailSignup />
      </main>
      <Footer />
    </>
  );
}
