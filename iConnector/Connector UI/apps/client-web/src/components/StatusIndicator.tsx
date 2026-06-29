import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: "online" | "offline" | "maintenance" | "warning";
  label: string;
  className?: string;
}

export function StatusIndicator({status, label, className}: StatusIndicatorProps) {
  const getStatusClasses = () => {
    switch (status) {
      case "online":
        return "bg-success text-success-foreground";
      case "offline":
        return "bg-destructive text-destructive-foreground";
      case "maintenance":
        return "bg-warning text-warning-foreground";
      case "warning":
        return "bg-warning text-warning-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDotClasses = () => {
    switch (status) {
      case "online":
        return "bg-success";
      case "offline":
        return "bg-destructive";
      case "maintenance":
        return "bg-warning";
      case "warning":
        return "bg-warning";
      default:
        return "bg-muted-foreground";
    }
  };

  return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${getDotClasses()}`}/>
          {status === "online" && (
              <div className="absolute -inset-1 w-4 h-4 bg-success rounded-full animate-ping opacity-20"/>
          )}
        </div>
        <span className={`text-sm font-medium px-2 py-1 rounded-md ${getStatusClasses()}`}>
          {label}
        </span>
      </div>
  );
}