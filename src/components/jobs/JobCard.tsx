import Link from 'next/link'
import { TriangleProgress } from './TriangleProgress'
import type { Job, JobStatus, JobPriority } from '@/lib/types'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { label: string; bg: string; text: string }> = {
  unassigned:  { label: 'Unassigned',  bg: 'rgba(200,164,78,0.14)',  text: '#C8A44E'  },
  in_progress: { label: 'In Progress', bg: 'rgba(96,165,250,0.14)',  text: '#60A5FA'  },
  blocked:     { label: 'Blocked',     bg: 'rgba(248,113,113,0.14)', text: '#F87171'  },
  cancelled:   { label: 'Cancelled',   bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E'  },
  completed:   { label: 'Completed',   bg: 'rgba(74,222,128,0.14)',  text: '#4ADE80'  },
  archived:    { label: 'Archived',    bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E'  },
}

const PRIORITY_DOT: Record<JobPriority, string | null> = {
  urgent: '#F87171',
  normal: null,
  low:    '#8B8F9E',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function JobCard({ job }: { job: Job }) {
  const totalSteps     = job.job_steps?.length ?? 0
  const completedSteps = job.job_steps?.filter(s => s.done).length ?? 0
  const progress       = totalSteps > 0 ? completedSteps / totalSteps : 0

  const tpl          = Array.isArray(job.job_templates) ? job.job_templates[0] : job.job_templates
  const color        = tpl?.color ?? '#C8A44E'
  const templateName = tpl?.name  ?? 'Custom Task'
  const status      = STATUS_STYLES[job.status]
  const priorityDot = PRIORITY_DOT[job.priority]

  const isOverdue = job.due_date && new Date(job.due_date) < new Date() && job.status !== 'completed'

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card-hover block rounded-2xl overflow-hidden active:scale-[0.98]"
      style={{
        backgroundColor: '#1A1D27',
        border: isOverdue
          ? '1px solid rgba(251,146,60,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
        boxShadow: isOverdue
          ? '0 0 16px rgba(251,146,60,0.08), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Template color strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color, opacity: 0.75 }} />

      <div className="p-5 flex items-start justify-between gap-3">
        {/* Left: content */}
        <div className="flex-1 min-w-0">
          {/* Template name */}
          <p className="text-[11px] font-medium uppercase tracking-wider mb-1 truncate" style={{ color }}>
            {templateName}
          </p>

          {/* Job title */}
          <h3 className="font-semibold text-sm leading-snug mb-0.5 truncate" style={{ color: '#E8E9ED' }}>
            {job.title}
          </h3>

          {/* Client name */}
          {job.client_name && (
            <p className="text-xs mb-3 truncate" style={{ color: '#8B8F9E' }}>
              {job.client_name}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ backgroundColor: status.bg, color: status.text }}
            >
              {status.label}
            </span>

            {/* Priority dot */}
            {priorityDot && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: priorityDot }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityDot }} />
                {job.priority === 'urgent' ? 'Urgent' : 'Low'}
              </span>
            )}

            {/* Overdue */}
            {isOverdue && (
              <span className="text-[10px] font-semibold" style={{ color: '#FB923C' }}>
                Overdue
              </span>
            )}
          </div>

          {/* Step count */}
          {totalSteps > 0 && (
            <p className="text-[11px] mt-2" style={{ color: '#8B8F9E' }}>
              {completedSteps} of {totalSteps} steps
            </p>
          )}
        </div>

        {/* Right: triangle progress */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-1">
          <TriangleProgress progress={progress} color={color} size="md" />
          <span className="text-[10px] font-medium" style={{ color: progress >= 1 ? '#4ADE80' : '#8B8F9E' }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>
    </Link>
  )
}
