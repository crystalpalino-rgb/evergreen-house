import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for the private /admin area.
//
// It only passes through: the dashboard, the subscriber list and the sign in
// page each render their own full page shell. The auth check lives in each
// page's beforeLoad, not here, because the sign in page has to stay reachable
// while signed out.
export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
