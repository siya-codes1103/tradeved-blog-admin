import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL, COOKIE_ACCESS } from "./config";

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: Record<string, string>) {
    super(message);
  }
}

/** Calls the backend as the signed-in admin. A rejected login sends the person to /login. */
export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const token = (await cookies()).get(COOKIE_ACCESS)?.value;
  if (!token) redirect("/login");
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, body, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }
  if (res.status === 401) redirect("/login?expired=1");
  const text = await res.text();
  let json: { data?: T; error?: string; message?: string; fieldErrors?: Record<string, string> } = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) throw new ApiError(res.status, res.status === 403 ? "You do not have permission (SUPER_ADMIN only)." : json.error || json.message || `Request failed (${res.status})`, json.fieldErrors);
  return (json.data ?? (json as unknown)) as T;
}