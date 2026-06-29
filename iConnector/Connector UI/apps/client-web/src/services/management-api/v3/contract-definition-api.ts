import { apiClient } from "../api-client.ts";
import type { ContractDefinitionListRequest, ContractDefinitionListResponse } from "@/types/contract-definition.ts";

/*export const fetchContractDefinitions = async () => {
  const response = await fetch("/api/management/v3/contractdefinitions/request", {
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
  if (!response.ok) throw new Error("Failed to fetch contract definitions");
  return response.json();
};*/

export const fetchContractDefinitions = async (
  requestBody: ContractDefinitionListRequest,
): Promise<ContractDefinitionListResponse> => {
  return apiClient<ContractDefinitionListResponse>("v3/contractdefinitions/request", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
};
