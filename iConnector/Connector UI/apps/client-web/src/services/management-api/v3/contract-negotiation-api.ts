import { apiClient } from "../api-client.ts";

/**
 * Initiates a new contract negotiation.
 * @param {object} contractNegotiation The contract negotiation request body.
 * @returns {Promise<string>} A promise that resolves to the ID of the new contract negotiation.
 */
export async function initiateContractNegotiation<T>(contractNegotiation: T): Promise<string> {
  return apiClient<string>("v3/contract-negotiations", {
    method: "POST",
    body: JSON.stringify(contractNegotiation),
  });
}

/**
 * Queries contract negotiations based on a given query specification.
 * @param {object} querySpec The query specification to filter and sort the results.
 * @returns {Promise<T[]>} A promise that resolves to an array of contract negotiation objects.
 */
export async function queryNegotiations<T>(querySpec: object): Promise<T[]> {
  return apiClient<T[]>("v3/contract-negotiations/request", {
    method: "POST",
    body: JSON.stringify(querySpec),
  });
}

/**
 * Gets a contract negotiation by its ID.
 * @param {string} id The ID of the contract negotiation to retrieve.
 * @returns {Promise<T>} A promise that resolves to the contract negotiation object.
 */
export async function getNegotiation<T>(id: string): Promise<T> {
  return apiClient<T>(`v3/contract-negotiations/${id}`, {
    method: "GET",
  });
}

/**
 * Deletes a contract negotiation by its ID.
 * @param {string} id The ID of the contract negotiation to delete.
 * @returns {Promise<void>} A promise that resolves when the negotiation is successfully deleted.
 */
export async function deleteNegotiation(id: string): Promise<void> {
  return apiClient<void>(`v3/contract-negotiations/${id}`, {
    method: "DELETE",
  });
}

/**
 * Gets the contract agreement for a negotiation by its ID.
 * @param {string} id The ID of the contract negotiation.
 * @returns {Promise<T>} A promise that resolves to the contract agreement object.
 */
export async function getAgreementForNegotiation<T>(id: string): Promise<T> {
  return apiClient<T>(`v3/contract-negotiations/${id}/agreement`, {
    method: "GET",
  });
}

/**
 * Gets the current state of a contract negotiation by its ID.
 * @param {string} id The ID of the contract negotiation.
 * @returns {Promise<T>} A promise that resolves to the state of the negotiation.
 */
export async function getNegotiationState<T>(id: string): Promise<T> {
  return apiClient<T>(`v3/contract-negotiations/${id}/state`, {
    method: "GET",
  });
}

/**
 * Terminates a contract negotiation by its ID.
 * @param {string} id The ID of the contract negotiation to terminate.
 * @returns {Promise<void>} A promise that resolves when the negotiation is successfully terminated.
 */
export async function terminateNegotiation(id: string): Promise<void> {
  return apiClient<void>(`v3/contract-negotiations/${id}/terminate`, {
    method: "POST",
  });
}
