import type { Product } from "~/lib/types";
import { ProductCard } from "./ProductCard";
import { AnalyticsList } from "./AnalyticsList";

/**
 * Homepage TRENDING FINDS: 6 hand-picked trending products in the shared
 * Amazon-first card (large image, short title, VIEW ON AMAZON). Sits directly
 * under the SHOP THE EDITS row, so the copy is minimal: a heading and one line.
 */
export function TrendingProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  const shown = products.slice(0, 6);

  return (
    <section className="bg-cream-dark py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
          Trending Finds
        </h2>
        <p className="mt-2 text-sm text-warm-gray sm:text-base">
          The pieces people are reaching for this week.
        </p>
        <AnalyticsList id="crystals-edit" name="Crystal's Edit" items={shown}>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </AnalyticsList>
      </div>
    </section>
  );
}
