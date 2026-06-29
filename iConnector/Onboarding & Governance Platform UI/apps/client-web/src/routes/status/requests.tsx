import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { deleteRequestForOwner, getRequestsForOwner } from "@/lib/governance";

export const Route = createFileRoute("/status/requests")({
  component: StatusRequestsPage,
});

function StatusRequestsPage() {
  const { user } = useAuth();
  const ownerId = (user?.profile?.email || user?.profile?.preferred_username || "").toString();
  const [updateTick, setUpdateTick] = useState(0);
  const { pending, resolved } = useMemo(() => getRequestsForOwner(ownerId), [ownerId, updateTick]);
  const all = [...pending, ...resolved].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">My Onboarding Requests</h1>
        <p className="text-muted-foreground">
          Status for onboarding requests submitted by your account across your organisations.
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary">{pending.length} pending</Badge>
          <Badge variant="secondary">{resolved.length} resolved</Badge>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-lg font-semibold">Requests</h2>
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">No onboarding requests found for your account.</p>
        ) : (
          all.map((request) => (
            <div key={request.id} className="rounded border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{request.organizationName}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{request.status}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete request"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      deleteRequestForOwner(request.id, ownerId);
                      setUpdateTick((value) => value + 1);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="font-mono text-xs text-muted-foreground">{request.did}</div>
              <div className="text-xs text-muted-foreground">Submitted: {formatDate(request.submittedAt)}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
