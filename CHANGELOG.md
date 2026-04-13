# Geaux Ops — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — Phase 2: Multi-User & Client Management

---

## Step 23 — Auto-Send Invite Email via Resend (April 2026)

### Added
- `resend` npm package installed for transactional email
- `src/lib/email/sendInviteEmail.ts` — shared email utility:
  - Instantiates `Resend` with `RESEND_API_KEY` (server-side env var); logs a warning and returns early if the key is not set
  - Sends a branded HTML email with dark background (`#0F1117`), card surface (`#1A1D27`), and gold CTA button (`#C8A44E`)
  - Email body includes inviter's name, assigned role (humanized, e.g. `team_member` → "Team Member"), recipient email address, and a direct link to `https://geaux-ops.vercel.app/signup`
  - `from` address defaults to `Geaux Ops <onboarding@resend.dev>`; overridable via `RESEND_FROM_EMAIL` env var
  - Returns `{ error: string | null }` — never throws
- `src/app/api/email/invite/route.ts` — `POST /api/email/invite` API route accepting `{ to, inviterName, role, signupUrl? }` JSON body; returns 400 on bad input, 500 on send failure, 200 on success; delegates to `sendInviteEmail`

### Changed
- `src/app/invites/actions.ts` — `createInvite` now:
  1. Selects `display_name` alongside `role` when fetching the caller's profile
  2. After a successful DB insert, calls `sendInviteEmail` in a `try/catch` — errors are logged to the console but the invite is always created regardless
  3. Imports `SIGNUP_URL = 'https://geaux-ops.vercel.app/signup'` as the signup link embedded in every invite email

### Environment variables required
| Variable | Required | Default | Purpose |
|---|---|---|---|
| `RESEND_API_KEY` | Yes | — | Resend API key (server-side only) |
| `RESEND_FROM_EMAIL` | No | `Geaux Ops <onboarding@resend.dev>` | Sender address |

---

## Step 22 — Profile Self-Service (April 2026)

### Added
- `src/lib/avatarColors.ts` — shared color map for avatar circles (8 presets: gold, green, blue, purple, orange, red, teal, pink); `getAvatarStyle(avatarUrl)` returns `{ bg, color }` from the stored key string
- `src/app/profile/actions.ts` — three server actions:
  - `updateDisplayName(name)` — updates `public.users.display_name` and syncs `auth.updateUser` metadata; revalidates `/profile`
  - `changePassword(password, confirm)` — server-validates match + min-6-chars, calls `supabase.auth.updateUser({ password })`
  - `updateAvatarColor(colorKey)` — stores the chosen color key in `public.users.avatar_url`; revalidates `/profile`
- `src/components/profile/EditNameForm.tsx` — `'use client'` form with pre-populated input, `useTransition`, and inline green/red feedback message
- `src/components/profile/ChangePasswordForm.tsx` — `'use client'` form with two password fields, client-side match + length validation before calling the server action, inline success/error feedback, auto-clears fields on success
- `src/components/profile/AvatarPicker.tsx` — `'use client'` 8-swatch color picker; shows user's initial in each color; selected swatch is highlighted with border + glow; calls `updateAvatarColor` immediately on tap; uses `AVATAR_COLORS` from `avatarColors.ts`

### Changed
- `src/app/profile/page.tsx` — full redesign of the profile page:
  - **Avatar** now respects stored `avatar_url` color key via `getAvatarStyle()`; defaults to gold
  - New **Account Settings** card (dark surface panel) containing `EditNameForm`, `AvatarPicker`, and `ChangePasswordForm` separated by thin dividers
  - New **Workspaces** section: fetches `group_members` joined with `groups(name)`, renders each workspace name + `role_in_group` badge (read-only, informational)
  - Admin links (Invite / Manage Users / Manage Groups) moved under a labelled **Admin** section header; non-owners see a "No admin actions for your role" note
  - Navigation shortcuts (Recurring, Clients) moved under a **Shortcuts** section header
  - Preferences and Sign Out sections retain their original behavior
  - Parallel data fetch: profile + workspace memberships loaded with `Promise.all`

---

## Step 21 — Role-Based UI Filtering (April 2026)

