// Admin authentication primitives for Evergreen House.
//
// SERVER ONLY. This module reads process.env and uses node:crypto, so it is
// imported by server functions, by the Bun serve.ts middleware and by scripts.
// It must never be imported by a component that renders in the browser.
//
// Design rules (owner decision, 2026-11-05):
//  - Fail closed. If ADMIN_PASSWORD or ADMIN_SESSION_SECRET is missing, nothing
//    authenticates and every gated page and endpoint stays closed.
//  - Constant time password comparison over SHA-256 digests. No length check,
//    no early return.
//  - Stateless signed session cookie: issuedAt plus an HMAC of issuedAt.
//  - 5 failed sign-in attempts per IP per 15 minutes, held in memory.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "eh_admin";

/** 7 days, in seconds (cookie max age) and milliseconds (session lifetime). */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_FAILURES = 5;
/** Guard the in-memory map against unbounded growth from junk IPs. */
const RATE_LIMIT_MAX_TRACKED_IPS = 5000;

export interface AdminConfig {
  password: string;
  secret: string;
}

/**
 * Read the two admin secrets from the environment. Returns null when either is
 * missing or blank, which is the fail-closed state: no login, no session, no
 * admin data.
 */
export function readAdminConfig(): AdminConfig | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (typeof password !== "string" || typeof secret !== "string") return null;
  if (password.trim() === "" || secret.trim() === "") return null;
  return { password, secret };
}

/** True only when both secrets are present. */
export function isAdminConfigured(): boolean {
  return readAdminConfig() !== null;
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Constant time comparison of two strings, via their SHA-256 digests so both
 * sides are always 32 bytes. timingSafeEqual never sees a length difference and
 * nothing returns early.
 */
function digestsMatch(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** Constant time password check. */
export function verifyPassword(candidate: string, expected: string): boolean {
  return digestsMatch(candidate, expected);
}

function signIssuedAt(secret: string, issuedAt: number): string {
  return createHmac("sha256", secret).update(String(issuedAt)).digest("hex");
}

/** Build a fresh session cookie value: "<issuedAt>.<hmac>". */
export function createSessionValue(secret: string, now: number = Date.now()): string {
  return `${now}.${signIssuedAt(secret, now)}`;
}

/**
 * Verify a session cookie value statelessly: signature must match and the
 * session must be younger than 7 days. A missing, tampered or expired value is
 * simply false.
 */
export function verifySessionValue(
  value: string | undefined | null,
  secret: string,
  now: number = Date.now(),
): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const issuedAtRaw = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  if (!/^[0-9]{1,15}$/.test(issuedAtRaw)) return false;
  if (signature === "") return false;
  const issuedAt = Number(issuedAtRaw);
  const age = now - issuedAt;
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_MS) return false;
  return digestsMatch(signature, signIssuedAt(secret, issuedAt));
}

/** Pull one cookie value out of a raw Cookie header. */
export function readCookieValue(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/**
 * The single check used outside TanStack Start (serve.ts, scripts): is this raw
 * Cookie header carrying a valid admin session, with the secrets configured?
 */
export function isAuthenticatedCookieHeader(
  cookieHeader: string | null,
  now: number = Date.now(),
): boolean {
  const config = readAdminConfig();
  if (!config) return false;
  return verifySessionValue(readCookieValue(cookieHeader, ADMIN_COOKIE), config.secret, now);
}

// ── Failed attempt rate limiting (in memory, per process) ──
const failedAttempts = new Map<string, number[]>();

function recentFailures(timestamps: number[] | undefined, now: number): number[] {
  if (!timestamps) return [];
  return timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
}

/** True when this IP has used up its 5 attempts in the current 15 minutes. */
export function isRateLimited(ip: string, now: number = Date.now()): boolean {
  const recent = recentFailures(failedAttempts.get(ip), now);
  if (recent.length === 0) {
    failedAttempts.delete(ip);
    return false;
  }
  failedAttempts.set(ip, recent);
  return recent.length >= RATE_LIMIT_MAX_FAILURES;
}

/** Record one failed attempt against an IP. */
export function recordFailure(ip: string, now: number = Date.now()): void {
  if (failedAttempts.size >= RATE_LIMIT_MAX_TRACKED_IPS) {
    for (const [key, value] of failedAttempts) {
      if (recentFailures(value, now).length === 0) failedAttempts.delete(key);
    }
    // Still full of live entries: drop the oldest key rather than grow forever.
    if (failedAttempts.size >= RATE_LIMIT_MAX_TRACKED_IPS) {
      const oldest = failedAttempts.keys().next();
      if (!oldest.done) failedAttempts.delete(oldest.value);
    }
  }
  const recent = recentFailures(failedAttempts.get(ip), now);
  recent.push(now);
  failedAttempts.set(ip, recent);
}

/** Clear an IP's failures after a successful sign-in. */
export function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

/** How many attempts an IP has left in the current window (for messages). */
export function remainingAttempts(ip: string, now: number = Date.now()): number {
  const used = recentFailures(failedAttempts.get(ip), now).length;
  return Math.max(0, RATE_LIMIT_MAX_FAILURES - used);
}

/** Test helper: forget every tracked IP. */
export function resetRateLimits(): void {
  failedAttempts.clear();
}
