import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { GroupType, UserRole, JobStatus, Contact } from '@/lib/types'
import { ContactsSection } from './ContactsSection'

// ── Type configs ───────────────────────────────────────────────────────────────

const GROUP_TYPE: Record<GroupType, { label: string; bg: string; color: string }> = {
  business:  { label: 'Business',  bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  household: { label: 'Household', bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
  personal:  { label: 'Personal',  bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
  misc:      { label: 'Misc',      bg: 'rgba(139,143,158,0.15)', color: '#8B8F9E' },
}

const ROLE_STYLE: Record<UserRole, { label: string; bg: string; color: string }> = {
  owner:         { label: 'Owner',       bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  admin:         { label: 'Admin',       bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  partner:       { label: 'Partner',     bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
  manager:       { label: 'Manager',     bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  worker:        { label: 'Worker',      bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
  team_member:   { label: 'Team Member', bg: 'rgba(56,189,248,0.15)',  color: '#38BDF8' },
  family_member: { label: 'Family',      bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
  viewer:        { label: 'Viewer',      bg: 'rgba(139,143,158,0.15)', color: '#8B8F9E' },
}

const JOB_STATUS: Record<JobStatus, { label: string; color: string }> = {
  unassigned:  { label: 'Unassigned',  color: '#C8A44E' },
  in_progress: { label: 'In Progress', color: '#60A5FA' },
  blocked:     { label: 'Blocked',     color: '#F87171' },
  cancelled:   { label: 'Cancelled',   color: '#8B8F9E' },
  completed:   { label: 'Completed',   color: '#4ADE80' },
  archived:    { label: 'Archived',    color: '#8B8F9E' },
}

// ── Info row ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>{label}</p>
        <p className="text-sm truncate" style={{ color: '#E8E9ED' }}>{value}</p>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

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

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Group with members
  const { data: group } = await supabase
    .from('groups')
    .select('*, group_members(user_id, role_in_group, joined_at, users(id, display_name, email, role))')
    .eq('id', id)
    .single()

  if (!group) notFound()

  // Jobs assigned to this group
  const { data: jobsRaw } = await supabase
    .from('jobs')
    .select('id, title, status, priority, client_name, created_at')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  // Contacts in this workspace
  const { data: contactsRaw } = await supabase
    .from('contacts')
    .select('*')
    .eq('group_id', id)
    .order('name')

  const contacts = (contactsRaw ?? []) as Contact[]

  // Check if current user is manager-or-above in this workspace (can manage contacts)
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = caller?.role === 'owner'
  const membership = ((group.group_members as Array<{ user_id: string; role_in_group: string | null }>) ?? [])
    .find(m => m.user_id === user.id)
  const canManageContacts = isOwner || ['owner', 'admin', 'partner', 'manager'].includes(membership?.role_in_group ?? '')

  const groupType = (group.type ?? 'misc') as GroupType
  const ts        = GROUP_TYPE[groupType]
  const initial   = group.name.charAt(0).toUpperCase()

  type RawMember = {
    user_id:      string
    role_in_group: string | null
    joined_at:    string
    users: { id: string; display_name: string | null; email: string; role: string } | Array<{ id: string; display_name: string | null; email: string; role: string }> | null
  }

  const members = ((group.group_members as RawMember[]) ?? []).map(m => {
    const u = Array.isArray(m.users) ? m.users[0] : m.users
    return {
      user_id:       m.user_id,
      role_in_group: m.role_in_group,
      joined_at:     m.joined_at,
      display_name:  u?.display_name ?? null,
      email:         u?.email ?? '',
      role:          (u?.role ?? 'family_member') as UserRole,
    }
  })

  const jobs = jobsRaw ?? []
  const activeJobs    = jobs.filter(j => ['unassigned', 'in_progress', 'blocked'].includes(j.status))
  const completedJobs = jobs.filter(j => j.status === 'completed')

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/people"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#8B8F9E' }}>People</span>
        </div>

        {/* Group avatar + info */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: ts.bg, color: ts.color }}
          >
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight" style={{ color: '#E8E9ED' }}>
                {group.name}
              </h1>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: ts.bg, color: ts.color }}
              >
                {ts.label}
              </span>
            </div>
            {group.description && (
              <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>{group.description}</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>
              {members.length} {members.length === 1 ? 'member' : 'members'} · {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 pb-4">
        {/* ── Contact info ── */}
        {(group.contact_email || group.contact_phone) && (
          <div
            className="space-y-3 p-4 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {group.contact_email && (
              <InfoRow
                label="Email"
                value={group.contact_email}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
                  </svg>
                }
              />
            )}
            {group.contact_phone && (
              <InfoRow
                label="Phone"
                value={group.contact_phone}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                }
              />
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {group.notes && (
          <div
            className="px-4 py-3 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: '#8B8F9E' }}>Notes</p>
            <p className="text-sm leading-relaxed" style={{ color: '#E8E9ED' }}>{group.notes}</p>
          </div>
        )}

        {/* ── Members ── */}
        <section>
          <SectionHeader title={`Members (${members.length})`} />
          {members.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>No members in this group.</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => {
                const roleStyle = ROLE_STYLE[m.role] ?? ROLE_STYLE.family_member
                const name    = m.display_name ?? m.email.split('@')[0]
                const initial = name.charAt(0).toUpperCase()
                const joined  = new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                return (
                  <div
                    key={m.user_id}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
                        >
                          {roleStyle.label}
                        </span>
                        {m.role_in_group && (
                          <span className="text-[10px]" style={{ color: '#8B8F9E' }}>{m.role_in_group}</span>
                        )}
                        <span className="text-[10px]" style={{ color: '#8B8F9E' }}>Joined {joined}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Contacts ── */}
        <ContactsSection groupId={id} contacts={contacts} canManage={canManageContacts} />

        {/* ── Jobs ── */}
        <section className="pb-4">
          <SectionHeader title={`Jobs (${jobs.length})`} />
          {jobs.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>No jobs assigned to this group.</p>
          ) : (
            <div className="space-y-2">
              {activeJobs.length > 0 && activeJobs.map(j => {
                const st = JOB_STATUS[j.status as JobStatus] ?? JOB_STATUS.unassigned
                return (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="card-hover flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-70"
                    style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{j.title}</p>
                      {j.client_name && (
                        <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>{j.client_name}</p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${st.color}18`, color: st.color }}
                    >
                      {st.label}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                )
              })}
              {completedJobs.length > 0 && (
                <>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mt-3 mb-2" style={{ color: '#8B8F9E' }}>
                    Completed
                  </p>
                  {completedJobs.map(j => (
                    <Link
                      key={j.id}
                      href={`/jobs/${j.id}`}
                      className="card-hover flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-70 opacity-60"
                      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#4ADE80' }} />
                      <p className="flex-1 text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{j.title}</p>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
