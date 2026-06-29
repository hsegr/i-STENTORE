import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default"
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      case "destructive":
        return "border-destructive/20 bg-destructive/5";
      default:
        return "border-border bg-card";
    }
  };

  const getIconVariantClasses = () => {
    switch (variant) {
      case "success":
        return "text-success bg-success/10";
      case "warning":
        return "text-warning bg-warning/10";
      case "destructive":
        return "text-destructive bg-destructive/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
      <Card className={`transition-all duration-200 hover:shadow-md ${getVariantClasses()}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${getIconVariantClasses()}`}>
            <Icon className="h-4 w-4"/>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
          )}
          {trend && (
              <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
            }`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
                <span className="text-xs text-muted-foreground ml-1">
              from last month
            </span>
              </div>
          )}
        </CardContent>
      </Card>
  );
}