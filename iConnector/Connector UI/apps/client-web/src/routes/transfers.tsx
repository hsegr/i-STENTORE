import { createFileRoute } from "@tanstack/react-router";
import Transfers from "@/features/transfers/Transfers.tsx";

export const Route = createFileRoute("/transfers")({
  component: Transfers,
});
