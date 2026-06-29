import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRevokedCredential, getAllIssuedCredentials, revokeIssuedCredential } from "@/lib/verifiableCredentials";

export const Route = createFileRoute("/admin/revoke")({
  component: AdminRevokePage,
});

function AdminRevokePage() {
  const { user } = useAuth();
  const adminId = (
    user?.profile?.email ||
    user?.profile?.preferred_username ||
    "trusted.issuer@dataspace.org"
  ).toString();
  const [updateTick, setUpdateTick] = useState(0);
  const [reasonByCredential, setReasonByCredential] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Awaited<ReturnType<typeof getAllIssuedCredentials>>>([]);
  const activeCredentials = credentials.filter((credential) => credential.status === "active");

  useEffect(() => {
    let cancelled = false;

    async function loadCredentials() {
      try {
        const nextCredentials = await getAllIssuedCredentials();
        if (!cancelled) {
          setCredentials(nextCredentials);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        const description = error instanceof Error ? error.message : "Could not load issued credentials.";
        toast.error("Credential registry unavailable", { description });
      }
    }

    void loadCredentials();

    return () => {
      cancelled = true;
    };
  }, [updateTick]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Verifiable Credential Revocation</h1>
        <p className="text-muted-foreground">
          Revoke issued credentials and expose their status as revoked so verifiers can fail validation checks.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{activeCredentials.length} active credentials</Badge>
          <Badge variant="secondary">{credentials.length - activeCredentials.length} revoked credentials</Badge>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Issued Credentials Registry</h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credentials available.</p>
        ) : (
          credentials.map((credential) => {
            const reasonValue = reasonByCredential[credential.id] ?? "No longer valid for requested business context.";
            return (
              <div key={credential.id} className="space-y-2 rounded border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{credential.credentialType}</div>
                    <div className="font-mono text-xs text-muted-foreground">{credential.id}</div>
                  </div>
                  <Badge variant={credential.status === "active" ? "default" : "destructive"}>
                    {credential.status}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Holder: {credential.holderOrganizationName || "Unknown org"} ({credential.holderId})
                </div>
                <div className="font-mono text-xs text-muted-foreground">Holder DID: {credential.holderDid}</div>
                <div className="font-mono text-xs text-muted-foreground">Issuer DID: {credential.issuerId}</div>
                <div className="text-xs text-muted-foreground">Issued at: {formatDate(credential.issuanceDate)}</div>
                {credential.revokedAt ? (
                  <div className="text-xs text-red-600">
                    Revoked at: {formatDate(credential.revokedAt)} by {credential.revokedBy || "issuer"}
                  </div>
                ) : null}
                {credential.revocationReason ? (
                  <div className="text-xs text-red-600">Reason: {credential.revocationReason}</div>
                ) : null}

                {credential.status === "active" ? (
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <div className="space-y-1">
                      <Label htmlFor={`reason-${credential.id}`}>Revocation reason</Label>
                      <Input
                        id={`reason-${credential.id}`}
                        value={reasonValue}
                        onChange={(event) =>
                          setReasonByCredential((prev) => ({
                            ...prev,
                            [credential.id]: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          await revokeIssuedCredential(credential.id, adminId, reasonValue);
                          setUpdateTick((value) => value + 1);
                        }}
                      >
                        Revoke VC
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={async () => {
                        await deleteRevokedCredential(credential.id);
                        setUpdateTick((value) => value + 1);
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Remove Revoked VC
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
