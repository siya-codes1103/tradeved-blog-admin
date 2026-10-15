import { notFound } from "next/navigation";
import CategoriesManager from "@/components/CategoriesManager";
import { API_MODE } from "@/lib/api/config";
import { getCategories } from "@/lib/data";

/** In local file mode categories live in site/content/categories.json. In API mode they are managed here. */
export default async function CategoriesPage() {
  if (!API_MODE) notFound();
  return <CategoriesManager categories={await getCategories()} />;
}