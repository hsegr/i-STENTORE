import type { ColumnDef } from "@tanstack/react-table";
import type { Dataset } from "@/types/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, MoreHorizontal, Database, FileText, Globe } from "lucide-react";

interface ColumnProps {
  onViewDetails: (dataset: Dataset) => void;
  onStartNegotiation: (dataset: Dataset) => void;
}

const getContentIcon = (contentType: string) => {
  if (!contentType) return <Globe className="h-4 w-4" />;
  const ct = contentType.toLowerCase();
  if (ct.includes("json") || ct.includes("csv") || ct.includes("parquet")) {
    return <Database className="h-4 w-4" />;
  }
  if (ct.includes("pdf") || ct.includes("text")) {
    return <FileText className="h-4 w-4" />;
  }
  return <Globe className="h-4 w-4" />;
};

export const columns = ({ onViewDetails, onStartNegotiation }: ColumnProps): ColumnDef<Dataset>[] => [
  {
    id: "asset",
    header: "Asset",
    cell: ({ row }) => {
      const ds = row.original;
      return (
        <div className="flex items-center space-x-3">
          {getContentIcon(ds.contenttype)}
          <div className="max-w-xs">
            <div className="font-medium">{ds["@id"]}</div>
            <div className="truncate text-sm text-muted-foreground">{ds.description}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {ds.keywords.slice(0, 3).map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {ds.keywords.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{ds.keywords.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "provider",
    header: "Provider",
    cell: ({ row }) => {
      const ds = row.original;
      const endpoint = ds["dcat:distribution"]?.[0]?.["dcat:accessService"]?.["dcat:endpointURL"] ?? "";
      let hostname = "";
      try {
        hostname = endpoint ? new URL(endpoint).hostname : "";
      } catch {
        hostname = "";
      }
      return (
        <div>
          <div className="font-medium">{endpoint}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            <ExternalLink className="mr-1 h-3 w-3" />
            {hostname}
          </div>
        </div>
      );
    },
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => <Badge variant="outline">{row.original.name}</Badge>,
  },
  {
    id: "actions",
    enableHiding: false,
    header: "",
    cell: ({ row }) => {
      const ds = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(ds)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStartNegotiation(ds)}>Start Negotiation</DropdownMenuItem>
            <DropdownMenuItem>Contact Provider</DropdownMenuItem>
            <DropdownMenuItem>Add to Favorites</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
