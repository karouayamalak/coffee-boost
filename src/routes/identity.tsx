import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/identity")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
