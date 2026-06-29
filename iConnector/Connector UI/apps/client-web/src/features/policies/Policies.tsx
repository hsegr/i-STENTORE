import { useState } from "react";
import type {
  PolicyRule,
  PolicyDefinition,
  RawPolicyDefinition,
  CreatePolicyRequest,
} from "@/types/policy-definition.ts";
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
import { Search, Plus, MoreHorizontal, Shield, Lock, Clock, Globe, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const fetchPolicyDefinitions = async () => {
  const response = await fetch("/api/management/v3/policydefinitions/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": "password",
    },
    body: JSON.stringify({
      "@context": { "@vocab": "https://w3id.org/edc/v0.0.1/ns/" },
      "@type": "QuerySpec",
      offset: 0,
      limit: 10,
      filterExpression: [],
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch policy definitions");
  return response.json();
};

const createPolicyDefinition = async (policyData: CreatePolicyRequest) => {
  const response = await fetch("/api/management/v3/policydefinitions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": "password",
    },
    body: JSON.stringify(policyData),
  });

  if (!response.ok) throw new Error("Failed to create policy");
  return response.json();
};

export default function Policies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    id: "",
    template: "basic",
  });

  const queryClient = useQueryClient();

  const {
    data: rawPolicies = [],
    isLoading,
    isError,
  } = useQuery<RawPolicyDefinition[], Error>({
    queryKey: ["policies"],
    queryFn: fetchPolicyDefinitions,
  });

  const createPolicyMutation = useMutation({
    mutationFn: createPolicyDefinition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policies"] });
      setIsCreateModalOpen(false);
      setCreateForm({ id: "", template: "basic" });
      toast.success("PolicyDefinition definition created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create policy definition: " + error.message);
    },
  });

  const handleCreatePolicy = () => {
    if (!createForm.id.trim()) {
      toast.error("Please enter a policy ID");
      return;
    }

    const policyData: CreatePolicyRequest =
      createForm.template === "eu-location"
        ? {
            "@context": {
              "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
              odrl: "http://www.w3.org/ns/odrl/2/",
            },
            "@id": createForm.id,
            policy: {
              "@context": "http://www.w3.org/ns/odrl.jsonld",
              "@type": "Set",
              permission: [
                {
                  action: "use",
                  constraint: {
                    "@type": "AtomicConstraint",
                    leftOperand: "location",
                    operator: {
                      "@id": "odrl:eq",
                    },
                    rightOperand: "eu",
                  },
                },
              ],
              prohibition: [],
              obligation: [],
            },
          }
        : {
            "@context": {
              "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
              odrl: "http://www.w3.org/ns/odrl/2/",
            },
            "@id": createForm.id,
            policy: {
              "@context": "http://www.w3.org/ns/odrl.jsonld",
              "@type": "Set",
              permission: [],
              prohibition: [],
              obligation: [],
            },
          };

    createPolicyMutation.mutate(policyData);
  };

  if (isLoading) return <div className="p-6">Loading policies...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load policies.</div>;

  const filteredPolicies: PolicyDefinition[] = rawPolicies
    .map((policy: RawPolicyDefinition): PolicyDefinition => {
      const id = policy["@id"];
      // Placeholder values for type, name, and description
      const policyType: "access" | "contract" | "usage" = "access";
      let name: string = id;
      let description: string = "PolicyDefinition description unavailable.";
      const rules: PolicyRule[] = [];

      // Simple logic to extract rules and create a name/description
      const permission = policy.policy?.permission?.[0];
      if (permission?.constraint) {
        const constraint = permission.constraint;
        rules.push({
          type: (constraint.leftOperand as string) || "unknown",
          value: (constraint.rightOperand as string) || "unknown",
        });
        name = `${constraint.leftOperand} for ${constraint.rightOperand}`;
        description = `Access policy for: ${name}`;
      }

      return {
        id,
        name,
        type: policyType,
        description,
        rules,
        created: "2024-01-01", // Placeholder
        usageCount: 0, // Placeholder
      };
    })
    .filter(
      (policy: PolicyDefinition) =>
        policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "access":
        return <Lock className="h-4 w-4 text-blue-500" />;
      case "contract":
        return <Shield className="h-4 w-4 text-green-500" />;
      case "usage":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      access: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      contract: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      usage: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };

    return (
      <Badge variant="secondary" className={colors[type as keyof typeof colors] || ""}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Policies</h1>
          <p className="mt-1 text-muted-foreground">Define access, usage and contract policies for data sharing</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Policy Definition
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPolicies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Access Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPolicies.filter((p) => p.type === "access").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usage Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPolicies.filter((p) => p.type === "usage").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contract Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPolicies.filter((p) => p.type === "contract").length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="policies">Policy Definitions</TabsTrigger>
            <TabsTrigger value="templates">Policy Templates</TabsTrigger>
          </TabsList>
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Policy Definitions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Rules</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(policy.type)}
                          <div>
                            <div className="font-medium">{policy.name}</div>
                            <div className="text-sm text-muted-foreground">{policy.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(policy.type)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {policy.rules.slice(0, 2).map((rule, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {rule.type}: {rule.value}
                            </Badge>
                          ))}
                          {policy.rules.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{policy.rules.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{policy.usageCount}</span>
                          <span className="text-muted-foreground"> contracts</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{policy.created}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit Policy</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>View Usage</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete Policy</DropdownMenuItem>
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

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Policy Templates</CardTitle>
            </CardHeader>
            {/*
                      <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredTemplates.map((template) => (
                                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                      <CardHeader className="pb-3">
                                          <div className="flex justify-between items-start">
                                              <div>
                                                  <CardTitle className="text-lg">{template.name}</CardTitle>
                                                  <Badge variant="outline" className="text-xs mt-1">
                                                      {template.category}
                                                  </Badge>
                                              </div>
                                              <Button variant="outline" size="sm">
                                                  Use Template
                                              </Button>
                                          </div>
                                      </CardHeader>
                                      <CardContent>
                                          <p className="text-sm text-muted-foreground mb-3">
                                              {template.description}
                                          </p>
                                          <div className="space-y-1">
                                              {template.rules.map((rule, index) => (
                                                  <div key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                                      {rule}
                                                  </div>
                                              ))}
                                          </div>
                                      </CardContent>
                                  </Card>
                              ))}
                          </div>
                      </CardContent>
                      */}
          </Card>
        </TabsContent>
      </Tabs>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[500px] rounded-lg bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Policy Definition</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="policyId">Policy ID</Label>
                <Input
                  id="policyId"
                  value={createForm.id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder="e.g., my-policy-001"
                />
              </div>

              <div>
                <Label htmlFor="template">Policy Template</Label>
                <Select
                  value={createForm.template}
                  onValueChange={(value) => setCreateForm((prev) => ({ ...prev, template: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Policy (Empty)</SelectItem>
                    <SelectItem value="eu-location">EU Location Restriction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePolicy}>Create Policy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
