# GEAUX OPS
**Family & Business Operations Platform**
Product Specification & Architecture Blueprint
Prepared for: Loyal --- 5 Nichols LLC / Geaux Mobile Notary LLC
Date: March 9, 2026
Version: 0.2 --- Requirements Defined
**Status: READY FOR ARCHITECTURE REVIEW**

## 1. Product Vision

Geaux Ops is a family and business operations platform designed to replace the mental overhead of managing multiple businesses, household responsibilities, and team coordination. It is not a generic task manager. It is a purpose-built command center for a solo operator running multiple service lines who needs to see, at a glance, what needs attention and what is progressing.

### 1.1 Core Problem

Loyal operates two LLCs with six combined service lines, supports his wife's notary and registered agent businesses, is studying for the Louisiana Notary Exam, and manages a household with children. There is no system that ties all of this together. Tasks get dropped. Context gets lost. The mental load is unsustainable without a tool built specifically for this reality.

### 1.2 What This Is NOT

- Not another Google Tasks or generic to-do list
- Not a corporate project management tool (no ServiceNow/Remedy aesthetic)
- Not a tool that requires training or onboarding to understand
- Not limited to one business or one user

### 1.3 What This IS

- A cozy, visually engaging workspace that you want to open
- A multi-user platform where family members and team can sign in and collaborate
- A job-based system with templated step-by-step workflows
- A gamified experience where progress is visible and completing work feels rewarding
- A tool that works beautifully on mobile (phone-first design)

### 1.4 The 5 Fs Framework

The 5 Fs are the operating philosophy of Geaux Ops. Every job in the system follows this progression. It is not an optional add-on --- it is the identity of the app and what separates it from every generic task manager.

**F1 --- FINISH:** Before anything starts, define what done looks like. Every job begins with a "What does finished look like?" prompt. This forces clarity before action. If you don't know where you're going, you can't get there.

**F2 --- FOCUS:** Prioritize the steps that move the needle most. Not all steps are equal --- the 80/20 rule applies. High-impact steps are weighted heavier (in allowance value, in visual emphasis). Focus on what produces results.

**F3 --- FEELING:** As focused work gets done, the triangle progress bar fills, colors shift from dull to vibrant, and you feel the momentum. The app's design reinforces progress emotionally. You should feel good opening this app.

**F4 --- FOLLOW-UP:** When obstacles hit --- and they will --- the system captures them through comments and added steps. Nothing stalls silently. Bumps and hiccups get documented and addressed.

**F5 --- FOLLOW-THROUGH:** Push through to the finish line. All steps complete. Job done. No half-measures.

**FEEDBACK (The Report Card):** Feedback is not a step --- it is the outcome. After a job completes, the results speak. For household chores, feedback is money (allowance earned). For business jobs, it is the archive record, the invoice sent, the client served. Feedback closes the loop and informs the next job.

The 5 Fs will be reflected throughout the UI: job creation prompts F1 (Finish), step weighting reflects F2 (Focus), the triangle progress bar embodies F3 (Feeling), comments and added steps serve F4 (Follow-Up), and completion triggers F5 (Follow-Through). Feedback appears in the completed job summary and allowance ledger.

---

## 2. Users & Roles

| Role | Who | Can Do | Dashboard View |
|---|---|---|---|
| Owner / Admin | Loyal | Everything: create jobs, assign, manage users, view all activity, configure templates | Full command center with all jobs, all users, all metrics |
| Partner | Wife | Create and manage jobs, assign tasks, view all business activity, manage household jobs | Business + household view, shared job board |
| Team Member | Future VA / assistant | View assigned jobs, claim unassigned jobs from group board, check off steps, add comments | Assigned jobs + group job board |
| Family Member | Kids | View assigned chores/tasks, claim chores from family board, check off steps, earn allowance | Simple view: my tasks, available chores, allowance balance |

### 2.1 Authentication

Email/password sign-in via Supabase Auth. Google OAuth as secondary option. Each user gets a role assigned by the Owner. Invitation system: Owner sends invite link, new user creates account and is auto-assigned to the appropriate role and group(s).

---

## 3. Core Concepts

### 3.1 Jobs

A Job is the central unit of work. Every piece of work in the system is a Job, whether it is a one-time RON notarization, a recurring daily email check, or a household chore. Jobs have:

- A type (from a template or custom)
- A client or name
- An owner (who created it) and an assignee (who is working on it)
- A list of steps (checklist items) that can be checked off
- A comment thread for notes, issues, and updates
- A status: Unassigned, In Progress, Blocked, Cancelled, Completed, Archived
- An optional allowance amount (for household/kid tasks)
- Priority level: Urgent, Normal, Low
- A visual progress indicator (the triangle progress bar)

### 3.2 Job Templates

