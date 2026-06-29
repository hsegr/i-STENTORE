import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, X, XCircle, User, Wallet, Shield, RotateCw, Ban, Trash2 } from "lucide-react";
import {
  deleteAuditEvent,
  deleteRejectedRequest,
  getAuditEvents,
  getResolvedRequests,
  overturnAcceptedRequest,
  updateLifecycle,
} from "@/lib/governance";
import type { ResolvedRequest } from "@dataspace-onboarding/shared";

export function ResolvedRequests() {
  const [requests, setRequests] = useState<ResolvedRequest[]>(() => getResolvedRequests());
  const [auditEvents, setAuditEvents] = useState(() => getAuditEvents(12));
  const [overturnReasonByRequestId, setOverturnReasonByRequestId] = useState<Record<string, string>>({});

  const refreshState = () => {
    setRequests(getResolvedRequests());
    setAuditEvents(getAuditEvents(12));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: "accepted" | "rejected") => {
    if (status === "accepted") {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle className="mr-1 h-3 w-3" />
          Accepted
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
        <XCircle className="mr-1 h-3 w-3" />
        Rejected
      </Badge>
    );
  };

  const getLifecycleBadge = (request: ResolvedRequest) => {
    if (request.status !== "accepted") {
      return null;
    }
    if (request.lifecycleStatus === "revoked") {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Revoked</Badge>;
    }
    if (request.lifecycleStatus === "renewed") {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">Renewed</Badge>;
    }
    return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</Badge>;
  };

  const acceptedCount = requests.filter((r) => r.status === "accepted").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Resolved Requests</h2>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            {acceptedCount} Accepted
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            {rejectedCount} Rejected
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="border border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-foreground">{request.organizationName}</CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(request.status)}
                  {getLifecycleBadge(request)}
                </div>
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

              {request.assignedRoles && request.assignedRoles.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Assigned roles:</span>
                  {request.assignedRoles.map((role) => (
                    <Badge key={role} variant="outline" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              {request.rejectionReason && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Rejection Reason:</strong> {request.rejectionReason}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Submitted: {formatDate(request.submittedAt)}</span>
                  <span>Resolved: {formatDate(request.resolvedAt)}</span>
                </div>
                <span className="text-sm text-muted-foreground">By: {request.resolvedBy}</span>
              </div>

              {request.status === "accepted" && (
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateLifecycle(request.id, "renewed", "admin@dataspace.org");
                        refreshState();
                      }}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <RotateCw className="mr-1 h-3.5 w-3.5" />
                      Renew
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateLifecycle(request.id, "revoked", "admin@dataspace.org");
                        refreshState();
                      }}
                      className="border-red-200 text-red-700 hover:bg-red-50"
                    >
                      <Ban className="mr-1 h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                    <Input
                      placeholder="Overturn reason (e.g. policy or compliance violation)"
                      value={overturnReasonByRequestId[request.id] ?? ""}
                      onChange={(event) =>
                        setOverturnReasonByRequestId((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        overturnAcceptedRequest(
                          request.id,
                          "admin@dataspace.org",
                          overturnReasonByRequestId[request.id] ?? "",
                        );
                        setOverturnReasonByRequestId((current) => {
                          const next = { ...current };
                          delete next[request.id];
                          return next;
                        });
                        refreshState();
                      }}
                    >
                      Overturn to Rejected
                    </Button>
                  </div>
                </div>
              )}

              {request.status === "rejected" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      deleteRejectedRequest(request.id);
                      refreshState();
                    }}
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove Rejected Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Governance Audit Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {auditEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : (
            auditEvents.map((event) => (
              <div key={event.id} className="rounded border bg-muted/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{event.type.replaceAll("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete audit event"
                      className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        deleteAuditEvent(event.id);
                        refreshState();
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">Request: {event.requestId}</div>
                <div className="text-xs text-muted-foreground">Actor: {event.actor}</div>
                <div className="mt-1">{event.details}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
