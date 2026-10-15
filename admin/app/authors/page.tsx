import AuthorsManager from "@/components/AuthorsManager";
import { getAuthors } from "@/lib/data";

export default async function AuthorsPage() {
  return <AuthorsManager authors={await getAuthors()} />;
}