import { createFileRoute, redirect } from "@tanstack/react-router";
import { WizardPage } from "@/features/wizard/components/WizardPage";

export const Route = createFileRoute("/wizard")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: WizardPage,
});
