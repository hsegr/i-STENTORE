const IDS_PROXY_PATH = "/api/management";
const API_TOKEN = "change_me_1";

async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${IDS_PROXY_PATH}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-token": API_TOKEN,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "An API error occurred");
  }

  // Handle cases where the response body is empty (e.g., DELETE requests)
  const isJsonResponse = response.headers.get("content-type")?.includes("application/json");
  return isJsonResponse ? response.json() : (response.text() as T);
}

export { apiClient };
