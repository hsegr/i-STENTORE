import { CheckCircle2, Shield, Users, Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const OnboardingSuccess = () => {
  return (
    <div className="bg-gradient-secondary flex min-h-screen items-center justify-center p-6">
      <div className="mx-auto max-w-2xl space-y-8 text-center">
        {/* Success Icon */}
        <div className="bg-gradient-primary shadow-glow mx-auto flex size-24 items-center justify-center rounded-full">
          <CheckCircle2 className="size-12 text-primary-foreground" />
        </div>

        {/* Main Message */}
        <div>
          <h1 className="bg-gradient-primary mb-4 bg-clip-text text-4xl font-bold text-transparent">
            Onboarding Complete!
          </h1>
          <p className="text-xl text-muted-foreground">Your DataSpace identity has been successfully configured.</p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Wallet className="size-5 text-primary" />
              <span className="font-medium">Blockchain Wallet Created</span>
              <CheckCircle2 className="ml-auto size-4 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-primary" />
              <span className="font-medium">Ed25519 Verification Method Configured</span>
              <CheckCircle2 className="ml-auto size-4 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-primary" />
              <span className="font-medium">Attestators Selected</span>
              <CheckCircle2 className="ml-auto size-4 text-green-600" />
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Alert>
          <AlertDescription>
            <strong>What's Next:</strong> Your connector is now in a pending state awaiting approval from your selected
            attestators. You'll receive notifications once they approve your identity registration.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => window.location.reload()}>
            Setup Another Identity
          </Button>

          <Button
            variant="link"
            className="bg-gradient-primary hover:shadow-glow transition-smooth flex items-center gap-2"
          >
            View Dashboard
            <ExternalLink className="size-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground">
          <p>Need help? Contact our support team or check the documentation.</p>
        </div>
      </div>
    </div>
  );
};
