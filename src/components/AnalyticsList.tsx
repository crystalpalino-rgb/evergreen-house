import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { claimOnce, getPagePath, toAnalyticsItem, trackViewItemList } from "~/lib/analytics";

/**
 * Wraps a product grid and reports it to GA4 exactly once per render.
 *
 * Two jobs:
 * 1. Pushes `view_item_list` for the whole grid on mount (once, deduped by
 *    list + page + item set) instead of once per card.
 * 2. Publishes the list identity through context, so the shared ProductCard can
 *    tag `select_item` and `affiliate_click` with the grid they came from
 *    without every one of the 14 renderers passing props down.
 *
 * Renders no DOM element: layout is untouched (a bare fragment).
 */
export type AnalyticsListValue = {
  listId: string;
  listName: string;
  context: string;
};

const AnalyticsListContext = createContext<AnalyticsListValue | null>(null);

/** Nearest grid context, or null when a card renders outside a grid. */
export function useAnalyticsList(): AnalyticsListValue | null {
  return useContext(AnalyticsListContext);
}

export function AnalyticsList({
  id,
  name,
  context,
  items,
  children,
}: {
  id: string;
  name?: string;
  context?: string;
  items: unknown[];
  children: ReactNode;
}) {
  const listName = name || id;
  const listContext = context || id;

  // Stable identity for the rendered set, so a renderer that hands us a fresh
  // array on every render does not re-fire the event.
  const signature = useMemo(
    () =>
      (items || [])
        .map((item) => toAnalyticsItem(item)?.item_id ?? "")
        .filter(Boolean)
        .join(","),
    [items],
  );

  useEffect(() => {
    if (!signature) return;
    if (!claimOnce(`${listContext}|${getPagePath()}|${signature}`)) return;
    trackViewItemList({ listId: id, listName, context: listContext, items });
    // `items` is deliberately tracked through `signature`: same set, no re-push.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, listName, listContext, signature]);

  const value = useMemo(
    () => ({ listId: id, listName, context: listContext }),
    [id, listName, listContext],
  );

  return <AnalyticsListContext.Provider value={value}>{children}</AnalyticsListContext.Provider>;
}
