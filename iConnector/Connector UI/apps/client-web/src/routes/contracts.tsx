import { createFileRoute } from "@tanstack/react-router";
import Contracts from "@/features/contracts/Contracts.tsx";

export const Route = createFileRoute("/contracts")({
  component: Contracts,
});
