import { NextResponse, type NextRequest } from "next/server";

/**
 * API mode only: keeps the admin behind a login and quietly renews the short-lived access token.
 * (Server components cannot set cookies, so the renewal has to happen here.)
 */
const API_URL = (process.env.BLOG_API_URL ?? "").replace(/\/$/, "");
const AT = "tv_at";
const RT = "tv_rt";

function secondsLeft(jwt?: string): number {
  if (!jwt) return 0;
  try {
    const payload = JSON.parse(atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp - Math.floor(Date.now() / 1000) : 0;
  } catch {
    return 0;
  }
}

export async function middleware(req: NextRequest) {
  if (!API_URL) return NextResponse.next();
  const { pathname } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const toLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const res = NextResponse.redirect(url);
    res.cookies.delete(AT);
    res.cookies.delete(RT);
    return res;
  };

  const access = req.cookies.get(AT)?.value;
  const refresh = req.cookies.get(RT)?.value;
  if (!refresh) return toLogin();
  if (secondsLeft(access) > 30) return NextResponse.next();

  // Access token missing or about to expire: swap the refresh token for a new pair.
  let pair: { accessToken: string; refreshToken: string } | null = null;
  try {
    const r = await fetch(`${API_URL}/auth/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: refresh }), cache: "no-store" });
    if (r.ok) {
      const d = ((await r.json()) as { data?: Record<string, unknown> }).data ?? {};
      const a = String(d.accessToken ?? d.token ?? "");
      const n = String(d.refreshToken ?? "");
      if (a && n) pair = { accessToken: a, refreshToken: n };
    }
  } catch {
    /* backend unreachable: fall through to login */
  }
  if (!pair) return toLogin();

  // Make the new tokens visible to this very request, and store them in the browser for the next ones.
  const headers = new Headers(req.headers);
  const jar = (headers.get("cookie") ?? "")
    .split(/;\s*/)
    .filter((c) => c && !c.startsWith(`${AT}=`) && !c.startsWith(`${RT}=`));
  jar.push(`${AT}=${pair.accessToken}`, `${RT}=${pair.refreshToken}`);
  headers.set("cookie", jar.join("; "));
  const res = NextResponse.next({ request: { headers } });
  const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };
  res.cookies.set(AT, pair.accessToken, { ...base, maxAge: 60 * 60 * 24 });
  res.cookies.set(RT, pair.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  return res;
}

export const config = { matcher: ["/((?!_next/|favicon.ico|templates/|blog-covers/).*)"] };