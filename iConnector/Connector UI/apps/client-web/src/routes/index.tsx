import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/features/Dashboard.tsx";

export const Route = createFileRoute("/")({
  component: Dashboard,
});
