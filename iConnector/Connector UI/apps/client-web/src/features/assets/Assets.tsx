import { useState } from "react";
import type { Asset, AssetDataItem, AssetCreationRequest, AssetListRequest, AssetListResponse } from "@/types/asset.ts";
import { createAsset, requestAssets, getAssetById, deleteAsset } from "@/services/management-api/v3/asset-api.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { columns as assetColumns } from "./columns.tsx";
import { DataTable } from "@/components/common/data-table.tsx";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Assets() {
  const [selectedAssetData, setSelectedAssetData] = useState<AssetDataItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    id: "",
    name: "",
    contentType: "application/json",
    baseUrl: "",
  });

  const queryClient = useQueryClient();

  const assetListRequestBody: AssetListRequest = {
    "@type": "QuerySpec",
    offset: 0,
    limit: 10,
    sortOrder: "DESC",
    sortField: "fieldName",
    filterExpression: [],
  };

  const {
    data: assets = [],
    isLoading,
    isError,
  } = useQuery<AssetListResponse, Error>({
    queryKey: ["assets"],
    queryFn: () => requestAssets(assetListRequestBody),
  });

  const handleViewDetails = async (asset: Asset): Promise<void> => {
    const id = asset["@id"];

    try {
      const response = await fetch("http://localhost:3000/assets");
      const allData: AssetDataItem[] = await response.json();
      const matched = allData.find((item) => item.id === id);
      setSelectedAssetData(matched || null);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching asset details:", error);
    }
  };

  const createAssetMutation = useMutation({
    mutationFn: (assetData: AssetCreationRequest) => createAsset(assetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      setIsCreateModalOpen(false);
      setCreateForm({ id: "", name: "", contentType: "application/json", baseUrl: "" });
      toast.success("Asset created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create asset: " + error.message);
    },
  });

  const handleCreateAsset = () => {
    const assetRequest: AssetCreationRequest = {
      "@context": {
        "@vocab": "https://w3id.org/edc/v0.0.1/ns/",
        edc: "https://w3id.org/edc/v0.0.1/ns/",
        odrl: "http://www.w3.org/ns/odrl/2/",
      },
      "@id": createForm.id,
      properties: {
        name: createForm.name,
        contenttype: createForm.contentType,
      },
      dataAddress: {
        type: "HttpData",
        name: createForm.name,
        baseUrl: createForm.baseUrl,
        proxyPath: "true",
      },
    };

    createAssetMutation.mutate(assetRequest);
  };

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset deleted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to delete asset: " + error.message);
    },
  });

  const handleDeleteAsset = (assetId: string) => {
    deleteAssetMutation.mutate(assetId);
  };

  const columns = assetColumns({ onViewDetails: handleViewDetails, onDeleteAsset: handleDeleteAsset });

  if (isLoading) return <div className="p-6">Loading assets...</div>;
  if (isError) return <div className="p-6 text-red-500">Failed to load assets</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets</h1>
          <p className="mt-1 text-muted-foreground">Manage your data assets and make them available in the dataspace</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(assets.map((a) => a.properties.contentType)).size}</div>
            <p className="text-xs text-muted-foreground">Different formats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Latest Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.0.1</div>
            <p className="text-xs text-muted-foreground">Most recent asset</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={assets} />
        </CardContent>
      </Card>

      {/* Create Asset Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[80vh] w-[500px] overflow-auto rounded-lg bg-background p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Create New Asset</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="asset-id">Asset ID</Label>
                <Input
                  id="asset-id"
                  placeholder="e.g., Demo3_VRFB_Asset"
                  value={createForm.id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, id: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="asset-name">Name</Label>
                <Input
                  id="asset-name"
                  placeholder="e.g., product description"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="content-type">Content Type</Label>
                <Input
                  id="content-type"
                  placeholder="e.g., application/json"
                  value={createForm.contentType}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, contentType: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="base-url">Base URL</Label>
                <Input
                  id="base-url"
                  placeholder="e.g., http://json-server:3000/assets/urn:example:001"
                  value={createForm.baseUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateAsset}
                disabled={!createForm.id || !createForm.name || !createForm.baseUrl || createAssetMutation.isPending}
              >
                {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isModalOpen && selectedAssetData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[80vh] w-[500px] overflow-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-bold">Asset Details</h2>

            {Object.entries(selectedAssetData)
              .filter(([key]) => key !== "id")
              .map(([key, value]) => {
                if (typeof value === "object" && value !== null && "value" in value && "unit" in value) {
                  return (
                    <div key={key} className="flex justify-between border-b py-2">
                      <span className="font-medium">{key}</span>
                      <span>
                        {(value as { value: number; unit: string }).value}{" "}
                        {(value as { value: number; unit: string }).unit}
                      </span>
                    </div>
                  );
                }
                return null;
              })}

            <div className="mt-4 text-right">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
