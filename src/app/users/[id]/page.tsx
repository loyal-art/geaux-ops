import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { UserDetailClient } from './UserDetailClient'
import type { UserRole } from '@/lib/types'

const ROLE_STYLE: Record<string, { label: string; color: string }> = {
  owner:         { label: 'Owner',       color: '#C8A44E' },
  admin:         { label: 'Admin',       color: '#C8A44E' },
  partner:       { label: 'Partner',     color: '#A78BFA' },
  manager:       { label: 'Manager',     color: '#FB923C' },
  worker:        { label: 'Worker',      color: '#60A5FA' },
  team_member:   { label: 'Team Member', color: '#38BDF8' },
  family_member: { label: 'Family',      color: '#4ADE80' },
  viewer:        { label: 'Viewer',      color: '#8B8F9E' },
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  // Auth check (layout already handles owner guard, but belt-and-suspenders)
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  // Fetch the target user
  const { data: targetUser } = await supabase
    .from('users')
    .select('id, email, display_name, role, created_at')
    .eq('id', id)
    .single()

  if (!targetUser) notFound()

  const role = (targetUser.role ?? 'viewer') as UserRole
  const roleInfo = ROLE_STYLE[role] ?? ROLE_STYLE.viewer
  const name = targetUser.display_name ?? targetUser.email.split('@')[0]
  const initial = name.charAt(0).toUpperCase()
  const joined = new Date(targetUser.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  // Fetch workspace memberships for this user
  const { data: wsMemberships } = await supabase
    .from('group_members')
    .select('group_id, role_in_group, groups(name)')
    .eq('user_id', id)

  // Fetch team memberships for this user (use service client to bypass RLS)
  const { data: tmMemberships } = await service
    .from('team_memberships')
    .select('team_id, team_role, teams(id, name, group_id, groups(name))')
    .eq('user_id', id)

  // Fetch all workspaces and teams for the add-to dropdowns
  const { data: allWorkspaces } = await supabase
    .from('groups')
    .select('id, name')
    .order('name')

  const { data: allTeams } = await service
    .from('teams')
    .select('id, name, group_id, groups(name)')
    .order('name')

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/users"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: `${roleInfo.color}22`, color: roleInfo.color }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate" style={{ color: '#E8E9ED' }}>{name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${roleInfo.color}22`, color: roleInfo.color }}
                >
                  {roleInfo.label}
                </span>
                <span className="text-[11px]" style={{ color: '#8B8F9E' }}>Joined {joined}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <UserDetailClient
          userId={id}
          displayName={name}
          email={targetUser.email}
          role={role}
          isOwnerUser={role === 'owner'}
          workspaceMemberships={(wsMemberships ?? []) as Array<{
            group_id: string
            role_in_group: string | null
            groups: { name: string } | null
          }>}
          teamMemberships={(tmMemberships ?? []) as Array<{
            team_id: string
            team_role: string
            teams: { id: string; name: string; group_id: string; groups?: { name: string } | null } | null
          }>}
          allWorkspaces={(allWorkspaces ?? []) as Array<{ id: string; name: string }>}
          allTeams={(allTeams ?? []) as Array<{
            id: string
            name: string
            group_id: string
            groups?: { name: string } | null
          }>}
        />
      </div>
    </div>
  )
}
