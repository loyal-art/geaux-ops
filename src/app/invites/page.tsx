import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createInvite, revokeInvite } from './actions'
import type { Invite, UserRole } from '@/lib/types'

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: Exclude<UserRole, 'owner'>; label: string; desc: string; color: string }[] = [
  { value: 'partner',     label: 'Partner',     desc: 'Full access',         color: '#A78BFA' },
  { value: 'team_member', label: 'Team Member', desc: 'Jobs & tasks',        color: '#60A5FA' },
  { value: 'family_member', label: 'Family',    desc: 'Household tasks only', color: '#4ADE80' },
]

const ROLE_COLOR: Record<string, string> = {
  partner:       '#A78BFA',
  team_member:   '#60A5FA',
  family_member: '#4ADE80',
  owner:         '#C8A44E',
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

// ── Invite form (client-action wrapped) ───────────────────────────────────────

function InviteForm({ error }: { error?: string }) {
  return (
    <form action={createInvite} className="space-y-4">
      {/* Hidden prev-state slot required by useActionState signature — server action ignores it */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
          Email <span style={{ color: '#F87171' }}>*</span>
        </label>
        <input
          type="email"
          name="email"
          placeholder="teammate@example.com"
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
        />
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
          Role
        </label>
        <div className="space-y-2">
          {ROLE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                defaultChecked={opt.value === 'team_member'}
                className="sr-only"
              />
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              <span className="flex-1">
                <span className="block text-sm font-semibold" style={{ color: '#E8E9ED' }}>{opt.label}</span>
                <span className="block text-[11px]" style={{ color: '#8B8F9E' }}>{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        Send Invite
      </button>
    </form>
  )
}

// ── Invite row ────────────────────────────────────────────────────────────────

function InviteRow({ invite }: { invite: Invite }) {
  const color = ROLE_COLOR[invite.role] ?? '#8B8F9E'
  const sent  = new Date(invite.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Avatar initial */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold uppercase"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {invite.email[0]}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{invite.email}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {invite.role.replace('_', ' ')}
          </span>
          <span className="text-[10px]" style={{ color: '#8B8F9E' }}>Sent {sent}</span>
        </div>
      </div>

      {/* Revoke */}
      <form action={async () => { 'use server'; await revokeInvite(invite.id) }}>
        <button
          type="submit"
          className="text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
          style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }}
        >
          Revoke
        </button>
      </form>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('invites')
    .select('*, users(display_name)')
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  const pending = (data ?? []) as unknown as Invite[]

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
            <h1 className="text-2xl font-bold" style={{ color: '#E8E9ED' }}>Invite People</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              {pending.length} pending {pending.length === 1 ? 'invite' : 'invites'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-8">
        {/* ── Send invite form ── */}
        <section>
          <SectionHeader title="New Invite" />
          <div
            className="p-4 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <InviteForm />
          </div>
        </section>

        {/* ── Pending invites ── */}
        {pending.length > 0 && (
          <section className="pb-4">
            <SectionHeader title="Pending" />
            <div className="space-y-2">
              {pending.map(inv => <InviteRow key={inv.id} invite={inv} />)}
            </div>
          </section>
        )}

        {pending.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: '#8B8F9E' }}>No pending invites.</p>
          </div>
        )}
      </div>
    </div>
  )
}
