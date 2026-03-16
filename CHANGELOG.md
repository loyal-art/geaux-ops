# Geaux Ops — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Phase 1: Foundation

---

## Step 3 — Authentication (March 2026)

### Added
- Supabase Auth server actions: `signIn`, `signUp`, `signOut`, `signInWithGoogle`
- OAuth callback route handler at `/auth/callback` for Google OAuth code exchange
- Login page (`/login`) — email/password + Google OAuth, Geaux Ops design system
- Signup page (`/signup`) — display name + email/password + Google OAuth
- Placeholder dashboard page (`/dashboard`) for post-auth redirect
- `useFormStatus`-aware submit buttons for loading state feedback

---

## Step 2 — Database Schema (March 2026)

### Added
- `supabase/migrations/001_schema.sql`
  - 5 enums: `user_role`, `job_status`, `job_priority`, `recurring_frequency`, `allowance_status`
  - 10 tables: `users`, `groups`, `group_members`, `job_templates`, `jobs`,
    `job_steps`, `job_comments`, `recurring_schedules`, `notifications`, `allowance_ledger`
  - 12 performance indexes
  - 2 auth triggers: auto-create user profile on sign-up; auto-promote first user to `owner`
  - 5 Fs baked into schema: `finish_definition` on `jobs` (F1), `is_high_impact` on `job_steps` (F2)
- `supabase/migrations/002_rls.sql`
  - Row Level Security enabled on all 10 tables
  - 3 helper functions: `is_owner()`, `is_group_member()`, `can_access_job()`
  - Scoped policies: kids see only their data; owners see everything; group members see group jobs
- `supabase/migrations/003_seed_templates.sql`
  - 6 business templates: RON Online Notarization, Cogency Global Process Service,
    Own RA Service/Mail, Southern VUEs RE Photo Shoot, Podcast Film & Edit, Custom Task
  - 9 daily household chore templates
  - 10 weekly household chore templates
  - 7 monthly household chore templates
  - 32 total templates confirmed in database
- `supabase/README.md` — step-by-step instructions for running migrations

---

## Step 1 — Project Setup (March 2026)

### Added
- GitHub repository created: `loyal-art/geaux-ops`
- Next.js 16 project initialized with TypeScript and Tailwind CSS v4
- `@supabase/supabase-js` and `@supabase/ssr` installed
- `src/lib/supabase/client.ts` — browser-side Supabase client
- `src/lib/supabase/server.ts` — server-side Supabase client for Server Components and Route Handlers
- `src/middleware.ts` — session refresh + route protection (`/dashboard` requires auth)
- `src/app/globals.css` — Geaux Ops design tokens as CSS variables and Tailwind theme tokens
  - Background `#0F1117`, Surface `#1A1D27`, Gold `#C8A44E`, Green `#4ADE80`
  - Blue `#60A5FA`, Purple `#A78BFA`, Orange `#FB923C`, Red `#F87171`
  - Text `#E8E9ED`, Dim `#8B8F9E`
- `Geaux_Ops_Product_Spec.md` — full product specification saved to repository
- `.env.local` — Supabase project URL and anon key (gitignored)
- Vercel connected to GitHub for automatic deployments
