const EDC_PROXY_PATH = "/management-api/management";
const API_KEY = "your-api-key";

async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${EDC_PROXY_PATH}/${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": API_KEY,
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
