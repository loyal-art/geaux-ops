import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserControls } from './UserControls'
import type { UserRole } from '@/lib/types'

// ── Role display ───────────────────────────────────────────────────────────────

const ROLE_STYLE: Record<UserRole, { label: string; bg: string; color: string }> = {
  owner:         { label: 'Owner',       bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  partner:       { label: 'Partner',     bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
  team_member:   { label: 'Team Member', bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
  family_member: { label: 'Family',      bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
        {title}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All users with group memberships
  const { data: usersData } = await supabase
    .from('users')
    .select('id, email, display_name, role, created_at, group_members(group_id)')
    .order('created_at', { ascending: true })

  // All groups
  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name')
    .order('name')

  // Client associations: unique client_name per user (from jobs)
  const { data: jobsData } = await supabase
    .from('jobs')
    .select('created_by, assigned_to, client_name')
    .not('client_name', 'is', null)

  const users  = usersData  ?? []
  const groups = (groupsData ?? []) as Array<{ id: string; name: string }>

  // Build a map of userId → Set<client_name>
  const clientsByUser = new Map<string, Set<string>>()
  for (const job of jobsData ?? []) {
    const clientName = job.client_name as string
    for (const uid of [job.created_by, job.assigned_to]) {
      if (!uid) continue
      if (!clientsByUser.has(uid)) clientsByUser.set(uid, new Set())
      clientsByUser.get(uid)!.add(clientName)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/profile"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E8E9ED' }}>Manage Users</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              {users.length} registered {users.length === 1 ? 'user' : 'users'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-8 pb-4">
        <section>
          <SectionHeader title="All Users" />
          <div className="space-y-3">
            {users.map(u => {
              const role       = (u.role ?? 'family_member') as UserRole
              const roleStyle  = ROLE_STYLE[role]
              const isOwner    = role === 'owner'
              const name       = u.display_name ?? u.email.split('@')[0]
              const initial    = name.charAt(0).toUpperCase()
              const joined     = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              const memberGroups = ((u.group_members as Array<{ group_id: string }>) ?? []).map(m => m.group_id)
              const clients    = [...(clientsByUser.get(u.id) ?? [])]

              return (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl"
                  style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* User identity */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>{name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                        >
                          {roleStyle.label}
                        </span>
                        <span className="text-[10px]" style={{ color: '#8B8F9E' }}>Joined {joined}</span>
                      </div>
                    </div>
                  </div>

                  {/* Client associations */}
                  {clients.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8B8F9E' }}>
                        Associated Clients
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {clients.map(c => (
                          <span
                            key={c}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(251,146,60,0.1)', color: '#FB923C', border: '1px solid rgba(251,146,60,0.2)' }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Controls: role + groups */}
                  <UserControls
                    userId={u.id}
                    currentRole={role}
                    isOwner={isOwner}
                    allGroups={groups}
                    memberGroups={memberGroups}
                  />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
