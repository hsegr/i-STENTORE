import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
    if (!context.auth.isAdmin) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  return <Outlet />;
}
