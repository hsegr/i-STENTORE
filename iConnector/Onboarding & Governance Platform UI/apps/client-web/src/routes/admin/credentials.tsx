import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  ADMIN_ISSUER_DID,
  ADMIN_ISSUER_ORGANIZATION_NAME,
  getIssuerOrganizationName,
  getPendingVcRequests,
  getTrustedIssuers,
  issueVcDirect,
  issueVcFromRequest,
  readPemFile,
  rejectVcRequest,
} from "@/lib/verifiableCredentials";
import { getOrganisationSettings } from "@/lib/settings";

export const Route = createFileRoute("/admin/credentials")({
  component: AdminCredentialsPage,
});

function AdminCredentialsPage() {
  const { user } = useAuth();
  const adminId = (user?.profile?.email || user?.profile?.preferred_username || "trusted.issuer@dataspace.org").toString();
  const issuerSettings = getOrganisationSettings(adminId);
  const issuerDid = issuerSettings.did || ADMIN_ISSUER_DID;
  const issuerOrganizationName = issuerSettings.organizationName || ADMIN_ISSUER_ORGANIZATION_NAME;
  const [updateTick, setUpdateTick] = useState(0);
  const [issuerPrivateKeyPem, setIssuerPrivateKeyPem] = useState("");
  const [trustedIssuerDids, setTrustedIssuerDids] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Awaited<ReturnType<typeof getPendingVcRequests>>>([]);
  const issuerDidTrusted = trustedIssuerDids.includes(issuerDid);
  const { register, handleSubmit } = useForm<{
    holderId: string;
    holderOrganizationName: string;
    holderDid: string;
    credentialType: string;
    claimsText: string;
  }>({
    defaultValues: {
      holderId: "",
      holderOrganizationName: "",
      holderDid: "",
      credentialType: "DataSpaceParticipationCredential",
      claimsText: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [issuerIds, requests] = await Promise.all([getTrustedIssuers(), getPendingVcRequests()]);
        if (cancelled) {
          return;
        }
        setTrustedIssuerDids(issuerIds);
        setPendingRequests(requests);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const description = error instanceof Error ? error.message : "Could not load VC admin data.";
        toast.error("Credential data unavailable", { description });
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [updateTick]);

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const onIssueDirect = async (data: {
    holderId: string;
    holderOrganizationName: string;
    holderDid: string;
    credentialType: string;
    claimsText: string;
  }) => {
    if (!data.holderId || !data.holderDid || !data.credentialType) {
      return;
    }
    try {
      if (!issuerDidTrusted) {
        toast.error("Issuer DID is not trusted", {
          description: "Configure a DID from the trusted issuer directory in Settings before signing.",
        });
        return;
      }
      if (!issuerPrivateKeyPem) {
        toast.error("Missing issuer private key", {
          description: "Upload the issuer Ed25519 private key PEM before signing.",
        });
        return;
      }
      await issueVcDirect({
        adminId,
        holderId: data.holderId,
        holderOrganizationName: data.holderOrganizationName,
        holderDid: data.holderDid,
        issuerId: issuerDid,
        issuerOrganizationName,
        issuerPrivateKeyPem,
        credentialType: data.credentialType,
        claims: parseClaims(data.claimsText),
      });
      setUpdateTick((value) => value + 1);
      toast.success("Credential issued", {
        description: "The signed VC is encrypted in backend delivery storage until the holder downloads it.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "The credential could not be signed.";
      toast.error("Credential signing failed", { description });
    }
  };

  const onPrivateKeyUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const pem = await readPemFile(file);
      setIssuerPrivateKeyPem(pem);
      toast.success("Issuer private key loaded", {
        description: "The key is held in memory for this signing session only.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "Could not read the selected PEM file.";
      toast.error("Private key upload failed", { description });
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Verifiable Credential Issuance</h1>
        <p className="text-muted-foreground">
          Trusted issuers/attestators can issue credentials from participant requests or issue directly when needed.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{pendingRequests.length} pending VC requests</Badge>
          <Badge variant={issuerDidTrusted ? "default" : "destructive"}>
            {issuerDidTrusted ? "trusted issuer DID" : "issuer DID not trusted"}
          </Badge>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Signing Identity</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Issuer Organisation</Label>
            <Input value={issuerOrganizationName} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Issuer DID</Label>
            <Input value={issuerDid} readOnly className="font-mono text-xs" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="issuer-private-key">Issuer Ed25519 private key PEM</Label>
            <Input id="issuer-private-key" type="file" accept=".pem,.key" onChange={onPrivateKeyUpload} />
            <p className="text-xs text-muted-foreground">
              The private key is used in the browser for signing and is not stored in settings or backend state.
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">Issue VC Without Request</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onIssueDirect)}>
          <div className="space-y-2">
            <Label htmlFor="direct-issuer">Issuer Organisation</Label>
            <Input id="direct-issuer" value={issuerOrganizationName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-issuer-did">Issuer DID</Label>
            <Input id="direct-issuer-did" value={issuerDid} readOnly className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-type">Credential type</Label>
            <Input id="direct-type" {...register("credentialType", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-holder-id">Participant Account ID</Label>
            <Input id="direct-holder-id" {...register("holderId", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-holder-org">Participant Organisation Name</Label>
            <Input id="direct-holder-org" {...register("holderOrganizationName", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="direct-holder-did">Participant DID</Label>
            <Input id="direct-holder-did" {...register("holderDid", { required: true })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="direct-claims">Claims (`key=value` per line)</Label>
            <Textarea id="direct-claims" rows={5} {...register("claimsText")} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Issue VC directly</Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Pending VC Requests</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending VC requests.</p>
        ) : (
          pendingRequests.map((request) => (
            <div key={request.id} className="space-y-2 rounded border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{request.credentialType}</div>
                  <div className="font-mono text-xs text-muted-foreground">{request.id}</div>
                </div>
                <Badge variant="outline">pending</Badge>
              </div>
              {request.requestSource === "unsigned_json" ? (
                <Badge variant="secondary">uploaded unsigned credential</Badge>
              ) : null}
              <div className="text-xs text-muted-foreground">
                Participant: {request.requesterOrganizationName || "Unknown org"} ({request.requesterId})
              </div>
              <div className="text-xs text-muted-foreground">Holder DID: {request.holderDid}</div>
              <div className="text-xs text-muted-foreground">
                Requested issuer organisation:{" "}
                {request.requestedIssuerOrganizationName || getIssuerOrganizationName(request.requestedIssuerId)}
              </div>
              <div className="font-mono text-xs text-muted-foreground">Requested issuer DID: {request.requestedIssuerId}</div>
              <div className="text-xs text-muted-foreground">
                Issuing authority: {issuerOrganizationName}
              </div>
              <div className="text-xs text-muted-foreground">Requested at: {formatDate(request.requestedAt)}</div>
              <p className="text-xs text-muted-foreground">{request.purpose}</p>
              {request.unsignedCredentialId || request.unsignedCredentialTypes?.length ? (
                <div className="rounded border bg-background p-2 text-xs">
                  <div className="font-medium">Unsigned credential preview</div>
                  <div className="text-muted-foreground">Credential ID: {request.unsignedCredentialId || "Not provided"}</div>
                  {request.unsignedCredentialTypes?.length ? (
                    <div className="text-muted-foreground">Type: {request.unsignedCredentialTypes.join(", ")}</div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      if (!issuerDidTrusted) {
                        toast.error("Issuer DID is not trusted", {
                          description: "Configure a DID from the trusted issuer directory in Settings before signing.",
                        });
                        return;
                      }
                      if (!issuerPrivateKeyPem) {
                        toast.error("Missing issuer private key", {
                          description: "Upload the issuer Ed25519 private key PEM before signing.",
                        });
                        return;
                      }
                      await issueVcFromRequest(request.id, adminId, {
                        issuerDid,
                        issuerPrivateKeyPem,
                        issuerOrganizationName,
                      });
                      setUpdateTick((value) => value + 1);
                      toast.success("Credential signed", {
                        description: "The signed VC is encrypted in backend delivery storage until the holder downloads it.",
                      });
                    } catch (error) {
                      const description = error instanceof Error ? error.message : "The credential could not be signed.";
                      toast.error("Credential signing failed", { description });
                    }
                  }}
                >
                  Sign and issue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await rejectVcRequest(request.id, adminId, "Rejected by trusted issuer.");
                    setUpdateTick((value) => value + 1);
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

function parseClaims(raw: string): Record<string, string> {
  return raw.split("\n").reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return acc;
    }
    const [key, ...rest] = trimmed.split("=");
    const claimKey = key?.trim();
    const claimValue = rest.join("=").trim();
    if (claimKey && claimValue) {
      acc[claimKey] = claimValue;
    }
    return acc;
  }, {});
}
