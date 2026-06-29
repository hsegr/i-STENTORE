import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({
  component: () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">Analytics page coming soon...</p>
    </div>
  ),
});