### Added
- `src/lib/permissions.ts` — central permissions module:
  - `ROLE_RANK` map: owner(6) → admin(5) → partner(4) → manager(3) → worker/team_member/family_member(2) → viewer(1)
  - `Permissions` type with fields: `canCreateJobs`, `canEditJobs`, `canDeleteJobs`, `canManageUsers`, `canManageTemplates`, `canCreateSteps`, `canToggleSteps`, `canChangeStatus`, `canComment`, `canAccessRecurring`, `isViewerOnly`
  - `getPermissions(role)` — pure function mapping a role string to a `Permissions` object
  - `getUserEffectiveRole(supabase, userId)` — async helper that fetches both the global `users.role` and all `group_members.role_in_group` entries for the user, then returns the highest-ranked role string
- `src/components/ui/BottomNavServer.tsx` — server component wrapper for `BottomNav` that fetches the user's effective role and passes `canCreateJobs` as a prop

### Changed
- `src/components/ui/BottomNav.tsx` — added optional `canCreateJobs` prop (default `true`); when `false` the centre "New" button is replaced with a neutral spacer so workers/viewers cannot create jobs
- All 12 layout files (`dashboard`, `jobs`, `profile`, `people`, `people/groups/[id]`, `recurring`, `clients`, `projects/[id]`, `projects/new`, `users`, `invites`, `groups/manage`) — switched from `<BottomNav />` to `<BottomNavServer />` so role-based visibility is resolved server-side on every page
- `src/components/jobs/StepItem.tsx` — added `readOnly?: boolean` prop; when `true` the step renders as a static `<div>` (no toggle, checkbox is dimmed) — applies to viewers
- `src/app/jobs/[id]/page.tsx` — derives effective role from `group_members.role_in_group` for the job's workspace (falls back to `users.role` for unassigned jobs); applies `getPermissions`:
  - `StepItem` receives `readOnly={!perms.canToggleSteps}` — viewers see read-only steps
  - `AddStepForm` is hidden when `!perms.canCreateSteps` — workers/viewers cannot add steps
  - `CommentForm` is hidden when `!perms.canComment` — viewers cannot comment
  - All status-control sections gated on `perms.canChangeStatus` — viewers see no status buttons
- `src/app/people/page.tsx` — fetches effective role and passes `canManageUsers` to `PeopleFeed`
- `src/app/people/PeopleFeed.tsx` — `PersonCard` now accepts `canManageUsers`; when `true` a gold "Manage" link pointing to `/users/[id]` is shown on each person row (owner-only shortcut to the user detail page)
- `src/app/recurring/page.tsx` — early-returns an "Access Restricted" notice for workers and viewers (rank < 3); owners continue to see the full recurring schedule manager

---

## Step 20 — Ramp Progress Bar Redesign (April 2026)

### Changed
- `src/components/jobs/TriangleProgress.tsx` — complete redesign from equilateral triangle to a horizontal right-triangle ramp:
  - **Shape**: right-triangle "ramp" (`points="0,40 120,40 120,0"` in viewBox `0 0 120 40`) — wide and low, zero on the left, peak on the right
  - **Fill direction**: left → right via clipPath rect (`width = 120 * progress`)
  - **Color by range**: 0% = dim `#2A2D37` (invisible), 1–25% = rust `#8B4513`, 26–50% = orange `#FB923C`, 51–75% = gold `#C8A44E`, 76–99% = lime `#9ACD32`, 100% = green `#4ADE80`
  - **Pulsating glow**: a second polygon overlay drives the glow animation; uses class `ramp-glow-anim` while in-progress, `ramp-complete-anim` when complete — both powered by CSS `@keyframes` only (no JS animation loops)
  - **Embedded percentage label**: percentage text rendered inside the SVG near the top-right peak (hidden for `size="sm"`)
  - **Sizes updated** to match landscape aspect ratio — `sm: 64×22`, `md: 96×32`, `lg: 136×46`
- `src/app/globals.css` — added `@keyframes ramp-glow-pulse` (0→0.95→0 opacity loop) and `@keyframes ramp-complete-pulse` (bright flash, then settle) with `.ramp-glow-anim` and `.ramp-complete-anim` utility classes
- `src/components/jobs/JobCard.tsx` — removed the external percentage `<span>` below the ramp (percentage is now embedded in the SVG); updated container to `items-end` alignment