Templates define the default steps for common job types. When a new job is created from a template, all default steps are pre-populated. Users can then add, remove, or modify steps for that specific instance. Templates are created and managed by Owner/Admin.

Initial templates to build:

| Template | Steps | Workflow Summary |
|---|---|---|
| RON --- Online Notarization | 10 | Find docs in email → Download → Upload to PandaDoc → Customize → Contact signers → Confirm time → Calendar → Conduct session → Invoice via QuickBooks → Confirm payment |
| Cogency Global --- Process Service | 7 | Receive docs → Date-stamp → Review → Scan → Upload to Cogency portal → Notify client → File originals |
| Own RA --- Service / Mail | 7 | Receive → Date-stamp → Identify client → Scan → Notify client → Forward originals → Log |
| Southern VUEs --- RE Photo Shoot | 11 | Confirm shoot → Calendar → Charge equipment → Travel → Shot checklist → Drone aerials → Transfer → Edit → MLS prep → Deliver → Invoice |
| Podcast --- Film & Edit | 9 | Confirm topic/guest → Setup equipment → Film → Transfer → Edit video → Edit audio → Thumbnail → Publish → Promote |
| Custom Task | 0 | Empty template --- user adds all steps manually |

### 3.3 Groups & Job Board

Groups are collections of users who share a job board. When a job is posted to a group without an assignee, any member of that group can claim it and start working. This removes the bottleneck of one person assigning everything.

Example groups:
- Business Ops --- Loyal + Wife + future assistant
- Household --- Loyal + Wife + Kids
- Kids Only --- Chores and tasks visible to children

### 3.4 Steps

Steps are the individual checklist items within a Job. They can be checked off by anyone assigned to the job. Steps can be added at any time (for unforeseen obstacles or additional work discovered mid-job). Each step can optionally have an allowance amount attached, so partial completion of a chore earns partial allowance.

### 3.5 Comments

Every job has a comment thread. Comments serve as a running log of activity, issues, decisions, and notes. They are timestamped and attributed to the user who posted them. Comments are the primary way to document what happened during a job.

### 3.6 Allowances

For household chores (assigned or claimed from the family job board), the parent sets a total chore value and distributes that amount across steps using the 80/20 rule --- harder or more important steps are weighted higher. For example, a $5 chore with 5 steps might have "Mow the lawn" worth $3.00 and "Put the mower away" worth $0.50. The app suggests an even split as default but allows the parent to drag amounts around.

Allowance rules:
- **ALL OR NOTHING** --- The chore must be fully completed before anyone gets paid. No partial payouts for quitting halfway.
- **SPLIT BY CONTRIBUTION** --- If multiple kids collaborate on a chore, each person gets credit (and pay) for the steps they personally completed. The system tracks who checked off each step.
- **COMPLETION REQUIRED FOR PAYOUT** --- Even in a split scenario, nobody gets paid until every step is done. If Kid A does 3 steps and Kid B does 2 steps and the chore is complete, both get paid for their portion. If Kid A does 3 steps and nobody finishes the rest, nobody gets anything.
- Kids can see and claim any chore from the family job board without parent approval.
- Payout is handled outside the app (cash, Venmo, etc.) and marked as paid by a parent. The child sees their running balance and earnings history in their dashboard.

FEEDBACK (the 6th F) for chores IS the allowance. The money is the report card.

---

## 4. Job Lifecycle

Every job moves through a defined lifecycle:

1. **CREATED** --- Job is created from a template or custom. Steps are populated.
2. **UNASSIGNED** --- Job is posted to a group board. Anyone in the group can claim it.
3. **IN PROGRESS** --- Someone has claimed or been assigned the job. Steps are being checked off.
4. **BLOCKED** --- Job cannot proceed (client cancelled, waiting for documents, etc.). Requires a comment explaining why.
5. **CANCELLED** --- Job is cancelled but preserved. Can be reactivated (un-cancelled) to resume where it left off.
6. **COMPLETED** --- All steps are checked off. Job moves to the completed sidebar panel.
7. **ARCHIVED** --- After a configurable period, completed jobs move to archive. Archived jobs are searchable but hidden from the main view.

### 4.1 Recurring Jobs

Daily and weekly recurring jobs auto-generate at their scheduled time. When the day resets, a fresh instance of each recurring job is created with all steps unchecked. Recurring jobs that had no major alterations do not need to be archived. If a recurring job instance had significant comments or added steps, it should be flagged for archival.

---

## 5. Design Philosophy & Visual Language

### 5.1 The Vibe: Cozy Office Workspace

The app should feel like a well-organized, warm workspace. Not corporate. Not sterile. Not a 1980s mainframe. Think: a modern home office with warm lighting, organized shelves, and a clean desk. Calm yet interesting. You want to open it.

