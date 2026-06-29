import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Key,
  Users,
  Wallet,
  Shield,
  AlertCircle,
  Loader2,
  Fingerprint,
  Download,
  Server,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { WalletData } from "@/lib/wallet.ts";
import { submitOnboardingRequest } from "@/lib/governance";
import { useAuth } from "@/hooks/useAuth";
import type {
  DIDData,
  DIDVerificationMethodData,
  ParticipantProfile,
  SubmitOnboardingRequestDto,
} from "@dataspace-onboarding/shared";

interface OnboardingSummaryProps {
  verificationMethodData: DIDVerificationMethodData | null;
  walletData: WalletData | null;
  didData: DIDData | null;
  selectedAttestators: string[];
  attestatorsList: { id: string; name: string; did: string }[];
  participantProfile: ParticipantProfile;
  onComplete: () => void;
}

export const OnboardingSummary = ({
  verificationMethodData,
  walletData,
  didData,
  selectedAttestators,
  attestatorsList,
  participantProfile,
  onComplete,
}: OnboardingSummaryProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAttestatorDetails = attestatorsList.filter((attestator) => selectedAttestators.includes(attestator.id));
  const username = user?.profile?.preferred_username || user?.profile?.email || "unknown-user";
  const verificationMethodId = didData?.did ? `${didData.did}#key-1` : "Not generated";
  const publicVerificationFingerprint = verificationMethodData?.publicKeyFingerprintSha256 || "Not generated";
  const connectorIdentityProxyBaseUrl = "";
  const serviceEndpoints = connectorIdentityProxyBaseUrl ? [`${connectorIdentityProxyBaseUrl}/api/v1/indy`] : [];
  const intendedParticipation = participantProfile.intendedParticipation;
  const effectiveRoles =
    intendedParticipation === "prosumer"
      ? (["provider", "consumer"] as const)
      : intendedParticipation
        ? ([intendedParticipation] as const)
        : [];
  const verificationMethodPublicKeyPreview = (() => {
    if (!verificationMethodData?.publicKeyPem) {
      return "Not configured";
    }
    const lines = verificationMethodData.publicKeyPem
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length < 3) {
      return verificationMethodData.publicKeyPem;
    }
    const begin = lines[0];
    const end = lines[lines.length - 1];
    const keyBody = lines.slice(1, -1).join("");
    const compactBody = keyBody.length > 64 ? `${keyBody.slice(0, 64)}...` : keyBody;
    return `${begin}\n${compactBody}\n${end}`;
  })();

  const handleDownloadConnectorConfig = () => {
    if (!walletData || !didData || !verificationMethodData) {
      toast.error("Missing artifacts", {
        description: "Generate wallet, DID and verification-method key material before exporting connector config.",
      });
      return;
    }

    const normalizedDid = didData.did.toLowerCase();
    const normalizedWalletAddress = walletData.address.toLowerCase();
    const includeWalletPrivateKey = walletData.usesEncryptedKeystore !== true;

    const config = {
      participant: {
        did: normalizedDid,
        walletAddress: normalizedWalletAddress,
        ...(includeWalletPrivateKey
          ? { walletPrivateKey: walletData.privateKey.toLowerCase().replace(/^0x/, "") }
          : {}),
      },
      governance: {
        selectedAttestators: selectedAttestatorDetails.map((att) => ({ name: att.name, did: att.did })),
      },
      didVerificationMethod: {
        type: verificationMethodData.methodType,
        publicKeyPem: verificationMethodData.publicKeyPem,
        privateKeyPem: verificationMethodData.privateKeyPem,
        publicKeyFingerprintSha256: verificationMethodData.publicKeyFingerprintSha256,
      },
      connectorBootstrap: {
        didMethod: "indy",
        ledgerNamespace: "besu:wf",
        identityProxyBaseUrl: connectorIdentityProxyBaseUrl,
      },
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `connector-bootstrap-${normalizedWalletAddress.slice(2, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Connector config exported");
  };

  const handleConfirmOnboarding = async () => {
    setIsSubmitting(true);

    try {
      // Simulate API call to complete onboarding
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!walletData || !didData) {
        throw new Error("Missing wallet or DID data");
      }

      // Keep all key material client-side. Only non-sensitive governance metadata is submitted.
      const governanceSubmission: SubmitOnboardingRequestDto = {
        ownerId: user?.profile?.email || user?.profile?.preferred_username || username,
        applicantName: username,
        organizationName: participantProfile.organizationName.trim(),
        walletAddress: walletData.address,
        did: didData.did,
        selectedAttestators: selectedAttestators.map(
          (id) => selectedAttestatorDetails.find((attestator) => attestator.id === id)?.did ?? id,
        ),
        tlsSetup: Boolean(verificationMethodData),
        blockchainSetup: true,
        participantProfile: {
          organizationName: participantProfile.organizationName.trim(),
          intendedParticipation,
          businessPurpose: participantProfile.businessPurpose.trim(),
          contactEmail: participantProfile.contactEmail?.trim() || undefined,
          website: participantProfile.website?.trim() || undefined,
          country: participantProfile.country?.trim() || undefined,
          additionalInformation: participantProfile.additionalInformation?.trim() || undefined,
        },
      };

      const createdRequest = submitOnboardingRequest(governanceSubmission);

      toast.success("Onboarding Complete!", {
        description: `Request ${createdRequest.id} submitted for governance review.`,
      });

      onComplete();
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "There was an error completing your onboarding. Please try again.";
      toast.error("Onboarding Failed", {
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="bg-gradient-primary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="size-8 text-primary-foreground" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Configuration Summary</h3>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Review your DataSpace identity configuration below. The flow keeps manual input minimal and prepares
          deployment-ready outputs consumed by connector bootstrap.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Server className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">Onboarding Output Summary (Non-Sensitive)</h4>
              <p className="mb-3 text-sm text-muted-foreground">
                Safe-to-share deployment references for connector integration. No private keys or secrets are shown.
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">DID Identifier</p>
                  <p className="rounded bg-muted p-2 font-mono text-sm break-all">{didData?.did || "Not generated"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Public Verification Method ID</p>
                  <p className="rounded bg-muted p-2 font-mono text-sm break-all">{verificationMethodId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification Fingerprint (SHA-256)</p>
                  <p className="rounded bg-muted p-2 font-mono text-sm break-all">{publicVerificationFingerprint}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Endpoints</p>
                  <div className="space-y-1 rounded bg-muted p-2">
                    {serviceEndpoints.length > 0 ? (
                      serviceEndpoints.map((endpoint) => (
                        <p key={endpoint} className="font-mono text-sm break-all">
                          {endpoint}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="default" className="shrink-0 bg-blue-100 text-blue-800">
              Connector Ready
            </Badge>
          </div>
        </Card>

        {/* Wallet Configuration */}
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">Blockchain Wallet</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <p className="rounded bg-muted p-2 font-mono text-sm break-all">
                    {walletData?.address || "Not configured"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-green-600" />
                  <span className="text-sm text-green-600">Securely generated and encrypted</span>
                </div>
              </div>
            </div>
            <Badge variant="default" className="shrink-0 bg-green-100 text-green-800">
              Configured
            </Badge>
          </div>
        </Card>

        {/* DID Configuration */}
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Fingerprint className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">Decentralized Identifier (DID)</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Generated DID</p>
                  <p className="rounded bg-muted p-2 font-mono text-sm break-all">{didData?.did || "Not generated"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-sm text-green-600">Generated and ready for usage</span>
                </div>
              </div>
            </div>
            <Badge variant="default" className="shrink-0 bg-green-100 text-green-800">
              Generated
            </Badge>
          </div>
        </Card>
        {/* ---------------------------------- */}

        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h4 className="text-lg font-semibold">Participant Admission Details</h4>
              <div>
                <p className="text-sm text-muted-foreground">Organization Name</p>
                <p className="rounded bg-muted p-2 text-sm wrap-break-word">{participantProfile.organizationName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intended Participation</p>
                <div className="flex flex-wrap gap-2 rounded bg-muted p-2">
                  <Badge variant="outline" className="capitalize">
                    {intendedParticipation || "Not selected"}
                  </Badge>
                  {effectiveRoles.length > 1 && <Badge variant="outline">Effective: provider + consumer</Badge>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Intended Use in DataSpace</p>
                <p className="rounded bg-muted p-2 text-sm wrap-break-word">{participantProfile.businessPurpose}</p>
              </div>
              {(participantProfile.contactEmail ||
                participantProfile.website ||
                participantProfile.country ||
                participantProfile.additionalInformation) && (
                <div className="space-y-2">
                  {participantProfile.contactEmail && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Contact Email:</span> {participantProfile.contactEmail}
                    </p>
                  )}
                  {participantProfile.website && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Website:</span> {participantProfile.website}
                    </p>
                  )}
                  {participantProfile.country && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Country / Jurisdiction:</span>{" "}
                      {participantProfile.country}
                    </p>
                  )}
                  {participantProfile.additionalInformation && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Additional Information:</span>{" "}
                      {participantProfile.additionalInformation}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Badge variant="default" className="shrink-0 bg-blue-100 text-blue-800">
              For Issuer Review
            </Badge>
          </div>
        </Card>

        {/* DID Verification Method Configuration */}
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Key className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">DID Verification Method (Ed25519)</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Public key material used for DID `authentication` and `assertionMethod` operations.
                </p>
                <pre className="overflow-x-auto rounded bg-muted p-2 font-mono text-xs whitespace-pre">
                  {verificationMethodPublicKeyPreview}
                </pre>
              </div>
            </div>
            <Badge variant="default" className="shrink-0 bg-blue-100 text-blue-800">
              Ready
            </Badge>
          </div>
        </Card>

        {/* Blockchain Network */}
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">Blockchain Network</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p>WeForming</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chain ID</p>
                    <p>1337</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  DID public key management will be handled automatically.
                </p>
              </div>
            </div>
            <Badge variant="default" className="shrink-0 bg-blue-100 text-blue-800">
              Pre-configured
            </Badge>
          </div>
        </Card>

        {/* Attestators */}
        <Card className="p-6">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-2 text-lg font-semibold">Selected Attestators</h4>
              {selectedAttestatorDetails.length > 0 ? (
                <div className="space-y-3">
                  {selectedAttestatorDetails.map((attestator) => (
                    <div key={attestator.id} className="rounded-lg border bg-muted/50 p-3">
                      <h5 className="font-medium">{attestator.name}</h5>
                      <p className="font-mono text-xs break-all text-muted-foreground">{attestator.did}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No attestators selected</p>
              )}
            </div>
            <Badge
              variant={selectedAttestatorDetails.length > 0 ? "default" : "secondary"}
              className={selectedAttestatorDetails.length > 0 ? "shrink-0 bg-green-100 text-green-800" : "shrink-0"}
            >
              {selectedAttestatorDetails.length} Selected
            </Badge>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {selectedAttestatorDetails.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              You must select at least one attestator before proceeding with the onboarding.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>Next Steps:</strong> After confirmation, your connector will be in a pending state until approved by
            the selected attestators. You'll receive notifications once approvals are granted.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>Important:</strong> If you lose your wallet keys, verification keys, or related addresses, you may
            permanently lose control of this identity. Back up all generated artifacts before finishing onboarding.
          </AlertDescription>
        </Alert>
      </div>

      {/* Action Button */}
      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={handleDownloadConnectorConfig} size="lg" className="min-w-48">
          <Download className="mr-2 size-4" />
          Download Connector Config
        </Button>
        <Button
          variant="outline"
          onClick={handleConfirmOnboarding}
          disabled={selectedAttestatorDetails.length === 0 || isSubmitting}
          size="lg"
          className="bg-gradient-primary hover:shadow-glow transition-smooth min-w-48"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Configuring...
            </>
          ) : (
            "Confirm & Complete Onboarding"
          )}
        </Button>
      </div>
    </div>
  );
};
