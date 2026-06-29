import { apiClient } from "../api-client.ts";
import type { CatalogRequest, CatalogResponse, DatasetRequest, Dataset } from "@/types/catalog.ts";

export async function requestDataset(requestBody: DatasetRequest): Promise<Dataset> {
  return apiClient<Dataset>("v3/catalogs/dataset/request", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export async function requestCatalog(requestBody: CatalogRequest): Promise<CatalogResponse> {
  return apiClient<CatalogResponse>("v3/catalogs/request", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}
