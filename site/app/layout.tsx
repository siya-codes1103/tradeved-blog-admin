import type { Metadata } from "next";
import { Open_Sans, Raleway } from "next/font/google";
import "./globals.css";

const heading = Raleway({ subsets: ["latin"], variable: "--font-raleway", display: "swap" });
const body = Open_Sans({ subsets: ["latin"], variable: "--font-opensans", display: "swap" });

export const metadata: Metadata = { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-dark00 font-body text-light03">{children}</body>
    </html>
  );
}
