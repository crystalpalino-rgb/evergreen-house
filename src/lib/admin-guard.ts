// Route level guard for the private pages.
//
// This is UX, not the security boundary: it sends a browser without a valid
// session to the sign in page instead of rendering an empty dashboard. The real
// gate is the adminOnly middleware on every server function the page calls.

import { redirect } from "@tanstack/react-router";
import { getAdminSession } from "./admin-fns";

export async function requireAdmin(location: { href: string }) {
  const session = await getAdminSession();
  if (!session.authenticated) {
    throw redirect({
      to: "/admin/login",
      search: { redirect: location.href },
    });
  }
  return session;
}
