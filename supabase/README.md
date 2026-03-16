# Geaux Ops — Supabase Setup

Run these three SQL files **in order** in the Supabase SQL Editor.

## How to Run

1. Go to [supabase.com](https://supabase.com) → your **geaux-ops** project
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Paste the contents of each file below, one at a time, in order
5. Click **Run** after each one

---

## File Order

### 1. `migrations/001_schema.sql`
Creates all 10 tables, enums, indexes, and triggers.
- Enums: `user_role`, `job_status`, `job_priority`, `recurring_frequency`, `allowance_status`
- Tables: `users`, `groups`, `group_members`, `job_templates`, `jobs`, `job_steps`, `job_comments`, `recurring_schedules`, `notifications`, `allowance_ledger`
- Triggers: auto-creates a `users` row on sign-up; auto-promotes the first user to `owner`

### 2. `migrations/002_rls.sql`
Enables Row Level Security on all tables and creates access policies.
- Users can only see their own notifications and allowance entries
- Jobs are visible to owners, assignees, creators, and group members
- Only `owner` role can manage templates, groups, and allowance payouts

### 3. `migrations/003_seed_templates.sql`
Seeds all job templates:
- **Business (5):** RON, Cogency, Own RA, Southern VUEs Photo Shoot, Podcast
- **Household Daily (9):** Make Beds, Dirty Clothes, Dining Table, Dishwasher, Trash, Pick Up Toys, Wipe Counters, Sweep Floor, Deal With Mail
- **Household Weekly (10):** Laundry, Vacuum, Mop, Bathrooms, Dust, Fridge, Grocery Shopping, Change Sheets, Appliances, Recycling
- **Household Monthly (7):** Deep Clean Kitchen, Windows, Closets, Ceiling Fans, Garage, Trash Cans, Pet Areas
- **Custom (1):** Blank template

---

## After Running

Once all three files are executed:

1. **Enable Auth providers** in Supabase:
   - Go to **Authentication → Providers**
   - Enable **Email** (already on by default)
   - Enable **Google**: you'll need a Google OAuth client ID and secret from [Google Cloud Console](https://console.cloud.google.com)

2. **Sign up as the first user** — the trigger will automatically promote you to `owner`

3. **Verify** by running this in the SQL editor:
   ```sql
   select * from public.job_templates order by category, name;
   select * from public.users;
   ```

---

## Table Reference

| Table | Purpose |
|---|---|
| `users` | App profiles linked to Supabase Auth |
| `groups` | Collections of users (Business Ops, Household, Kids Only) |
| `group_members` | Who belongs to which group |
| `job_templates` | Reusable job blueprints with default steps |
| `jobs` | Individual units of work |
| `job_steps` | Checklist items within a job |
| `job_comments` | Comment thread on each job (F4: Follow-Up) |
| `recurring_schedules` | Auto-generate jobs on a schedule |
| `notifications` | In-app notifications per user |
| `allowance_ledger` | Tracks kid earnings per completed step |
