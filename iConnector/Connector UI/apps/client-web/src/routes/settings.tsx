import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/features/Settings.tsx";

export const Route = createFileRoute("/settings")({
  component: Settings,
});
