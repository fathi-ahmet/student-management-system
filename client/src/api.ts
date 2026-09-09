const BASE = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
  ?.VITE_API_URL || "http://localhost:5000/api";

export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("sms_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const get = (path: string) => api(path);
export const post = (path: string, body: any) =>
  api(path, { method: "POST", body: JSON.stringify(body) });
export const put = (path: string, body: any) =>
  api(path, { method: "PUT", body: JSON.stringify(body) });
export const del = (path: string) => api(path, { method: "DELETE" });
