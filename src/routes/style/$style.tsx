import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { getProductsByStyle } from "~/lib/intelligence";

const styleLabels: Record<string, string> = {
  modern: "Modern",
  cozy: "Cozy",
  minimalist: "Minimalist",
  farmhouse: "Farmhouse",
  coastal: "Coastal",
  boho: "Bohemian",
  glam: "Everyday Luxury",
  traditional: "Traditional",
};

export const Route = createFileRoute("/style/$style")({
  loader: async ({ params }) => {
    try {
      const products = await getProductsByStyle(params.style);
      return { products, style: params.style };
    } catch (err) {
      console.error("Loader error:", err);
      return { products: [], style: params.style };
    }
  },
  head: ({ loaderData }) => {
    const styleName = styleLabels[loaderData?.style] || (loaderData?.style ? loaderData.style.charAt(0).toUpperCase() + loaderData.style.slice(1) : "Style");
    return {
      meta: [
        { title: `${styleName}, Evergreen House` },
        {
          name: "description",
          content: `Curated ${styleName.toLowerCase()} home finds, editor-approved pieces that define this aesthetic.`,
        },
      ],
    };
  },
  component: StylePage,
});

function StylePage() {
  const { products, style } = Route.useLoaderData();
  const styleName = styleLabels[style] || style.charAt(0).toUpperCase() + style.slice(1);

  return (
    <>
      <Header />
      <main>
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
              href="/styles"
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
              All Styles
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">
              {styleName}
            </h1>
            <p className="mt-4 text-lg text-warm-gray">
              {products.length} {products.length === 1 ? "product" : "products"} with {styleName.toLowerCase()} aesthetic
            </p>
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
                <p className="text-lg text-warm-gray">No products found for this style yet.</p>
                <a
                  href="/styles"
                  className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                >
                  Browse all styles →
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
