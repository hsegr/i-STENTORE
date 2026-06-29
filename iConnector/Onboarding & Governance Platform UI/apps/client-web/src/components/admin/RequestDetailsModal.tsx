import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Wallet, Shield, CheckCircle, Building2 } from "lucide-react";
import type { OnboardingRequest } from "@dataspace-onboarding/shared";

interface RequestDetailsModalProps {
  request: OnboardingRequest;
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const attestatorNames: Record<string, string> = {
  "did:indy:besu:attestator1": "TrustNet Certification Authority",
  "did:indy:besu:attestator2": "SecureID Verification Services",
  "did:indy:besu:attestator3": "DataSpace Identity Registry",
};

export function RequestDetailsModal({ request, isOpen, onClose, onAccept, onReject }: RequestDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  const participantProfile = request.participantProfile;
  const intendedParticipation = participantProfile?.intendedParticipation || null;
  const effectiveRoles =
    intendedParticipation === "prosumer"
      ? ["provider", "consumer"]
      : intendedParticipation
        ? [intendedParticipation]
        : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Onboarding Request Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <User className="h-5 w-5 text-blue-600" />
              Applicant Information
            </h3>
            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="font-medium">{request.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applicant Name:</span>
                <span className="font-medium">{request.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Request ID:</span>
                <span className="font-mono text-sm">{request.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{formatDate(request.submittedAt)}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Participant Admission Details
            </h3>
            <div className="space-y-3 rounded-lg bg-muted p-4">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Organization Name:</span>
                <span className="font-medium text-right">{participantProfile?.organizationName || request.organizationName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Intended Participation:</span>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge variant="outline" className="capitalize">
                    {intendedParticipation || "Not provided"}
                  </Badge>
                  {effectiveRoles.length > 1 && <Badge variant="outline">Effective: provider + consumer</Badge>}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">Intended Use in DataSpace:</span>
                <p className="rounded border bg-card p-2 text-sm">
                  {participantProfile?.businessPurpose || "Not provided"}
                </p>
              </div>
              {participantProfile?.contactEmail && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Contact Email:</span>
                  <span className="font-medium text-right">{participantProfile.contactEmail}</span>
                </div>
              )}
              {participantProfile?.website && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Website:</span>
                  <span className="font-medium text-right">{participantProfile.website}</span>
                </div>
              )}
              {participantProfile?.country && (
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Country / Jurisdiction:</span>
                  <span className="font-medium text-right">{participantProfile.country}</span>
                </div>
              )}
              {participantProfile?.additionalInformation && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">Additional Information:</span>
                  <p className="rounded border bg-card p-2 text-sm">{participantProfile.additionalInformation}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Wallet Information */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Wallet className="h-5 w-5 text-green-600" />
              Wallet Configuration
            </h3>
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wallet Address:</span>
                <span className="rounded border bg-card px-2 py-1 font-mono text-sm">{request.walletAddress}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-muted-foreground">DID:</span>
                <span className="rounded border bg-card px-2 py-1 font-mono text-xs break-all">{request.did}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Setup Status */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              Setup Status
            </h3>
            <div className="space-y-3 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">DID Verification Method Keys:</span>
                <Badge className={request.tlsSetup ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {request.tlsSetup ? "✓ Complete" : "✗ Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Blockchain Network Setup:</span>
                <Badge className={request.blockchainSetup ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {request.blockchainSetup ? "✓ Complete" : "✗ Pending"}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Selected Attestators */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
              <Shield className="h-5 w-5 text-orange-600" />
              Selected Trusted Attestators
            </h3>
            <div className="space-y-2">
              {request.selectedAttestators.map((attestator, index) => (
                <div key={index} className="rounded-lg bg-muted p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        {attestatorNames[attestator] || "Unknown Attestator"}
                      </div>
                      <div className="mt-1 font-mono text-sm break-all text-muted-foreground">{attestator}</div>
                    </div>
                    <Badge variant="outline">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
            >
              Reject Request
            </Button>
            <Button onClick={onAccept} className="bg-green-600 text-white hover:bg-green-700">
              Accept Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
