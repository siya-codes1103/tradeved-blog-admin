"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_MODE, COOKIE_ACCESS, COOKIE_REFRESH } from "@/lib/api/config";
import { ACCESS_COOKIE_AGE, AuthError, cookieBase, loginWithBackend, logoutFromBackend, REFRESH_COOKIE_AGE } from "@/lib/api/session";

export async function login(_prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  if (!API_MODE) redirect("/");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    const t = await loginWithBackend(email, password);
    const jar = await cookies();
    jar.set(COOKIE_ACCESS, t.accessToken, { ...cookieBase, maxAge: ACCESS_COOKIE_AGE });
    jar.set(COOKIE_REFRESH, t.refreshToken, { ...cookieBase, maxAge: REFRESH_COOKIE_AGE });
  } catch (e) {
    return { error: e instanceof AuthError ? e.message : "Could not sign in." };
  }
  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  const rt = jar.get(COOKIE_REFRESH)?.value;
  if (rt) await logoutFromBackend(rt);
  jar.delete(COOKIE_ACCESS);
  jar.delete(COOKIE_REFRESH);
  redirect("/login");
}