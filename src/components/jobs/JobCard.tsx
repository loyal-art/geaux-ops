import Link from 'next/link'
import { TriangleProgress } from './TriangleProgress'
import type { Job, JobStatus, JobPriority, JobCategory } from '@/lib/types'

// ── Status mapping (solid-pill badge + border/glow colors) ───────────────────

interface StatusStyle {
  label: string
  emoji: string
  color: string
}

const STATUS_STYLES: Record<JobStatus, StatusStyle> = {
  unassigned:  { label: 'UNASSIGNED', emoji: '📝', color: '#C8A44E' },
  in_progress: { label: 'ACTIVE',     emoji: '🚀', color: '#60A5FA' },
  waiting:     { label: 'WAITING',    emoji: '⏸',  color: '#EAB308' },
  ready:       { label: 'READY',      emoji: '✨', color: '#4ADE80' },
  queued:      { label: 'QUEUED',     emoji: '📋', color: '#8B8F9E' },
  blocked:     { label: 'BLOCKED',    emoji: '🚫', color: '#F87171' },
  cancelled:   { label: 'CANCELLED',  emoji: '🗑',  color: '#8B8F9E' },
  completed:   { label: 'DONE',       emoji: '✅', color: '#4ADE80' },
  archived:    { label: 'ARCHIVED',   emoji: '📦', color: '#8B8F9E' },
}

const CATEGORY_EMOJI: Record<JobCategory, string> = {
  business: '💼',
  home:     '🏠',
  personal: '👤',
  misc:     '📁',
}

const PRIORITY_DOT: Record<JobPriority, string | null> = {
  urgent: '#F87171',
  normal: null,
  low:    '#8B8F9E',
}

// ── Step bubble ───────────────────────────────────────────────────────────────

type StepState = 'completed' | 'current' | 'pending'

