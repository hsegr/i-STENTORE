import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield,
  LogIn,
  Workflow,
  ClipboardList,
  CheckCircle2,
  Users,
  ClipboardCheck,
  KeyRound,
  ShieldOff,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, isLoading, activeNavigator, isAdmin, login } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !activeNavigator) {
      void login();
    }
  }, [activeNavigator, isAuthenticated, isLoading, login]);

  if (isAuthenticated) {
    return (
      <div className="bg-gradient-secondary min-h-screen p-6">
        <div className="mx-auto grid w-full max-w-6xl gap-4 pt-8 md:grid-cols-6">
          <Card className="md:col-span-4">
            <CardHeader className="items-center text-center">
              <div className="mb-2 flex items-center justify-center gap-3">
                <div className="bg-gradient-primary shadow-glow flex size-10 items-center justify-center rounded-lg">
                  <Shield className="size-5 text-primary-foreground" />
                </div>
                <Badge variant="outline">{isAdmin ? "Administrator" : "Participant"}</Badge>
              </div>
              <CardTitle className="text-3xl leading-tight">
                {isAdmin ? "Governance and Onboarding Console" : "Welcome to the DataSpace Onboarding Console"}
              </CardTitle>
              <CardDescription className="text-base">
                {isAdmin
                  ? "Approve participant admission, issue VCs and operate governance lifecycle workflows from one console."
                  : "Follow guided onboarding with minimal manual input and produce connector-ready outputs for deployment."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-1">
              {isAdmin ? (
                <>
                  <Button asChild variant="outline">
                    <Link to="/admin/incoming">
                      <Users className="mr-2 size-4" />
                      Participant Admission
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/resolved">
                      <ClipboardCheck className="mr-2 size-4" />
                      Governance Lifecycle
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/credentials">
                      <KeyRound className="mr-2 size-4" />
                      VC Issuance
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/admin/revoke">
                      <ShieldOff className="mr-2 size-4" />
                      VC Revocation
                    </Link>
                  </Button>
                  <div className="basis-full" />
                  <Button asChild variant="ghost">
                    <Link to="/wizard">
                      <Workflow className="mr-2 size-4" />
                      Start Onboarding
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/status/requests">
                      <ClipboardList className="mr-2 size-4" />
                      My Requests
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/status/credentials">
                      <ClipboardList className="mr-2 size-4" />
                      My Credentials
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link to="/wizard">
                      <Workflow className="mr-2 size-4" />
                      Start Onboarding
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/status/requests">
                      <ClipboardList className="mr-2 size-4" />
                      My Requests
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/status/credentials">
                      <ClipboardList className="mr-2 size-4" />
                      My Credentials
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">At a glance</CardTitle>
              <CardDescription>Core capabilities available in this portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {isAdmin ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Review incoming participant admission requests and accept or reject with explicit reasons.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Operate lifecycle governance actions: renew, revoke, overturn accepted requests, and clean up rejected ones.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Issue, reject, revoke, and remove verifiable credentials while keeping a controlled issuer workflow.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Guided identity bootstrap with Ed25519 verification keys, wallet and DID generation.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Per-user request tracking and audit visibility.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
                    <p>Request and track W3C verifiable credentials issued by trusted data space issuers.</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-secondary min-h-screen p-6">
      <div className="mx-auto grid w-full max-w-3xl place-items-center pt-12">
        <Card className="w-full max-w-xl">
          <CardHeader className="text-center">
            <div className="bg-gradient-primary shadow-glow mx-auto mb-2 flex size-12 items-center justify-center rounded-lg">
              <Shield className="size-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl">DataSpace Onboarding</CardTitle>
            <CardDescription>Redirecting to Keycloak sign-in.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => login()} className="w-full">
              <LogIn className="mr-2 size-4" />
              Sign In Manually
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
