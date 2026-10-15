"use client";

import { useTransition } from "react";

export default function ConfirmButton({ action, message, children, className }: { action: () => Promise<unknown>; message: string; children: React.ReactNode; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={className ?? "font-body text-[12px] text-[var(--tv-pink)] hover:underline disabled:opacity-50"}
      onClick={() => {
        if (window.confirm(message)) start(async () => void (await action()));
      }}
    >
      {pending ? "…" : children}
    </button>
  );
}
