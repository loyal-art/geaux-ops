// ── Role rank ─────────────────────────────────────────────────────────────────
// Higher number = more privileges. Global-only roles map to their nearest
// workspace equivalent so the same function works for both.

const ROLE_RANK: Record<string, number> = {
  owner:         6,
  admin:         5,
  partner:       4,
  manager:       3,
  worker:        2,
  team_member:   2,
  family_member: 2,
  viewer:        1,
}

// ── Permissions shape ─────────────────────────────────────────────────────────

export type Permissions = {
  canCreateJobs:      boolean  // manager+
  canEditJobs:        boolean  // worker+
  canDeleteJobs:      boolean  // partner+
  canManageUsers:     boolean  // owner only (global admin action)
  canManageTemplates: boolean  // partner+
  canCreateSteps:     boolean  // manager+
  canToggleSteps:     boolean  // worker+ (check off existing steps)
  canChangeStatus:    boolean  // worker+
  canComment:         boolean  // worker+
  canAccessRecurring: boolean  // manager+
  isViewerOnly:       boolean  // viewer only
}

// ── Pure permission resolver ──────────────────────────────────────────────────

export function getPermissions(role: string | null | undefined): Permissions {
  const r = ROLE_RANK[role ?? 'viewer'] ?? 1
  return {
    canCreateJobs:      r >= 3,
    canEditJobs:        r >= 2,
    canDeleteJobs:      r >= 4,
    canManageUsers:     r >= 6,
    canManageTemplates: r >= 4,
    canCreateSteps:     r >= 3,
    canToggleSteps:     r >= 2,
    canChangeStatus:    r >= 2,
    canComment:         r >= 2,
    canAccessRecurring: r >= 3,
    isViewerOnly:       r <= 1,
  }
}

// ── DB helper: highest role across all workspaces ─────────────────────────────
// Queries both the global users.role and all group_members.role_in_group rows,
// then returns whichever role string has the highest rank.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserEffectiveRole(supabase: any, userId: string): Promise<string> {
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('role').eq('id', userId).single(),
    supabase.from('group_members').select('role_in_group').eq('user_id', userId),
  ])

  const allRoles: string[] = [
    profile?.role,
    ...((memberships ?? []) as { role_in_group: string | null }[]).map(m => m.role_in_group),
  ].filter((r): r is string => typeof r === 'string' && r.length > 0)

  if (allRoles.length === 0) return 'viewer'

  return allRoles.reduce((best, curr) =>
    (ROLE_RANK[curr] ?? 0) > (ROLE_RANK[best] ?? 0) ? curr : best
  )
}
