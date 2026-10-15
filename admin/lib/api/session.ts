import { API_URL, COOKIE_ACCESS, COOKIE_REFRESH, REQUIRED_ROLE } from "./config";

/**
 * Everything about HOW the admin signs in lives in this one file.
 * If the backend login changes (new endpoint, new response shape, SSO), only loginWithBackend and
 * refreshWithBackend need to change. No page or form depends on the details.
 */

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthError extends Error {}

const roleTitles = (user: unknown): string[] => {
  const rows = (user as { userRole?: { role?: { title?: string } }[] } | null)?.userRole ?? [];
  return rows.map((r) => r.role?.title).filter((t): t is string => !!t);
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { res, json: json as { data?: Record<string, unknown>; error?: string; message?: string } };
}

/** POST /auth/login. Returns the token pair, or throws AuthError with a message safe to show. */
export async function loginWithBackend(email: string, password: string): Promise<Tokens> {
  let out: Awaited<ReturnType<typeof post>>;
  try {
    out = await post("/auth/login", { email, password });
  } catch {
    throw new AuthError("Cannot reach the server. Check BLOG_API_URL and that the backend is running.");
  }
  const { res, json } = out;
  if (!res.ok) {
    throw new AuthError(res.status === 401 || res.status === 404 ? "Wrong email or password." : json.error || json.message || "Could not sign in.");
  }
  const d = json.data ?? {};
  const accessToken = String(d.accessToken ?? d.token ?? "");
  const refreshToken = String(d.refreshToken ?? "");
  if (!accessToken || !refreshToken) throw new AuthError("The server answered, but not with a login token.");
  if (!roleTitles(d.user).includes(REQUIRED_ROLE)) throw new AuthError("This account is not allowed to manage the blog.");
  return { accessToken, refreshToken };
}

/** POST /auth/refresh. Returns a new pair (the old refresh token stops working), or null when it is no longer valid. */
export async function refreshWithBackend(refreshToken: string): Promise<Tokens | null> {
  try {
    const { res, json } = await post("/auth/refresh", { refreshToken });
    if (!res.ok) return null;
    const d = json.data ?? {};
    const accessToken = String(d.accessToken ?? d.token ?? "");
    const next = String(d.refreshToken ?? "");
    return accessToken && next ? { accessToken, refreshToken: next } : null;
  } catch {
    return null;
  }
}

export async function logoutFromBackend(refreshToken: string) {
  try {
    await post("/auth/logout", { refreshToken });
  } catch {
    /* signing out locally is enough */
  }
}

/** Seconds until a JWT expires (reads the payload only; the backend verifies the signature). */
export function secondsLeft(jwt: string | undefined): number {
  if (!jwt) return 0;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp - Math.floor(Date.now() / 1000) : 0;
  } catch {
    return 0;
  }
}

export const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
export const ACCESS_COOKIE_AGE = 60 * 60 * 24; // the JWT itself is short-lived; the cookie just keeps it available
export const REFRESH_COOKIE_AGE = 60 * 60 * 24 * 30;
export { COOKIE_ACCESS, COOKIE_REFRESH };