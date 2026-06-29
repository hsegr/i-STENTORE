import { createFileRoute } from "@tanstack/react-router";
import NotFound from "@/features/NotFound.tsx";

export const Route = createFileRoute("/$")({
  component: NotFound,
});
