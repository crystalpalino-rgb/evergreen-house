import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy path rescue. The July pin drafts linked to `/patio`; the real page is
 * `/room/patio`. Permanent redirect so saved pins and indexed links resolve
 * instead of returning 404.
 */
export const Route = createFileRoute("/patio")({
  loader: () => {
    throw redirect({ href: "/room/patio", statusCode: 301 });
  },
  component: () => null,
});
