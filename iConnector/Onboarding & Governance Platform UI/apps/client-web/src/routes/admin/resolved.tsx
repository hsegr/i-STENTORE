import { createFileRoute } from "@tanstack/react-router";
import { ResolvedRequests } from "@/components/admin/ResolvedRequests";

export const Route = createFileRoute("/admin/resolved")({
  component: ResolvedRequestsPage,
});

function ResolvedRequestsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <ResolvedRequests />
    </div>
  );
}
