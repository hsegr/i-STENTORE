import { apiClient } from "../api-client.ts";

/**
 * Retrieves a single EDR (Endpoint Data Reference) entry by its transfer process ID.
 * The API returns a Data Address as a JSON object.
 * @param {string} transferProcessId The ID of the transfer process associated with the EDR entry.
 * @returns {Promise<T>} A promise that resolves to the retrieved data address JSON object.
 */
export async function getEdrEntryDataAddress<T>(transferProcessId: string): Promise<T> {
  return apiClient<T>(`v3/edr-cache/${transferProcessId}/dataaddress`, {
    method: "GET",
  });
}

/**
 * Queries EDR (Endpoint Data Reference) entries from the EDR Cache based on a given query specification.
 * @param {object} querySpec The query specification to filter and sort the results.
 * @returns {Promise<T[]>} A promise that resolves to an array of EDR entries.
 */
export async function requestEdrEntries<T>(querySpec: object): Promise<T[]> {
  return apiClient<T[]>("v3/edr-cache/request", {
    method: "POST",
    body: JSON.stringify(querySpec),
  });
}

/**
 * Deletes an EDR (Endpoint Data Reference) entry from the EDR Cache.
 * @param {string} transferProcessId The ID of the transfer process to delete.
 * @returns {Promise<void>} A promise that resolves when the EDR entry is successfully deleted.
 */
export async function removeEdrEntry(transferProcessId: string): Promise<void> {
  return apiClient<void>(`v3/edr-cache/${transferProcessId}`, {
    method: "DELETE",
  });
}
