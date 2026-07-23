import { useState } from "react";

interface ShopSubItem {
  label: string;
  href: string;
}

interface ShopCategory {
  category: string;
  items: ShopSubItem[];
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const shopCategories: ShopCategory[] = [
    {
      category: "By Room",
      items: [
        { label: "Living Room", href: "/room/living-room" },
        { label: "Bedroom", href: "/room/bedroom" },
        { label: "Kitchen", href: "/room/kitchen" },
        { label: "Bathroom", href: "/room/bathroom" },
        { label: "Dining Room", href: "/room/dining-room" },
        { label: "Home Office", href: "/room/office" },
        { label: "Entryway", href: "/room/entryway" },
        { label: "Outdoor", href: "/room/patio" },
      ],
    },
    {
      category: "By Style",
      items: [
        { label: "Organic Modern", href: "/style/modern" },
        { label: "Minimalist & Modern", href: "/style/minimalist" },
        { label: "Everyday Luxury", href: "/style/glam" },
        { label: "Cozy Style", href: "/style/cozy" },
      ],
    },
    {
      category: "By Season",
      items: [
        { label: "Spring", href: "/collection/spring" },
        { label: "Summer", href: "/collection/summer" },
        { label: "Fall", href: "/collection/fall" },
        { label: "Holiday", href: "/collection/holiday" },
      ],
    },
    {
      category: "By Lifestyle",
      items: [
        { label: "Small Space Living", href: "/lifestyle/small-spaces" },
        { label: "Organization", href: "/lifestyle/organization" },
        { label: "Hosting", href: "/lifestyle/hosting" },
        { label: "Work From Home", href: "/lifestyle/work-from-home" },
      ],
    },
  ];

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Journal", href: "/blog" },
  ];

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-beige/20 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a
          href="/"
          className="font-serif text-2xl font-semibold tracking-tight text-warm-dark sm:text-3xl"
        >
          Evergreen House
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {/* Home */}
          <a
            href="/"
            className="text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
          >
            Home
          </a>

          {/* Shop dropdown — native <details> works without JS hydration */}
          <details className="group relative">
            <summary className="flex cursor-pointer items-center gap-1 text-sm font-medium text-warm-gray transition-colors hover:text-terracotta list-none select-none">
              Shop
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-200 group-open:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>

            <div className="absolute left-0 top-full mt-2 w-[640px] rounded-xl border border-beige/20 bg-white py-6 shadow-lg">
              <div className="grid grid-cols-4 gap-x-6 px-6">
                {shopCategories.map((cat) => (
                  <div key={cat.category}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-taupe">
                      {cat.category}
                    </h4>
                    <ul className="space-y-1">
                      {cat.items.map((item) => (
                        <li key={item.label}>
                          <a
                            href={item.href}
                            className="block py-1 text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </details>

          {/* Remaining nav links (Blog, About, Journal) */}
          {navLinks.slice(1).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side: search + hamburger */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <input
                type="text"
                placeholder="Search..."
                className="w-36 rounded-full border border-beige/50 bg-white px-3 py-1.5 text-sm text-warm-dark placeholder-warm-gray/60 outline-none transition-all focus:w-48 focus:border-beige sm:w-48 sm:focus:w-64"
                autoFocus
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                }}
              />
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-warm-gray transition-colors hover:text-terracotta"
                aria-label="Open search"
              >
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
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-full p-2 text-warm-gray transition-colors hover:text-terracotta md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-beige/20 bg-cream px-4 pb-4 pt-2 md:hidden">
          {/* Home */}
          <a
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block py-2 text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
          >
            Home
          </a>

          {/* Shop accordion */}
          <div className="border-t border-beige/20 pt-1">
            <p className="py-2 text-xs font-semibold uppercase tracking-wider text-taupe">
              Shop
            </p>
            {shopCategories.map((cat) => (
              <div key={cat.category} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="flex w-full items-center justify-between py-2 text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
                  aria-expanded={expandedCategories[cat.category] || false}
                >
                  <span>{cat.category}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${expandedCategories[cat.category] ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {expandedCategories[cat.category] && (
                  <div className="ml-4 space-y-0.5 pb-1">
                    {cat.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-warm-gray/80 transition-colors hover:text-terracotta"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Remaining links (Blog, About, Journal) */}
          <div className="border-t border-beige/20 pt-1">
            {navLinks.slice(1).map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-warm-gray transition-colors hover:text-terracotta"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
