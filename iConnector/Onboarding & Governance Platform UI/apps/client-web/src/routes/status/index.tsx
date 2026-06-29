import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/status/")({
  beforeLoad: () => {
    throw redirect({ to: "/status/requests" });
  },
  component: StatusRedirectPage,
});

function StatusRedirectPage() {
  return null;
}

