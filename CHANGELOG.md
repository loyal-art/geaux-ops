# Geaux Ops — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Phase 2: Multi-User & Client Management

---

## Step 12 — User Management & Group Management (April 2026)

### Added
- `src/app/users/layout.tsx` — owner-only layout guard for `/users` route (non-owners redirected to `/dashboard`)
- `src/app/users/actions.ts` — server actions: `updateUserRole` (owner-only, cannot change owner role), `addGroupMember`, `removeGroupMember`
- `src/app/users/UserControls.tsx` — `'use client'` component with optimistic role pill selector and group checkbox toggles; uses `useTransition` for instant feedback
- `src/app/users/page.tsx` — owner-only `/users` page: lists all registered users with avatar, display name, email, role badge, join date; associated clients derived from job assignments (orange pills); role change controls (pill buttons) and group assignment (toggleable checkboxes); owner row is read-only
- `src/app/groups/manage/layout.tsx` — owner-only layout guard for `/groups/manage` route
- `src/app/groups/manage/actions.ts` — server actions: `createGroup`, `updateGroup`, `addGroupMember`, `removeGroupMember`
- `src/app/groups/manage/GroupEditor.tsx` — `'use client'` inline group editor: toggle edit mode for name/description, member list with per-member remove buttons, add-member dropdown with all non-member users
- `src/app/groups/manage/page.tsx` — owner-only `/groups/manage` page: create group form (name + description), groups list with `GroupEditor` per group showing member count, member list, add/remove controls
- `supabase/migrations/010_groups_rls_fix.sql` — drops the broad `groups_all_owner` / `group_members_all_owner` `FOR ALL` policies and replaces them with explicit INSERT/UPDATE/DELETE policies each with proper `WITH CHECK (is_owner())` for correct enforcement
- `src/lib/types.ts` — added `Group` and `GroupMember` interfaces

### Changed
- `src/app/profile/page.tsx` — added **Manage Users** and **Manage Groups** `MenuRow` links (gold accent, owner-only, same pattern as Invite People)

---

## Step 11 — AI-Powered Job Creation Flow (April 2026)

