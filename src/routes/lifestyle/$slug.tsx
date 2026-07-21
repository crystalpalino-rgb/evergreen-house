import { createFileRoute } from "@tanstack/react-router";
import { ProductCard } from "~/components/ProductCard";
import { sql } from "~/db";
import type { Product } from "~/lib/products";

const lifestyleMappings: Record<string, { rooms: string[]; label: string }> = {
  "small-spaces": { rooms: ["storage"], label: "Small Space Living" },
  organization: { rooms: ["organization"], label: "Organization" },
  hosting: { rooms: ["dining-room"], label: "Hosting" },
  "work-from-home": { rooms: ["office"], label: "Work From Home" },
};

function mapRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name || row.name,
    room: row.room,
    style: typeof row.style === "string" ? JSON.parse(row.style) : (row.style || []),
    amazonUrl: row.amazon_url,
    price: row.price,
    rating: row.rating,
    editorNote: row.editor_note,
    imageUrl: row.image_url,
    pinterestTitle: row.pinterest_title,
    blogCategory: row.blog_category,
    collection: row.collection,
    isTrending: row.is_trending ?? false,
  };
}

export const Route = createFileRoute("/lifestyle/$slug")({
  loader: async ({ params }) => {
    const mapping = lifestyleMappings[params.slug];
    if (!mapping) return { products: [] as Product[], label: params.slug, slug: params.slug };
    try {
      const allRows = await Promise.all(
        mapping.rooms.map((room) => { const db = sql(); return db`SELECT * FROM products WHERE room = ${room} ORDER BY rating DESC NULLS LAST`; })
      );
      const seen = new Set<number>();
      const products: Product[] = [];
      for (const rows of allRows) {
        for (const row of rows as any[]) {
          if (!seen.has(row.id)) {
            seen.add(row.id);
            products.push(mapRow(row));
          }
        }
      }
      return { products, label: mapping.label, slug: params.slug };
    } catch (err) {
      console.error("Lifestyle loader error:", err);
      return { products: [] as Product[], label: mapping.label, slug: params.slug };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.label || "Lifestyle"} — Evergreen House` },
      {
        name: "description",
        content: `Curated home finds for ${(loaderData?.label || "your lifestyle").toLowerCase()} — editor-approved picks that work the way you do.`,
      },
    ],
  }),
  component: LifestyleSlugPage,
});

function LifestyleSlugPage() {
  const { products, label, slug } = Route.useLoaderData();

  const themes = [
    { href: "/lifestyle/small-spaces", label: "Small Space Living", slug: "small-spaces" },
    { href: "/lifestyle/organization", label: "Organization", slug: "organization" },
    { href: "/lifestyle/hosting", label: "Hosting", slug: "hosting" },
    { href: "/lifestyle/work-from-home", label: "Work From Home", slug: "work-from-home" },
  ];
  return (

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #3d322c 1px, transparent 1px), radial-gradient(circle at 80% 70%, #3d322c 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
            <a href="/lifestyle" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              All Lifestyles
            </a>
            <h1 className="font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl lg:text-6xl">{label}</h1>
            <p className="mt-4 text-lg text-warm-gray">{products.length} {products.length === 1 ? "product" : "products"} curated for {label.toLowerCase()}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {themes.map((t) => (
                <a key={t.slug} href={t.href} className={`inline-block rounded-full border px-4 py-2 text-sm font-medium transition-colors ${t.slug === slug ? "bg-terracotta text-white border-terracotta" : "border-beige/50 bg-white/60 text-warm-dark hover:bg-white hover:text-terracotta"}`}>{t.label}</a>
              ))}
            </div>
          </div>
        </section>
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-warm-gray">No products found for this lifestyle yet.</p>
                <a href="/lifestyle" className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark">Browse all lifestyles →</a>
              </div>
            )}
          </div>
        </section>
      </main>
  );
}
