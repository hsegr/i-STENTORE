import { apiClient } from "../api-client.ts";

/**
 * Initiates a new transfer process.
 * @param {object} transferRequest The transfer request body.
 * @returns {Promise<string>} A promise that resolves to the ID of the new transfer process.
 */
export async function initiateTransferProcess<T>(transferRequest: T): Promise<string> {
  return apiClient<string>("v3/transferprocesses", {
    method: "POST",
    body: JSON.stringify(transferRequest),
  });
}

/**
 * Queries transfer processes based on a given query specification.
 * @param {object} querySpec The query specification to filter and sort the results.
 * @returns {Promise<T[]>} A promise that resolves to an array of transfer process objects.
 */
export async function queryTransferProcesses<T>(querySpec: object): Promise<T[]> {
  return apiClient<T[]>("v3/transferprocesses/request", {
    method: "POST",
    body: JSON.stringify(querySpec),
  });
}

/**
 * Gets a transfer process by its ID.
 * @param {string} id The ID of the transfer process to retrieve.
 * @returns {Promise<T>} A promise that resolves to the transfer process object.
 */
export async function getTransferProcess<T>(id: string): Promise<T> {
  return apiClient<T>(`v3/transferprocesses/${id}`, {
    method: "GET",
  });
}

/**
 * Deprovisions a transfer process by its ID.
 * @param {string} id The ID of the transfer process to deprovision.
 * @returns {Promise<void>} A promise that resolves when the deprovisioning is successfully requested.
 */
export async function deprovisionTransferProcess(id: string): Promise<void> {
  return apiClient<void>(`v3/transferprocesses/${id}/deprovision`, {
    method: "POST",
  });
}

/**
 * Resumes a suspended transfer process by its ID.
 * @param {string} id The ID of the transfer process to resume.
 * @returns {Promise<void>} A promise that resolves when the resumption is successfully requested.
 */
export async function resumeTransferProcess(id: string): Promise<void> {
  return apiClient<void>(`v3/transferprocesses/${id}/resume`, {
    method: "POST",
  });
}

/**
 * Gets the current state of a transfer process by its ID.
 * @param {string} id The ID of the transfer process.
 * @returns {Promise<T>} A promise that resolves to the state of the transfer process.
 */
export async function getTransferProcessState<T>(id: string): Promise<T> {
  return apiClient<T>(`v3/transferprocesses/${id}/state`, {
    method: "GET",
  });
}

/**
 * Suspends a transfer process by its ID.
 * @param {string} id The ID of the transfer process to suspend.
 * @param {object} requestBody The suspension request body.
 * @returns {Promise<void>} A promise that resolves when the suspension is successfully requested.
 */
export async function suspendTransferProcess(id: string, requestBody: object): Promise<void> {
  return apiClient<void>(`v3/transferprocesses/${id}/suspend`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

/**
 * Terminates a transfer process by its ID.
 * @param {string} id The ID of the transfer process to terminate.
 * @param {object} requestBody The termination request body.
 * @returns {Promise<void>} A promise that resolves when the termination is successfully requested.
 */
export async function terminateTransferProcess(id: string, requestBody: object): Promise<void> {
  return apiClient<void>(`v3/transferprocesses/${id}/terminate`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}
