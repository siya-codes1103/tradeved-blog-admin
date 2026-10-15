import Image from "next/image";
import Link from "next/link";
import { GLOSSARY_ROUTE } from "@/lib/site-links";

// --- TYPES ---
type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterColumnData = {
  title: string;
  links: FooterLink[];
};

// --- DATA ---
const socialLinks = [
  { label: "X", href: "https://x.com/TradeVed_in", icon: "/assets/x-icon.png" },
  { label: "YouTube", href: "https://www.youtube.com/@TradeVedOfficial", icon: "/assets/yt-icon (1).png" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/tradeved/", icon: "/assets/linkedin (1).png" },
  { label: "Instagram", href: "https://www.instagram.com/tradeved_official", icon: "/assets/instagram (1).png" },
];

const footerColumns: FooterColumnData[] = [
  {
    title: "Product",
    links: [
      { label: "Quiz", href: "/quiz" },
      { label: "Quest", href: "/quest" },
      { label: "Paper Trading", href: "/paper-trading" },
      { label: "Journal", href: "/journal" },
      { label: "Assessment", href: "/coming-soon" },
      { label: "Ved AI", href: "/ai" },
      { label: "Mentor", href: "/coming-soon" },
    ],
  },
  {
    title: "Learn About Trading",
    links: [
      { label: "Blog", href: "/coming-soon" },
      { label: "Docs", href: "/docs" },
      { label: "FAQ", href: "/#faq" },
      { label: "Glossary", href: GLOSSARY_ROUTE },
      { label: "Calculator", href: "/calculators" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "Partner with Us", href: "/partner-with-us" },
      { label: "Brand Kit", href: "/brand-kit.pdf", external: true },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
    ],
  },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// --- SUB-COMPONENTS ---
function FooterColumn({ title, links }: FooterColumnData) {
  return (
    <div>
      <p
        className="font-heading text-[12px] font-extrabold tracking-wider mb-5 uppercase"
        style={{ color: "var(--color-light02, #B4B8AE)" }}
      >
        {title}
      </p>
      <ul className="list-none space-y-2.5">
        {links.map(function (link) {
          if (link.external) {
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body text-[13px] text-light03 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={link.label}>
              <Link
                href={link.href}
                className="font-body text-[13px] text-light03 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StockTickerBar() {
  return (
    <div className="border-t border-dark02 py-5 overflow-x-auto">
      <div className="flex items-center px-6 max-w-6xl mx-auto whitespace-nowrap">
        <span className="font-heading text-[15px] font-bold text-light00 shrink-0 pr-4">
          Glossary
        </span>
        {ALPHABET.map(function (letter, index) {
          return (
            <span
              key={letter}
              className="flex items-center flex-1 justify-center"
            >
              {index === 0 ? null : (
                <span className="text-dark02 mr-0">|</span>
              )}

              <Link
                href={`${GLOSSARY_ROUTE}?letter=${letter}`}
                prefetch={false}
                className="font-body text-[14px] text-light03 hover:text-primary transition-colors px-2"
              >
                {letter}
              </Link>
            </span>
          );
        })}
        <span className="text-dark02">|</span>

        <Link
          href={GLOSSARY_ROUTE}
          prefetch={false}
          className="font-body text-[14px] text-light03 hover:text-primary transition-colors pl-2 shrink-0"
        >
          others
        </Link>
      </div>
    </div>
  );
}

function CTABanner() {
  return (
    <div className="w-full border-t border-b border-primary/40 py-10 px-6 text-center">
      <Link href={GLOSSARY_ROUTE} prefetch={false} className="block w-full">
        <h2 className="w-full font-heading text-[clamp(28px,6vw,56px)] leading-tight font-black text-primary hover:opacity-90 transition-opacity">
          LEARN FIRST AND THEN TRADE
        </h2>
      </Link>
    </div>
  );
}

// --- MAIN FOOTER COMPONENT ---
export default function Footer() {
  return (
    <footer className="bg-dark00 pt-16 border-t border-dark02/60">
      <div className="max-w-6xl mx-auto px-6 pb-12 flex flex-col md:flex-row items-start justify-between gap-12 lg:gap-20">
        {/* Brand Left Sidebar */}
        <div className="w-full md:w-[260px] shrink-0">
          <div className="mb-3">
            <Image
              src="/logo1.png"
              alt="TradeVed Logo"
              width={144}
              height={36}
              className="h-9 w-auto object-contain"
            />
          </div>

          <p className="font-body text-[13px] text-light03 mb-6">
            <span className="text-primary font-bold">Bharat</span> trade with knowledge.
          </p>

          {/* Social Icons */}
          <div className="flex gap-2.5 mb-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-8 h-8 rounded-full border border-dark02 bg-dark01 flex items-center justify-center hover:border-primary transition-colors"
              >
                <Image
                  src={social.icon}
                  alt={social.label}
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </a>
            ))}
          </div>

          {/* Action CTA */}
          <div>
            <Link
              href="/waitlist"
              className="block text-center bg-primary text-dark00 font-heading text-button font-bold rounded-full py-2.5 hover:opacity-90 transition-opacity"
            >
              Join Waitlist
            </Link>
          </div>

          <p className="font-body text-[12px] text-light04 mt-6">
            Support email &rarr;{" "}
            <a href="mailto:support@tradeved.com" className="text-light03 hover:text-primary transition-colors">
              support@tradeved.com
            </a>
          </p>
          <p className="font-body text-[12px] text-light04 mt-2">&copy; 2026 TradeVed. All rights reserved.</p>
          <p className="font-body text-[12px] text-light04 mt-1">
            Made with <span role="img" aria-label="love">❤️</span> in India
          </p>
        </div>

        {/* 3 Columns Grid */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10 lg:gap-16">
          {footerColumns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      <StockTickerBar />
      <CTABanner />

      <div className="max-w-6xl mx-auto px-6 py-6 border-t border-dark02">
        <p className="font-body text-[11px] text-light04 text-center">
          Educational content only. It does not constitute investment advice, a recommendation, or a promise of returns.
        </p>
      </div>
    </footer>
  );
}