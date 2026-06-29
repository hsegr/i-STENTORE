import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteCredentialForHolder,
  downloadIssuedCredentialJson,
  getIssuedCredentialsForHolder,
  getIssuerOrganizationName,
  getTrustedIssuerDirectory,
  getVcRequestsForRequester,
  parseUnsignedCredentialJson,
  submitUnsignedVcRequest,
  submitVcRequest,
} from "@/lib/verifiableCredentials";
import type { UnsignedVerifiableCredential } from "@dataspace-onboarding/shared";

export const Route = createFileRoute("/status/credentials")({
  component: StatusCredentialsPage,
});

function StatusCredentialsPage() {
  const { user } = useAuth();
  const ownerId = (user?.profile?.email || user?.profile?.preferred_username || "").toString();
  const preferredDid = (user?.profile?.sub as string | undefined) || "";

  const [issuerDirectory, setIssuerDirectory] = useState<Array<{ did: string; organizationName: string }>>([]);
  const [requests, setRequests] = useState<Awaited<ReturnType<typeof getVcRequestsForRequester>>>([]);
  const [credentials, setCredentials] = useState<Awaited<ReturnType<typeof getIssuedCredentialsForHolder>>>([]);
  const [issuerDidInput, setIssuerDidInput] = useState("");
  const [uploadedUnsignedCredential, setUploadedUnsignedCredential] = useState<UnsignedVerifiableCredential | null>(null);
  const [uploadedCredentialFileName, setUploadedCredentialFileName] = useState("");
  const [uploadPurpose, setUploadPurpose] = useState("Please sign this uploaded unsigned credential.");
  const [updateTick, setUpdateTick] = useState(0);

  const { register, handleSubmit } = useForm<{
    holderOrganizationName: string;
    holderDid: string;
    credentialType: string;
    purpose: string;
    claimsText: string;
  }>({
    defaultValues: {
      holderOrganizationName: "",
      holderDid: preferredDid,
      credentialType: "DataSpaceParticipationCredential",
      purpose: "",
      claimsText: "",
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!ownerId) {
        return;
      }

      try {
        const [directory, requesterRequests, holderCredentials] = await Promise.all([
          getTrustedIssuerDirectory(),
          getVcRequestsForRequester(ownerId),
          getIssuedCredentialsForHolder(ownerId),
        ]);

        if (cancelled) {
          return;
        }

        setIssuerDirectory(directory);
        setRequests(requesterRequests);
        setCredentials(holderCredentials);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const description = error instanceof Error ? error.message : "Could not load credential state.";
        toast.error("Credential data unavailable", { description });
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [ownerId, updateTick]);

  useEffect(() => {
    if (!issuerDidInput && issuerDirectory[0]?.did) {
      setIssuerDidInput(issuerDirectory[0].did);
    }
  }, [issuerDirectory, issuerDidInput]);

  const issuerOptions = useMemo(
    () =>
      issuerDirectory.map((issuer) => ({
        ...issuer,
        label: `${issuer.organizationName} | ${issuer.did}`,
      })),
    [issuerDirectory],
  );
  const normalizedIssuerDidInput = issuerDidInput.trim();
  const matchedIssuer = useMemo(
    () => issuerDirectory.find((issuer) => issuer.did === normalizedIssuerDidInput),
    [issuerDirectory, normalizedIssuerDidInput],
  );
  const filteredIssuerOptions = useMemo(() => {
    const query = normalizedIssuerDidInput.toLowerCase();
    if (!query) {
      return issuerOptions;
    }
    return issuerOptions.filter(
      (issuer) =>
        issuer.did.toLowerCase().includes(query) || issuer.organizationName.toLowerCase().includes(query),
    );
  }, [issuerOptions, normalizedIssuerDidInput]);
  const requestedIssuerDid = matchedIssuer?.did || normalizedIssuerDidInput;
  const issuerDidInvalid = normalizedIssuerDidInput.length > 0 && !matchedIssuer;
  const issuerInputDescription = matchedIssuer
    ? `Trusted issuer: ${matchedIssuer.organizationName}`
    : normalizedIssuerDidInput
      ? "Wrong issuer: this DID is not in the trusted issuer directory."
      : "Select an issuer DID from the directory or type one to validate it.";

  const formatDate = (value: string) => new Date(value).toLocaleString();

  const onSubmitRequest = async (data: {
    holderOrganizationName: string;
    holderDid: string;
    credentialType: string;
    purpose: string;
    claimsText: string;
  }) => {
    if (!ownerId || !requestedIssuerDid || !data.holderDid || !data.credentialType || issuerDidInvalid) {
      return;
    }

    const claims = parseClaims(data.claimsText);

    try {
      await submitVcRequest({
        requesterId: ownerId,
        requesterOrganizationName: data.holderOrganizationName || claims.organizationName,
        holderDid: data.holderDid,
        requestedIssuerId: requestedIssuerDid,
        credentialType: data.credentialType,
        purpose: data.purpose,
        requestedClaims: claims,
      });
      setUpdateTick((value) => value + 1);
      toast.success("VC request submitted", {
        description: "The unsigned request is encrypted in backend storage until an issuer handles it.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "The request could not be submitted.";
      toast.error("VC request failed", { description });
    }
  };

  const onUnsignedCredentialUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const rawJson = String(loadEvent.target?.result ?? "");
        const parsed = parseUnsignedCredentialJson(rawJson);
        setUploadedUnsignedCredential(parsed);
        setUploadedCredentialFileName(file.name);
        toast.success("Unsigned credential loaded", {
          description: `Ready to request signing for ${parsed.credentialSubject.id}.`,
        });
      } catch (error) {
        const description = error instanceof Error ? error.message : "Upload a valid unsigned credential JSON file.";
        setUploadedUnsignedCredential(null);
        setUploadedCredentialFileName("");
        toast.error("Invalid unsigned credential", { description });
      }
    };
    reader.readAsText(file);
  };

  const onSubmitUploadedCredential = async () => {
    if (!ownerId || !requestedIssuerDid || !uploadedUnsignedCredential || issuerDidInvalid) {
      return;
    }

    try {
      await submitUnsignedVcRequest({
        requesterId: ownerId,
        requestedIssuerId: requestedIssuerDid,
        purpose: uploadPurpose,
        unsignedCredential: uploadedUnsignedCredential,
      });
      setUploadedUnsignedCredential(null);
      setUploadedCredentialFileName("");
      setUpdateTick((value) => value + 1);
      toast.success("Signing request submitted", {
        description: "The uploaded unsigned credential is encrypted in backend storage until signing.",
      });
    } catch (error) {
      const description = error instanceof Error ? error.message : "The unsigned credential request could not be submitted.";
      toast.error("Signing request failed", { description });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">My Verifiable Credentials</h1>
        <p className="text-muted-foreground">
          Request credentials from trusted issuers and view credentials that were issued to your participant account.
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary">{requests.filter((request) => request.status === "pending").length} pending requests</Badge>
          <Badge variant="secondary">{credentials.length} issued credentials</Badge>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Request Credential Signing</h2>
          <p className="text-sm text-muted-foreground">
            Use one Issuer DID field for both selection and manual input. Selecting from the dropdown autocompletes the DID,
            and manual edits are validated against the trusted issuer directory.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issuer-did">Issuer DID</Label>
          <Input
            id="issuer-did"
            list="trusted-issuer-did-options"
            value={issuerDidInput}
            onChange={(event) => setIssuerDidInput(event.target.value)}
            placeholder="did:indy:besu:wf:0x..."
            className="font-mono text-xs"
          />
          <datalist id="trusted-issuer-did-options">
            {filteredIssuerOptions.map((issuer) => (
              <option key={issuer.did} value={issuer.did}>
                {issuer.organizationName}
              </option>
            ))}
          </datalist>
          <p className={`text-xs ${issuerDidInvalid ? "text-destructive" : "text-muted-foreground"}`}>
            {issuerInputDescription}
          </p>
        </div>

        <Tabs defaultValue="request">
          <TabsList>
            <TabsTrigger value="request">Request a Credential</TabsTrigger>
            <TabsTrigger value="upload">Upload Unsigned Credential</TabsTrigger>
          </TabsList>

          <TabsContent value="request">
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSubmit(onSubmitRequest)}>
              <div className="space-y-2">
                <Label htmlFor="vc-type">Credential type</Label>
                <Input id="vc-type" {...register("credentialType", { required: true })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="holder-org">Participant Organisation Name</Label>
                <Input id="holder-org" {...register("holderOrganizationName", { required: true })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="holder-did">Holder DID</Label>
                <Input id="holder-did" {...register("holderDid", { required: true })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vc-purpose">Purpose</Label>
                <Input id="vc-purpose" {...register("purpose")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vc-claims">Requested claims (`key=value` per line)</Label>
                <Textarea id="vc-claims" rows={5} {...register("claimsText")} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={issuerDidInvalid || !requestedIssuerDid}>
                  Submit VC request
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="upload">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="unsigned-vc-file">Unsigned credential JSON</Label>
                <Input
                  id="unsigned-vc-file"
                  type="file"
                  accept="application/json,.json"
                  onChange={onUnsignedCredentialUpload}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="unsigned-vc-purpose">Purpose</Label>
                <Input
                  id="unsigned-vc-purpose"
                  value={uploadPurpose}
                  onChange={(event) => setUploadPurpose(event.target.value)}
                />
              </div>
              {uploadedUnsignedCredential ? (
                <div className="space-y-1 rounded border bg-muted/40 p-3 text-sm md:col-span-2">
                  <div className="font-medium">{uploadedCredentialFileName}</div>
                  <div className="text-xs text-muted-foreground">
                    Holder DID: {uploadedUnsignedCredential.credentialSubject.id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Type: {uploadedUnsignedCredential.type.map((type) => type.split("#").pop() ?? type).join(", ")}
                  </div>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <Button
                  type="button"
                  onClick={onSubmitUploadedCredential}
                  disabled={!uploadedUnsignedCredential || issuerDidInvalid || !requestedIssuerDid}
                >
                  Submit unsigned credential for signing
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">My VC Requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No VC requests found for your account.</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="rounded border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{request.credentialType}</span>
                <Badge variant={request.status === "issued" ? "default" : request.status === "rejected" ? "destructive" : "outline"}>
                  {request.requestSource === "unsigned_json" ? `unsigned JSON ${request.status}` : request.status}
                </Badge>
              </div>
              <div className="font-mono text-xs text-muted-foreground">{request.id}</div>
              <div className="text-xs text-muted-foreground">
                Issuer organisation:{" "}
                {request.requestedIssuerOrganizationName || getIssuerOrganizationName(request.requestedIssuerId)}
              </div>
              <div className="font-mono text-xs text-muted-foreground">Issuer DID: {request.requestedIssuerId}</div>
              <div className="text-xs text-muted-foreground">
                Participant: {request.requesterOrganizationName || "Unknown org"} ({request.requesterId})
              </div>
              <div className="text-xs text-muted-foreground">Requested: {formatDate(request.requestedAt)}</div>
              <p className="mt-1 text-xs text-muted-foreground">{request.purpose}</p>
              {request.unsignedCredentialId ? (
                <div className="text-xs text-muted-foreground">Unsigned VC ID: {request.unsignedCredentialId}</div>
              ) : null}
              {request.unsignedCredentialTypes?.length ? (
                <div className="text-xs text-muted-foreground">
                  Unsigned VC types: {request.unsignedCredentialTypes.join(", ")}
                </div>
              ) : null}
              {request.decisionNote ? <p className="mt-1 text-xs">Decision: {request.decisionNote}</p> : null}
            </div>
          ))
        )}
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Issued Credentials</h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No issued credentials found for your account.</p>
        ) : (
          credentials.map((credential) => (
            <div key={credential.id} className="space-y-1 rounded border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{credential.credentialType}</span>
                <Badge variant={credential.status === "active" ? "default" : "destructive"}>{credential.status}</Badge>
              </div>
              <div className="font-mono text-xs text-muted-foreground">{credential.id}</div>
              <div className="text-xs text-muted-foreground">
                Issuer organisation: {credential.issuerOrganizationName || getIssuerOrganizationName(credential.issuerId)}
              </div>
              <div className="font-mono text-xs text-muted-foreground">Issuer DID: {credential.issuerId}</div>
              <div className="text-xs text-muted-foreground">
                Participant: {credential.holderOrganizationName || "Unknown org"} ({credential.holderId})
              </div>
              <div className="text-xs text-muted-foreground">Issued: {formatDate(credential.issuanceDate)}</div>
              {credential.revokedAt ? (
                <div className="text-xs text-red-600">
                  Revoked: {formatDate(credential.revokedAt)} by {credential.revokedBy || "issuer"}
                </div>
              ) : null}
              {credential.revocationReason ? (
                <div className="text-xs text-red-600">Reason: {credential.revocationReason}</div>
              ) : null}
              <div className="text-xs text-muted-foreground">Format: {credential.format}</div>
              {credential.downloadedAt ? (
                <div className="text-xs text-muted-foreground">Downloaded: {formatDate(credential.downloadedAt)}</div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {credential.deliveryAvailable ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await downloadIssuedCredentialJson(credential, ownerId);
                        await deleteCredentialForHolder(credential.id, ownerId);
                        setUpdateTick((value) => value + 1);
                        toast.success("Credential downloaded", {
                          description: "The signed VC was downloaded and removed from platform storage.",
                        });
                      } catch (error) {
                        const description = error instanceof Error ? error.message : "The signed VC could not be downloaded.";
                        toast.error("Download failed", { description });
                      }
                    }}
                  >
                    Download JSON
                  </Button>
                ) : (
                  <Badge variant="outline">downloaded</Badge>
                )}
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
