import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, KeyRound, ShieldCheck, ShieldOff, Users } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
});

function AdminIndexPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-gradient-primary shadow-glow flex size-10 items-center justify-center rounded-lg">
              <ShieldCheck className="size-5 text-primary-foreground" />
            </div>
            <Badge variant="outline">Admin Restricted</Badge>
          </div>
          <CardTitle className="text-3xl leading-tight">Data Space Governance Dashboard</CardTitle>
          <CardDescription className="text-base">
            Run participant admission, role activation, and governance lifecycle operations from this admin-only area.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/admin/incoming">
              <Users className="mr-2 size-4" />
              Participant Admission
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/resolved">
              <ClipboardCheck className="mr-2 size-4" />
              Governance Lifecycle
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/credentials">
              <KeyRound className="mr-2 size-4" />
              VC Issuance
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/revoke">
              <ShieldOff className="mr-2 size-4" />
              VC Revocation
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
