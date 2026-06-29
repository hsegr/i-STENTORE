import { createFileRoute } from "@tanstack/react-router";
import Assets from "@/features/assets/Assets.tsx";

export const Route = createFileRoute("/assets")({
  component: Assets,
});
