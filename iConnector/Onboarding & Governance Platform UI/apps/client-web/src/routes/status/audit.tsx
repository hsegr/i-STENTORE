import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { clearAuditTrailForOwner, deleteAuditEventForOwner, getAuditEventsForOwner } from "@/lib/governance";

export const Route = createFileRoute("/status/audit")({
  component: StatusAuditPage,
});

function StatusAuditPage() {
  const { user } = useAuth();
  const ownerId = (user?.profile?.email || user?.profile?.preferred_username || "").toString();
  const [updateTick, setUpdateTick] = useState(0);
  const events = useMemo(() => getAuditEventsForOwner(ownerId, 25), [ownerId, updateTick]);
  const formatDate = (value: string) => new Date(value).toLocaleString();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">My Audit Trail</h1>
        <p className="text-muted-foreground">
          Governance-relevant events for onboarding requests created by your account.
        </p>
      </Card>

      <Card className="space-y-3 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearAuditTrailForOwner(ownerId);
              setUpdateTick((value) => value + 1);
            }}
          >
            Clear My Audit Trail
          </Button>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events found for your requests.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="rounded border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{event.type.replaceAll("_", " ")}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete audit event"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      deleteAuditEventForOwner(event.id, ownerId);
                      setUpdateTick((value) => value + 1);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Request: {event.requestId}</div>
              <div className="text-xs text-muted-foreground">Actor: {event.actor}</div>
              <div>{event.details}</div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
