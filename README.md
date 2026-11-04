# ImCoding

**Understand the code AI writes for you, from the fundamentals.**

ImCoding is a learning platform for founders and non-developers who build products with AI coding assistants. Instead of generic programming courses, it teaches the core concepts (client–server, APIs, databases, secrets, deployment…) and asks you to find each one in **your own project**, 30 minutes a day.

**Live:** https://imcoding.dev · **Contact:** hello@imcoding.dev

![ImCoding knowledge map](docs/images/map.png)

## Why

AI tools make it easy to ship an app you don't understand. That gap becomes a problem the first time something breaks, a key leaks, or a change has to be reviewed. ImCoding closes the gap one concept at a time:

1. **Read (10 min):** one concept, explained in plain language with a short example.
2. **Find it in your code (10 min):** open your own project and locate where the concept actually appears.
3. **Check yourself (10 min):** a short quiz shows what you understood and what is still unclear.

## Features

- **Knowledge map:** 16 concepts linked by prerequisites, with a suggested next lesson.
- **Progress tracking:** sign in with GitHub, mark each concept as "seen in my code" or "understood".
- **Ask AI about a lesson:** questions go straight from your browser to Google Gemini with your own API key (BYOK). ImCoding never receives or stores your key or your questions.
- **Privacy first:** one essential cookie for sign-in, no tracking or analytics, row-level security on every table.

![ImCoding home page](docs/images/home.png)

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, RLS) · React Flow · Vitest · Playwright · Vercel

## Roadmap

See the [open issues](https://github.com/imcodingdev/imcoding/issues). Next up: growing the curriculum from 16 to 45 concepts, a "reading code" track, spaced review, and an English version of the lessons.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (Vitest)
npm run e2e        # end-to-end tests (Playwright, port 3100)
```

Lessons live in `content/concepts/*.md`.

## License

MIT. See [LICENSE](LICENSE).

---

## Tiếng Việt

ImCoding là nền tảng học giúp founder và người mới hiểu những gì AI đã viết trong project của chính mình. Mỗi ngày 30 phút, học từng khái niệm một: đọc bài, tìm khái niệm đó trong code của bạn, rồi tự kiểm tra.

- Trang chạy thật: https://imcoding.dev
- Liên hệ: hello@imcoding.dev
- Bài học nằm trong `content/concepts/*.md`. Cách chạy trên máy xem mục "Run locally" ở trên.
