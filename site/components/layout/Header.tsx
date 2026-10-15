"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GLOSSARY_ROUTE } from "@/lib/site-links";

const productLinks = [
  { label: "Quiz", href: "/quiz" },
  { label: "Quest", href: "/quest" },
  { label: "Journal", href: "/journal" },
  { label: "Paper Trading", href: "/paper-trading" },
];

const resourceLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Glossary", href: GLOSSARY_ROUTE },
  { label: "Calculator", href: "/calculators" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={"mt-0.5 transition-transform " + (open ? "rotate-180" : "")}>
      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 2.5L9.5 7L4 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {open ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 12h16M4 6h16M4 18h16" />}
    </svg>
  );
}

function NavDropdown({
  label,
  items,
  openMenu,
  setOpenMenu,
}: {
  label: string;
  items: { label: string; href: string }[];
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
}) {
  const isOpen = openMenu === label;

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenu(isOpen ? null : label);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenu(null);
  };

  return (
    <div className="relative pointer-events-auto" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={handleButtonClick}
        className="font-body text-[14px] text-[#A2AB9A] cursor-pointer hover:text-[#9BEC00] transition-colors flex items-center gap-1 pointer-events-auto"
      >
        {label}
        <ChevronIcon open={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 w-48 z-50 pointer-events-auto">
          <div className="rounded-2xl border border-white/10 bg-[#0F1209]/95 backdrop-blur-xl shadow-2xl overflow-hidden py-2">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleLinkClick}
                className="block px-4 py-2.5 font-body text-[13px] text-[#A2AB9A] hover:text-[#9BEC00] hover:bg-[#9BEC00]/10 transition-colors pointer-events-auto"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const closeMenus = useCallback(() => {
    setOpenMenu(null);
    setMobileMenuOpen(false);
  }, []);

  // Close menus when route changes
  useEffect(() => {
    closeMenus();
  }, [pathname, closeMenus]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (navRef.current && !navRef.current.contains(target)) {
        setOpenMenu(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full pointer-events-none bg-transparent">
      <div className="border-b border-white/10 bg-[#0F1209]/60 backdrop-blur-md py-1.5 text-center pointer-events-auto px-4">
        <p className="font-body text-[11px] sm:text-[12px] text-[#A2AB9A] truncate">
           Our Public Beta is almost here! Get in before everyone else does.{" "}
          <Link href="/waitlist" className="font-bold text-[#9BEC00] underline hover:text-white transition-colors">
            Join waitlist →
          </Link>
        </p>
      </div>

      <div className="px-3 sm:px-6 md:px-10 pt-3 pb-2">
        <nav
          ref={navRef}
          className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/10 backdrop-blur-lg shadow-2xl pointer-events-auto relative"
          style={{
            background:
              "radial-gradient(ellipse 80% 150% at 50% 50%, rgba(155,236,0,0.15), rgba(15,18,9,0.92) 70%)",
          }}
        >
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo1.png" alt="TradeVed" width={140} height={32} className="h-6 sm:h-8 w-auto object-contain" priority />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <NavDropdown label="Products" items={productLinks} openMenu={openMenu} setOpenMenu={setOpenMenu} />
            <NavDropdown label="Resources" items={resourceLinks} openMenu={openMenu} setOpenMenu={setOpenMenu} />
            
            <Link
              href="/ai"
              onClick={() => setOpenMenu(null)}
              className="relative z-10 font-body text-[14px] text-[#A2AB9A] hover:text-[#9BEC00] transition-colors"
            >
              Ved AI
            </Link>

            <Link
              href="/about-us"
              onClick={() => setOpenMenu(null)}
              className="relative z-10 font-body text-[14px] text-[#A2AB9A] hover:text-[#9BEC00] transition-colors"
            >
              About us
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/waitlist"
              className="flex items-center gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border border-white/20 text-white font-body text-[11px] sm:text-[14px] hover:border-[#9BEC00] hover:text-[#9BEC00] transition-colors"
            >
              Join Waitlist
              <ArrowRightIcon />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-[#A2AB9A] hover:text-white transition-colors"
              aria-label="Toggle navigation menu"
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-white/10 bg-[#0F1209]/98 backdrop-blur-2xl shadow-2xl p-5 md:hidden pointer-events-auto flex flex-col gap-4 z-50">
              <div>
                <p className="font-heading text-[10px] font-bold text-[#9BEC00] uppercase tracking-wider mb-2">Products</p>
                <div className="grid grid-cols-2 gap-2">
                  {productLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#A2AB9A] hover:text-white py-1"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-heading text-[10px] font-bold text-[#9BEC00] uppercase tracking-wider mb-2">Resources</p>
                <div className="grid grid-cols-2 gap-2">
                  {resourceLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#A2AB9A] hover:text-white py-1"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
                <Link
                  href="/ai"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#A2AB9A] hover:text-white py-1"
                >
                  Ved AI
                </Link>
                <Link
                  href="/about-us"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#A2AB9A] hover:text-white py-1"
                >
                  About us
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}