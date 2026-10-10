import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy path rescue. The July pin drafts linked to `/living-room`; the real page
 * is `/room/living-room`. Permanent redirect so saved pins and indexed links
 * resolve instead of returning 404.
 */
export const Route = createFileRoute("/living-room")({
  loader: () => {
    throw redirect({ href: "/room/living-room", statusCode: 301 });
  },
  component: () => null,
});
