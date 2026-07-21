import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate({ to: `/search?q=${encodeURIComponent(trimmed)}` });
    } else {
      navigate({ to: "/search" });
    }
  };

  return (
    <section className="bg-cream-dark py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <h2 className="text-center font-serif text-2xl font-semibold text-warm-dark sm:text-3xl">
          Find your perfect piece
        </h2>
        <form onSubmit={handleSubmit} className="relative mt-6">
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray/60"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by room, style, or product..."
              className="w-full rounded-full border border-beige/50 bg-white py-3.5 pl-12 pr-5 text-warm-dark shadow-sm outline-none transition-all placeholder:text-warm-gray/60 focus:border-beige focus:shadow-md"
              aria-label="Search products by room, style, or product name"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-terracotta px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-terracotta-dark"
            >
              Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