---

## Step 19 — Job Completion Celebration & Team Notifications (April 2026)

### Added
- `canvas-confetti` + `@types/canvas-confetti` npm packages
- `src/components/jobs/CompleteJobButton.tsx` — `'use client'` component that replaces the plain "Mark Complete" button:
  - Calls `completeJob(jobId)` server action on click; shows loading state (`Saving…`) during the async call
  - On success: fires a two-wave confetti burst (gold `#C8A44E`, green `#4ADE80`, yellow `#EAB308`, white) from center + flanks
  - Simultaneously shows a full-screen modal overlay: "🎉 Well done!" headline (green), job title, step-count badge ("✓ N of N steps completed"), redirect hint
  - After 3.5 s automatically navigates to `/dashboard` via `router.push`
- `src/app/jobs/actions.ts` — new `completeJob(jobId)` server action:
  - Updates `status = 'completed'` and `completed_at` for the job
  - Uses `createServiceClient()` (service-role, bypasses RLS) for all notification writes
  - Workspace notifications: inserts `job_completed` notification for every member of `job.group_id` with message `"{name} completed "{title}""`, de-duped by `user_id`; falls back to notifying just the completing user when no workspace is set
  - Assigned-user notification: if `job.assigned_to` differs from the completing user, inserts a separate `job_completed_assigned` notification `"{name} completed your job: "{title}""` 
  - Project nudge: if the job belongs to a project and that project has other jobs in `ready` or `queued` status, inserts a `next_job_ready` notification to all workspace members: `""{title}" is done — "{next title}" is ready to go."`
  - All notification logic is wrapped in try/catch — errors are non-fatal and never surface to the user

### Changed
- `src/app/jobs/actions.ts` — imported `createServiceClient` from `@/lib/supabase/service`
- `src/app/jobs/[id]/page.tsx` — "Mark Complete" `<StatusButton>` replaced with `<CompleteJobButton jobId title totalSteps completedSteps />`; imported `CompleteJobButton`

---

## Step 18 — Job Statuses: Waiting, Ready, Queued (April 2026)

### Added
- `supabase/migrations/022_job_status_waiting_ready_queued.sql` — `ALTER TYPE job_status ADD VALUE IF NOT EXISTS` for `'waiting'` (after `in_progress`), `'ready'` (after `waiting`), and `'queued'` (after `ready`)
- `src/components/jobs/MarkWaitingButton.tsx` — `'use client'` component used on the job detail page; renders a "Mark Waiting" button that expands inline to a textarea prompting "What are you waiting on?"; on submit calls `markJobWaiting` server action and refreshes the page via `router.refresh()`

### Changed
- `src/lib/types.ts` — `JobStatus` union extended: `'unassigned' | 'in_progress' | 'waiting' | 'ready' | 'queued' | 'blocked' | 'cancelled' | 'completed' | 'archived'`
- `src/app/jobs/actions.ts` — added `markJobWaiting(jobId, reason)` server action: sets status to `'waiting'`, inserts an auto-generated comment `"Status changed to Waiting: {reason}"`, revalidates job and dashboard paths
- `src/app/jobs/[id]/page.tsx`:
  - `STATUS_STYLES` map expanded with `waiting` (yellow `#EAB308`), `ready` (blue `#60A5FA`), `queued` (dim purple `#8B8F9E`)
  - Status controls restructured into two rows: Row 1 shows `<MarkWaitingButton>`, "Mark Ready", "Mark Queued" (hiding the button for the current status); Row 2 shows "Resume" (when job is blocked/waiting/ready/queued) or "Mark Blocked" (otherwise), plus "Mark Complete" and "Cancel"
- `src/components/jobs/JobCard.tsx` — `STATUS_STYLES` extended with `waiting`, `ready`, `queued` entries matching the same color scheme
- `src/app/people/groups/[id]/page.tsx` — `JOB_STATUS` map extended with `waiting` (yellow `#EAB308`), `ready` (blue `#60A5FA`), `queued` (dim `#8B8F9E`)
- `src/components/dashboard/DashboardFeed.tsx`:
  - Added `waiting`, `ready`, `queued` filter buckets alongside existing ones
  - Dashboard section order: In Progress → Waiting → Ready → Queued → Blocked → Unassigned → Recently Completed
  - `hasResults` guard updated to include new buckets
