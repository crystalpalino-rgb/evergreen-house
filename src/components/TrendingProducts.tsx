import type { Product } from "~/lib/types";
import { ProductCard } from "./ProductCard";

export function TrendingProducts({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-cream-dark py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-3xl font-semibold text-warm-dark sm:text-4xl">
          Crystal's Edit
        </h2>
        <p className="mt-3 text-center text-warm-gray">
          Newest discoveries and favorite recommendations
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
