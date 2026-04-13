import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PeopleFeed } from './PeopleFeed'
import { getUserEffectiveRole, getPermissions } from '@/lib/permissions'
import type { GroupType, UserRole } from '@/lib/types'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const effectiveRole = await getUserEffectiveRole(supabase, user.id)
  const { canManageUsers } = getPermissions(effectiveRole)

  // Groups with member count
  const { data: groupsRaw } = await supabase
    .from('groups')
    .select('id, name, description, type, contact_email, contact_phone, group_members(user_id)')
    .order('name')

  // All users with their group memberships
  const { data: usersRaw } = await supabase
    .from('users')
    .select('id, display_name, email, role, group_members(group_id, groups(name))')
    .order('display_name', { ascending: true })

  const groups = (groupsRaw ?? []).map(g => {
    const members = Array.isArray(g.group_members) ? g.group_members : []
    return {
      id:            g.id,
      name:          g.name,
      description:   g.description as string | null,
      type:          (g.type ?? 'misc') as GroupType,
      contact_email: g.contact_email as string | null,
      contact_phone: g.contact_phone as string | null,
      memberCount:   members.length,
    }
  })

  const people = (usersRaw ?? []).map(u => {
    const memberships = Array.isArray(u.group_members) ? u.group_members : []
    const groupNames  = memberships.flatMap(m => {
      const g = m.groups
      if (!g) return []
      if (Array.isArray(g)) return g.map((x: { name: string }) => x.name)
      return [(g as { name: string }).name]
    })
    return {
      id:           u.id,
      display_name: u.display_name as string | null,
      email:        u.email as string,
      role:         (u.role ?? 'family_member') as UserRole,
      groups:       groupNames,
    }
  })

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <h1 className="text-3xl font-extrabold" style={{ color: '#E8E9ED' }}>People</h1>
        <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
          {groups.length} {groups.length === 1 ? 'group' : 'groups'} · {people.length} {people.length === 1 ? 'person' : 'people'}
        </p>
      </div>

      <PeopleFeed groups={groups} people={people} canManageUsers={canManageUsers} />
    </div>
  )
}
