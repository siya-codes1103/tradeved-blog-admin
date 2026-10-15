import { redirect } from "next/navigation";
import { API_MODE } from "@/lib/api/config";
import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (!API_MODE) redirect("/");
  const { expired } = await searchParams;
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[var(--tv-line)] bg-[var(--tv-card)] p-7">
      <h2 className="font-heading text-[22px] font-extrabold text-[var(--tv-ink)]">Sign in</h2>
      <p className="mt-1 font-body text-[14px] text-[var(--tv-body)]">Use your TradeVed admin account. Only super admins can manage the blog.</p>
      {expired && <p role="status" className="mt-4 rounded-xl bg-[var(--tv-soft)] px-4 py-3 font-body text-[13px] text-[var(--tv-ink)]">Your session ended. Please sign in again.</p>}
      <LoginForm />
    </div>
  );
}