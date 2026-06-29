import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { GovernanceRole, OnboardingRequest } from "@dataspace-onboarding/shared";

interface ActionModalProps {
  request: OnboardingRequest;
  action: "accept" | "reject";
  isOpen: boolean;
  onClose: () => void;
  issuerDid?: string;
  issuerDidTrusted?: boolean;
  onConfirm: (payload?: {
    reason?: string;
    assignedRoles?: GovernanceRole[];
    issuerDid?: string;
    issuerPrivateKeyPem?: string;
  }) => void;
}

export function ActionModal({ request, action, isOpen, onClose, issuerDid = "", issuerDidTrusted = true, onConfirm }: ActionModalProps) {
  const [reason, setReason] = useState("");
  const [assignedRoles, setAssignedRoles] = useState<GovernanceRole[]>(["participant"]);
  const [issuerPrivateKeyPem, setIssuerPrivateKeyPem] = useState("");

  const availableRoles: GovernanceRole[] = ["participant", "consumer", "provider", "prosumer", "observer"];

  const handleConfirm = () => {
    if (action === "reject" && !reason.trim()) {
      return;
    }

    if (action === "accept" && assignedRoles.length === 0) {
      return;
    }

    if (action === "accept" && (!issuerDidTrusted || !issuerDid || !issuerPrivateKeyPem)) {
      return;
    }

    onConfirm(
      action === "reject"
        ? { reason }
        : {
            assignedRoles,
            issuerDid,
            issuerPrivateKeyPem,
          },
    );
  };

  const toggleRole = (role: GovernanceRole) => {
    setAssignedRoles((prev) => (prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]));
  };

  const isAccept = action === "accept";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAccept ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {isAccept ? "Accept Request" : "Reject Request"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <div className="font-medium text-foreground">{request.organizationName}</div>
            <div className="text-sm text-muted-foreground">{request.applicantName}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{request.id}</div>
          </div>

          {isAccept ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900 dark:text-green-100">Confirm Acceptance</div>
                  <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                    This will grant {request.organizationName} access to the DataSpace and notify the selected
                    attestators.
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Assign participant roles <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((role) => (
                    <label key={role} className="flex items-center gap-2 rounded border bg-card p-2 text-sm">
                      <input
                        type="checkbox"
                        checked={assignedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="size-4"
                      />
                      <span className="capitalize">{role}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Selected roles control admission privileges in the governance layer.
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Issuer DID</Label>
                <Input value={issuerDid || "No issuer DID configured"} readOnly className="font-mono text-xs" />
                {!issuerDidTrusted ? (
                  <p className="text-xs text-destructive">
                    This DID is not in the trusted issuer directory. Configure a trusted issuer DID in Settings.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboarding-issuer-private-key" className="text-sm font-medium">
                  Issuer Ed25519 private key PEM <span className="text-destructive">*</span>
                </Label>
                <input
                  id="onboarding-issuer-private-key"
                  type="file"
                  accept=".pem,.key"
                  className="w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (loadEvent) => setIssuerPrivateKeyPem(String(loadEvent.target?.result ?? ""));
                    reader.readAsText(file);
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  Used locally to sign the automatic MembershipCredential. The key is not stored.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">Confirm Rejection</div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    This will deny access to the DataSpace. Please provide a reason for the rejection.
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-medium">
                  Rejection Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for rejecting this request..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="text-xs text-muted-foreground">
                  This reason will be sent to the applicant and stored in the records.
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                (!isAccept && !reason.trim()) ||
                (isAccept && (assignedRoles.length === 0 || !issuerDidTrusted || !issuerDid || !issuerPrivateKeyPem))
              }
              className={
                isAccept ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"
              }
            >
              {isAccept ? "Accept Request" : "Reject Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
