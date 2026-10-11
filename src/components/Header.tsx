import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { APPAREL_BUCKETS } from "~/lib/apparel";

interface ShopSubItem {
  label: string;
  href: string;
}

interface ShopCategory {
  category: string;
  items: ShopSubItem[];
}

/* Approved simplified top level nav (owner, 2026-10-10): exactly three items.
   The logo is the way home, Journal, About, Contact and the policy page live in
   the footer, and every other destination is reachable from the two dropdowns
   below and from the mobile drawer. */
const NAV_ITEMS = [
  { label: "SHOP THE EDITS", href: "/collections" },
  { label: "BY ROOM", href: "/rooms" },
  { label: "HOLIDAY", href: "/collection/holiday" },
];

const NAV_LINK_CLASS =
  "text-[0.78rem] font-semibold uppercase tracking-[0.14em] transition-colors";

/* All ten rooms. The dropdown is the only home these need now that BY ROOM is a
   top level item, so it must stay complete. */
const ROOM_ITEMS: ShopSubItem[] = [
  { label: "Living Room", href: "/room/living-room" },
  { label: "Bedroom", href: "/room/bedroom" },
  { label: "Kitchen", href: "/room/kitchen" },
  { label: "Bathroom", href: "/room/bathroom" },
  { label: "Dining Room", href: "/room/dining-room" },
  { label: "Home Office", href: "/room/office" },
  { label: "Entryway", href: "/room/entryway" },
  { label: "Outdoor", href: "/room/patio" },
  { label: "Laundry Room", href: "/room/laundry" },
  { label: "Pantry", href: "/room/pantry" },
];

