"use client";

import { useActionState } from "react";
import { btn, field } from "@/components/ui";
import { login } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-5 space-y-4">
      <label className="block font-heading text-[13px] font-bold text-[var(--tv-ink)]">
        Email
        <input name="email" type="email" autoComplete="username" required className={field} />
      </label>
      <label className="block font-heading text-[13px] font-bold text-[var(--tv-ink)]">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state?.error && <p role="alert" className="rounded-xl bg-[#CC0066]/10 px-4 py-3 font-body text-[13px] font-semibold text-[#CC0066]">{state.error}</p>}
      <button className={btn} disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}