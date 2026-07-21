import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}