### 5.2 Design Principles

1. **Warm dark mode** --- Deep backgrounds with warm undertones, not cold gray. Off-white text, not pure white.
2. **Soft, rounded edges** --- Everything has generous border-radius. Cards, buttons, inputs all feel approachable.
3. **Color tells the story** --- At a glance, color communicates status. Dull = not started. Vibrant = progressing. Green = done.
4. **Triangle progress bars** --- Signature visual element. Each job card has a triangular progress indicator that fills from dull to vibrant as steps complete. Instantly scannable.
5. **Micro-animations & celebrations** --- Subtle fireworks or confetti when a job completes. Smooth transitions between views. Progress bars animate as they fill.
6. **Swipe interactions** --- Tinder-inspired swipe gestures for quick actions (swipe right to claim a job, swipe left to skip/dismiss).
7. **Bottom navigation** --- Mobile-first with thumb-friendly bottom nav bar.
8. **Neumorphic accents** --- Subtle soft shadows on cards and buttons for tactile depth without going overboard.

### 5.3 Color Palette

| Name | Hex | Usage |
|---|---|---|
| Background | #0F1117 | Primary app background |
| Surface | #1A1D27 | Cards, panels, elevated elements |
| Gold | #C8A44E | Primary accent, branding, CTAs, progress highlights |
| Green | #4ADE80 | Completed, success, positive |
| Blue | #60A5FA | Cogency / informational |
| Purple | #A78BFA | Registered Agent |
| Orange | #FB923C | Podcast / warnings / approaching deadlines |
| Red | #F87171 | Urgent / blocked / overdue |
| Text | #E8E9ED | Primary text (off-white, not pure white) |
| Dim | #8B8F9E | Secondary text, labels, timestamps |

---

## 6. Key Screens

### 6.1 Dashboard (Home)
The first thing you see when opening the app. Shows:
- Daily checklist status (how many done today)
- Active jobs as cards with triangle progress indicators and banner showing job name
- Jobs approaching deadlines highlighted with warm/orange glow
- Side panel or collapsible section showing recently completed jobs
- Quick-add button for new jobs

### 6.2 Job Board (Group View)
Shows all unassigned jobs for the selected group. Users can swipe right to claim a job or tap to view details. Filter by job type. Sort by priority or date.

### 6.3 Job Detail
Full view of a single job:
- Job header with client name, type, and triangle progress bar
- Step checklist with check-off capability
- Add new step input at bottom of step list
- Comment thread below steps
- Status controls: Mark Blocked, Cancel, Complete
- If cancelled: Resume button to reactivate
- Allowance display if applicable (per-step earnings)

### 6.4 My Tasks (Personal View)
Filtered view showing only jobs assigned to the current user. Daily recurring tasks at the top, active jobs below. Simple and focused.

### 6.5 Kid Dashboard
Simplified interface for children:
- Available chores to claim (from family job board)
- My current tasks with step checklists
- Allowance balance and recent earnings
- Fun, colorful design with celebratory animations on completion

### 6.6 Archive
Searchable list of completed and archived jobs. Filterable by type, date range, and client. View-only --- no editing.

---

## 7. Notifications

### 7.1 Notification Triggers
- New job assigned to you
- New job posted to your group board
- Comment added to a job you are working on
- Job approaching deadline (if deadline is set)
- Job status changed (blocked, cancelled, completed)
- Recurring job generated for the day
- Allowance earned (for kids)

### 7.2 Notification Preferences
Each user can configure which notifications they receive and whether they get push notifications or in-app only.

---

## 8. Technical Architecture

### 8.1 Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (React) --- same stack as Top5DOA for consistency |
| Hosting | Vercel |
| Database | Supabase (Postgres + Row Level Security) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Real-time | Supabase Realtime (for live updates when team members check off steps) |
| Push Notifications | Supabase Edge Functions + web push API (Phase 2) |
| File Storage | Supabase Storage (for any document attachments, Phase 2) |

### 8.2 Database Schema (Preliminary)

Core tables:
- **users** --- id, email, display_name, role, avatar_url, created_at
- **groups** --- id, name, description, created_by
- **group_members** --- group_id, user_id, role_in_group
- **job_templates** --- id, name, color, category, default_steps (JSONB), created_by
- **jobs** --- id, template_id, client_name, status, priority, assigned_to, group_id, allowance_total, created_by, created_at, completed_at, archived_at
- **job_steps** --- id, job_id, text, done, completed_by, completed_at, allowance_amount, sort_order
- **job_comments** --- id, job_id, user_id, text, created_at
- **recurring_schedules** --- id, template_id, frequency (daily/weekly), group_id, assigned_to, active
- **notifications** --- id, user_id, type, job_id, message, read, created_at
- **allowance_ledger** --- id, user_id, job_id, step_id, amount, status (earned/paid), created_at

