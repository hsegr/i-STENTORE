import type { Asset } from "@/types/asset.ts";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, FileText, Database, Package } from "lucide-react";

interface ColumnProps {
  onViewDetails: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
}

const getContentIcon = (contentType: string) => {
  let iconCategory = "default";
  if (contentType.includes("json") || contentType.includes("csv") || contentType.includes("parquet")) {
    iconCategory = "database";
  } else if (contentType.includes("yaml") || contentType.includes("text")) {
    iconCategory = "filetext";
  }

  // Use a switch statement on the category
  switch (iconCategory) {
    case "database":
      return <Database className="h-6 w-6 text-blue-500" />;
    case "filetext":
      return <FileText className="h-6 w-6 text-purple-500" />;
    default:
      return <Package className="h-6 w-6 text-gray-500" />;
  }
};

// Helper function to get the status badge variant
/*
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "live":
      return <Badge variant="default">Live</Badge>;
    case "draft":
      return <Badge variant="outline">Draft</Badge>;
    case "archived":
      return <Badge variant="secondary">Archived</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
*/
export const columns = ({ onViewDetails, onDeleteAsset }: ColumnProps): ColumnDef<Asset>[] => [
  {
    id: "name",
    accessorKey: "properties.name",
    header: "Name",
    cell: ({ row }) => {
      const asset = row.original;
      return (
        <div className="flex items-center space-x-3">
          {getContentIcon(asset.properties.contenttype)}
          <div>
            <div className="font-medium">{asset.properties.name}</div>
          </div>
        </div>
      );
    },
  },
  {
    id: "contentType",
    accessorKey: "properties.contenttype",
    header: "Content Type",
    cell: ({ row }) => {
      const contentType = row.getValue("contentType");
      return <code className="rounded bg-muted px-2 py-1 text-xs">{contentType as string}</code>;
    },
  },
  {
    accessorKey: "version",
    header: "Version",
  },
  {
    id: "keywords",
    accessorKey: "properties.keywords",
    header: "Keywords",
    cell: ({ row }) => {
      const rawKeywords = row.original.properties.keywords;

      let keywords: string[];
      if (typeof rawKeywords === "string") {
        keywords = rawKeywords.split(",").map((k) => k.trim());
      } else if (Array.isArray(rawKeywords)) {
        keywords = rawKeywords.map((k: unknown) => (typeof k === "string" ? k.trim() : "")).filter(Boolean);
      } else {
        // Default to an empty array if keywords are missing or invalid
        keywords = [];
      }
      return (
        <div className="flex flex-wrap gap-1">
          {keywords.slice(0, 2).map((keyword, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {keyword}
            </Badge>
          ))}
          {keywords.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{keywords.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "created",
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <span className="text-sm text-muted-foreground">{row.getValue("created") as string}</span>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const asset = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewDetails(asset)}>View Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(asset["@id"])}>
              Create Contract Definition
            </DropdownMenuItem>
            <DropdownMenuItem>Edit Asset</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteAsset(asset["@id"])} className="text-destructive">
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
