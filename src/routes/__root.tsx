import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";

const SITE_URL = "https://evergreenhouse.co";
const SITE_NAME = "Evergreen House";
const SITE_TAGLINE = "Beautiful Things That Never Go Out of Style";
const SITE_DESCRIPTION =
  "Thoughtfully curated home collections to help you create a timeless home.";
const OG_IMAGE_URL = `${SITE_URL}/og-image.jpg`;

// ── JSON-LD Structured Data ──
const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [],
};

const jsonLdScript = JSON.stringify(
  {
    "@context": "https://schema.org",
    "@graph": [jsonLdWebsite, jsonLdOrganization],
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
      // Pinterest claim (replace with real verification code when setup)
      {
        name: "p:domain_verify",
        content: "cc54cdb622bd077fb5700333599cbb92",
      },
      // Canonical
      { property: "og:see_also", content: SITE_URL },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "stylesheet", href: appCss },
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WCVMWDLG');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/* JSON-LD structured data — rendered inline in <head> */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
        />
        {/* Pinterest Tag — base code for all pages */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(e){if(!window.pintrk){window.pintrk = function () {
window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
  n=window.pintrk;n.queue=[],n.version="3.0";var
  t=document.createElement("script");t.async=!0,t.src=e;var
  r=document.getElementsByTagName("script")[0];
  r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
pintrk('load', '2612894533915');
pintrk('page');`,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://ct.pinterest.com/v3/?event=init&tid=2612894533915&noscript=1"
          />
        </noscript>
        {/* end Pinterest Tag */}
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
        {children}
        <Scripts />
      </body>
    </html>
  );
}
