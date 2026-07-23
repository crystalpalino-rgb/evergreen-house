import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";
import { ProductCard } from "~/components/ProductCard";
import { ProductFilters } from "~/components/ProductFilters";
import { searchProducts, getFilterOptions } from "~/lib/intelligence";
import type { ProductFilters as PFilters } from "~/lib/intelligence";
import type { Product, FilterOptions } from "~/lib/types";

const ITEMS_PER_PAGE = 12;

function useQueryParams() {
  const [params, setParams] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const obj: Record<string, string> = {};
      sp.forEach((v, k) => { obj[k] = v; });
      setParams(obj);
    }
  }, []);

  return params;
}

function buildFiltersFromParams(params: Record<string, string>): { filters: PFilters; page: number } {
  const filters: PFilters = {};
  if (params.room) filters.room = params.room;
  if (params.style) filters.style = params.style;
  if (params.productType) filters.productType = params.productType;
  if (params.material) filters.material = params.material;
  if (params.color) filters.color = params.color;
  if (params.mood) filters.mood = params.mood;
  if (params.minPrice) filters.minPrice = parseFloat(params.minPrice);
  if (params.maxPrice) filters.maxPrice = parseFloat(params.maxPrice);
  const page = parseInt(params.page || "1", 10);
  return { filters, page };
}

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Evergreen House" },
      { name: "description", content: "Search our curated collection of timeless home finds." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const navigate = useNavigate();
  const rawParams = useQueryParams();
  const { filters: activeFilters, page } = buildFiltersFromParams(rawParams);
  const query = rawParams.q || "";

  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [availableFilters, setAvailableFilters] = useState<FilterOptions>({
    rooms: [], styles: [], productTypes: [], materials: [], colors: [], moods: [],
    priceRange: { min: 0, max: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const [searchResult, filtersResult] = await Promise.all([
          searchProducts(query, { ...activeFilters, isActive: true }, ITEMS_PER_PAGE, offset),
          getFilterOptions(),
        ]);
        if (!cancelled) {
          setResults(searchResult.products);
          setTotal(searchResult.total);
          setAvailableFilters(filtersResult);
        }
      } catch (err) {
        console.error("Search error:", err);
        if (!cancelled) {
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [query, rawParams.room, rawParams.style, rawParams.productType, rawParams.material, rawParams.color, rawParams.mood, rawParams.minPrice, rawParams.maxPrice, rawParams.page]);

  const updateParams = (newFilters: PFilters) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (newFilters.room) sp.set("room", newFilters.room);
    if (newFilters.style) sp.set("style", newFilters.style);
    if (newFilters.productType) sp.set("productType", newFilters.productType);
    if (newFilters.material) sp.set("material", newFilters.material);
    if (newFilters.color) sp.set("color", newFilters.color);
    if (newFilters.mood) sp.set("mood", newFilters.mood);
    if (newFilters.minPrice !== undefined) sp.set("minPrice", String(newFilters.minPrice));
    if (newFilters.maxPrice !== undefined) sp.set("maxPrice", String(newFilters.maxPrice));
    // Reset to page 1 on filter change
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/search?${sp.toString()}`);
      // Trigger a reload by navigating
      navigate({ to: `/search?${sp.toString()}` });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector("input") as HTMLInputElement;
    const sp = new URLSearchParams();
    if (input.value.trim()) sp.set("q", input.value.trim());
    // Keep existing filters
    if (activeFilters.room) sp.set("room", activeFilters.room);
    if (activeFilters.style) sp.set("style", activeFilters.style);
    if (activeFilters.productType) sp.set("productType", activeFilters.productType);
    if (activeFilters.material) sp.set("material", activeFilters.material);
    if (activeFilters.color) sp.set("color", activeFilters.color);
    if (activeFilters.mood) sp.set("mood", activeFilters.mood);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", `/search?${sp.toString()}`);
      navigate({ to: `/search?${sp.toString()}` });
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <>
      <Header />
      <main>
        {/* Search hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cream-dark" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
            <a href="/" className="inline-flex items-center gap-1.5 text-sm text-taupe transition-colors hover:text-terracotta mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Home
            </a>
            <h1 className="font-serif text-3xl font-bold text-warm-dark sm:text-4xl">
              {query ? `Results for "${query}"` : "Browse All Products"}
            </h1>
            <p className="mt-2 text-warm-gray">
              {total} {total === 1 ? "product" : "products"} found
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="mt-6 max-w-xl">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray/60">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by product name, brand, or style..."
                  className="w-full rounded-full border border-beige/50 bg-white py-3 pl-12 pr-5 text-warm-dark shadow-sm outline-none transition-all placeholder:text-warm-gray/60 focus:border-beige focus:shadow-md"
                />
              </div>
            </form>
          </div>
        </section>

        <section className="py-4 sm:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filter sidebar */}
              <aside className="w-full lg:w-60 shrink-0">
                <div className="sticky top-4 rounded-2xl border border-beige/20 bg-white p-5 shadow-sm">
                  <h2 className="font-serif text-lg font-semibold text-warm-dark mb-3">Filters</h2>
                  <ProductFilters
                    availableFilters={availableFilters}
                    activeFilters={activeFilters}
                    onChange={updateParams}
                    layout="sidebar"
                  />
                </div>
              </aside>

              {/* Results */}
              <div className="flex-1 min-w-0">
                {loading ? (
                  <div className="py-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-beige border-t-terracotta" />
                    <p className="mt-4 text-warm-gray">Loading...</p>
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {results.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8 flex items-center justify-center gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const pg = i + 1;
                          const sp = new URLSearchParams(rawParams as any);
                          sp.set("page", String(pg));
                          return (
                            <a
                              key={pg}
                              href={`/search?${sp.toString()}`}
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                pg === page ? "bg-beige/30 text-terracotta" : "text-warm-dark hover:bg-cream-dark"
                              }`}
                            >
                              {pg}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-lg text-warm-gray">
                      {query ? `No results found for "${query}".` : "No products match your filters."}
                    </p>
                    <p className="mt-2 text-sm text-taupe">
                      Try adjusting your search terms or clearing filters.
                    </p>
                    <a
                      href="/search"
                      className="mt-4 inline-block text-sm font-medium text-terracotta transition-colors hover:text-terracotta-dark"
                    >
                      Clear all filters →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
