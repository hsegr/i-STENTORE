import { useState } from "react";
import type {
  ContractDefinition,
  RawContractDefinition,
  CreateContractRequest,
  ContractDefinitionListResponse,
  ContractDefinitionListRequest,
} from "@/types/contract-definition.ts";
import type { ContractAgreement, RawContractAgreement } from "@/types/contract-agreement.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, FileText, Clock, CheckCircle, XCircle, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchContractDefinitions } from "@/services/management-api/v3/contract-definition-api.ts";
import { fetchContractAgreements } from "@/services/management-api/v3/contract-agreement-api.ts";

const createContractDefinition = async (contractData: CreateContractRequest) => {
  const response = await fetch("/api/management/v3/contractdefinitions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": "password",
    },
    body: JSON.stringify(contractData),
  });

  if (!response.ok) throw new Error("Failed to create contract definition");
  return response.json();
};

export default function Contracts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    id: "",
    policyId: "aPolicy",
    includeAssetSelector: false,
    assetId: "",
  });

  const queryClient = useQueryClient();

  const ContractListRequest: ContractDefinitionListRequest = {
    "@context": { "@vocab": "https://w3id.org/edc/v0.0.1/ns/" },
    "@type": "QuerySpec",
    offset: 0,
    limit: 10,
    //sortOrder: "DESC",
    //sortField: "fieldName",
    filterExpression: [],
  };
  const {
    data: rawContractAgreements = [],
    isLoading: isLoadingAgreements,
    isError: isErrorAgreements,
  } = useQuery<RawContractAgreement[], Error>({
    queryKey: ["contractAgreements"],
    queryFn: fetchContractAgreements,
  });

  const {
    data: rawContractDefinitions = [],
    isLoading: isLoadingDefinitions,
    isError: isErrorDefinitions,
  } = useQuery<ContractDefinitionListResponse[], Error>({
    queryKey: ["contractDefinitions"],
    queryFn: () => fetchContractDefinitions(ContractListRequest),
  });

  const createContractMutation = useMutation({
    mutationFn: createContractDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      setIsCreateModalOpen(false);
      setCreateForm({ id: "", policyId: "aPolicy", includeAssetSelector: false, assetId: "" });
      toast.success("Contract definition created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create contract definition: " + error.message);
    },
  });

  const handleCreateContract = () => {
    if (!createForm.id.trim()) {
      toast.error("Please enter a contract definition ID");
      return;
    }

    if (createForm.includeAssetSelector && !createForm.assetId.trim()) {
      toast.error("Please enter an asset ID for the asset selector");
      return;
    }

    const contractData: CreateContractRequest = {
      "@context": {
        "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
      },
      "@id": createForm.id,
      accessPolicyId: createForm.policyId,
      contractPolicyId: createForm.policyId,
      assetsSelector: createForm.includeAssetSelector
        ? [
            {
              "@type": "CriterionDto",
              operandLeft: "https://w3id.org/edc/v0.0.1/ns/id",
              operator: "=",
              operandRight: createForm.assetId,
            },
          ]
        : [],
    };

    createContractMutation.mutate(contractData);
  };

  if (isLoadingAgreements || isLoadingDefinitions) return <div className="p-6">Loading contracts...</div>;
  if (isErrorAgreements || isErrorDefinitions) return <div className="p-6 text-red-500">Failed to load contracts.</div>;

  const filteredContractAgreements: ContractAgreement[] = rawContractAgreements
    .map((contractAgreement: RawContractAgreement): ContractAgreement => {
      const startDate = new Date(contractAgreement.contractSigningDate * 1000).toISOString().split("T")[0];
      const endDate = "2026-01-01";
      const status = contractAgreement.state === "FINALIZED" ? "active" : "negotiating";
      return {
        id: contractAgreement.agreementId,
        assetId: contractAgreement.assetId,
        assetName: `Asset-${contractAgreement.assetId.substring(0, 5)}`, // Placeholder name
        counterParty: contractAgreement.providerId,
        status: status as "active" | "negotiating" | "expired",
        startDate: startDate,
        endDate: endDate,
        policy: "Default PolicyDefinition", // Placeholder
        negotiationId: "N/A",
      };
    })
    .filter(
      (agreement) =>
        agreement.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.counterParty.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const filteredContractDefinitions: ContractDefinition[] = rawContractDefinitions
    .map((contractDefinition: RawContractDefinition): ContractDefinition => {
      return {
        id: contractDefinition["@id"],
        name: `Def-${contractDefinition["@id"].substring(0, 5)}`, // Placeholder name
        assetId: "N/A", // Not available in raw data
        assetName: "N/A", // Placeholder
        accessPolicy: contractDefinition.accessPolicyId,
        contractPolicy: contractDefinition.contractPolicyId,
        created: "2024-01-01", // Placeholder
      };
    })
    .filter(
      (contractDefinition: ContractDefinition) =>
        contractDefinition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contractDefinition.assetName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "negotiating":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Clock className="mr-1 h-3 w-3" />
            Negotiating
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
          <p className="mt-1 text-muted-foreground">Manage contract agreements and definitions for data sharing</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Contract Definition
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredContractAgreements.filter((c) => c.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negotiating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredContractAgreements.filter((c) => c.status === "negotiating").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredContractDefinitions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">New contracts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agreements" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agreements">Contract Agreements</TabsTrigger>
            <TabsTrigger value="definitions">Contract Definitions</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="agreements">
          <Card>
            <CardHeader>
              <CardTitle>Contract Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Counter Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractAgreements.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{contract.assetName}</div>
                            <div className="text-sm text-muted-foreground">{contract.assetId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{contract.counterParty}</TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell className="text-sm">{contract.startDate}</TableCell>
                      <TableCell className="text-sm">{contract.endDate}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {contract.policy}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Download Contract</DropdownMenuItem>
                            {contract.status === "active" && (
                              <DropdownMenuItem className="text-destructive">Terminate Contract</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="definitions">
          <Card>
            <CardHeader>
              <CardTitle>Contract Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Definition</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Access Policy</TableHead>
                    <TableHead>Contract Policy</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContractDefinitions.map((definition) => (
                    <TableRow key={definition.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{definition.name}</div>
                            <div className="text-sm text-muted-foreground">{definition.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{definition.assetName}</div>
                          <div className="text-sm text-muted-foreground">{definition.assetId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {definition.accessPolicy}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {definition.contractPolicy}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{definition.created}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Definition</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete Definition</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[500px] rounded-lg bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Contract Definition</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="contractId">Contract Definition ID</Label>
                <Input
                  id="contractId"
                  value={createForm.id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="e.g., contract-def-001"
                />
              </div>

              <div>
                <Label htmlFor="policySelect">Policy</Label>
                <Select
                  value={createForm.policyId}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, policyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aPolicy">Basic Policy (aPolicy)</SelectItem>
                    <SelectItem value="eu-policy">EU Location Policy (eu-policy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeAssetSelector"
                  checked={createForm.includeAssetSelector}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, includeAssetSelector: e.target.checked }))}
                />
                <Label htmlFor="includeAssetSelector">Include Asset Selector</Label>
              </div>

              {createForm.includeAssetSelector && (
                <div>
                  <Label htmlFor="assetId">Asset ID</Label>
                  <Input
                    id="assetId"
                    value={createForm.assetId}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, assetId: e.target.value }))}
                    placeholder="e.g., my-asset-001"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContract}>Create Contract Definition</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
