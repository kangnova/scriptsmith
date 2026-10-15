# ScriptSmith

AI selling-content script generator for TikTok, Reels, and Shorts.

Type a product name, price, and category — get a ready-to-post script: hook, spoken script, call-to-action, caption + hashtags, background music recommendation, and (optionally) a copy-paste prompt for AI video generators.

## Features

- **Bilingual (Indonesian / English)** — the entire UI and the generated content switch language together.
- **AI category suggestions** — type a product name and the AI suggests selling categories (click to pick, or type your own).
- **Optional product link** — the caption and CTA include your link automatically.
- **Two output modes** — text-only, or text + AI video prompt (Kling / Vidu / Runway / Pika).
- **Caption + hashtags** — ready-to-paste caption with discovery tags (`#fyp`, `#foryou`, niche tags).
- **Resilient model routing** — automatic fallback across multiple LLM providers via OpenRouter, so a rate-limited model never blocks a request.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4
- OpenRouter with model fallback (DeepSeek Chat → Llama 3.3 70B → Qwen 2.5 72B)

## Getting started

```bash
npm install
# create .env.local and set your OpenRouter key (see .env.example)
npm run dev
```

Open http://localhost:3000.

## Project structure

```
src/
  app/
    page.tsx                          # form UI (client component)
    api/
      generate/route.ts               # script generation endpoint
      suggest-categories/route.ts     # AI category suggestion endpoint
  lib/
    openrouter.ts                     # LLM client with ordered model fallback
scripts/
  gen.py                              # CLI prototype
docs/
  SPEC.md                             # spec: API contracts, business rules
```

## API

### POST /api/generate

Body: `{ product, price, category, mode, lang, link }`

Returns `{ ok: true, data: { text } }`.

### POST /api/suggest-categories

Body: `{ product, lang }`

Returns `{ ok: true, data: { categories: string[] } }`.

## Roadmap

- Production deployment (pm2 + nginx + domain)
- Real-time trending TikTok sound data
- User accounts and saved scripts
- Multi-page app with next-intl (current i18n is a single-page dictionary)
