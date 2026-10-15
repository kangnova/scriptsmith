# ScriptSmith — Auth & Admin (PRD)

## 1. Overview

ScriptSmith is an AI selling-script generator (TikTok / Reels / Shorts). This PRD
adds authentication (Google OAuth), user roles (USER / ADMIN), and an admin
dashboard — the foundation for the upcoming subscription & pricing phase.

## 2. Roles

- **USER** — signs in with Google and uses the generator.
- **ADMIN** — full access to the admin dashboard: view users, monitor growth,
  and (future) manage subscription tiers and usage.

Role assignment:

- Emails listed in `ADMIN_EMAILS` (comma-separated) are auto-promoted to ADMIN on
  first sign-in.
- A `make-admin <email>` script promotes additional users later.

## 3. Authentication

- Provider: **Google OAuth**. A single "Sign in with Google" button handles both
  login and registration — the first sign-in auto-creates the account.
- Stack: NextAuth v4 + Prisma adapter, database sessions.
- Route protection:
  - `/admin/**` requires an ADMIN session; non-admins are redirected to `/login`.
  - `/login` redirects already-authenticated users away from the login page.

## 4. Data model (Prisma + SQLite)

SQLite is used for the MVP (no DB container needed on a RAM-constrained VPS);
migration to Postgres is on the roadmap.

- **User** — `id`, `name`, `email`, `emailVerified`, `image`, `role`, `createdAt`
- **Account**, **Session**, **VerificationToken** — NextAuth standard models

`role` is a string (`USER` | `ADMIN`) rather than a Prisma enum, so adding roles
later does not require a dev-server restart.

## 5. Admin pages

- `/admin` — overview: total users, admin count, recent signups.
- `/admin/users` — table of all users (name, email, role, joined date).

Future admin features (pricing phase):

- Usage analytics (scripts generated per user)
- Subscription tier management
- User limits / suspension

## 6. Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string |
| `NEXTAUTH_URL` | Public origin (https://scriptsmith.web.id) |
| `NEXTAUTH_SECRET` | Session signing secret (random) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app credentials |
| `ADMIN_EMAILS` | Comma-separated emails auto-promoted to ADMIN |
| `OPENROUTER_API_KEY` | LLM provider key |

## 7. Non-goals (this phase)

- No billing / subscription yet.
- `/api/generate` stays public for now; gating by login + monthly quota is the
  pricing phase.

## 8. Roadmap

1. **Auth + roles + admin** (this PRD)
2. Pricing page + Midtrans + subscription tiers
3. Gate `/api/generate` behind login + quota; log usage per user
4. Admin: usage analytics, plan management, user management
5. Postgres migration when scale demands it