const SHOP_CATEGORIES: ShopCategory[] = [
  {
    category: "By Season",
    items: [
      { label: "Holiday", href: "/collection/holiday" },
      { label: "Fall", href: "/collection/fall" },
      { label: "Spring", href: "/collection/spring" },
      { label: "Summer", href: "/collection/summer" },
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
    category: "By Lifestyle",
    items: [
      { label: "Small Space Living", href: "/lifestyle/small-spaces" },
      { label: "Organization", href: "/lifestyle/organization" },
      { label: "Hosting", href: "/lifestyle/hosting" },
      { label: "Work From Home", href: "/lifestyle/work-from-home" },
    ],
  },
];

/* Apparel keeps its /apparel groups as links, folded into the SHOP THE EDITS
   dropdown and the mobile drawer. The bucket ids come from ~/lib/apparel, which
   is also what the /apparel page renders its sections from, so the menu can
   never drift from the anchors that exist on the page. */
const APPAREL_LINKS: ShopSubItem[] = [
  { label: "All Apparel", href: "/apparel" },
  ...APPAREL_BUCKETS.map((bucket) => ({
    label: bucket.label,
    href: `/apparel#${bucket.id}`,
  })),
];

const DROPDOWN_KEYS = ["SHOP THE EDITS", "BY ROOM"] as const;

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const handleSearchSubmit = () => {
    const q = searchValue.trim();
    if (q) {
      navigate({ to: "/search", search: { q } });
      setSearchOpen(false);
      setSearchValue("");
    }
  };

  /* Active state: exact match, or a path below the destination. Oxblood on soft
     white is 11.6:1, so it carries both the hover and the active state. */
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    `${NAV_LINK_CLASS} ${isActive(href) ? "text-burgundy" : "text-midnight hover:text-burgundy"}`;

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-midnight/10 bg-soft-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo is the way home now that HOME left the nav */}
        <a
          href="/"
          className="font-serif text-2xl font-semibold tracking-tight text-midnight transition-colors hover:text-burgundy sm:text-3xl"
        >
          Evergreen House
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const hasDropdown = (DROPDOWN_KEYS as readonly string[]).includes(
              item.label,
            );

            if (!hasDropdown) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                >
                  {item.label}
                </a>
              );
            }

            const isShop = item.label === "SHOP THE EDITS";

            return (
              /* Both dropdown items link to their own index page and open the
                 full menu on hover or keyboard focus. The panel is in the DOM
                 even when closed, so every destination stays crawlable. */
              <div key={item.href} className="group relative">
                <a
                  href={item.href}
                  className={`${linkClass(item.href)} flex items-center gap-1.5`}
                  aria-haspopup="true"
                >
                  {item.label}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </a>

                <div className="absolute left-1/2 top-full hidden -translate-x-1/2 pt-3 group-hover:block group-focus-within:block">
                  {isShop ? (
                    <div className="w-[42rem] max-w-[calc(100vw_-_3rem)] rounded-xl border border-midnight/10 bg-soft-white p-6 shadow-lg shadow-midnight/10">
                      <div className="grid grid-cols-3 gap-x-6">
                        {SHOP_CATEGORIES.map((cat) => (
                          <div key={cat.category}>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-burgundy">
                              {cat.category}
                            </h4>
                            <ul className="space-y-1">
                              {cat.items.map((it) => (
                                <li key={it.label}>
                                  <a
                                    href={it.href}
                                    className="block py-1 text-sm font-medium text-midnight/80 transition-colors hover:text-burgundy"
                                  >
                                    {it.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-midnight/10 pt-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-burgundy">
                          Apparel
                        </span>
                        {APPAREL_LINKS.map((it) => (
                          <a
                            key={it.label}
                            href={it.href}
                            className="rounded-full border border-midnight/15 px-3 py-1 text-xs font-medium text-midnight/80 transition-colors hover:border-burgundy hover:text-burgundy"
                          >
                            {it.label}
                          </a>
                        ))}
                        <a
                          href="/about"
                          className="ml-auto text-xs font-semibold uppercase tracking-wider text-midnight/70 transition-colors hover:text-burgundy"
                        >
                          About
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-[24rem] max-w-[calc(100vw_-_3rem)] rounded-xl border border-midnight/10 bg-soft-white p-6 shadow-lg shadow-midnight/10">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-burgundy">
                        By Room
                      </h4>
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {ROOM_ITEMS.map((it) => (
                          <li key={it.label}>
                            <a
                              href={it.href}
                              className="block py-1 text-sm font-medium text-midnight/80 transition-colors hover:text-burgundy"
                            >
                              {it.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                      <a
                        href="/rooms"
                        className="mt-4 inline-block border-t border-midnight/10 pt-3 text-xs font-semibold uppercase tracking-wider text-midnight/70 transition-colors hover:text-burgundy"
                      >
                        All Rooms
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Right side: search + hamburger */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            {searchOpen ? (
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-36 rounded-full border border-midnight/20 bg-white px-3 py-1.5 text-sm text-midnight placeholder-midnight/50 outline-none transition-all focus:w-48 focus:border-burgundy sm:w-48 sm:focus:w-64"
                  autoFocus
                  onBlur={() => setSearchOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSearchOpen(false);
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                />
                <button
                  onClick={handleSearchSubmit}
                  className="ml-1 rounded-full p-2 text-midnight transition-colors hover:text-burgundy"
                  aria-label="Submit search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
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
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 text-midnight transition-colors hover:text-burgundy"
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
            className="rounded-full p-2 text-midnight transition-colors hover:text-burgundy lg:hidden"
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

      {/* Mobile menu: the three top level items, then every destination the
          dropdowns carry on desktop, then the footer-only pages. */}
      {mobileOpen && (
        <nav
          className="max-h-[calc(100vh_-_5rem)] overflow-y-auto border-t border-midnight/10 bg-soft-white px-4 pb-6 pt-2 lg:hidden"
          aria-label="Mobile"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 text-sm font-semibold uppercase tracking-[0.12em] transition-colors ${
                isActive(item.href)
                  ? "text-burgundy"
                  : "text-midnight hover:text-burgundy"
              }`}
            >
              {item.label}
            </a>
          ))}

          {/* Rooms accordion */}
          <div className="border-t border-midnight/10 pt-1">
            <button
              onClick={() => toggleCategory("By Room")}
              className="flex w-full items-center justify-between py-2 text-sm font-medium text-midnight transition-colors hover:text-burgundy"
              aria-expanded={expandedCategories["By Room"] || false}
            >
              <span>By Room</span>
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
                className={`transition-transform duration-200 ${expandedCategories["By Room"] ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedCategories["By Room"] && (
              <div className="ml-4 space-y-0.5 pb-1">
                {ROOM_ITEMS.map((it) => (
                  <a
                    key={it.label}
                    href={it.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-sm text-midnight/80 transition-colors hover:text-burgundy"
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop accordion */}
          <div className="border-t border-midnight/10 pt-1">
            <p className="py-2 text-xs font-semibold uppercase tracking-wider text-burgundy">
              Shop by
            </p>
            {SHOP_CATEGORIES.map((cat) => (
              <div key={cat.category} className="mb-1">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="flex w-full items-center justify-between py-2 text-sm font-medium text-midnight transition-colors hover:text-burgundy"
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
                    {cat.items.map((it) => (
                      <a
                        key={it.label}
                        href={it.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-midnight/80 transition-colors hover:text-burgundy"
                      >
                        {it.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Apparel accordion */}
          <div className="border-t border-midnight/10 pt-1">
            <button
              onClick={() => toggleCategory("Apparel")}
              className="flex w-full items-center justify-between py-2 text-sm font-medium text-midnight transition-colors hover:text-burgundy"
              aria-expanded={expandedCategories["Apparel"] || false}
            >
              <span>Apparel</span>
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
                className={`transition-transform duration-200 ${expandedCategories["Apparel"] ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedCategories["Apparel"] && (
              <div className="ml-4 space-y-0.5 pb-1">
                {APPAREL_LINKS.map((it) => (
                  <a
                    key={it.label}
                    href={it.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-sm text-midnight/80 transition-colors hover:text-burgundy"
                  >
                    {it.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Pages that moved out of the top level nav */}
          <div className="border-t border-midnight/10 pt-1">
            {[
              { label: "About", href: "/about" },
              { label: "Journal", href: "/blog" },
              { label: "Contact", href: "/contact" },
            ].map((it) => (
              <a
                key={it.label}
                href={it.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm font-medium text-midnight transition-colors hover:text-burgundy"
              >
                {it.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
