import { notFound } from "next/navigation";
import PostEditor from "@/components/PostEditor";
import { getAuthors, getCategories, getIndex, getPostBySlug } from "@/lib/data";

export default async function EditPost({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { slug } = await params;
  const { saved } = await searchParams;
  const [post, index, categories, authors] = await Promise.all([getPostBySlug(slug), getIndex(), getCategories(), getAuthors()]);
  if (!post) notFound();
  return <PostEditor categories={categories} authors={authors} post={post} index={index} justSaved={saved === "1"} />;
}