import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy path rescue. The July pin drafts linked to `/kitchen`, which has never
 * been a route on this site (the real page is `/room/kitchen`), so every one of
 * those saves landed on a 404. A permanent redirect keeps any pin or indexed
 * link that already carries the short path working, and points shoppers at the
 * room edit they were promised.
 */
export const Route = createFileRoute("/kitchen")({
  loader: () => {
    throw redirect({ href: "/room/kitchen", statusCode: 301 });
  },
  component: () => null,
});
