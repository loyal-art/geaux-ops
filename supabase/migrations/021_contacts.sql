-- ============================================================================
-- 021_contacts.sql — Contacts table for external people (clients, vendors, etc.)
-- Contacts belong to a workspace (group) and are NOT app users.
-- ============================================================================

create table public.contacts (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null,
  email       text,
  phone       text,
  company     text,
  notes       text,
  created_by  uuid references public.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Indexes
create index contacts_group_id_idx on public.contacts(group_id);
create index contacts_created_at_idx on public.contacts(created_at);
create index contacts_name_idx on public.contacts(name);

-- Enable RLS
alter table public.contacts enable row level security;

-- SELECT: workspace members can view contacts in their workspace
create policy "contacts_select" on public.contacts for select using (
  auth.uid() is not null and (
    public.is_owner()
    or public.is_group_member(group_id)
  )
);

-- INSERT: manager-or-above can create contacts
create policy "contacts_insert" on public.contacts for insert with check (
  auth.uid() is not null and (
    public.is_owner()
    or public.is_workspace_manager_or_above(group_id)
  )
);

-- UPDATE: manager-or-above can edit contacts
create policy "contacts_update" on public.contacts for update using (
  auth.uid() is not null and (
    public.is_owner()
    or public.is_workspace_manager_or_above(group_id)
  )
);

-- DELETE: manager-or-above can delete contacts
create policy "contacts_delete" on public.contacts for delete using (
  auth.uid() is not null and (
    public.is_owner()
    or public.is_workspace_manager_or_above(group_id)
  )
);