---

## 9. Build Phases

### Phase 1: Foundation
Get the core working. One user (Loyal), basic job management.
1. Supabase project setup with auth (email + Google OAuth)
2. Database tables: users, job_templates, jobs, job_steps, job_comments
3. Job CRUD: create from template, view, update steps, add comments
4. Dashboard with triangle progress bars
5. Job detail view with step checklist and comments
6. Daily recurring job generation
7. Mobile-responsive design with bottom nav
8. Deploy to Vercel

### Phase 2: Multi-User
Add collaboration features.
1. User roles (Owner, Partner, Team Member, Family Member)
2. Groups and group job board
3. Job assignment and claiming (swipe to claim)
4. Invitation system
5. Real-time updates via Supabase Realtime
6. Cancel/resume job functionality

### Phase 3: Gamification & Polish
Make it feel amazing.
- Completion animations (confetti/fireworks)
- Allowance system for kids
- Kid-friendly dashboard view
- Push notifications
- Archive and search
- Deadline warnings with visual glow effects
- Swipe gestures throughout

### Phase 4: Advanced
Future possibilities once the core is solid:
- Calendar integration (Google Calendar sync)
- File attachments on jobs (receipts, documents)
- Reporting and analytics (jobs completed per week, average completion time)
- Client portal (let clients see status of their notarization)
- QuickBooks integration for auto-invoicing

---

## 10. Resolved Decisions

| Question | Decision |
|---|---|
| Archive retention period? | Indefinite storage. Auto-hide jobs older than 90 days from default archive view. Full search available for older records. One year minimum guaranteed. |
| Kid chore visibility? | All chores visible to all kids. No age-based filtering. Kids see everything so they understand how much goes into keeping the house up. |
| Kid chore claiming? | Kids can see AND claim any chore without parent approval. |
| Recurring frequencies? | Yes --- support daily, weekdays only, weekly, and monthly. |
| Blocked job notifications? | Any status change or activity on a job (notes added, tasks added, steps finished by another party) triggers a notification to whoever has taken ownership of the job. |
| Allowance model? | Per-chore total, distributed across steps with 80/20 weighting. Parent sets total and allocates per step. All-or-nothing payout. Split by contribution if multiple kids collaborate. |
| My Day view? | Yes --- combine daily recurring + assigned jobs in one timeline view. |
| @mentions in comments? | Yes --- support @mentions to notify specific users. |
| App name? | Working title. To be finalized before public launch. |
| Custom domain? | Yes, once name is finalized. |
| Offline mode? | Not an immediate need. Phase 4 or later. |

### 10.1 Additional Resolved Decisions

| Question | Decision |
|---|---|
| Final app name? | Still working on it. Brainstorm session needed. |
| 5 Fs visual labeling? | Undetermined. Comments should label Follow-Ups and Follow-Throughs explicitly. Focus could display as the purpose/goal of the job. Still working out the details. |
| Onboarding for 5 Fs? | Consider motivational messages when a user is stuck on a task. Exact implementation TBD. |
| Kid dashboard theme? | Simpler, more playful, less reading. Touch-screen focused --- tapping and sliding over text-heavy UI. |

### 10.2 Pre-Built Household Chore Templates

**Daily Household Chores**
- Make beds
- Put dirty clothes in hamper
- Clear and wipe dining table after meals
- Load or unload dishwasher
- Take out trash
- Pick up toys and personal items
- Wipe kitchen counters
- Sweep kitchen floor
- Deal with mail (sort, recycle junk, file important items)

**Weekly Household Chores**
- Laundry --- wash, fold, and put away
- Vacuum all floors
- Mop hard floors
- Clean bathrooms (toilet, shower, sink, mirror)
- Dust surfaces
- Clean out refrigerator
- Grocery shopping
- Change bed sheets
- Wipe down kitchen appliances
- Take out recycling

**Monthly Household Chores**
- Deep clean kitchen (oven, behind appliances)
- Clean windows
- Organize closets and drawers
- Dust ceiling fans and light fixtures
- Clean garage or storage areas
- Wash outdoor trash cans
- Deep clean pet areas

Note: These are starting templates. Parents can customize, add, or remove chores. Each chore template will include default steps that can be modified per instance.

### 10.3 Remaining Open Questions

8. Final app name
9. How exactly should the 5 Fs be surfaced in the UI? Labels on job cards vs. subtle integration vs. a combination?
10. What motivational messages or nudges should appear when a user is stuck on a task?
11. Should the kid dashboard use a completely different color palette, or a simplified version of the main theme?
12. What specific swipe gestures and touch interactions should the kid dashboard support?

---
*This is a living document.*
*Updated as requirements are refined through conversation.*
