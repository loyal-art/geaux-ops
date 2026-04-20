// ── Assignment data loading ───────────────────────────────────────────────────
// Helpers for job-assignment flows: fetches the workspaces a user can create
// jobs in (manager+ role), plus members and teams for each workspace.

import type { createClient } from '@/lib/supabase/server'

type SupabaseSrvClient = Awaited<ReturnType<typeof createClient>>

export type AssignableMember = {
  user_id:      string
  display_name: string | null
  email:        string | null
}

export type AssignableTeam = {
  id:           string
  name:         string
  member_count: number
}

export type AssignableWorkspace = {
  id:      string
  name:    string
  members: AssignableMember[]
  teams:   AssignableTeam[]
}

const MANAGER_PLUS_ROLES = ['owner', 'admin', 'partner', 'manager']

export async function loadAssignableWorkspaces(
  supabase: SupabaseSrvClient,
  userId: string,
): Promise<AssignableWorkspace[]> {
  // 1. Determine which groups the user has manager+ role in
  const [{ data: myMemberships }, { data: profile }] = await Promise.all([
    supabase.from('group_members').select('group_id, role_in_group').eq('user_id', userId),
    supabase.from('users').select('role').eq('id', userId).single(),
  ])

  const isGlobalAdmin = profile?.role === 'owner' || profile?.role === 'admin'

  let groupIds: string[]
  if (isGlobalAdmin) {
    const { data: allGroups } = await supabase.from('groups').select('id')
    groupIds = (allGroups ?? []).map(g => g.id as string)
  } else {
    groupIds = (myMemberships ?? [])
      .filter(m => m.role_in_group && MANAGER_PLUS_ROLES.includes(m.role_in_group))
      .map(m => m.group_id as string)
  }

  if (groupIds.length === 0) return []

  const [{ data: groups }, { data: teams }] = await Promise.all([
    supabase
      .from('groups')
      .select('id, name, group_members(user_id, users(id, display_name, email))')
      .in('id', groupIds)
      .order('name'),
    supabase
      .from('teams')
      .select('id, name, group_id, team_memberships(user_id)')
      .in('group_id', groupIds)
      .order('name'),
  ])

  const teamsByGroup = new Map<string, AssignableTeam[]>()
  for (const t of (teams ?? []) as Array<{ id: string; name: string; group_id: string; team_memberships?: Array<{ user_id: string }> }>) {
    const list = teamsByGroup.get(t.group_id) ?? []
    list.push({
      id:           t.id,
      name:         t.name,
      member_count: (t.team_memberships ?? []).length,
    })
    teamsByGroup.set(t.group_id, list)
  }

  type UserJoin   = { id: string; display_name: string | null; email: string | null }
  type MemberJoin = { user_id: string; users: UserJoin | UserJoin[] | null }
  type GroupJoin  = { id: string; name: string; group_members: MemberJoin[] }

  return ((groups ?? []) as unknown as GroupJoin[]).map(g => ({
    id:      g.id,
    name:    g.name,
    members: (g.group_members ?? [])
      .map(m => {
        const u = Array.isArray(m.users) ? m.users[0] : m.users
        return {
          user_id:      m.user_id,
          display_name: u?.display_name ?? null,
          email:        u?.email ?? null,
        }
      })
      .sort((a, b) => (a.display_name ?? a.email ?? '').localeCompare(b.display_name ?? b.email ?? '')),
    teams:   teamsByGroup.get(g.id) ?? [],
  }))
}

// Check whether a user has manager+ role in a given workspace. Used on the job
// detail page to gate the "Edit Assignments" button.
export async function canManageWorkspace(
  supabase: SupabaseSrvClient,
  userId: string,
  groupId: string | null,
): Promise<boolean> {
  if (!groupId) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()
    return profile?.role === 'owner' || profile?.role === 'admin'
  }
  const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single()
  if (profile?.role === 'owner' || profile?.role === 'admin') return true

  const { data: membership } = await supabase
    .from('group_members')
    .select('role_in_group')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single()

  return MANAGER_PLUS_ROLES.includes(membership?.role_in_group ?? '')
}
