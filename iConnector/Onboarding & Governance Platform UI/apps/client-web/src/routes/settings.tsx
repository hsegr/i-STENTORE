import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { getOrganisationSettings, saveOrganisationSettings } from "@/lib/settings";
import { getTrustedIssuerDirectory } from "@/lib/verifiableCredentials";

export const Route = createFileRoute("/settings")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const accountId = (user?.profile?.email || user?.profile?.preferred_username || "").toString();
  const [settings, setSettings] = useState(() => getOrganisationSettings(accountId));
  const [issuerDirectory, setIssuerDirectory] = useState<Array<{ did: string; organizationName: string }>>([]);
  const [issuerDirectoryLoaded, setIssuerDirectoryLoaded] = useState(false);
  const normalizedDid = settings.did.trim().toLowerCase();
  const isTrustedIssuer =
    normalizedDid.length > 0 &&
    issuerDirectory.some((issuer) => issuer.did.trim().toLowerCase() === normalizedDid);

  useEffect(() => {
    let cancelled = false;

    async function loadIssuerDirectory() {
      try {
        const nextDirectory = await getTrustedIssuerDirectory();
        if (!cancelled) {
          setIssuerDirectory(nextDirectory);
          setIssuerDirectoryLoaded(true);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setIssuerDirectoryLoaded(false);
        const description = error instanceof Error ? error.message : "Could not load trusted issuer directory.";
        toast.error("Settings data unavailable", { description });
      }
    }

    void loadIssuerDirectory();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field: keyof typeof settings, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const onSave = () => {
    saveOrganisationSettings(settings);
    toast.success("Settings saved", {
      description: "Your organisation profile and DID were updated locally.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">Manage your organisation profile and DID used in onboarding and VC flows.</p>
          </div>
          <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Trusted issuer/admin" : "Participant"}</Badge>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Organisation Profile</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-org-name">Organisation name</Label>
            <Input
              id="settings-org-name"
              value={settings.organizationName}
              onChange={(event) => updateField("organizationName", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-contact">Contact email</Label>
            <Input
              id="settings-contact"
              type="email"
              value={settings.contactEmail}
              onChange={(event) => updateField("contactEmail", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-website">Website</Label>
            <Input
              id="settings-website"
              value={settings.website}
              onChange={(event) => updateField("website", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-country">Country / jurisdiction</Label>
            <Input
              id="settings-country"
              value={settings.country}
              onChange={(event) => updateField("country", event.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="settings-did">Organisation DID</Label>
            <Input
              id="settings-did"
              className="font-mono text-xs"
              value={settings.did}
              onChange={(event) => updateField("did", event.target.value)}
            />
          </div>
        </div>
        <Button onClick={onSave}>Save settings</Button>
      </Card>

      {isAdmin ? (
        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold">Trusted Issuer Signing</h2>
          <p className="text-sm text-muted-foreground">
            Your private signing key is requested only when signing a VC. It is not stored in settings.
          </p>
          <div className="rounded border bg-muted/40 p-3 text-sm">
            <div className="font-medium">Issuer DID status</div>
            <div className="mt-1 font-mono text-xs break-all">{settings.did || "No DID configured"}</div>
            {!issuerDirectoryLoaded ? (
              <Badge className="mt-2" variant="outline">
                Trusted issuer directory unavailable
              </Badge>
            ) : (
              <Badge className="mt-2" variant={isTrustedIssuer ? "default" : "destructive"}>
                {isTrustedIssuer ? "DID is in trusted issuer directory" : "DID is not in trusted issuer directory"}
              </Badge>
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
