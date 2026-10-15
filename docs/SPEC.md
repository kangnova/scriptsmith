# ScriptSmith — Spec

## Overview

ScriptSmith generates ready-to-post selling content for short-form video
platforms (TikTok, Reels, Shorts). A user provides a product, price, and
category; the system returns a complete selling package.

## Non-goals (v1)

- No persistence, auth, or billing. The app is stateless.
- No real-time trending data. Music recommendations are vibe + trend-type based.

## Business rules

- `product` and `price` are required; `category`, `mode`, `lang`, and `link`
  are optional (defaults: category `""`, mode `text`, lang `id`, link `""`).
- `lang` drives both UI strings (client-side dictionary) and the generated
  output language.
- `mode` = `video` adds an AI video prompt section; `text` omits it.
- When `link` is provided, it is embedded in the caption and referenced
  naturally in the CTA. When absent, the CTA stays generic.
- Category → selling style is resolved by keyword matching against a rule
  table (e.g. "skincare", "beauty" → skincare style). Unknown categories fall
  back to a self-adapting instruction.

## LLM routing

`src/lib/openrouter.ts` calls models in order until one returns non-empty
content: DeepSeek Chat → Llama 3.3 70B → Qwen 2.5 72B. A provider rate-limit
or empty response falls through to the next model.

## API contracts

### POST /api/generate

Request: `{ product: string, price: string, category?: string, mode?: "text"|"video", lang?: "id"|"en", link?: string }`

Response: `{ ok: true, data: { text: string } }` or `{ ok: false, error: string }`

### POST /api/suggest-categories

Request: `{ product: string, lang?: "id"|"en" }`

Response: `{ ok: true, data: { categories: string[] } }` or `{ ok: false, error: string }`

## Verification

- `npx tsc --noEmit` — zero errors.
- `npm run dev` then `curl` the two API endpoints and assert `ok: true`.
