import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onNext?: () => void;
  onPrevious?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  title: string;
  subtitle?: string;
}

export const OnboardingLayout = ({
  children,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canGoNext = true,
  canGoPrevious = true,
  nextLabel = "Continue",
  previousLabel = "Previous",
  title,
  subtitle,
}: OnboardingLayoutProps) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-gradient-secondary flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-primary bg-clip-text text-2xl font-bold text-transparent">
                DataSpace Onboarding
              </h1>
              <p className="text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <div className="w-48">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-3xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="mx-auto max-w-4xl px-6">
          <div className="shadow-elegant rounded-lg border border-border bg-card p-8">{children}</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card p-6">
        <div className="mx-auto flex max-w-4xl justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious || currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="size-4" />
            {previousLabel}
          </Button>

          <Button
            variant="outline"
            onClick={onNext}
            disabled={!canGoNext}
            className="bg-gradient-primary hover:shadow-glow transition-smooth flex items-center gap-2 text-foreground"
          >
            {nextLabel}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};