- `src/app/dashboard/page.tsx`:
  - Active jobs query `.in('status', [...])` expanded to include `'waiting'`, `'ready'`, `'queued'`
  - Added `waitingFollowUpJobs` computation: `waiting` jobs where `latestActivity < threeDaysAgo` (same activity logic as Needs Attention)
  - Passes `waitingFollowUp={waitingFollowUpJobs}` to `<MyDaySection>`
- `src/components/dashboard/MyDaySection.tsx`:
  - `Props` interface + component signature accept new `waitingFollowUp: Job[]` prop
  - `totalItems` includes `waitingFollowUp.length`
  - Renders a "⏳ Still Waiting? Time to follow up." sub-section (yellow `#EAB308`) after Needs Attention when `waitingFollowUp.length > 0`

---

## Step 17 — My Day Dashboard Feature (April 2026)

### Added
- `src/lib/hooks/useLocalStorage.ts` — generic SSR-safe `useLocalStorage<T>(key, defaultValue)` hook with try/catch for private browsing; initializes from `defaultValue` on server, hydrates from localStorage on mount to avoid mismatch
- `src/components/dashboard/MyDaySection.tsx` — `'use client'` collapsible section at top of dashboard (above category tabs) with 5 conditional sub-sections:
  - **Overdue** (red `#F87171`) — jobs where `due_date` is in the past, status not completed/archived
  - **Due Today** (gold `#C8A44E`) — jobs where `due_date` is today
  - **Today's Recurring** (blue `#60A5FA`) — jobs auto-generated today from active recurring schedules (matched via `template_id`)
  - **Needs Attention** (orange `#FB923C`) — `in_progress` jobs with no steps checked off and no comment/activity in 3+ days (F4 nudge)
  - **Almost Done** (green `#4ADE80`) — jobs at 80%+ step completion but not yet marked complete (F5 nudge)
  - Empty sections hidden; when all sections empty, shows motivational "You're all caught up. Nice work." message with gold accent
  - Expand/collapse state persists via `localStorage` key `geaux-myday-expanded`
  - Collapse animation uses CSS `grid-template-rows: 0fr/1fr` transition
- `src/components/dashboard/MyDayCard.tsx` — compact job card showing title, client/workspace name, progress percentage, and link to job detail; accent-colored left border per section
- `src/components/profile/MyDayToggle.tsx` — `'use client'` toggle switch for "Make My Day your homepage" preference; stores `geaux-myday-homepage` in localStorage; when enabled, dashboard auto-expands My Day and scrolls to top on load

