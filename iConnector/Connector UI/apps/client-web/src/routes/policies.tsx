import { createFileRoute } from "@tanstack/react-router";
import Policies from "@/features/policies/Policies.tsx";

export const Route = createFileRoute("/policies")({
  component: Policies,
});
