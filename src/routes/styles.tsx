import { createFileRoute, redirect } from "@tanstack/react-router";
import { RETIRED_STYLE_REDIRECTS } from "~/lib/legacy-redirects";

/**
 * The Shop by Style index is retired (owner decision 37, 2026-11-14): the site
 * has one point of view, not five styles, and Rooms plus the Edits carry the
 * shopping. The page itself is gone; the URL answers a permanent redirect to
 * /collections, from the same map serve.ts and vercel.json read, so a pin or an
 * old link still lands somewhere real.
 */
export const Route = createFileRoute("/styles")({
  beforeLoad: () => {
    throw redirect({ href: RETIRED_STYLE_REDIRECTS["/styles"], statusCode: 301 });
  },
});
