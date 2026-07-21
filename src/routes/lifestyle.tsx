import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const Route = createFileRoute("/lifestyle")({
  component: LifestyleLayout,
});

function LifestyleLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
