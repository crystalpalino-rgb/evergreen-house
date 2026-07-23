import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import { ThirdPartyScripts } from "~/components/ThirdPartyScripts";
import { getOrganizationSchema, getWebSiteSchema, SITE_URL } from "~/lib/schema";

const SITE_NAME = "Evergreen House";
const SITE_TAGLINE = "Beautiful Things That Never Go Out of Style";
const SITE_DESCRIPTION =
  "Thoughtfully curated home collections to help you create a timeless home.";
const OG_IMAGE_URL = `${SITE_URL}/og-image.jpg`;

// ── JSON-LD Structured Data ──
const jsonLdScript = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@graph": [
      getWebSiteSchema(`${SITE_URL}/search`),
      getOrganizationSchema(),
    ],
  },
  null,
  0,
);

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      {
        title: `${SITE_NAME}, ${SITE_TAGLINE}`,
      },
      {
        name: "description",
        content: SITE_DESCRIPTION,
      },
      // Open Graph
      { property: "og:title", content: SITE_NAME },
      {
        property: "og:description",
        content: SITE_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_NAME },
      {
        name: "twitter:description",
        content: SITE_DESCRIPTION,
      },
      { name: "twitter:image", content: OG_IMAGE_URL },
      { name: "twitter:site", content: "@evergreenhouse" },
      // Pinterest claim
      {
        name: "p:domain_verify",
        content: "cc54cdb622bd077fb5700333599cbb92",
      },
    ],
    links: [
      // NOTE: canonical is set per-route now. Each route should include its own
      // canonical link in its head export. The root canonical is a fallback.
      { rel: "canonical", href: SITE_URL },
      { rel: "stylesheet", href: appCss },
      // Preconnect for Google Fonts (before the stylesheet)
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      // Preload LCP hero image for homepage (above-the-fold background image)
      {
        rel: "preload",
        as: "image",
        href: "/images/living-room.jpg",
        fetchpriority: "high",
      },
    ],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* JSON-LD structured data — rendered inline in <head> for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
        />
        {/* Pinterest noscript fallback — stays in <head> for non-JS users */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://ct.pinterest.com/v3/?event=init&tid=2612894533915&noscript=1"
          />
        </noscript>
      </head>
      <body className="min-h-screen bg-cream">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WCVMWDLG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Third-party scripts (GTM + Pinterest) loaded client-side after hydration */}
        <ThirdPartyScripts />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
