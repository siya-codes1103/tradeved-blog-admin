export default function SearchForm({ defaultValue = "", placeholder = "Search articles…" }: { defaultValue?: string; placeholder?: string }) {
  return (
    <form action="/blog/search" method="get" role="search" className="flex w-full max-w-xl items-center gap-2">
      <label htmlFor="blog-q" className="sr-only">
        Search articles
      </label>
      <input
        id="blog-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        className="h-12 min-w-0 flex-1 rounded-full border border-[var(--tv-line)] bg-[var(--tv-bg)] px-5 font-body text-[15px] text-[var(--tv-ink)] placeholder:text-[var(--tv-faint)] outline-none focus:border-[var(--tv-lime)]"
      />
      <button type="submit" className="h-12 rounded-full bg-[var(--tv-lime)] px-6 font-heading text-[14px] font-bold leading-[14px] text-[#0F1209] transition hover:opacity-90">
        Search
      </button>
    </form>
  );
}
