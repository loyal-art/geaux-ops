import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import { MyDayToggle } from '@/components/profile/MyDayToggle'
import { EditNameForm } from '@/components/profile/EditNameForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { AvatarPicker } from '@/components/profile/AvatarPicker'
import { getAvatarStyle } from '@/lib/avatarColors'
import type { UserRole } from '@/lib/types'

// ── Role badge ────────────────────────────────────────────────────────────────

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

// ── Section divider ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>
      {label}
    </p>
  )
}

// ── Menu row ──────────────────────────────────────────────────────────────────

function MenuRow({
  href, icon, label, sublabel, accent,
}: {
  href: string
  icon: React.ReactNode
  label: string
  sublabel?: string
  accent?: boolean
}) {
  return (
    <Link
      href={href}
      className="card-hover flex items-center gap-4 px-5 py-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: accent ? 'rgba(200,164,78,0.12)' : 'rgba(255,255,255,0.05)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: accent ? '#C8A44E' : '#E8E9ED' }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>{sublabel}</p>}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: membershipsRaw }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, role, email, avatar_url')
      .eq('id', user.id)
      .single(),

    supabase
      .from('group_members')
      .select('role_in_group, groups(name)')
      .eq('user_id', user.id),
  ])

  const displayName  = profile?.display_name ?? user.email?.split('@')[0] ?? 'You'
  const email        = profile?.email ?? user.email ?? ''
  const role         = (profile?.role ?? 'family_member') as UserRole
  const roleStyle    = ROLE_STYLE[role]
  const initial      = displayName.charAt(0).toUpperCase()
  const isOwner      = role === 'owner'
  const avatarStyle  = getAvatarStyle(profile?.avatar_url)
  const avatarColor  = profile?.avatar_url ?? 'gold'

  // Flatten workspace memberships
  const workspaces = (membershipsRaw ?? []).map(m => {
    const g = m.groups
    const name = g
      ? (Array.isArray(g) ? g[0]?.name : (g as { name: string }).name)
      : 'Unknown workspace'
    return { name: name ?? 'Unknown workspace', roleInGroup: m.role_in_group ?? 'viewer' }
  })

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#E8E9ED' }}>Profile</h1>

        {/* Avatar + identity */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: avatarStyle.bg, color: avatarStyle.color }}
          >
            {initial}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#E8E9ED' }}>{displayName}</p>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>{email}</p>
            <span
              className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
            >
              {roleStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Account Settings ── */}
      <div className="px-5 mb-6">
        <SectionLabel label="Account Settings" />

        <div
          className="rounded-2xl p-5 space-y-6"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Display name */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B8F9E' }}>
              Display Name
            </p>
            <EditNameForm currentName={displayName} />
          </div>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Avatar picker */}
          <AvatarPicker initial={initial} currentColor={avatarColor} />

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* Change password */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B8F9E' }}>
              Change Password
            </p>
            <ChangePasswordForm />
          </div>
        </div>
      </div>

      {/* ── Workspace Memberships ── */}
      {workspaces.length > 0 && (
        <div className="px-5 mb-6">
          <SectionLabel label="Workspaces" />
          <div className="space-y-2">
            {workspaces.map((ws, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#E8E9ED' }}>{ws.name}</p>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full capitalize"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    color: '#8B8F9E',
                  }}
                >
                  {ws.roleInGroup}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Menu ── */}
      <div className="px-5 space-y-2 mb-6">
        <SectionLabel label="Admin" />

        {/* Invite People — owner only */}
        {isOwner && (
          <MenuRow
            href="/invites"
            accent
            label="Invite People"
            sublabel="Manage team access"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            }
          />
        )}

        {/* Manage Users — owner only */}
        {isOwner && (
          <MenuRow
            href="/users"
            accent
            label="Manage Users"
            sublabel="Roles & group assignments"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
        )}

        {/* Manage Groups — owner only */}
        {isOwner && (
          <MenuRow
            href="/groups/manage"
            accent
            label="Manage Groups"
            sublabel="Create and organize teams"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
          />
        )}

        {!isOwner && (
          <p className="text-xs py-1" style={{ color: '#8B8F9E' }}>
            No admin actions for your role.
          </p>
        )}
      </div>

      {/* ── Shortcuts ── */}
      <div className="px-5 space-y-2 mb-6">
        <SectionLabel label="Shortcuts" />

        <MenuRow
          href="/recurring"
          label="Recurring Jobs"
          sublabel="Manage scheduled work"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 22l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          }
        />

        <MenuRow
          href="/clients"
          label="Clients"
          sublabel="Manage client roster"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
      </div>

      {/* ── Preferences ── */}
      <div className="px-5 mb-6">
        <SectionLabel label="Preferences" />
        <MyDayToggle />
      </div>

      {/* ── Sign out ── */}
      <div className="px-5 mt-2">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }}
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* ── App version ── */}
      <p className="text-center text-[10px] mt-6 pb-24" style={{ color: '#8B8F9E' }}>
        Geaux Ops · Phase 2
      </p>
    </div>
  )
}
