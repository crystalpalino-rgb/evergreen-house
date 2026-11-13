import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Retired URL: /evergreen-house/privacy.
 *
 * The July 2026 privacy policy was replaced on 2026-11-12 by the owner's
 * AdSense-ready policy at /privacy. This URL must never serve the old policy
 * again, so it redirects permanently.
 *
 * Production answers this before the app is ever reached: the same redirect is
 * in the "redirects" block of vercel.json and of .vercel/output/config.json
 * (build-vercel.sh), and in LEGACY_REDIRECTS at the top of serve.ts. This route
 * is the third guard, so the vite dev server answers identically.
 */
export const Route = createFileRoute("/evergreen-house/privacy")({
  beforeLoad: () => {
    throw redirect({ href: "/privacy", statusCode: 301 });
  },
});
