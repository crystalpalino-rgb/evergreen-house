// Production server for the built site. The TanStack Start build emits a portable
// fetch handler (dist/server/server.js) plus static client assets (dist/client);
// this wraps them in a Bun server on port 3000 — static files first, API routes
// next, SSR for the rest. Run `bun run build` before starting.
// Restart it with `bun run publish`.
//
// Starting a new instance supersedes the old one: it frees the port no matter
// which user owns the current server (provisioning starts it as `engine`; a team
// member's `bun run publish` runs as their own user), so publish never collides
// with an already-running server. Every sandbox user has passwordless sudo, so
// the takeover works across user boundaries.
import handler from "./dist/server/server.js";

// Pinned, NOT read from the environment. The published preview URL
// (<label>.<PUBLIC_SITE_DOMAIN>) is reverse-proxied to 0.0.0.0:3000 inside the
// sandbox, so the default site MUST bind there. Bun auto-loads .env files, so
// honouring process.env.PORT/HOST would let a stray env var or a .env in the site
// dir silently move the site off :3000 (or onto loopback) and break the public URL.
const PORT = 3000;
const HOST = "0.0.0.0";
const CLIENT_DIR = `${import.meta.dir}/dist/client`;

// ── Admin API middleware ──
async function handleAdminApi(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);

  // GET /api/admin/summary
  if (pathname === "/api/admin/summary" && req.method === "GET") {
    try {
      const { sql: getSql } = await import("./src/db");
      const s = getSql();

      // Run all queries in parallel
      const [
        totalRows,
        activeRows,
        avgCompRows,
        avgQualRows,
        missingImgRows,
        missingSEORows,
        missingAIRows,
        missingPinRows,
        collRows,
        ruleRows,
        recentRows,
        attentionRows,
      ] = await Promise.all([
        s`SELECT count(*)::int as c FROM products`,
        s`SELECT count(*)::int as c FROM products WHERE is_active = true`,
        s`SELECT coalesce(avg(completeness_score), 0)::float as v FROM products`,
        s`SELECT coalesce(avg(quality_score), 0)::float as v FROM products`,
        s`SELECT count(*)::int as c FROM products WHERE image_url IS NULL`,
        s`SELECT count(*)::int as c FROM products WHERE seo_title IS NULL OR seo_description IS NULL`,
        s`SELECT count(*)::int as c FROM products WHERE ai_summary IS NULL`,
        s`SELECT count(*)::int as c FROM products WHERE pinterest_title IS NULL OR pinterest_description IS NULL`,
        s`SELECT count(*)::int as c FROM collections`,
        s`SELECT count(*)::int as c FROM collection_rules`,
        s`SELECT id, name, full_name, room, price, rating, completeness_score, quality_score, image_url, ai_summary, editor_note, created_at, updated_at FROM products ORDER BY updated_at DESC NULLS LAST LIMIT 8`,
        s`SELECT id, name, full_name, room, price, rating, completeness_score, quality_score, image_url, ai_summary, editor_note FROM products WHERE completeness_score < 50 OR image_url IS NULL OR ai_summary IS NULL ORDER BY completeness_score ASC LIMIT 12`,
      ]);

      const totalProducts = (totalRows as any[])[0]?.c ?? 0;
      const activeProducts = (activeRows as any[])[0]?.c ?? 0;
      const avgCompleteness = Math.round(((avgCompRows as any[])[0]?.v ?? 0) * 10) / 10;
      const avgQuality = Math.round(((avgQualRows as any[])[0]?.v ?? 0) * 10) / 10;
      const missingImages = (missingImgRows as any[])[0]?.c ?? 0;
      const missingSEO = (missingSEORows as any[])[0]?.c ?? 0;
      const missingAI = (missingAIRows as any[])[0]?.c ?? 0;
      const missingPinterest = (missingPinRows as any[])[0]?.c ?? 0;
      const collections = (collRows as any[])[0]?.c ?? 0;
      const collectionRules = (ruleRows as any[])[0]?.c ?? 0;

      const serialize = (p: any) => ({
        id: p.id,
        name: p.name,
        fullName: p.full_name,
        room: p.room,
        price: p.price,
        rating: p.rating,
        completenessScore: p.completeness_score,
        qualityScore: p.quality_score,
        imageUrl: p.image_url,
        aiSummary: p.ai_summary,
        editorNote: p.editor_note,
        createdAt: String(p.created_at ?? ""),
        updatedAt: String(p.updated_at ?? ""),
      });

      return new Response(JSON.stringify({
        totalProducts,
        activeProducts,
        avgCompleteness,
        avgQuality,
        missingImages,
        missingSEO,
        missingAI,
        missingPinterest,
        collections,
        collectionRules,
        recentlyAdded: (recentRows as any[]).map(serialize),
        needsAttention: (attentionRows as any[]).map(serialize),
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/admin/low-quality
  if (pathname === "/api/admin/low-quality" && req.method === "GET") {
    try {
      const { sql: getSql } = await import("./src/db");
      const s = getSql();
      const rows = await s`
        SELECT id, name, full_name, room, price, rating, completeness_score, quality_score,
               image_url, ai_summary, editor_note, seo_title, pinterest_title
        FROM products
        WHERE completeness_score < 50 OR image_url IS NULL OR ai_summary IS NULL
        ORDER BY completeness_score ASC
        LIMIT 50
      `;
      const products = (rows as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.full_name,
        room: p.room,
        price: p.price,
        rating: p.rating,
        completenessScore: p.completeness_score,
        qualityScore: p.quality_score,
        imageUrl: p.image_url,
        aiSummary: p.ai_summary,
        editorNote: p.editor_note,
        seoTitle: p.seo_title,
        pinterestTitle: p.pinterest_title,
        issues: [
          !p.image_url && "missing-image",
          p.completeness_score < 50 && "low-completeness",
          !p.ai_summary && "missing-ai",
          !p.seo_title && "missing-seo",
          !p.pinterest_title && "missing-pinterest",
        ].filter(Boolean),
      }));
      return new Response(JSON.stringify({ products }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/admin/recent
  if (pathname === "/api/admin/recent" && req.method === "GET") {
    try {
      const { sql: getSql } = await import("./src/db");
      const s = getSql();
      const rows = await s`
        SELECT id, name, full_name, room, price, rating, completeness_score, quality_score,
               image_url, ai_summary, editor_note, created_at, updated_at
        FROM products
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 20
      `;
      const products = (rows as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        fullName: p.full_name,
        room: p.room,
        price: p.price,
        rating: p.rating,
        completenessScore: p.completeness_score,
        qualityScore: p.quality_score,
        imageUrl: p.image_url,
        aiSummary: p.ai_summary,
        editorNote: p.editor_note,
        createdAt: String(p.created_at ?? ""),
        updatedAt: String(p.updated_at ?? ""),
      }));
      return new Response(JSON.stringify({ products }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return null;
}

// ── Marketing API middleware ──
// These are lazy-loaded to avoid startup errors when DB isn't connected yet.
let marketingApi: Awaited<typeof import("./src/lib/marketing-api.ts")> | null = null;
async function getMarketingApi() {
  if (!marketingApi) {
    marketingApi = await import("./src/lib/marketing-api.ts");
  }
  return marketingApi;
}

async function handleMarketingApi(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);

  // GET /api/marketing/dashboard
  if (pathname === "/api/marketing/dashboard" && req.method === "GET") {
    try {
      const api = await getMarketingApi();
      const data = await api.handleDashboard();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/marketing/generate
  if (pathname === "/api/marketing/generate" && req.method === "POST") {
    try {
      const body = await req.json();
      const { channel, topic } = body;
      if (!channel || !["blog", "pinterest", "email"].includes(channel)) {
        return new Response(
          JSON.stringify({ error: "Invalid channel" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      const api = await getMarketingApi();
      const draft = await api.handleGenerate(channel, topic);
      return new Response(JSON.stringify(draft), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/marketing/drafts
  if (pathname === "/api/marketing/drafts" && req.method === "GET") {
    try {
      const url = new URL(req.url);
      const channel = url.searchParams.get("channel") ?? undefined;
      const status = url.searchParams.get("status") ?? undefined;
      const api = await getMarketingApi();
      const drafts = await api.handleGetDrafts(channel, status);
      return new Response(JSON.stringify(drafts), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/marketing/drafts/:id/approve
  const approveMatch = pathname.match(/^\/api\/marketing\/drafts\/(\d+)\/approve$/);
  if (approveMatch && req.method === "POST") {
    try {
      const id = parseInt(approveMatch[1], 10);
      const api = await getMarketingApi();
      const draft = await api.handleApproveDraft(id);
      return new Response(JSON.stringify(draft), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // PATCH /api/marketing/drafts/:id
  const patchMatch = pathname.match(/^\/api\/marketing\/drafts\/(\d+)$/);
  if (patchMatch && req.method === "PATCH") {
    try {
      const id = parseInt(patchMatch[1], 10);
      const body = await req.json();
      const api = await getMarketingApi();
      const draft = await api.handleUpdateDraft(id, body);
      return new Response(JSON.stringify(draft), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // POST /api/marketing/agent/run
  if (pathname === "/api/marketing/agent/run" && req.method === "POST") {
    try {
      const api = await getMarketingApi();
      const result = await api.handleAgentRun();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // GET /api/marketing/agent/summary
  if (pathname === "/api/marketing/agent/summary" && req.method === "GET") {
    try {
      const api = await getMarketingApi();
      const result = await api.handleAgentSummary();
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return null;
}

// Free PORT regardless of which user owns the current listener. lsof runs under
// sudo so it can see (and the kill can signal) a process owned by another user;
// the loop waits for the socket to actually release before we bind.
const freePort =
  `for _ in $(seq 1 25); do ` +
  `pids=$(lsof -t -iTCP:${String(PORT)} -sTCP:LISTEN 2>/dev/null || true); ` +
  `if [ -z "$pids" ]; then exit 0; fi; ` +
  `kill $pids 2>/dev/null || true; sleep 0.2; ` +
  `done`;

// Take over the port, re-freeing and retrying if another publish grabbed it in the
// gap between freeing and binding (last publish wins). Bun.serve throws EADDRINUSE
// synchronously, so without this a raced publish would die while the shell already
// reported success.
for (let attempt = 1; ; attempt++) {
  await Bun.$`sudo sh -c ${freePort}`.quiet().nothrow();
  try {
    Bun.serve({
      port: PORT,
      hostname: HOST,
      async fetch(req) {
        const { pathname } = new URL(req.url);

        // Static files
        if (pathname !== "/") {
          const file = Bun.file(CLIENT_DIR + pathname);
          if (await file.exists()) return new Response(file);
        }

        // Admin API routes
        if (pathname.startsWith("/api/admin/")) {
          const apiResp = await handleAdminApi(req);
          if (apiResp) return apiResp;
        }

        // Marketing API routes
        if (pathname.startsWith("/api/marketing/")) {
          const apiResp = await handleMarketingApi(req);
          if (apiResp) return apiResp;
        }

        // Blog posts API — returns all published blog posts
        if (pathname === "/api/blog-posts" && req.method === "GET") {
          try {
            const { sql: getSql } = await import("./src/db");
            const s = getSql();
            const rows = (await s`
              SELECT id, title, content, status, created_at, updated_at
              FROM marketing_tasks
              WHERE channel = 'blog' AND status = 'published'
              ORDER BY created_at DESC
            `) as any[];
            const posts = rows.map((r: any) => ({
              id: r.id,
              title: r.title,
              content: r.content,
              status: r.status,
              created_at: String(r.created_at),
              updated_at: String(r.updated_at),
            }));
            return new Response(JSON.stringify({ posts }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Blog post API — returns a single published post by ID
        if (pathname === "/api/blog-post" && req.method === "GET") {
          const url = new URL(req.url);
          const id = parseInt(url.searchParams.get("id") || "", 10);
          if (isNaN(id)) {
            return new Response(JSON.stringify({ error: "Invalid ID" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          try {
            const { sql: getSql } = await import("./src/db");
            const s = getSql();
            const rows = (await s`
              SELECT id, title, content, channel, status, created_at, updated_at
              FROM marketing_tasks
              WHERE id = ${id} AND channel = 'blog' AND status = 'published'
              LIMIT 1
            `) as any[];
            if (rows.length === 0) {
              return new Response(JSON.stringify({ post: null }), {
                headers: { "Content-Type": "application/json" },
              });
            }
            const r = rows[0];
            const post = {
              id: r.id,
              title: r.title,
              content: r.content,
              channel: r.channel,
              status: r.status,
              created_at: String(r.created_at),
              updated_at: String(r.updated_at),
            };
            return new Response(JSON.stringify({ post }), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Room products API — works around TanStack SSR loader DB issue
        if (pathname === "/api/room-products") {
          const url = new URL(req.url);
          const room = url.searchParams.get("room") || "";
          try {
            const { sql: getSql } = await import("./src/db");
            const s = getSql();
            const rows = await s`SELECT * FROM products ORDER BY rating DESC NULLS LAST`;
            const arr = Array.isArray(rows) ? rows : [...rows];
            // Curated virtual rooms
            const curated: Record<string, number[]> = {
              "seasonal-finds": [74,75,79,80,81,82,83,84,85,86,87,88,114,115],
              "wall-decor": [12,16,30,46],
              "dining-room": [13,28,39,63,69,92,105,106,111,113],
            };
            const curatedIds = curated[room];
            if (curatedIds) {
              const idSet = new Set(curatedIds);
              const filtered = arr.filter((r: any) => idSet.has(r.id));
              const mapped = filtered.map((r: any) => ({
                id: r.id, name: r.name, fullName: r.full_name, room: r.room,
                style: r.style || [], amazonUrl: r.amazon_url, price: r.price,
                rating: r.rating, editorNote: r.editor_note, imageUrl: r.image_url,
                collection: r.collection, isTrending: r.is_trending,
              }));
              return new Response(JSON.stringify(mapped), {
                headers: { "Content-Type": "application/json" },
              });
            }
            // Real room
            const filtered = arr.filter((r: any) => r.room === room);
            const mapped = filtered.map((r: any) => ({
              id: r.id, name: r.name, fullName: r.full_name, room: r.room,
              style: r.style || [], amazonUrl: r.amazon_url, price: r.price,
              rating: r.rating, editorNote: r.editor_note, imageUrl: r.image_url,
              collection: r.collection, isTrending: r.is_trending,
            }));
            return new Response(JSON.stringify(mapped), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // V3 product import API (one-time use)
        if (pathname === "/api/import-v3" && req.method === "POST") {
          try {
            const { runImport } = await import("./src/lib/import-v3.ts");
            const result = await runImport();
            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // ── Search API ──
        if (pathname === "/api/search" && req.method === "GET") {
          try {
            const url = new URL(req.url);
            const q = url.searchParams.get("q") || "";
            const room = url.searchParams.get("room") || undefined;
            const style = url.searchParams.get("style") || undefined;
            const productType = url.searchParams.get("productType") || undefined;
            const material = url.searchParams.get("material") || undefined;
            const color = url.searchParams.get("color") || undefined;
            const mood = url.searchParams.get("mood") || undefined;
            const minPrice = url.searchParams.get("minPrice");
            const maxPrice = url.searchParams.get("maxPrice");
            const sort = url.searchParams.get("sort");
            const limit = parseInt(url.searchParams.get("limit") || "12", 10);
            const offset = parseInt(url.searchParams.get("offset") || "0", 10);

            const { searchProducts } = await import("./src/lib/intelligence");
            const filters: any = { isActive: true };
            if (room) filters.room = room;
            if (style) filters.style = style;
            if (productType) filters.productType = productType;
            if (material) filters.material = material;
            if (color) filters.color = color;
            if (mood) filters.mood = mood;
            if (minPrice) filters.minPrice = parseFloat(minPrice);
            if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
            if (sort === "price") filters.orderBy = "price";
            else if (sort === "rating") filters.orderBy = "rating";
            else if (sort === "newest") filters.orderBy = "created_at";
            else if (sort === "name") filters.orderBy = "name";

            const result = await searchProducts(q, filters, limit, offset);
            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Subscriber signup API
        if (pathname === "/api/subscribe" && req.method === "POST") {
          try {
            const body = await req.json();
            const { handleSubscribe } = await import("./src/lib/subscribers");
            const result = await handleSubscribe(body);
            return new Response(JSON.stringify(result), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ success: false, error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Subscriber list API (admin)
        if (pathname === "/api/subscribers" && req.method === "GET") {
          try {
            const { handleGetSubscribers } = await import("./src/lib/subscribers");
            const subscribers = await handleGetSubscribers();
            return new Response(JSON.stringify(subscribers), {
              headers: { "Content-Type": "application/json" },
            });
          } catch (err: any) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        return (
          handler as { fetch: (r: Request) => Response | Promise<Response> }
        ).fetch(req);
      },
    });
    break;
  } catch (err) {
    if (attempt >= 10) throw err;
    await Bun.sleep(200);
  }
}

console.log(`team-site serving on http://${HOST}:${String(PORT)}`);
