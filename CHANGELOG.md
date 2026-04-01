# Geaux Ops — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Phase 2: Multi-User & Client Management

---

## Step 6 — Client Management & Project Grouping (April 2026)

### Added
- `supabase/migrations/004_clients.sql` — `clients` table (id, name, contact_name, contact_email, contact_phone, locations jsonb, notes, created_by, created_at); RLS: owner full access, all authenticated users can view
- `supabase/migrations/005_projects.sql` — `projects` table (id, client_id FK, name, description, status enum active/paused/complete, created_by, created_at, updated_at); `set_updated_at()` trigger; RLS: owner full access, all authenticated users can view
- `supabase/migrations/006_jobs_project_id.sql` — `ALTER TABLE jobs ADD COLUMN project_id uuid FK → projects`; partial index on project_id
- `src/lib/types.ts` — added `ProjectStatus` type, `Client` interface, `Project` interface; added `project_id` field to `Job`
- `src/app/clients/actions.ts` — owner-only server actions: `createClientRecord`, `updateClientRecord`, `deleteClientRecord`
- `src/app/projects/actions.ts` — owner-only server actions: `createProject`, `updateProjectStatus`, `deleteProject`
- `src/app/clients/layout.tsx` — auth guard + bottom nav wrapper
- `src/app/clients/page.tsx` — client list page: stats row (total clients, active projects, total projects), client cards with project status dots, active/others grouping
- `src/app/clients/new/page.tsx` — new client form (name, contact name/email/phone, notes)
- `src/app/clients/[id]/page.tsx` — client detail: avatar, contact info, notes, projects grouped by status, inline quick-add project form (`?add=1`)
- `src/app/projects/[id]/layout.tsx` — auth guard + bottom nav wrapper
- `src/app/projects/[id]/page.tsx` — project detail: breadcrumb nav, status cycle button, job stats row, jobs grouped by status using existing `JobCard` + triangle progress bars, "Add Job to Project" CTA
- `src/app/projects/new/layout.tsx` — auth guard + bottom nav wrapper
- `src/app/projects/new/page.tsx` — new project form with client picker (when no client_id provided), name/description/status fields
- Updated `src/components/ui/BottomNav.tsx` — replaced Board tab with Clients (people icon, `/clients` route)

---

## [Unreleased] — Phase 1: Foundation

---

## Step 5 — Recurring Job Scheduler (March 2026)

### Added
- `src/lib/types.ts` — added `RecurringFrequency` type and `RecurringSchedule` interface
- `src/lib/supabase/service.ts` — server-only Supabase service-role client (bypasses RLS for system operations)
- `src/lib/recurring.ts` — shared `calcNextGenerateAt` utility: computes next run timestamp per frequency (daily, weekdays, weekly, monthly)
- `src/app/recurring/actions.ts` — owner-only server actions: `createRecurringSchedule`, `toggleScheduleActive`, `deleteRecurringSchedule`
- `src/app/recurring/layout.tsx` — layout with auth guard + bottom nav wrapper
- `src/app/recurring/page.tsx` — schedule management dashboard: lists all active/paused schedules, pause/resume toggle, delete, link to create
- `src/app/recurring/new/page.tsx` — two-phase schedule setup: template picker → frequency + assignee form
- `src/app/api/recurring/generate/route.ts` — `GET` endpoint called by Vercel Cron; finds all due active schedules, generates a fresh job from each template (with steps copied), updates `last_generated_at` and `next_generate_at`; secured by `CRON_SECRET`
- `vercel.json` — Vercel Cron config: runs `/api/recurring/generate` daily at 06:00 UTC
- Updated `src/components/ui/BottomNav.tsx` — replaced Tasks tab with Recurring (repeat icon, `/recurring` route)

---

## Step 4 — Full Dashboard & Job System (March 2026)

### Added
- `src/lib/types.ts` — shared TypeScript types for Job, JobStep, JobComment, JobTemplate, Profile
- `src/app/jobs/actions.ts` — server actions: `createJob`, `toggleStep`, `addComment`, `addStep`, `updateJobStatus`
- `src/components/ui/BottomNav.tsx` — mobile-first bottom navigation bar (Home, Board, + New, Tasks, Profile)
- `src/components/jobs/TriangleProgress.tsx` — signature triangle progress SVG, fills bottom-to-top, shifts to green at 100%
- `src/components/jobs/JobCard.tsx` — job card with template color strip, triangle progress, status/priority badges, step count
- `src/components/jobs/StepItem.tsx` — interactive step checkbox with optimistic UI via `useTransition`
- `src/components/jobs/AddStepForm.tsx` — inline form to add a step to an existing job
- `src/components/jobs/CommentForm.tsx` — comment posting form with `useActionState`
- `src/app/dashboard/layout.tsx` — dashboard layout: auth guard + bottom nav wrapper
- `src/app/dashboard/page.tsx` — full dashboard: greeting, stats row, active job cards, recently completed section, empty state
- `src/app/jobs/layout.tsx` — jobs layout: auth guard + bottom nav wrapper
- `src/app/jobs/new/page.tsx` — two-phase job creation: template picker → job form (title, client, F1 finish definition, priority)
- `src/app/jobs/[id]/page.tsx` — job detail: large triangle progress, step checklist, add step, comment thread, status controls

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
