// Vercel Build Output API function entry.
//
// The Build Output Node launcher invokes the default export as a classic Node
// `(req, res)` handler - NOT a web handler. TanStack Start emits a portable web
// fetch handler (dist/server/server.js), so we adapt: Node IncomingMessage → web
// Request, run the fetch handler, stream the web Response back onto ServerResponse.
// Node 22 has global Request/Response/Headers/ReadableStream.
//
// Bundled (with its deps + the SSR handler's dynamic ./assets chunks) into
// .vercel/output/functions/render.func/index.mjs by build-vercel.sh.
import type { IncomingMessage, ServerResponse } from "node:http";

import handler from "./dist/server/server.js";

const fetchHandler = handler as {
  fetch: (request: Request) => Response | Promise<Response>;
};

// ── API middleware (mirrors serve.ts for Vercel) ──
async function handleApiRoutes(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);

  // POST /api/subscribe
  if (pathname === "/api/subscribe" && req.method === "POST") {
    try {
      const body = await req.json();
      const { handleSubscribe } = await import("./src/lib/subscribers");
      const result = await handleSubscribe(body);
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // GET /ads.txt, from the publisher ID saved in /admin/ads. Same handler as
  // serve.ts, because production is served by this entry and not by serve.ts:
  // an empty setting answers 404 with an empty body, never a placeholder line.
  if (pathname === "/ads.txt") {
    const { handleAdsTxt } = await import("./src/lib/site-settings");
    return handleAdsTxt();
  }

  // GET /api/subscribers was removed on 2026-11-05: it answered unauthenticated
  // requests with the subscriber list. Subscriber reading goes through an
  // authenticated server function once the admin login lands. Do not re-add a
  // data route here without the adminOnly middleware in front of it.

  return null;
}

const toWebRequest = (req: IncomingMessage): Request => {
  const host = req.headers.host ?? "localhost";
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const url = `${proto}://${host}${req.url ?? "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) for (const v of value) headers.append(key, v);
    else if (value != null) headers.set(key, value);
  }
  const method = req.method ?? "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers,
    ...(hasBody
      ? { body: req as unknown as ReadableStream, duplex: "half" }
      : {}),
  } as RequestInit);
};

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const webReq = toWebRequest(req);
    // Check API routes before SSR
    const apiRes = await handleApiRoutes(webReq);
    const webRes = apiRes ?? (await fetchHandler.fetch(webReq));
    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => res.setHeader(key, value));
    if (webRes.body) {
      const reader = webRes.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    // Log the detail server-side (captured by the host's function logs); never
    // return a stack trace to the public visitor of the site.
    console.error("[team-site] SSR request failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Internal Server Error");
  }
}
