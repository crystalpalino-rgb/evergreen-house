import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Retired URL: /collections/moody-tablescape-edit.
 *
 * The Moody Tablescape Edit stopped being its own page on 2026-11-04 (owner
 * decision 17: one Moody collection) and was folded into
 * /collections/moody-thanksgiving-edit. Live Pinterest pins still point at the
 * old URL, so it redirects permanently instead of 404ing.
 *
 * Production answers this before the app is ever reached: the same redirect is
 * in the "redirects" block of .vercel/output/config.json (build-vercel.sh) and
 * vercel.json, and in LEGACY_REDIRECTS at the top of serve.ts. This route is the
 * third guard, so the vite dev server answers identically.
 */
export const Route = createFileRoute("/collections/moody-tablescape-edit")({
  beforeLoad: () => {
    throw redirect({
      to: "/collections/$editSlug",
      params: { editSlug: "moody-thanksgiving-edit" },
      statusCode: 301,
    });
  },
});
