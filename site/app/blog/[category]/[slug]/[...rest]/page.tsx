import { notFound } from "next/navigation";

// Any longer, unknown address under /blog shows the blog's own 404 page instead of the site-wide one.
export default function UnknownBlogPath() {
  notFound();
}