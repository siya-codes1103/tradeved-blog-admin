import PostEditor from "@/components/PostEditor";
import { getAuthors, getCategories, getIndex } from "@/lib/data";

export default async function NewPost() {
  const [index, categories, authors] = await Promise.all([getIndex(), getCategories(), getAuthors()]);
  return <PostEditor categories={categories} authors={authors} post={null} index={index} />;
}