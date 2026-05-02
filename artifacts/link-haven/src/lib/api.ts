import { getAuthToken } from "./auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function apiCall(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `API error ${res.status}`);
  return data;
}
