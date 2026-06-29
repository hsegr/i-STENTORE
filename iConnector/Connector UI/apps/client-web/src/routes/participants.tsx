import { createFileRoute } from "@tanstack/react-router";
import Participants from "@/features/participants/Participants.tsx";

export const Route = createFileRoute("/participants")({
  component: Participants,
});
