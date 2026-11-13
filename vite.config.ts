import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * /ads.txt in the dev server, mirroring what serve.ts does in production: the
 * publisher ID saved in /admin/ads, and a 404 with an empty body while it is
 * empty. Without this the working site would answer /ads.txt from the router
 * and the owner could not see the file she just switched on.
 */
function adsTxtDevRoute(): Plugin {
  return {
    name: "ads-txt-dev-route",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url || "").split("?")[0];
        if (path !== "/ads.txt") return next();
        void (async () => {
          try {
            const mod = await server.ssrLoadModule("/src/lib/site-settings.ts");
            const response: Response = await mod.handleAdsTxt();
            const body = await response.text();
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(body);
          } catch {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end("");
          }
        })();
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    // The site is reverse-proxied behind <label>.<PUBLIC_SITE_DOMAIN>; the proxy
    // masks the Host to localhost:3000, but accept any host so a dev server never
    // rejects a proxied request with "Blocked request".
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    viteReact(),
    adsTxtDevRoute(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Split all third-party code into a single vendor chunk.
        // TanStack Router already code-splits routes automatically.
        // This keeps the main entry chunk small and makes vendor code
        // highly cacheable across deployments.
        manualChunks(id) {
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
