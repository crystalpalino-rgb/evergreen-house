import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tiktok-content")({
  loader: () => {
    throw redirect({
      to: "/tiktok-content.html",
      statusCode: 302,
    });
  },
});
