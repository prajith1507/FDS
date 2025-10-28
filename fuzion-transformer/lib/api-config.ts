/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */
//https://cpt4x27j-4001.inc1.devtunnels.ms
const backendUrl = "https://0shfds9x-4001.inc1.devtunnels.ms";
export const API_BASE_URL = backendUrl.replace(/\/+$/, "");

// Log the API base URL for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("[v0] API Base URL:", API_BASE_URL);
}
