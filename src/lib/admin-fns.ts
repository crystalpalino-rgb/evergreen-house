// Admin session server functions and the adminOnly middleware.
//
// Every authenticated server function in the site must carry `.middleware([adminOnly])`
// so that a direct POST to the server function endpoint is rejected before any
// data is read. A route beforeLoad is UX only and is not a security boundary.

import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, getRequestIP, setCookie } from "@tanstack/react-start/server";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  clearFailures,
  createSessionValue,
  isRateLimited,
  readAdminConfig,
  recordFailure,
  verifyPassword,
  verifySessionValue,
} from "./admin-auth";
import { handleGetSubscribers, type Subscriber } from "./subscribers";
import { parseHeadSnippet, type HeadSnippetResult } from "./head-snippet";
import {
  ADS_PUBLISHER_KEY,
  HEAD_HTML_KEY,
  adsTxtBody,
  normalizePublisherId,
  readAdsSettings,
  writeAdsSetting,
} from "./site-settings";

export interface AdminSessionState {
  /** Are both admin secrets present in the environment? */
  configured: boolean;
  /** Does this request carry a valid, unexpired admin session cookie? */
  authenticated: boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "rate_limited" | "invalid" };

/**
 * The single gate. Reads the secrets, then verifies the session cookie
 * statelessly. Missing secrets means deny, always.
 */
export const adminOnly = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const config = readAdminConfig();
  if (!config) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  const session = getCookie(ADMIN_COOKIE);
  if (!verifySessionValue(session, config.secret)) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return next();
});

/**
 * Session state for route beforeLoad checks. Returns no data beyond two
 * booleans, so it is safe to answer without a session.
 */
export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminSessionState> => {
    const config = readAdminConfig();
    if (!config) return { configured: false, authenticated: false };
    const session = getCookie(ADMIN_COOKIE);
    return { configured: true, authenticated: verifySessionValue(session, config.secret) };
  },
);

/** Sign in with the admin password. Sets the signed session cookie on success. */
export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { password?: unknown }) => ({
    password: typeof data?.password === "string" ? data.password : "",
  }))
  .handler(async ({ data }): Promise<LoginResult> => {
    const config = readAdminConfig();
    if (!config) return { ok: false, reason: "unavailable" };

    const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    if (isRateLimited(ip)) return { ok: false, reason: "rate_limited" };

    if (!verifyPassword(data.password, config.password)) {
      recordFailure(ip);
      return { ok: false, reason: "invalid" };
    }

    clearFailures(ip);
    setCookie(ADMIN_COOKIE, createSessionValue(config.secret), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return { ok: true };
  });

/** Sign out: clear the cookie. Never reveals whether a session existed. */
export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(ADMIN_COOKIE, { path: "/" });
  return { ok: true };
});

/** The subscriber list, only for a signed in admin. */
export const getSubscriberList = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .handler(async (): Promise<Subscriber[]> => {
    return handleGetSubscribers();
  });

// ── Ad readiness: the head injection point and ads.txt ──
//
// Two owner rules govern this screen:
//  1. She must be able to see exactly what is currently injected, so the state
//     read below returns the stored paste AND the exact HTML the head renders.
//  2. A bad paste must not be able to take the site down, so a paste that does
//     not parse is refused here, and the render path parses it again and
//     injects nothing if it fails. Empty always means "inject nothing".

export interface AdsAdminState {
  /** The snippet exactly as saved. */
  headHtml: string;
  /** What the head would render from it right now. */
  headParsed: HeadSnippetResult;
  /** The ads.txt publisher ID exactly as saved. */
  publisherId: string;
  /** The exact line /ads.txt serves, or "" when nothing is served. */
  adsTxtLine: string;
  /** ISO timestamp of the last save, or null. */
  updatedAt: string | null;
  /** False when the settings table could not be read at all. */
  readable: boolean;
  /** Plain sentence describing a read failure, or null. */
  error: string | null;
}

export type SaveAdsResult =
  | { ok: true; warnings: string[] }
  | { ok: false; reason: string };

/** Read the ad settings for the admin screen. */
export const getAdsAdminState = createServerFn({ method: "GET" })
  .middleware([adminOnly])
  .handler(async (): Promise<AdsAdminState> => {
    try {
      const settings = await readAdsSettings();
      return {
        headHtml: settings.headHtml,
        headParsed: parseHeadSnippet(settings.headHtml),
        publisherId: settings.publisherId,
        adsTxtLine: adsTxtBody(settings.publisherId),
        updatedAt: settings.updatedAt,
        readable: true,
        error: null,
      };
    } catch (err) {
      return {
        headHtml: "",
        headParsed: parseHeadSnippet(""),
        publisherId: "",
        adsTxtLine: "",
        updatedAt: null,
        readable: false,
        error: err instanceof Error ? err.message : "The settings could not be read.",
      };
    }
  });

/**
 * Save both values together, all or nothing. A snippet that does not parse and
 * a publisher ID that is not pub-<16 digits> are both refused before anything
 * is written, and the refusal says why in plain words.
 */
export const saveAdsAdminState = createServerFn({ method: "POST" })
  .middleware([adminOnly])
  .validator((data: { headHtml?: unknown; publisherId?: unknown }) => ({
    headHtml: typeof data?.headHtml === "string" ? data.headHtml : "",
    publisherId: typeof data?.publisherId === "string" ? data.publisherId : "",
  }))
  .handler(async ({ data }): Promise<SaveAdsResult> => {
    const rawHead = data.headHtml.trim() ? data.headHtml : "";
    const parsed = parseHeadSnippet(rawHead);

    if (rawHead.trim() && !parsed.ok) {
      return {
        ok: false,
        reason:
          parsed.problems[0] ??
          "That snippet could not be read, so nothing was saved and nothing changed on the site.",
      };
    }

    const rawId = data.publisherId.trim();
    const publisherId = normalizePublisherId(rawId);
    if (rawId && !publisherId) {
      return {
        ok: false,
        reason:
          "The ads.txt publisher ID has to look like pub-1234567890123456 (16 digits). Nothing was saved.",
      };
    }

    try {
      await writeAdsSetting(HEAD_HTML_KEY, rawHead);
      await writeAdsSetting(ADS_PUBLISHER_KEY, publisherId);
    } catch (err) {
      return {
        ok: false,
        reason: `The settings could not be written: ${
          err instanceof Error ? err.message : "unknown database error"
        }. Nothing changed on the site.`,
      };
    }

    return { ok: true, warnings: parsed.ok ? parsed.problems : [] };
  });
