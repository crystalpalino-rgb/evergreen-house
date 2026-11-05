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
