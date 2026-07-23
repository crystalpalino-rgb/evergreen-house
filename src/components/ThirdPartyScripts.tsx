import { useEffect } from "react";

/**
 * Third-party tracking scripts loaded client-side after hydration.
 * GTM loads immediately; Pinterest is deferred via requestIdleCallback
 * so it never blocks page render.
 */
export function ThirdPartyScripts() {
  useEffect(() => {
    // ── Google Tag Manager ──
    // GTM's own snippet already creates an async <script> for the external
    // loader; we just need to bootstrap it after hydration so the inline
    // setup doesn't block the initial HTML parse.
    (function (w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s);
      const dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-WCVMWDLG");

    // ── Pinterest Tag ──
    // Pinterest is tracking-only; defer it to idle so it never competes
    // with rendering or interaction.
    const loadPinterest = () => {
      if (!(window as any).pintrk) {
        (window as any).pintrk = function () {
          ((window as any).pintrk.queue =
            (window as any).pintrk.queue || []).push(
            Array.prototype.slice.call(arguments),
          );
        };
        const n = (window as any).pintrk;
        n.queue = [];
        n.version = "3.0";
        const t = document.createElement("script");
        t.async = true;
        t.src = "https://s.pinimg.com/ct/core.js";
        const r = document.getElementsByTagName("script")[0];
        if (r && r.parentNode) r.parentNode.insertBefore(t, r);
        n("load", "2612894533915");
        n("page");
      }
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(loadPinterest, { timeout: 3000 });
    } else {
      setTimeout(loadPinterest, 100);
    }
  }, []);

  return null;
}
