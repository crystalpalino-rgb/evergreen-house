import { useState } from "react";
import { adminLogout } from "~/lib/admin-fns";

/** Small sign out control for the private admin pages. */
export function AdminSignOut({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await adminLogout();
    } catch {
      // Clearing the cookie is best effort; the redirect below still happens.
    }
    window.location.assign("/admin/login");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`rounded-lg border border-beige/50 bg-white px-3 py-2 text-sm text-warm-gray transition hover:border-burgundy hover:text-burgundy disabled:opacity-50 ${className}`}
    >
      {busy ? "Signing out" : "Sign out"}
    </button>
  );
}
