import { readableOn } from "@/lib/blog/utils";

export default function CategoryTag({ name, accent, className = "" }: { name: string; accent: string; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 font-heading text-[10px] font-extrabold uppercase leading-none tracking-wider ${className}`}
      style={{ backgroundColor: accent, color: readableOn(accent) }}
    >
      {name}
    </span>
  );
}
