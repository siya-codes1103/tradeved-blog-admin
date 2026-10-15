// Uses the SAME Header and Footer as the rest of the site. Change these two import paths to where they live
// in your project. If your root layout already renders them, delete them from this file.
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="tv min-h-screen font-body">
        {/* The site header floats on top of the page, so this dark band sits behind it. */}
        <div className="tv-dark h-[132px] md:h-[140px]" aria-hidden="true" />
        {children}
      </div>
      <Footer />
    </>
  );
}
