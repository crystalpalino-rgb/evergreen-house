import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { Breadcrumbs } from "~/components/Breadcrumbs";
import { getProductsByStyle } from "~/lib/intelligence";
import { generateStyleMetadata } from "~/lib/seo";
import { getCollectionPageSchema, SITE_URL } from "~/lib/schema";

const styleLabels: Record<string, string> = { modern: "Modern", cozy: "Cozy", minimalist: "Minimalist", farmhouse: "Farmhouse", coastal: "Coastal", boho: "Bohemian", glam: "Everyday Luxury", traditional: "Traditional" };

/** Define related styles for cross-linking */
const STYLE_RELATIONSHIPS: Record<string, string[]> = {
  modern: ["minimalist", "coastal"],
  minimalist: ["modern", "cozy"],
  cozy: ["farmhouse", "traditional", "boho"],
  farmhouse: ["cozy", "traditional", "coastal"],
  coastal: ["boho", "modern", "farmhouse"],
  boho: ["coastal", "cozy", "farmhouse"],
  glam: ["modern", "traditional"],
  traditional: ["farmhouse", "glam", "cozy"],
};

export const Route = createFileRoute("/style/$style")({
  loader: async ({ params }) => {
    try { const products = await getProductsByStyle(params.style); return { products, style: params.style }; }
    catch (err) { console.error("Loader error:", err); return { products: [], style: params.style }; }
  },
  head: ({ loaderData }) => {
    const styleName = styleLabels[loaderData?.style] || (loaderData?.style ? loaderData.style.charAt(0).toUpperCase() + loaderData.style.slice(1) : "Style");
    const seo = generateStyleMetadata(styleName);
    return { meta: seo.meta, links: seo.links };
  },
  component: StylePage,
});

function StylePage() {
  const { products, style } = Route.useLoaderData();
  const styleName = styleLabels[style] || style.charAt(0).toUpperCase() + style.slice(1);
  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Styles", href: "/styles" }, { label: styleName }];
  const collectionSchema = getCollectionPageSchema({ name: styleName, display_name: styleName }, `${SITE_URL}/style/${style}`);

  const relatedStyleSlugs = STYLE_RELATIONSHIPS[style] || [];
  const relatedStyles = relatedStyleSlugs
    .filter((s) => s !== style)
    .slice(0, 3)
    .map((s) => ({ slug: s, label: styleLabels[s] || s.charAt(0).toUpperCase() + s.slice(1) }));

  return (
    <>
      <Header />
      <main>
        <Breadcrumbs items={breadcrumbItems} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
            <a href="/styles" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              All Styles
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{styleName}</h1>
            <p className="mt-4 text-lg text-warm-gray">{products.length} {products.length === 1 ? "product" : "products"} with {styleName.toLowerCase()} aesthetic</p>
          </div>
        </section>
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => (<ProductCard key={product.id} product={product} />))}</div>
            ) : (
              <div className="py-10 text-center"><p className="text-lg text-warm-gray">No products found for this style yet.</p><a href="/styles" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all styles →</a></div>
            )}
          </div>
        </section>

        {/* Explore More Styles */}
        {relatedStyles.length > 0 && (
          <section aria-labelledby="more-styles-heading" className="border-t border-beige/20 bg-cream/30 py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2
                id="more-styles-heading"
                className="font-serif text-2xl font-semibold text-warm-dark sm:text-3xl"
              >
                Explore More Styles
              </h2>
              <p className="mt-2 text-warm-gray">
                If {styleName.toLowerCase()} speaks to you, you might also love these complementary aesthetics.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedStyles.map((related) => (
                  <a
                    key={related.slug}
                    href={`/style/${related.slug}`}
                    className="group rounded-2xl border border-beige/20 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <h3 className="font-serif text-lg font-semibold text-warm-dark transition-colors group-hover:text-terracotta">
                      {related.label}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-taupe transition-colors group-hover:text-terracotta">
                      Browse {related.label.toLowerCase()} finds
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
