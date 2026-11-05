import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { adminLogin, getAdminSession } from "~/lib/admin-fns";

/** Only ever send the browser back to a path on this site. */
function safeRedirect(target: string | undefined): string {
  if (!target) return "/admin";
  if (!target.startsWith("/") || target.startsWith("//")) return "/admin";
  if (target.startsWith("/admin/login")) return "/admin";
  return target;
}

export const Route = createFileRoute("/admin/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const session = await getAdminSession();
    if (session.authenticated) {
      throw redirect({ to: safeRedirect(search.redirect) as "/admin" });
    }
    return { configured: session.configured };
  },
  head: () => ({
    meta: [
      { title: "Sign in | Evergreen House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const { redirect: redirectTo } = Route.useSearch();
  const { configured } = Route.useRouteContext();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await adminLogin({ data: { password } });
      if (result.ok) {
        window.location.assign(safeRedirect(redirectTo));
        return;
      }
      if (result.reason === "unavailable") {
        setMessage("Sign in is not set up yet.");
      } else if (result.reason === "rate_limited") {
        setMessage("Too many attempts. Please try again in 15 minutes.");
      } else {
        setMessage("That password is not right.");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
    setBusy(false);
    setPassword("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <p className="font-serif text-2xl text-midnight sm:text-3xl">Evergreen House</p>
            <div className="mx-auto mt-4 h-px w-16 bg-antique-gold" />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.25em] text-burgundy">
              Studio access
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-beige/40 bg-soft-white px-5 py-7 shadow-sm sm:px-7"
          >
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-warm-gray"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-beige/60 bg-white px-4 py-3 text-base text-midnight outline-none focus:border-burgundy focus:ring-2 focus:ring-antique-gold/40"
              placeholder="Enter your password"
            />

            {message && (
              <p role="alert" className="mt-3 text-sm text-burgundy">
                {message}
              </p>
            )}

            {!configured && (
              <p className="mt-3 text-sm text-warm-gray">
                Admin sign in has not been set up on this site yet.
              </p>
            )}

            <button
              type="submit"
              disabled={busy || password.length === 0}
              className="mt-6 w-full rounded-lg bg-midnight px-4 py-3.5 text-base font-medium text-soft-white transition hover:bg-midnight-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Signing in" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-taupe">
            Private area. Nothing here is part of the public site.
          </p>
        </div>
      </main>
    </div>
  );
}
