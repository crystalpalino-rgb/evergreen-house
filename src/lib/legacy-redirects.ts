/**
 * Retired collection URLs: old short paths to their live "-edit" pages.
 *
 * Each of these eight paths was a published collection page before the edits
 * were renamed to `/collections/<slug>-edit`. Live Pinterest pins still point
 * at the short form, so every one of them has to answer a permanent redirect
 * instead of a 404. The mapping is one to one: the short path only ever had one
 * page behind it.
 *
 * This map is the single source for the two places the app answers from:
 * - `src/routes/collections/$editSlug.tsx` beforeLoad, which covers the vite
 *   dev server and any request that reaches the app;
 * - `LEGACY_REDIRECTS` at the top of `serve.ts`, which covers the published
 *   server before the app is reached.
 *
 * The same eight redirects are also written into the "redirects" block of
 * `vercel.json` and of `.vercel/output/config.json` (build-vercel.sh), so
 * production answers them at the edge, before any function runs.
 */
export const LEGACY_COLLECTION_REDIRECTS: Record<string, string> = {
  "/collections/luxe-christmas-tree":
    "/collections/luxe-christmas-tree-edit",
  "/collections/cozy-christmas-bedroom":
    "/collections/cozy-christmas-bedroom-edit",
  "/collections/heritage-christmas": "/collections/heritage-christmas-edit",
  "/collections/holiday-hosting": "/collections/holiday-hosting-edit",
  "/collections/thanksgiving-table": "/collections/thanksgiving-table-edit",
  "/collections/moody-thanksgiving": "/collections/moody-thanksgiving-edit",
  "/collections/thanksgiving-hosting":
    "/collections/thanksgiving-hosting-edit",
  "/collections/thanksgiving-welcome":
    "/collections/thanksgiving-welcome-edit",
};