### Changed
- `src/lib/types.ts` — expanded `job_steps` array type in `Job` interface to include `completed_at: string | null` (for Needs Attention activity detection)
- `src/app/dashboard/page.tsx` — expanded `JOB_SELECT` to include `job_steps.completed_at`; added Phase 2 parallel queries for latest `job_comments` per active job and active `recurring_schedules` template IDs; computes 5 My Day arrays (overdue, due today, today's recurring, needs attention, almost done); renders `<MyDaySection>` between stats row and `<DashboardFeed>`
- `src/app/profile/page.tsx` — added "Preferences" section with `<MyDayToggle>` above the sign-out button

---

## Step 16 — Remove Global Role & Contacts System (April 2026)

### Added
- `supabase/migrations/021_contacts.sql` — new `contacts` table (id uuid, group_id FK → groups, name text NOT NULL, email, phone, company, notes, created_by FK → users, created_at); indexes on group_id, created_at, and name; RLS: workspace members can view contacts in their workspace, manager-or-above can create/edit/delete
- `src/lib/types.ts` — added `Contact` interface (id, group_id, name, email, phone, company, notes, created_by, created_at)
- `src/app/people/groups/[id]/actions.ts` — server actions: `createContact`, `updateContact`, `deleteContact` for workspace contact CRUD
- `src/app/people/groups/[id]/ContactsSection.tsx` — `'use client'` component with inline add/edit/delete for contacts; shows contact cards with name, company badge, email, phone; edit/delete buttons visible only for manager-or-above; add button in section header

### Changed
- `src/app/users/new/page.tsx` — removed global role picker (radio buttons for admin/partner/manager/worker/team_member/family_member/viewer); form now collects only name, email, and temporary password; added helper text explaining permissions come from workspace assignments
- `src/app/users/actions.ts` — `createUser` no longer reads `role` from form data; new users default to `'worker'` on the users table since real permissions come from `group_members.role_in_group`
- `src/app/people/groups/[id]/page.tsx` — added contacts data fetch and `ContactsSection` between Members and Jobs sections; checks current user's workspace role to determine contact management permissions
- `src/app/api/ai/create-job/route.ts` — "Who's this for?" matching now checks contacts table names (step 2) between workspace names (step 1) and legacy clients (step 3); matched contact links job to the contact's workspace via `group_id` and preserves contact name as `client_name`

---

## Step 15 — User Creation & Assignment Editing (April 2026)

### Added
- `src/app/users/new/page.tsx` — owner-only page at `/users/new` for creating user accounts directly via Supabase Admin API; form captures display name, email, temporary password, and global role (owner/admin/partner/manager/worker/team_member/family_member/viewer); creates auth user and users table row immediately without requiring an invite
- `src/app/users/[id]/page.tsx` — owner-only user detail page at `/users/[id]` showing full user profile with avatar, role badge, and join date; fetches workspace memberships, team memberships, and all available workspaces/teams for assignment management
- `src/app/users/[id]/UserDetailClient.tsx` — `'use client'` component with three sections: (1) Profile editor (display name + role pill selector with save), (2) Workspace Assignments (list with role dropdown, remove button, add-to-workspace with role picker), (3) Team Assignments (list with lead/member role dropdown, remove button, add-to-team with role picker); all actions use `useTransition` for optimistic updates
- Server actions in `src/app/users/actions.ts`: `createUser` (Supabase Admin API), `updateUserProfile`, `addUserToWorkspace`, `removeUserFromWorkspace`, `updateWorkspaceRole`, `addUserToTeam`, `removeUserFromTeam`, `updateTeamRole`

### Changed
- `src/lib/types.ts` — expanded `UserRole` type to include all database enum values: `owner | admin | partner | manager | worker | team_member | family_member | viewer`
- `src/app/users/page.tsx` — added "+ Create User" button in header linking to `/users/new`; each user card now links to `/users/[id]` detail page with hover chevron; role style map expanded to include admin, manager, worker, viewer roles
- `src/app/users/UserControls.tsx` — role pill options expanded to include admin, manager, worker, and viewer roles
- `src/app/users/actions.ts` — refactored with shared `requireOwner()` helper; added revalidation for `/users/[id]` paths; workspace/team actions use service client where needed for RLS bypass

---

## Step 14 — Workspace & Team Model: Schema & Migrations (April 2026)

> **Part 1 of 2 — schema and migrations only. UI changes deferred.**

### Added
- `supabase/migrations/012_groups_workspace_type.sql` — drops the auto-generated `groups_type_check` constraint from migration 011 and replaces it with an expanded set: `business | household | group | personal | misc`. Adds `group` as a first-class workspace type; retains `misc` for backward compatibility.
- `supabase/migrations/013_teams.sql` — new `teams` table (`id uuid`, `group_id uuid FK → groups`, `name text`, `description text`, `created_by uuid FK → users`, `created_at timestamptz`); indexes on `group_id` and `created_at`; RLS: workspace owner/admin can manage (insert/update/delete), workspace members can view.
- `supabase/migrations/014_team_memberships.sql` — new `team_memberships` table (`id uuid`, `team_id uuid FK → teams`, `user_id uuid FK → users`, `team_role text CHECK IN ('lead','member') DEFAULT 'member'`, `joined_at timestamptz`, unique on `(team_id, user_id)`); indexes on `team_id` and `user_id`; RLS: workspace owner/admin can manage, team members can view their own team.
- `supabase/migrations/015_user_role_enum.sql` — adds `admin` (after `owner`), `manager` (after `partner`), `worker` (after `manager`), `viewer` (after `family_member`) to the `user_role` enum using `IF NOT EXISTS`; full set is now: `owner, admin, partner, manager, worker, team_member, family_member, viewer`.
- `supabase/migrations/016_group_members_role_constraint.sql` — normalises any invalid `role_in_group` values to `viewer`, then adds `group_members_role_in_group_check` constraint enforcing `owner | admin | partner | manager | worker | viewer`; `NULL` is still permitted (inherits most-restrictive access).
- `supabase/migrations/017_jobs_ownership.sql` — adds `owner_user_id uuid FK → users` (person accountable for the job) and `assigned_team_id uuid FK → teams` (team collectively responsible) to `public.jobs`; partial indexes on both columns.
- `supabase/migrations/018_projects_ownership.sql` — same ownership columns (`owner_user_id`, `assigned_team_id`) added to `public.projects`; partial indexes on both columns.
- `supabase/migrations/019_resolve_user_workspace_role.sql` — new helper function `resolve_user_workspace_role(p_user_id uuid, p_group_id uuid) returns text`; resolves explicit `group_members.role_in_group` first, falls back to `'owner'` for global app owners, returns `NULL` if no relationship.
- `supabase/migrations/020_rls_role_hierarchy.sql` — replaces jobs/job_steps/job_comments RLS policies with role-aware versions:
  - New helpers: `is_workspace_admin_or_above(group_id)` (owner/admin/partner) and `is_workspace_manager_or_above(group_id)` (+ manager).
  - Updated `can_access_job()` to include `owner_user_id` and `assigned_team_id` team membership.
  - **Jobs SELECT**: owner/admin/partner/manager/worker/viewer in workspace, plus creator, owner, assignee, and team members.
  - **Jobs INSERT**: manager-or-above in workspace or privileged global role; workers cannot create jobs.
  - **Jobs UPDATE**: manager-or-above in workspace, creator, owner_user_id, or assignee (workers can update their own jobs).
  - **Jobs DELETE**: admin-or-above in workspace only.
  - **Job Steps INSERT/DELETE**: manager-or-above or job owner/creator; workers cannot add/remove steps.
  - **Job Steps UPDATE**: any job participant (workers can check off steps).
  - **Job Comments INSERT**: any job participant including workers (F4 Follow-Up).
  - **Job Comments DELETE**: own comment, or workspace admin-or-above.

---

## Step 13 — People Hub & Group Model Refactor (April 2026)

### Added
- `supabase/migrations/011_groups_extended.sql` — adds `type` (business | household | personal | misc, NOT NULL DEFAULT 'business'), `contact_email`, `contact_phone`, `locations jsonb`, and `notes` columns to `public.groups`; notes that `jobs.group_id` and `jobs.client_name` were already nullable
- `src/app/people/layout.tsx` — auth-gated layout for `/people` route with BottomNav
- `src/app/people/PeopleFeed.tsx` — `'use client'` component with live search bar filtering both Groups and People sections; `GroupCard` links to group detail, shows type badge + contact email + member count; `PersonCard` shows role badge + group membership chips
- `src/app/people/page.tsx` — `/people` server page fetching groups (with member counts) and all users (with group names); passes normalized data to `PeopleFeed`
- `src/app/people/groups/[id]/layout.tsx` — auth-gated layout for group detail route
- `src/app/people/groups/[id]/page.tsx` — group detail page at `/people/groups/[id]`: group header with type badge, contact info block (email + phone), notes, members list (role badge + role-in-group + join date), jobs section (active jobs with status dots + completed jobs at 60% opacity), all linking to `/jobs/[id]`
- `src/lib/types.ts` — added `GroupType` union type; extended `Group` interface with `type`, `contact_email`, `contact_phone`, `locations`, `notes` fields

### Changed
- `src/components/ui/BottomNav.tsx` — renamed 'Clients' tab to 'People', href updated from `/clients` to `/people`
- `src/app/api/ai/create-job/route.ts` — 'Who's this for?' now resolves against group names first (sets `group_id`, clears `client_name`); falls back to matching legacy clients table (sets `project_id`); unmatched input stored as plain `client_name` text
- `src/app/profile/page.tsx` — Manage Groups link now points users toward `/groups/manage`

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
