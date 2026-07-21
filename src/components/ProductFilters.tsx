import { useState } from "react";
import type { FilterOptions, FilterOption } from "~/lib/types";
import type { ProductFilters as PFilters } from "~/lib/intelligence";

// ── Helpers ──

const SECTION_TITLES: Record<string, string> = {
  rooms: "Room",
  styles: "Style",
  productTypes: "Type",
  materials: "Material",
  colors: "Color",
  moods: "Mood",
};

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

export function ProductFilters({
  availableFilters,
  activeFilters,
  onChange,
  layout = "sidebar",
}: {
  availableFilters: FilterOptions;
  activeFilters: PFilters;
  onChange: (filters: PFilters) => void;
  layout?: "sidebar" | "horizontal";
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rooms: true,
    styles: false,
    productTypes: false,
    materials: false,
    colors: false,
    moods: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Build active filter chips
  const chips: ActiveFilter[] = [];
  if (activeFilters.room) chips.push({ type: "room", value: activeFilters.room, label: availableFilters.rooms.find((r) => r.value === activeFilters.room)?.label ?? activeFilters.room });
  if (activeFilters.style) chips.push({ type: "style", value: activeFilters.style, label: availableFilters.styles.find((s) => s.value === activeFilters.style)?.label ?? activeFilters.style });
  if (activeFilters.productType) chips.push({ type: "productType", value: activeFilters.productType, label: availableFilters.productTypes.find((p) => p.value === activeFilters.productType)?.label ?? activeFilters.productType });
  if (activeFilters.material) chips.push({ type: "material", value: activeFilters.material, label: availableFilters.materials.find((m) => m.value === activeFilters.material)?.label ?? activeFilters.material });
  if (activeFilters.color) chips.push({ type: "color", value: activeFilters.color, label: availableFilters.colors.find((c) => c.value === activeFilters.color)?.label ?? activeFilters.color });
  if (activeFilters.mood) chips.push({ type: "mood", value: activeFilters.mood, label: availableFilters.moods.find((m) => m.value === activeFilters.mood)?.label ?? activeFilters.mood });
  if (activeFilters.minPrice !== undefined || activeFilters.maxPrice !== undefined) {
    const label = activeFilters.minPrice && activeFilters.maxPrice
      ? `$${activeFilters.minPrice}–$${activeFilters.maxPrice}`
      : activeFilters.minPrice
        ? `$${activeFilters.minPrice}+`
        : `Up to $${activeFilters.maxPrice}`;
    chips.push({ type: "price", value: "range", label });
  }

  const removeChip = (chip: ActiveFilter) => {
    const next = { ...activeFilters };
    if (chip.type === "room") next.room = undefined;
    else if (chip.type === "style") next.style = undefined;
    else if (chip.type === "productType") next.productType = undefined;
    else if (chip.type === "material") next.material = undefined;
    else if (chip.type === "color") next.color = undefined;
    else if (chip.type === "mood") next.mood = undefined;
    else if (chip.type === "price") { next.minPrice = undefined; next.maxPrice = undefined; }
    onChange(next);
  };

  const clearAll = () => {
    onChange({});
  };

  const isActive = (type: string, value: string): boolean => {
    switch (type) {
      case "room": return activeFilters.room === value;
      case "style": return activeFilters.style === value;
      case "productType": return activeFilters.productType === value;
      case "material": return activeFilters.material === value;
      case "color": return activeFilters.color === value;
      case "mood": return activeFilters.mood === value;
      default: return false;
    }
  };

  const handleSelect = (type: string, value: string) => {
    const next = { ...activeFilters };
    // Toggle: if already selected, deselect
    if (isActive(type, value)) {
      switch (type) {
        case "room": next.room = undefined; break;
        case "style": next.style = undefined; break;
        case "productType": next.productType = undefined; break;
        case "material": next.material = undefined; break;
        case "color": next.color = undefined; break;
        case "mood": next.mood = undefined; break;
      }
    } else {
      switch (type) {
        case "room": next.room = value; break;
        case "style": next.style = value; break;
        case "productType": next.productType = value; break;
        case "material": next.material = value; break;
        case "color": next.color = value; break;
        case "mood": next.mood = value; break;
      }
    }
    onChange(next);
  };

  const sections: { key: string; options: FilterOption[] }[] = [
    { key: "rooms", options: availableFilters.rooms },
    { key: "styles", options: availableFilters.styles },
    { key: "productTypes", options: availableFilters.productTypes },
    { key: "materials", options: availableFilters.materials },
    { key: "colors", options: availableFilters.colors },
    { key: "moods", options: availableFilters.moods },
  ];

  const isHorizontal = layout === "horizontal";

  return (
    <div>
      {/* Active filter chips */}
      {chips.length > 0 && (
        <div className={`mb-4 ${isHorizontal ? "flex flex-wrap items-center gap-2" : ""}`}>
          {!isHorizontal && <p className="text-xs font-semibold uppercase tracking-wider text-taupe mb-2">Active Filters</p>}
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                onClick={() => removeChip(chip)}
                className="inline-flex items-center gap-1 rounded-full bg-cream-dark px-3 py-1.5 text-xs font-medium text-warm-dark transition-colors hover:bg-beige/30"
              >
                {chip.label}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ))}
            <button
              onClick={clearAll}
              className="text-xs text-taupe underline transition-colors hover:text-terracotta"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Filter sections */}
      <div className={`${isHorizontal ? "flex flex-wrap gap-4" : "space-y-1"}`}>
        {sections.map(({ key, options }) => {
          if (options.length === 0) return null;
          const expanded = expandedSections[key] ?? false;
          return (
            <div key={key} className={isHorizontal ? "relative" : ""}>
              <button
                onClick={() => toggleSection(key)}
                className={`flex w-full items-center justify-between py-2 text-sm font-medium text-warm-dark transition-colors hover:text-terracotta ${isHorizontal ? "gap-1" : ""}`}
              >
                <span>{SECTION_TITLES[key] ?? key}</span>
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
                  className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {expanded && (
                <div className={`${isHorizontal ? "absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-xl border border-beige/20 bg-white p-3 shadow-lg" : "pb-3"}`}>
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(key === "rooms" ? "room" : key === "styles" ? "style" : key === "productTypes" ? "productType" : key === "materials" ? "material" : key === "colors" ? "color" : "mood", opt.value)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                        isActive(
                          key === "rooms" ? "room" : key === "styles" ? "style" : key === "productTypes" ? "productType" : key === "materials" ? "material" : key === "colors" ? "color" : "mood",
                          opt.value
                        )
                          ? "bg-beige/20 font-medium text-terracotta"
                          : "text-warm-dark hover:bg-cream-dark"
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-xs text-taupe">{opt.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price range */}
      {availableFilters.priceRange.max > 0 && (
        <div className="mt-4 border-t border-beige/20 pt-4">
          <p className="text-sm font-medium text-warm-dark mb-2">Price Range</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ ...activeFilters, minPrice: undefined, maxPrice: 50 })}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${activeFilters.maxPrice === 50 && activeFilters.minPrice === undefined ? "bg-beige/30 text-terracotta font-medium" : "text-warm-dark hover:bg-cream-dark"}`}
            >
              Under $50
            </button>
            <button
              onClick={() => onChange({ ...activeFilters, minPrice: 50, maxPrice: 150 })}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${activeFilters.minPrice === 50 && activeFilters.maxPrice === 150 ? "bg-beige/30 text-terracotta font-medium" : "text-warm-dark hover:bg-cream-dark"}`}
            >
              $50–$150
            </button>
            <button
              onClick={() => onChange({ ...activeFilters, minPrice: 150, maxPrice: undefined })}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${activeFilters.minPrice === 150 && activeFilters.maxPrice === undefined ? "bg-beige/30 text-terracotta font-medium" : "text-warm-dark hover:bg-cream-dark"}`}
            >
              $150+
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
