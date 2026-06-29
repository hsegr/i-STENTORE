import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Dataset, PolicySet, ConstraintArr, RuleItem } from "@/types/catalog";
import { Search, Filter, Download, Database, FileText, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

import { columns as catalogColumns } from "./columns";
import { DataTable } from "@/components/common/data-table";

// --------- dummy datasets  following the postman response structure  ----------
const dummyDatasets: Dataset[] = [
  {
    "@id": "urn:dataset:ntua:pvplant-timeseries",
    "@type": "dcat:Dataset",
    "odrl:hasPolicy": [
      {
        "@id": "urn:policy:ntua-academic-only",
        "@type": "odrl:Offer",
        "odrl:permission": [
          {
            "odrl:action": { "@id": "odrl:use" },
            "odrl:constraint": [
              {
                "@type": "odrl:Constraint",
                "odrl:leftOperand": { "@id": "odrl:purpose" },
                "odrl:operator": { "@id": "odrl:eq" },
                "odrl:rightOperand": "research",
              },
            ],
          },
        ],
      },
    ],
    "dcat:distribution": [
      {
        "@id": "urn:dist:ntua:pvplant-timeseries:http",
        "@type": "dcat:Distribution",
        "dct:format": { "@id": "application/csv" },
        "dcat:accessService": {
          "@id": "urn:dataservice:ntua:pvplant-timeseries",
          "@type": "dcat:DataService",
          "dcat:endpointURL": "https://connector.provider.ntua.com/api/energy/pvplant/timeseries",
          "dcat:endpointDescription": "NTUA PV Plant Timeseries Data API",
        },
      },
    ],
    contenttype: "text/csv",
    keywords: ["energy", "PV", "timeseries", "renewables"],
    name: "PV Plant Timeseries Data",
    description: "Hourly PV plant generation data collected by NTUA for energy research.",
  },
  {
    "@id": "urn:dataset:ntua:pvplant-weather",
    "@type": "dcat:Dataset",
    "odrl:hasPolicy": [
      {
        "@id": "urn:policy:ntua-academic-only",
        "@type": "odrl:Offer",
        "odrl:permission": [
          {
            "odrl:action": { "@id": "odrl:use" },
            "odrl:constraint": [
              {
                "@type": "odrl:Constraint",
                "odrl:leftOperand": { "@id": "odrl:purpose" },
                "odrl:operator": { "@id": "odrl:eq" },
                "odrl:rightOperand": "research",
              },
            ],
          },
        ],
      },
    ],
    "dcat:distribution": [
      {
        "@id": "urn:dist:ntua:pvplant-weather:http",
        "@type": "dcat:Distribution",
        "dct:format": { "@id": "application/json" },
        "dcat:accessService": {
          "@id": "urn:dataservice:ntua:pvplant-weather",
          "@type": "dcat:DataService",
          "dcat:endpointURL": "https://connector.provider.ntua.com/api/energy/pvplant/weather",
          "dcat:endpointDescription": "NTUA PV Plant Weather Data API",
        },
      },
    ],
    contenttype: "application/json",
    keywords: ["energy", "PV", "weather", "renewables"],
    name: "PV Plant Weather Data",
    description: "Weather conditions for PV plants, including irradiance and temperature, for research purposes.",
  },
  {
    "@id": "urn:dataset:ntua:pvplant-maintenance",
    "@type": "dcat:Dataset",
    "odrl:hasPolicy": [
      {
        "@id": "urn:policy:ntua-academic-only",
        "@type": "odrl:Offer",
        "odrl:permission": [
          {
            "odrl:action": { "@id": "odrl:use" },
            "odrl:constraint": [
              {
                "@type": "odrl:Constraint",
                "odrl:leftOperand": { "@id": "odrl:purpose" },
                "odrl:operator": { "@id": "odrl:eq" },
                "odrl:rightOperand": "research",
              },
            ],
          },
        ],
      },
    ],
    "dcat:distribution": [
      {
        "@id": "urn:dist:ntua:pvplant-maintenance:http",
        "@type": "dcat:Distribution",
        "dct:format": { "@id": "application/json" },
        "dcat:accessService": {
          "@id": "urn:dataservice:ntua:pvplant-maintenance",
          "@type": "dcat:DataService",
          "dcat:endpointURL": "https://connector.provider.ntua.com/api/energy/pvplant/maintenance",
          "dcat:endpointDescription": "NTUA PV Plant Maintenance Logs API",
        },
      },
    ],
    contenttype: "application/json",
    keywords: ["energy", "PV", "maintenance", "operational"],
    name: "PV Plant Maintenance Data",
    description: "Maintenance logs and operational status of PV plants collected by NTUA.",
  },
];

const renderPolicyDetails = (policy: PolicySet) => {
  const renderConstraints = (constraints?: ConstraintArr) => {
    if (!constraints || constraints.length === 0) return null;
    return (
      <div className="mt-2 space-y-1">
        {constraints.map((c, i) => {
          const left =
            typeof c["odrl:leftOperand"] === "string" ? c["odrl:leftOperand"] : c["odrl:leftOperand"]?.["@id"];
          const op = c["odrl:operator"]?.["@id"];
          const right = String(c["odrl:rightOperand"]);
          return (
            <div key={i} className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Left:</span> <span className="font-mono">{left}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Operator:</span> <span className="font-mono">{op}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Right:</span> <span className="font-mono">{right}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const RuleBlock = ({
    title,
    items,
  }: {
    title: "Permissions" | "Prohibitions" | "Obligations";
    items?: RuleItem[];
  }) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <span className="text-sm font-medium text-muted-foreground">{title}:</span>
        <div className="mt-1 space-y-2">
          {items.map((r, i) => (
            <div
              key={i}
              className={
                title === "Permissions"
                  ? "rounded bg-green-50 p-2 dark:bg-green-950/20"
                  : title === "Prohibitions"
                    ? "rounded bg-red-50 p-2 dark:bg-red-950/20"
                    : "rounded bg-blue-50 p-2 dark:bg-blue-950/20"
              }
            >
              <div className="text-xs">
                <div className="font-medium">
                  Action: <span className="font-mono">{r["odrl:action"]?.["@id"]}</span>
                </div>
                {renderConstraints(r["odrl:constraint"])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Policy Type:</span>
        <Badge variant="outline">{policy["@type"]}</Badge>
      </div>

      {policy["@id"] && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Policy ID:</span>
          <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{policy["@id"]}</span>
        </div>
      )}

      {policy["odrl:target"] && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target:</span>
          <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{policy["odrl:target"]}</span>
        </div>
      )}

      <RuleBlock title="Permissions" items={policy["odrl:permission"]} />
      <RuleBlock title="Prohibitions" items={policy["odrl:prohibition"]} />
      <RuleBlock title="Obligations" items={policy["odrl:obligation"]} />
    </div>
  );
};

// --------- component ----------
export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<Dataset | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isNegotiationDialogOpen, setIsNegotiationDialogOpen] = useState(false);
  const [negotiationType, setNegotiationType] = useState("accept");

  const categories = ["all", ...new Set(dummyDatasets.map((item) => item.name))];

  // filter logic
  const filteredItems = dummyDatasets.filter((item) => {
    const matchesSearch =
      item["@id"].toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item["dcat:distribution"][0]["dcat:accessService"]["dcat:endpointURL"]
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || item.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (dataset: Dataset) => {
    setSelectedItem(dataset);
    setIsDetailsDialogOpen(true);
  };

  const handleStartNegotiation = (dataset: Dataset) => {
    setSelectedItem(dataset);
    setIsNegotiationDialogOpen(true);
  };

  // icons used in the details dialog title
  const getContentIcon = (contentType: string) => {
    if (contentType.includes("json") || contentType.includes("csv") || contentType.includes("parquet")) {
      return <Database className="h-4 w-4" />;
    }
    if (contentType.includes("pdf") || contentType.includes("text")) {
      return <FileText className="h-4 w-4" />;
    }
    return <Globe className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catalog</h1>
          <p className="mt-1 text-muted-foreground">Browse and discover data assets from the federated dataspace</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Refresh Catalog
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dummyDatasets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(dummyDatasets.map((item) => item["dcat:distribution"][0])).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(dummyDatasets.map((item) => item.name)).size}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Data Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13.5 GB</div>
            <p className="text-xs text-muted-foreground">Across all assets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Federated Catalog</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search catalog..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataTable
            columns={catalogColumns({
              onViewDetails: handleViewDetails,
              onStartNegotiation: handleStartNegotiation,
            })}
            data={filteredItems}
          />
        </CardContent>
      </Card>

      {/* Details Dialog (unchanged UI) */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getContentIcon(selectedItem.contenttype)}
              {selectedItem?.["@id"]}
            </DialogTitle>
            <DialogDescription>Detailed information about this data asset</DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{selectedItem["@id"]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="outline">{selectedItem.name}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Content Type:</span>
                        <span className="font-mono text-xs">{selectedItem.contenttype}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Provider Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connector:</span>
                        <span
                          className="max-w-40 truncate rounded bg-muted px-2 py-1 font-mono text-xs"
                          title={selectedItem["dcat:distribution"][0]["dcat:accessService"]["dcat:endpointURL"]}
                        >
                          {selectedItem["dcat:distribution"][0]["dcat:accessService"]["dcat:endpointURL"]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Policy</h4>
                    <div className="space-y-2 text-sm">
                      {selectedItem["odrl:hasPolicy"] && selectedItem["odrl:hasPolicy"].length > 0 ? (
                        renderPolicyDetails(selectedItem["odrl:hasPolicy"][0])
                      ) : (
                        <div className="text-sm text-muted-foreground">No policy defined</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold">Keywords</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.keywords.length > 0 ? (
                        selectedItem.keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No keywords available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Description</h4>
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{selectedItem.description}</p>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => setIsNegotiationDialogOpen(true)}>Start Negotiation</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Negotiation Dialog (unchanged UI) */}
      <Dialog open={isNegotiationDialogOpen} onOpenChange={setIsNegotiationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contract Negotiation</DialogTitle>
            <DialogDescription>
              Choose how you want to proceed with the contract negotiation for "{selectedItem?.["@id"]}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup value={negotiationType} onValueChange={setNegotiationType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accept" id="accept" />
                <Label htmlFor="accept" className="text-sm font-normal">
                  Accept provider's offered contract
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="text-sm font-normal">
                  Use one of my policy definitions
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNegotiationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const method = negotiationType === "accept" ? "provider's contract" : "custom policy";
                toast.success(`Contract negotiation started using ${method} for "${selectedItem?.["@id"]}"`);
                setIsNegotiationDialogOpen(false);
              }}
            >
              Start Negotiation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
