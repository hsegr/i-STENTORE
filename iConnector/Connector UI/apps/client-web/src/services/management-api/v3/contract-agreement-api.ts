import { apiClient } from "../api-client.ts";
import type {} from "@/types/contract-agreement.ts";

export const fetchContractAgreements = async () => {
  const response = await fetch("/api/management/v3/contractagreements/request", {
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
  if (!response.ok) throw new Error("Failed to fetch contract agreements");
  return response.json();
};
