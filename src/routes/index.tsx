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
import type { Product } from "~/lib/types";

export const Route = createFileRoute("/")({
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

  return (
    <>
      <Header />
      <main>
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
