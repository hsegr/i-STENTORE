import { MetricCard } from "@/components/MetricCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { RecentActivity } from "@/components/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, FileText, Users, ArrowUpRight, ArrowDownLeft, Server, Zap, Globe } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your Eclipse Dataspace Connector performance and activity</p>
        </div>
        <div className="flex items-center space-x-4">
          <StatusIndicator status="online" label="Connector Online" />
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
            v1.2.3
          </Badge>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Contracts"
          value={24}
          description="Currently negotiated contracts"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
          variant="success"
        />
        <MetricCard
          title="Available Assets"
          value={156}
          description="Assets in catalog"
          icon={Database}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Data Transfers"
          value="1.2K"
          description="Total transfers this month"
          icon={Activity}
          trend={{ value: 23, isPositive: true }}
        />
        <MetricCard
          title="Connected Participants"
          value={42}
          description="Active dataspace participants"
          icon={Users}
          trend={{ value: -2, isPositive: false }}
          variant="warning"
        />
      </div>

      {/* Charts and Activity Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">34%</span>
              </div>
              <Progress value={34} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network I/O</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
              <Progress value={23} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Transfer Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Transfer Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4 text-center">
                <ArrowUpRight className="mx-auto mb-2 h-6 w-6 text-success" />
                <div className="text-2xl font-bold text-success">847</div>
                <div className="text-sm text-muted-foreground">Outgoing</div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <ArrowDownLeft className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-primary">392</div>
                <div className="text-sm text-muted-foreground">Incoming</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm font-bold text-success">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg. Transfer Time</span>
                <span className="text-sm font-bold">2.3s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Data Volume</span>
                <span className="text-sm font-bold">1.2 TB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activity */}
        <div className="md:col-span-2">
          <RecentActivity />
        </div>

        {/* Connector Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Connector Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Connector ID</div>
                <div className="rounded bg-muted p-2 font-mono text-sm">edc-connector-001</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Endpoint</div>
                <div className="rounded bg-muted p-2 font-mono text-sm">https://edc.company.com:8080</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Protocol Version</div>
                <div className="text-sm">DSP 0.8</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                <div className="text-sm">15d 7h 23m</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Last Restart</div>
                <div className="text-sm">2025-10-23 09:15:00 UTC</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
