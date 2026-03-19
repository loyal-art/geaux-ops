import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { frequencyLabel } from '@/lib/recurring'
import { toggleScheduleActive, deleteRecurringSchedule } from './actions'
import type { RecurringSchedule, RecurringFrequency } from '@/lib/types'

// ── Frequency badge ───────────────────────────────────────────────────────────

function FrequencyBadge({ frequency }: { frequency: RecurringFrequency }) {
  const colors: Record<RecurringFrequency, string> = {
    daily:    '#60A5FA',
    weekdays: '#A78BFA',
    weekly:   '#4ADE80',
    monthly:  '#C8A44E',
  }
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${colors[frequency]}20`, color: colors[frequency] }}
    >
      {frequencyLabel(frequency)}
    </span>
  )
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

// ── Schedule card ─────────────────────────────────────────────────────────────

function ScheduleCard({ schedule }: { schedule: RecurringSchedule }) {
  const templateName = schedule.job_templates?.name ?? 'Unknown template'
  const templateColor = schedule.job_templates?.color ?? '#C8A44E'
  const assigneeName = schedule.users?.display_name ?? null

  const nextRun = schedule.next_generate_at
    ? new Date(schedule.next_generate_at).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      })
    : '—'

  const lastRun = schedule.last_generated_at
    ? new Date(schedule.last_generated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      })
    : 'Never'

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{
        backgroundColor: '#1A1D27',
        border: `1px solid ${schedule.active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
        opacity: schedule.active ? 1 : 0.6,
      }}
    >
      {/* Template identity */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: templateColor }} />
          <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>
            {templateName}
          </p>
        </div>
        <FrequencyBadge frequency={schedule.frequency} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        <span className="text-[11px]" style={{ color: '#8B8F9E' }}>
          Next: <span style={{ color: '#E8E9ED' }}>{nextRun}</span>
        </span>
        <span className="text-[11px]" style={{ color: '#8B8F9E' }}>
          Last run: <span style={{ color: '#E8E9ED' }}>{lastRun}</span>
        </span>
        {assigneeName && (
          <span className="text-[11px]" style={{ color: '#8B8F9E' }}>
            Assignee: <span style={{ color: '#E8E9ED' }}>{assigneeName}</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Toggle active */}
        <form
          action={async () => {
            'use server'
            await toggleScheduleActive(schedule.id, !schedule.active)
          }}
          className="flex-1"
        >
          <button
            type="submit"
            className="w-full py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: schedule.active ? 'rgba(251,146,60,0.12)' : 'rgba(74,222,128,0.12)',
              color: schedule.active ? '#FB923C' : '#4ADE80',
              border: `1px solid ${schedule.active ? 'rgba(251,146,60,0.2)' : 'rgba(74,222,128,0.2)'}`,
            }}
          >
            {schedule.active ? 'Pause' : 'Resume'}
          </button>
        </form>

        {/* Delete */}
        <form
          action={async () => {
            'use server'
            await deleteRecurringSchedule(schedule.id)
          }}
        >
          <button
            type="submit"
            className="px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'rgba(248,113,113,0.08)',
              color: '#F87171',
              border: '1px solid rgba(248,113,113,0.15)',
            }}
            title="Delete schedule"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-5 opacity-20">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 2l4 4-4 4" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <path d="M7 22l-4-4 4-4" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#E8E9ED' }}>No recurring schedules</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#8B8F9E' }}>
        Set up a template to auto-generate fresh jobs on a daily, weekday, weekly, or monthly schedule.
      </p>
      <Link
        href="/recurring/new"
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        Set Up First Schedule
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isOwner = profile?.role === 'owner'

  const { data: schedules } = await supabase
    .from('recurring_schedules')
    .select('*, job_templates(name, color), users!recurring_schedules_assigned_to_fkey(display_name)')
    .order('created_at', { ascending: false })

  const all = (schedules ?? []) as unknown as RecurringSchedule[]
  const active = all.filter(s => s.active)
  const paused = all.filter(s => !s.active)

  return (
    <div className="max-w-lg mx-auto px-5 pt-12 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>Recurring Jobs</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>
            {all.length === 0
              ? 'Auto-generate jobs on a schedule'
              : `${active.length} active · ${paused.length} paused`}
          </p>
        </div>

        {isOwner && (
          <Link
            href="/recurring/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New
          </Link>
        )}
      </div>

      {/* Non-owner notice */}
      {!isOwner && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm"
          style={{
            backgroundColor: 'rgba(200,164,78,0.08)',
            border: '1px solid rgba(200,164,78,0.15)',
            color: '#C8A44E',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Only the owner can create or manage recurring schedules.
        </div>
      )}

      {/* Empty state */}
      {all.length === 0 && isOwner && <EmptyState />}

      {/* Active schedules */}
      {active.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Active" />
          <div className="space-y-3">
            {active.map(s => <ScheduleCard key={s.id} schedule={s} />)}
          </div>
        </section>
      )}

      {/* Paused schedules */}
      {paused.length > 0 && (
        <section>
          <SectionHeader title="Paused" />
          <div className="space-y-3">
            {paused.map(s => <ScheduleCard key={s.id} schedule={s} />)}
          </div>
        </section>
      )}

    </div>
  )
}
