import { createFileRoute } from "@tanstack/react-router";
import { IncomingRequests } from "@/components/admin/IncomingRequests";

export const Route = createFileRoute("/admin/incoming")({
  component: IncomingRequestsPage,
});

function IncomingRequestsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <IncomingRequests />
    </div>
  );
}
