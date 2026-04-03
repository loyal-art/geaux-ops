import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createGroup } from './actions'
import { GroupEditor } from './GroupEditor'

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

export default async function GroupsManagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All groups with members (and member user details)
  const { data: groupsData } = await supabase
    .from('groups')
    .select('id, name, description, created_at, group_members(user_id, users(id, display_name, email, role))')
    .order('created_at', { ascending: true })

  // All users (for adding to groups)
  const { data: usersData } = await supabase
    .from('users')
    .select('id, display_name, email, role')
    .order('display_name', { ascending: true })

  const groups = groupsData ?? []
  const allUsers = (usersData ?? []) as Array<{ id: string; display_name: string | null; email: string; role: string }>

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
            <h1 className="text-2xl font-bold" style={{ color: '#E8E9ED' }}>Manage Groups</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              {groups.length} {groups.length === 1 ? 'group' : 'groups'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-8 pb-4">
        {/* ── Create group form ── */}
        <section>
          <SectionHeader title="New Group" />
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {error && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                {decodeURIComponent(error)}
              </div>
            )}
            <form action={createGroup} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
                  Name <span style={{ color: '#F87171' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Household, Business Team"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="What is this group for?"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
              >
                Create Group
              </button>
            </form>
          </div>
        </section>

        {/* ── Existing groups ── */}
        {groups.length > 0 && (
          <section className="pb-4">
            <SectionHeader title="Groups" />
            <div className="space-y-3">
              {groups.map(g => {
                type UserRow = { id: string; display_name: string | null; email: string; role: string }
                type RawMember = { user_id: string; users: UserRow | UserRow[] | null }
                const members = (g.group_members as RawMember[] ?? [])

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {/* Group identity */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(200,164,78,0.12)' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: '#E8E9ED' }}>{g.name}</p>
                        {g.description && (
                          <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>{g.description}</p>
                        )}
                        <p className="text-[10px] mt-0.5" style={{ color: '#8B8F9E' }}>
                          Created {new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <GroupEditor
                      groupId={g.id}
                      groupName={g.name}
                      description={g.description}
                      members={members.map(m => ({
                        user_id: m.user_id,
                        users: Array.isArray(m.users) ? (m.users[0] ?? null) : m.users,
                      }))}
                      allUsers={allUsers}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {groups.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: '#8B8F9E' }}>No groups yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
