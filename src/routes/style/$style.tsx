import { createFileRoute, redirect } from "@tanstack/react-router";
import { RETIRED_STYLE_REDIRECTS } from "~/lib/legacy-redirects";

/**
 * By Style is retired (owner decision 37, 2026-11-14). Every /style/<style>
 * URL answers a permanent redirect to /collections instead of rendering a style
 * collection. The five styles that had a page are named in the map
 * (src/lib/legacy-redirects.ts, shared with serve.ts and vercel.json); any
 * other style slug, including the modern, boho, glam and traditional pages the
 * old hardcoded list served, lands on /collections too, so no style URL can
 * 404 and none of them can quietly bring a By Style page back.
 */
export const Route = createFileRoute("/style/$style")({
  beforeLoad: ({ params }) => {
    const target =
      RETIRED_STYLE_REDIRECTS[`/style/${params.style}`] || "/collections";
    throw redirect({ href: target, statusCode: 301 });
  },
});