function StepBubble({ state }: { state: StepState }) {
  if (state === 'completed') {
    return (
      <span
        aria-hidden
        className="inline-block"
        style={{
          width:        '18px',
          height:       '18px',
          borderRadius: 'var(--radius-full)',
          background:   'var(--gradient-green)',
          boxShadow:    'var(--glow-green)',
        }}
      />
    )
  }
  if (state === 'current') {
    return (
      <span
        aria-hidden
        className="inline-block pulse-slow"
        style={{
          width:        '18px',
          height:       '18px',
          borderRadius: 'var(--radius-full)',
          background:   'var(--gradient-blue)',
          boxShadow:    'var(--glow-blue)',
        }}
      />
    )
  }
  return (
    <span
      aria-hidden
      className="inline-block"
      style={{
        width:        '18px',
        height:       '18px',
        borderRadius: 'var(--radius-full)',
        background:   'var(--bg-tertiary)',
        border:       '1.5px solid var(--bg-elevated)',
      }}
    />
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobCard({ job }: { job: Job }) {
  const steps          = job.job_steps ?? []
  const totalSteps     = steps.length
  const completedSteps = steps.filter(s => s.done).length
  const progress       = totalSteps > 0 ? completedSteps / totalSteps : 0
  const percent        = Math.round(progress * 100)

  const tpl          = Array.isArray(job.job_templates) ? job.job_templates[0] : job.job_templates
  const templateName = tpl?.name ?? 'Custom Task'

  const status      = STATUS_STYLES[job.status]
  const priorityDot = PRIORITY_DOT[job.priority]
  const categoryEmoji = CATEGORY_EMOJI[job.category] ?? '📁'

  const isOverdue = job.due_date && new Date(job.due_date) < new Date() && job.status !== 'completed'

  // Derive the "current step" as the first non-done step (bubbles are ordered
  // by whatever Supabase returns; we keep that order so step-by-step progress
  // reads naturally). Only in_progress jobs show a pulsing bubble.
  const firstOpenIdx = steps.findIndex(s => !s.done)
  const showCurrent  = job.status === 'in_progress' && firstOpenIdx >= 0

  // Bubble rendering: up to 10 bubbles + a "+N" indicator when there are more.
  const BUBBLE_LIMIT = 10
  const visibleSteps = steps.slice(0, BUBBLE_LIMIT)
  const hiddenCount  = Math.max(0, totalSteps - BUBBLE_LIMIT)

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card-hover relative block overflow-hidden active:scale-[0.98]"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderRadius:    'var(--radius-xl)',
        border:          `2px solid ${status.color}4D`,
        boxShadow:       'var(--shadow-md)',
      }}
    >
      {/* Corner radial glow — status-tinted, top-right */}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top:        '-60px',
          right:      '-60px',
          width:      '180px',
          height:     '180px',
          background: `radial-gradient(circle, ${status.color}26 0%, ${status.color}00 70%)`,
        }}
      />

      <div
        className="relative flex flex-col"
        style={{ padding: 'var(--space-5)', gap: 'var(--space-3)' }}
      >
        {/* Top: category label */}
        <div className="flex items-center justify-between gap-2">
          <p
            className="inline-flex items-center gap-1.5 truncate"
            style={{
              fontSize:      '11px',
              fontWeight:    'var(--weight-bold)',
              color:         status.color,
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            <span aria-hidden>{categoryEmoji}</span>
            <span className="truncate">{templateName}</span>
          </p>

          {/* Priority + overdue flags */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {priorityDot && (
              <span
                className="inline-flex items-center gap-1"
                style={{
                  fontSize:   '10px',
                  fontWeight: 'var(--weight-bold)',
                  color:      priorityDot,
                }}
              >
                <span
                  className="inline-block"
                  style={{
                    width:           '6px',
                    height:          '6px',
                    borderRadius:    'var(--radius-full)',
                    backgroundColor: priorityDot,
                  }}
                />
                {job.priority === 'urgent' ? 'URGENT' : 'LOW'}
              </span>
            )}
            {isOverdue && (
              <span
                style={{
                  fontSize:   '10px',
                  fontWeight: 'var(--weight-bold)',
                  color:      '#FB923C',
                }}
              >
                OVERDUE
              </span>
            )}
          </div>
        </div>

        {/* Job title */}
        <h3
          className="truncate"
          style={{
            fontSize:   '16px',
            fontWeight: 'var(--weight-extra)',
            color:      'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          {job.title}
        </h3>

        {/* Client name (optional) */}
        {job.client_name && (
          <p
            className="truncate"
            style={{
              fontSize: 'var(--text-xs)',
              color:    'var(--text-secondary)',
              marginTop: '-4px',
            }}
          >
            {job.client_name}
          </p>
        )}

        {/* Status badge — solid fill pill with emoji */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              padding:       '4px 10px',
              fontSize:      '10px',
              fontWeight:    'var(--weight-extra)',
              backgroundColor: status.color,
              color:         '#0F1117',
              borderRadius:  'var(--radius-full)',
              letterSpacing: 'var(--tracking-wide)',
              textTransform: 'uppercase',
            }}
          >
            <span aria-hidden>{status.emoji}</span>
            {status.label}
          </span>
        </div>

        {/* Steps row: bubble indicators + big percentage */}
        {totalSteps > 0 && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {visibleSteps.map((step, idx) => {
                const state: StepState = step.done
                  ? 'completed'
                  : showCurrent && idx === firstOpenIdx
                    ? 'current'
                    : 'pending'
                return <StepBubble key={step.id} state={state} />
              })}
              {hiddenCount > 0 && (
                <span
                  style={{
                    fontSize:   '11px',
                    fontWeight: 'var(--weight-bold)',
                    color:      'var(--text-tertiary)',
                    marginLeft: '2px',
                  }}
                >
                  +{hiddenCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                style={{
                  fontSize:   '18px',
                  fontWeight: 'var(--weight-black)',
                  color:      status.color,
                  lineHeight: 1,
                }}
              >
                {percent}%
              </span>
              {/* Ramp — kept as a small secondary detail */}
              <span style={{ opacity: 0.6 }}>
                <TriangleProgress progress={progress} color={status.color} size="sm" />
              </span>
            </div>
          </div>
        )}
      </div>

    </Link>
  )
}
