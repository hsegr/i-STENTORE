import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, Package, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const activities = [
  {
    id: 1,
    type: "transfer",
    title: "Data Transfer Completed",
    description: "Asset 'Customer Dataset' transferred to Participant A",
    timestamp: "2 minutes ago",
    status: "success",
    icon: ArrowUpRight,
  },
  {
    id: 2,
    type: "contract",
    title: "New Contract Negotiated",
    description: "Contract #CT-2024-001 with Participant B",
    timestamp: "15 minutes ago",
    status: "info",
    icon: FileText,
  },
  {
    id: 3,
    type: "asset",
    title: "Asset Published",
    description: "New asset 'Financial Reports Q4' added to catalog",
    timestamp: "1 hour ago",
    status: "success",
    icon: Package,
  },
  {
    id: 4,
    type: "participant",
    title: "New Participant Registered",
    description: "Data Provider Corp joined the dataspace",
    timestamp: "2 hours ago",
    status: "info",
    icon: Users,
  },
  {
    id: 5,
    type: "transfer",
    title: "Data Request Received",
    description: "Incoming request for 'Market Analysis' dataset",
    timestamp: "3 hours ago",
    status: "warning",
    icon: ArrowDownLeft,
  },
];

export function RecentActivity() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "info":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5"/>
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  <activity.icon className="w-4 h-4"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.timestamp}
                  </p>
                </div>
                <Badge variant="outline" className={getStatusColor(activity.status)}>
                  {activity.type}
                </Badge>
              </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}