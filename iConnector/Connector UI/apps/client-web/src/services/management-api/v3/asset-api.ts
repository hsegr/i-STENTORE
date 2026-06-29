import { apiClient } from "../api-client.ts";
import type {
  AssetCreationRequest,
  AssetCreationResponse,
  AssetListRequest,
  AssetListResponse,
  Asset,
} from "@/types/asset.ts";

export async function createAsset(requestBody: AssetCreationRequest): Promise<AssetCreationResponse> {
  return apiClient<AssetCreationResponse>("v3/assets", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export async function requestAssets(requestBody: AssetListRequest): Promise<AssetListResponse> {
  return apiClient<AssetListResponse>("v3/assets/request", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export async function getAssetById(id: string): Promise<Asset> {
  return apiClient<Asset>(`v3/assets/${id}`, {
    method: "GET",
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return apiClient<void>(`v3/assets/${id}`, {
    method: "DELETE",
  });
}
