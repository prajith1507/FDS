/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */
const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://obl-syncapi.fuzionest.com";
export const API_BASE_URL = backendUrl.replace(/\/+$/, "");

// Log the API base URL for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("[v0] API Base URL:", API_BASE_URL);
}
