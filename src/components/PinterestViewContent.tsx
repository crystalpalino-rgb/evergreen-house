import { useEffect } from "react";
import { trackPinterestViewContent, type PinterestViewCategory } from "~/lib/analytics";

/**
 * Fires the Pinterest `ViewContent` event once per view of a room or collection
 * page, from a single mount effect - the same one-event-per-view shape as
 * AnalyticsList. A client-side route change remounts the page, so the event
 * fires again for the new slug; claimOnce inside analytics.ts stops it ever
 * firing twice for one view.
 *
 * Renders nothing: no DOM element, no layout change.
 */
export function PinterestViewContent({
  contentName,
  contentCategory,
}: {
  contentName: string;
  contentCategory: PinterestViewCategory;
}) {
  useEffect(() => {
    trackPinterestViewContent({ contentName, contentCategory });
  }, [contentName, contentCategory]);

  return null;
}
