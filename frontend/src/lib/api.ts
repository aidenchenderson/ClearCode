/** Base URL for the backend API (no trailing slash). */
const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "http://localhost:5000";

const API_PREFIX = "/api/v1";

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
}

export interface SearchUsersResult {
  items: GitHubUser[];
  error?: string;
}

/**
 * Headers for API requests. Avoid Content-Type on GET to prevent CORS preflight.
 */
function getHeaders(token?: string, method: string = "GET"): HeadersInit {
  const headers: HeadersInit = {};
  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Search GitHub users by query (for typeahead). Returns items and optional error message.
 */
export async function searchGitHubUsers(query: string, token?: string): Promise<SearchUsersResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { items: [] };

  const url = `${API_BASE}${API_PREFIX}/github/search/users?q=${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, { headers: getHeaders(token, "GET") });
  const body = await res.json().catch(() => ({}));
  const items = (body?.items ?? []) as GitHubUser[];
  const error = body?.error;
  if (!res.ok && !error) {
    return { items: [], error: `Request failed (${res.status})` };
  }
  return { items, error };
}

/**
 * Look up a GitHub user by username via our backend (which calls GitHub API).
 * Returns user info or throws with message on error.
 */
export async function getGitHubUser(username: string, token?: string): Promise<GitHubUser> {
  const trimmed = username.trim().replace(/^@/, "");
  if (!trimmed) throw new Error("Username is required");

  const url = `${API_BASE}${API_PREFIX}/github/users/${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, { headers: getHeaders(token, "GET") });

  const body = await res.json().catch(() => ({}));
  const message = body?.error ?? (res.ok ? "" : `Request failed (${res.status})`);

  if (!res.ok) {
    throw new Error(message || `Failed to look up @${trimmed}`);
  }
  return body as GitHubUser;
}
