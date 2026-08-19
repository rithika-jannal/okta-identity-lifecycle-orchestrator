/**
 * Northwind IAM — API client configuration
 *
 * All REST calls go through this module.
 * Set VITE_API_BASE_URL in your .env file to point at the Spring Boot backend:
 *
 *   VITE_API_BASE_URL=http://localhost:8080/api
 *
 * The local backend is the default so a missing .env file cannot silently show
 * demo identities in the live application.
 */

export const API_BASE_URL = (
  (import.meta.env as Record<string, string | undefined>)["VITE_API_BASE_URL"] ||
  "http://localhost:8080/api"
).replace(/\/$/, "");

/** True when a real backend URL has been configured */
export const IS_CONNECTED = !!API_BASE_URL;

/**
 * Standard fetch wrapper with JSON headers.
 * Throws on network/HTTP errors so callers cannot present stale demo data as live data.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...options,
    });
    if (!res.ok) {
      const message = await res.text();
      throw new Error(message || `API request failed (${res.status})`);
    }
    if (res.status === 204) return null;
    const json: unknown = await res.json();
    if (
      json &&
      typeof json === "object" &&
      "data" in json &&
      "success" in json
    ) {
      return (json as { data: T }).data;
    }
    return json as T;
  } catch (err) {
    console.error(`[IAM API] Network error on ${endpoint}:`, err);
    throw err instanceof Error ? err : new Error("Unable to reach the backend");
  }
}

/**
 * REST endpoint map — kept in sync with TEAM_README contract (Member 8).
 * Update these if the Spring Boot controller paths change.
 */
export const ENDPOINTS = {
  users: "/users",
  user: (id: string) => `/users/${id}`,
  usersExport: "/users/export",

  joiner: "/lifecycle/joiner",
  mover: (id: string) => `/lifecycle/mover/${id}`,
  leaver: (id: string) => `/lifecycle/leaver/${id}`,

  impact: (id: string) => `/impact/${id}`,
  whatIf: "/whatif",

  approve: (simId: string) => `/approval/${simId}/approve`,
  reject: (simId: string) => `/approval/${simId}/reject`,
  execute: (simId: string) => `/execution/${simId}`,

  drift: "/drift",
  remediateDrift: (id: string) => `/drift/${id}/remediate`,

  audit: "/audit",
  bulk: "/bulk",
} as const;
