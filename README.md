# TradeVed Blog

    tradeved-blog/
    ├─ site/    PUBLIC blog (Next.js)  -> http://localhost:3000/blog   (isi folder ko deploy karo)
    │   ├─ app/blog/        pages (home, category, article, search, author, sitemap, rss)
    │   ├─ components/      blog UI + layout (Header/Footer)
    │   ├─ lib/blog/        content reader (read-only)
    │   ├─ content/         blog/*.md (1 file = 1 article), categories.json, authors.json
    │   └─ public/blog-covers/   uploaded cover images
    ├─ admin/   ADMIN panel (local only) -> http://localhost:3001
    │   ├─ app/             list, new, edit, bulk, authors, guide, export
    │   ├─ components/      editor UI
    │   ├─ lib/blog/        validation, SEO score, file writer
    │   └─ .env.development BLOG_SITE_DIR=../site  (admin yahin files likhta hai)
    └─ package.json   root commands

## Commands (Windows PowerShell)
    npm run setup        # ek baar: sab install
    npm run dev          # site (3000) + admin (3001) dono
    npm run dev:site     # sirf blog
    npm run dev:admin    # sirf admin
    npm run build        # site production build
    npm run typecheck

## Workflow
1. Admin (3001) → Bulk import: CSV, JSON ya .md files upload karo. Files `site/content/blog/` me ban jaati hain.
2. Site (3000) pe turant dikhta hai.
3. Live: `git add . && git commit && git push` -> site deploy (Vercel root directory = `site`).

Admin production me kabhi deploy nahi hota; site folder akela deploy hota hai.
Admin `../site/components` aur `../site/lib` reuse karta hai, isliye repo me dono folders saath rakho.
