import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Wallet, Shield, Eye } from "lucide-react";
import { toast } from "sonner";
import { RequestDetailsModal } from "./RequestDetailsModal";
import { ActionModal } from "./ActionModal";
import { resolveRequest, getPendingRequests } from "@/lib/governance";
import { useAuth } from "@/hooks/useAuth";
import { getOrganisationSettings } from "@/lib/settings";
import {
    getTrustedIssuers,
    issueDataProcessorCredentialForOnboarding,
    issueMembershipCredentialForOnboarding,
} from "@/lib/verifiableCredentials";
import type { GovernanceRole, OnboardingRequest } from "@dataspace-onboarding/shared";

export function IncomingRequests() {
    const { user } = useAuth();
    const adminId = (user?.profile?.email || user?.profile?.preferred_username || "admin@dataspace.org").toString();
    const issuerSettings = getOrganisationSettings(adminId);
    const issuerDid = issuerSettings.did;
    const [trustedIssuerDids, setTrustedIssuerDids] = useState<string[]>([]);
    const issuerDidTrusted = issuerDid ? trustedIssuerDids.includes(issuerDid) : false;
    const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
    const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
    const [requests, setRequests] = useState<OnboardingRequest[]>(() => getPendingRequests());

    useEffect(() => {
        let cancelled = false;

        async function loadTrustedIssuers() {
            try {
                const nextTrustedIssuers = await getTrustedIssuers();
                if (!cancelled) {
                    setTrustedIssuerDids(nextTrustedIssuers);
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }
                const description = error instanceof Error ? error.message : "Could not load trusted issuer directory.";
                toast.error("Trusted issuer directory unavailable", { description });
            }
        }

        void loadTrustedIssuers();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleAction = async (
      request: OnboardingRequest,
      action: "accept" | "reject",
      payload?: {
        reason?: string;
        assignedRoles?: GovernanceRole[];
        issuerDid?: string;
        issuerPrivateKeyPem?: string;
      },
    ) => {
        const resolved = resolveRequest(request.id, action, adminId, payload);
        if (action === "accept" && resolved && payload?.issuerDid && payload.issuerPrivateKeyPem) {
            try {
                await issueMembershipCredentialForOnboarding({
                    request,
                    issuerDid: payload.issuerDid,
                    issuerOrganizationName: issuerSettings.organizationName,
                    issuerPrivateKeyPem: payload.issuerPrivateKeyPem,
                    adminId,
                });
                await issueDataProcessorCredentialForOnboarding({
                    request,
                    issuerDid: payload.issuerDid,
                    issuerOrganizationName: issuerSettings.organizationName,
                    issuerPrivateKeyPem: payload.issuerPrivateKeyPem,
                    adminId,
                });
                toast.success("Onboarding accepted", {
                    description: "MembershipCredential and DataProcessorCredential VCs were signed and issued to the participant.",
                });
            } catch (error) {
                const description =
                    error instanceof Error
                        ? error.message
                        : "The onboarding credentials could not be signed.";
                toast.error("Credential signing failed", { description });
            }
        }

        setRequests(getPendingRequests());
        setActionType(null);
        setSelectedRequest(null);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">Incoming Requests</h2>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                    {requests.length} Pending
                </Badge>
            </div>

            <div className="grid gap-4">
                {requests.map((request) => (
                    <Card key={request.id} className="border border-border transition-shadow hover:shadow-lg">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-medium text-foreground">{request.organizationName}</CardTitle>
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Pending
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">{request.applicantName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-mono text-sm text-muted-foreground">
                                        {request.walletAddress.substring(0, 10)}...
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">
                                        {request.selectedAttestators.length} Attestator(s)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-3">
                                <span className="text-sm text-muted-foreground">Submitted: {formatDate(request.submittedAt)}</span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRequest(request)}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                                    >
                                        <Eye className="mr-1 h-4 w-4" />
                                        View Details
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setActionType("reject");
                                        }}
                                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setActionType("accept");
                                        }}
                                        className="bg-green-600 text-white hover:bg-green-700"
                                    >
                                        Accept
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {requests.length === 0 && (
                    <Card className="p-8 text-center">
                        <div className="mb-2 text-muted-foreground">
                            <Clock className="mx-auto mb-3 h-12 w-12" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-muted-foreground">No Pending Requests</h3>
                        <p className="text-muted-foreground">All onboarding requests have been processed.</p>
                    </Card>
                )}
            </div>

            {selectedRequest && !actionType && (
                <RequestDetailsModal
                    request={selectedRequest}
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onAccept={() => setActionType("accept")}
                    onReject={() => setActionType("reject")}
                />
            )}

            {selectedRequest && actionType && (
                <ActionModal
                    request={selectedRequest}
                    action={actionType}
                    isOpen={true}
                    issuerDid={issuerDid}
                    issuerDidTrusted={issuerDidTrusted}
                    onClose={() => {
                        setActionType(null);
                        setSelectedRequest(null);
                    }}
                    onConfirm={(payload) => handleAction(selectedRequest, actionType, payload)}
                />
            )}
        </div>
    );
}
