import type { Metadata } from "next";
import { Open_Sans, Raleway } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminTabs from "@/components/AdminTabs";
import { API_MODE } from "@/lib/api/config";
import { logout } from "@/app/login/actions";
import { SITE_ORIGIN } from "@/lib/site-origin";
import "./globals.css";

const heading = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const body = Open_Sans({ subsets: ["latin"], variable: "--font-opensans", display: "swap" });

export const metadata: Metadata = { title: "TradeVed Blog Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * File mode writes files into your project, so it refuses to run outside `npm run dev`.
 * API mode (BLOG_API_URL set) saves through the backend behind a login, so it may be deployed.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && !API_MODE) notFound();
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="tv min-h-screen font-body">
        <header className="tv-dark">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 font-heading text-[20px] font-extrabold text-[#F7FAF5]">
              <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#9BEC00] text-[12px] text-[#9BEC00]">▮</span>
              Trade<span className="text-[#9BEC00]">Ved</span>
            </Link>
            <div className="flex items-center gap-5">
              <a href={`${SITE_ORIGIN}/blog`} target="_blank" rel="noreferrer" className="font-heading text-[13px] font-bold text-[#D3DEC8] hover:text-[#9BEC00]">
                Open blog ↗
              </a>
              {API_MODE && (
                <form action={logout}>
                  <button className="font-heading text-[13px] font-bold text-[#D3DEC8] hover:text-[#9BEC00]">Sign out</button>
                </form>
              )}
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-8 md:px-6">
          <span className="inline-block rounded-full bg-[#0F1209] px-3 py-1 font-heading text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9BEC00]">Admin</span>
          <h1 className="mt-2 font-heading text-[32px] font-extrabold leading-[1.1] text-[var(--tv-ink)] md:text-[40px]">Blog Admin</h1>
          <div className="mt-6">
            <AdminTabs showCategories={API_MODE} />
          </div>
          <div className="mt-6">{children}</div>
        </div>
        <footer className="border-t border-[var(--tv-line)] px-6 py-6 text-center font-body text-[12px] text-[var(--tv-mut)]">
          {API_MODE ? "Admin tool. Saves articles through the TradeVed backend. Not part of the live website." : "Local tool. Saves articles into ../site/content. Not part of the live website."}
        </footer>
      </body>
    </html>
  );
}