### Added
- `src/app/jobs/ai/page.tsx` — new AI job creation page at `/jobs/ai` with two-phase flow: (1) four plain-text prompts (What's the job?, Who's this for?, What does finished look like?, What's your focus?), (2) editable preview of AI-generated title, steps, priority, and category with add/remove/reorder step controls
- `src/app/api/ai/generate-job/route.ts` — server-side API route that calls the Anthropic Claude API (`claude-sonnet-4-20250514`) with a system prompt to generate structured job data (title, 5–15 actionable steps, priority, category) from user inputs; auth-gated, API key stays server-side only
- `src/app/api/ai/create-job/route.ts` — server-side API route that persists the AI-generated job to the database with all steps; matches client name to existing clients and links to their project if found; saves F1 finish definition and F2 focus
- `supabase/migrations/009_jobs_focus.sql` — `ALTER TABLE jobs ADD COLUMN focus text` to store the F2 Focus mindset answer
- `@anthropic-ai/sdk` added to dependencies for server-side Claude API integration

### Changed
- `src/app/jobs/new/page.tsx` — added prominent "AI Generate" card at top of template picker with purple sparkle icon; links to `/jobs/ai` as an alternative to template-based job creation
- `src/app/jobs/actions.ts` — `createJob` server action now reads and persists the `focus` field from form data
- `src/app/jobs/[id]/page.tsx` — job detail page now displays F2 Focus block (purple accent) below the F1 Finish definition when present
- `src/lib/types.ts` — added `focus: string | null` field to `Job` interface

---

## Step 10 — Design Polish Pass (April 2026)

### Changed
- `src/app/globals.css` — added `.card-hover` utility class: `translateY(-2px)` lift + shadow deepens + border brightens on hover, with smooth 0.18s ease transitions
- `src/components/jobs/TriangleProgress.tsx` — added SVG `feGaussianBlur` glow filter applied at `pct > 0.6`; 100% outline also gets the glow; fill opacity ramp unchanged
- `src/components/jobs/JobCard.tsx` — `card-hover` on link wrapper; unassigned badge now gold (`rgba(200,164,78,0.14)` / `#C8A44E`) instead of dim grey; all status badge opacities bumped to 0.14; color strip `h-1` → `h-1.5`; card padding `p-4` → `p-5`; base border `rgba(255,255,255,0.05)` → `rgba(255,255,255,0.06)`
- `src/components/dashboard/DashboardFeed.tsx` — category tabs redesigned as filled pills (`rounded-full`); active pill: gold bg `#C8A44E`, dark text, gold glow `boxShadow`; inactive pill: subtle surface bg; removed underline bar; tab gap `0.5` → `2`; section spacing `mb-4` → `mb-5`
- `src/app/dashboard/page.tsx` — greeting `text-2xl font-bold` → `text-3xl font-extrabold`; header `pt-12 pb-6` → `pt-14 pb-8`; stats `py-2 text-xl` → `py-4 text-2xl`; each stat card gets a colored `borderTop: 2px solid ${color}40`; stats row `mb-6` → `mb-8`
- `src/app/clients/page.tsx` — `ClientCard` gets `card-hover`, padding `px-4` → `px-5`, border `0.05` → `0.06`; page title `text-2xl font-bold` → `text-3xl font-extrabold`; stat chips match dashboard style (`py-4`, `text-2xl`, colored top border)
- `src/app/recurring/page.tsx` — `ScheduleCard` gets `card-hover`, padding `px-4 py-4` → `px-5 py-5`, border opacity `0.07` → `0.06`; page title `text-xl font-bold` → `text-2xl font-extrabold`
- `src/app/profile/page.tsx` — `MenuRow` gets `card-hover`, padding `px-4` → `px-5`, border `0.05` → `0.06`

---

## Step 9 — Invite System & User Onboarding Gate (April 2026)

### Added
- `supabase/migrations/008_invites.sql` — `invites` table (id, email, role, invited_by FK, created_at, accepted_at); unique partial index prevents duplicate pending invites for the same email; RLS: owner-only read/write (service-role client bypasses for signup check)
- `src/lib/types.ts` — added `Invite` interface
- `src/app/invites/actions.ts` — `createInvite` (checks for existing account, unique constraint, owner-only guard) and `revokeInvite` server actions
- `src/app/invites/layout.tsx` — auth guard + owner-role check (non-owners redirected to `/dashboard`)
- `src/app/invites/page.tsx` — owner-only invite manager: email input + role picker (Partner / Team Member / Family), pending invite list with per-row Revoke buttons
- `src/app/auth/actions.ts` — `signUp` now uses the service-role client to check the invites table before creating the account; first-ever signup (no owner exists yet) bypasses the gate; on success, applies the invite's role to the new user and stamps `accepted_at`; blocked users see "You need an invitation to join. Contact the admin."
- `src/app/profile/layout.tsx` — auth guard + bottom nav wrapper
- `src/app/profile/page.tsx` — profile page: avatar initial, display name, email, role badge; **Invite People** menu row visible only to owners; Recurring Jobs + Clients shortcuts; Sign Out button

---

## Step 8 — Category Chips on Job Detail Page (April 2026)

### Added
- `src/components/jobs/CategoryChips.tsx` — `'use client'` chip row (Business / Home / Personal / Misc); active chip highlighted gold; optimistic update via `useTransition` so selection feels instant
- `src/app/jobs/actions.ts` — added `updateJobCategory(jobId, category)` server action; revalidates job detail and dashboard
- Updated `src/app/jobs/[id]/page.tsx` — `CategoryChips` placed between client name and triangle progress block; current category passed as prop

---

## Step 7 — Dashboard Redesign: Tabs, Search & Category Filtering (April 2026)

### Added
- `supabase/migrations/007_jobs_category.sql` — `ALTER TABLE jobs ADD COLUMN category text not null default 'misc'` with check constraint (`business | home | personal | misc`); index on `category`
- `src/lib/types.ts` — added `JobCategory` type; added `category` field and optional `projects` join to `Job` interface
- `src/components/dashboard/DashboardFeed.tsx` — new `'use client'` component handling all interactive dashboard state:
  - **Tabs** (All / Business / Home / Personal / Misc) — horizontally scrollable, gold active indicator
  - **Search bar** — filters by job title, client name, and joined project name as you type; clear button when active
  - **Client chips** — horizontal pill row visible only on Business tab; shows unique `client_name` values; tap to filter, tap All or same chip to clear
  - **Filtered job sections** — In Progress, Blocked, Unassigned, Recently Completed using existing `JobCard` + triangle progress bars; empty states for no-jobs and no-results
- Updated `src/app/dashboard/page.tsx` — greeting + stats row remain server-rendered (always show global counts); jobs now fetched with `projects(name)` join for search; passes `activeJobs` + `completedJobs` to `DashboardFeed`; completed jobs now fetched with full fields (including `job_steps`) for `JobCard` rendering
- Updated `src/app/jobs/actions.ts` — `createJob` reads and persists `category` from form data
- Updated `src/app/jobs/new/page.tsx` — added Category dropdown (Misc / Business / Home / Personal) after Priority field; defaults to Misc

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
