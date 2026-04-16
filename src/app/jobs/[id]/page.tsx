import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { TriangleProgress } from '@/components/jobs/TriangleProgress'
import { JobStepsSection } from '@/components/jobs/JobStepsSection'
import { CommentForm } from '@/components/jobs/CommentForm'
import { updateJobStatus, reopenJob } from '@/app/jobs/actions'
import { CategoryChips } from '@/components/jobs/CategoryChips'
import { MarkWaitingButton } from '@/components/jobs/MarkWaitingButton'
import { CompleteJobButton } from '@/components/jobs/CompleteJobButton'
import { getPermissions } from '@/lib/permissions'
import type { JobStep, JobComment, JobStatus, JobCategory, StepDependency } from '@/lib/types'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<JobStatus, { label: string; bg: string; text: string }> = {
  unassigned:  { label: 'Unassigned',  bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E' },
  in_progress: { label: 'In Progress', bg: 'rgba(96,165,250,0.12)',  text: '#60A5FA' },
  waiting:     { label: 'Waiting',     bg: 'rgba(234,179,8,0.12)',   text: '#EAB308' },
  ready:       { label: 'Ready',       bg: 'rgba(96,165,250,0.12)',  text: '#60A5FA' },
  queued:      { label: 'Queued',      bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E' },
  blocked:     { label: 'Blocked',     bg: 'rgba(248,113,113,0.12)', text: '#F87171' },
  cancelled:   { label: 'Cancelled',   bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E' },
  completed:   { label: 'Completed',   bg: 'rgba(74,222,128,0.12)',  text: '#4ADE80' },
  archived:    { label: 'Archived',    bg: 'rgba(139,143,158,0.12)', text: '#8B8F9E' },
}

// ── Status action button ──────────────────────────────────────────────────────

function StatusButton({
  jobId, status, label, color, bg,
}: {
  jobId: string; status: string; label: string; color: string; bg: string
}) {
  return (
    <form action={async () => { 'use server'; await updateJobStatus(jobId, status) }}>
      <button
        type="submit"
        className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
        style={{ backgroundColor: bg, color, border: `1px solid ${color}30` }}
      >
        {label}
      </button>
    </form>
  )
}

// ── Comment bubble ────────────────────────────────────────────────────────────

function CommentBubble({ comment }: { comment: JobComment }) {
  const name = comment.users?.display_name ?? 'Unknown'
  const time = new Date(comment.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
        style={{ backgroundColor: '#C8A44E22', color: '#C8A44E' }}
      >
        {name[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: '#E8E9ED' }}>{name}</span>
          <span className="text-[10px]" style={{ color: '#8B8F9E' }}>{time}</span>
        </div>
        <p
          className="text-sm leading-relaxed px-3 py-2.5 rounded-xl rounded-tl-sm"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border:          '1px solid rgba(255,255,255,0.06)',
            color:           '#E8E9ED',
          }}
        >
          {comment.text}
        </p>
      </div>
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: job }, { data: comments }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, job_templates(name, color), job_steps(*)')
      .eq('id', id)
      .single(),

    supabase
      .from('job_comments')
      .select('*, users(display_name)')
      .eq('job_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!job) notFound()

  // ── Step dependencies (fetched after job so we have step IDs) ─────────────
  const steps0 = (job.job_steps ?? []) as JobStep[]
  const stepIds = steps0.map(s => s.id)
  const allDependencies: StepDependency[] = stepIds.length > 0
    ? (((await supabase.from('step_dependencies').select('*').in('step_id', stepIds)).data) ?? []) as StepDependency[]
    : []

  // ── Permissions: use workspace role if job belongs to a group ──────────────
  let effectiveRole: string = 'viewer'
  if (job.group_id) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role_in_group')
      .eq('group_id', job.group_id)
      .eq('user_id', user.id)
      .single()
    effectiveRole = membership?.role_in_group ?? 'viewer'
  } else {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    effectiveRole = profile?.role ?? 'viewer'
  }
  const perms = getPermissions(effectiveRole)

  const steps          = ((job.job_steps ?? []) as JobStep[]).sort((a, b) => a.sort_order - b.sort_order)
  const totalSteps     = steps.length
  const completedSteps = steps.filter(s => s.done).length
  const progress       = totalSteps > 0 ? completedSteps / totalSteps : 0

  const tpl          = Array.isArray(job.job_templates) ? job.job_templates[0] : job.job_templates
  const color        = tpl?.color ?? '#C8A44E'
  const templateName = tpl?.name  ?? 'Custom Task'
  const status       = STATUS_STYLES[job.status as JobStatus]

  const isDone       = job.status === 'completed'
  const isCancelled  = job.status === 'cancelled'
  const isResumable  = ['blocked', 'waiting', 'ready', 'queued'].includes(job.status)

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Template color strip ── */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color, opacity: 0.8 }} />

      {/* ── Header ── */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Back to dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          {/* Status badge */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Template label */}
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color }}>
          {templateName}
        </p>

        {/* Job title */}
        <h1 className="text-2xl font-bold mb-1 leading-snug" style={{ color: '#E8E9ED' }}>
          {job.title}
        </h1>

        {/* Client name */}
        {job.client_name && (
          <p className="text-sm mb-4" style={{ color: '#8B8F9E' }}>{job.client_name}</p>
        )}

        {/* Category chips */}
        <div className="mb-5">
          <CategoryChips jobId={job.id} category={(job.category ?? 'misc') as JobCategory} />
        </div>

        {/* Triangle + progress text */}
        <div className="flex items-center gap-6 my-6">
          <TriangleProgress progress={progress} color={color} size="lg" />
          <div>
            <p className="text-4xl font-bold" style={{ color: progress >= 1 ? '#4ADE80' : '#E8E9ED' }}>
              {Math.round(progress * 100)}%
            </p>
            <p className="text-sm mt-1" style={{ color: '#8B8F9E' }}>
              {completedSteps} of {totalSteps} steps
            </p>
            {job.priority === 'urgent' && (
              <p className="text-xs font-semibold mt-1" style={{ color: '#F87171' }}>Urgent</p>
            )}
          </div>
        </div>

        {/* F1: Finish definition */}
        {job.finish_definition && (
          <div
            className="px-4 py-3 rounded-xl mb-2"
            style={{
              backgroundColor: 'rgba(200,164,78,0.06)',
              borderLeft: `3px solid ${color}`,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>
              F1 — Done looks like
            </p>
            <p className="text-sm italic leading-relaxed" style={{ color: '#E8E9ED' }}>
              {job.finish_definition}
            </p>
          </div>
        )}

        {/* F2: Focus */}
        {job.focus && (
          <div
            className="px-4 py-3 rounded-xl mb-2"
            style={{
              backgroundColor: 'rgba(167,139,250,0.06)',
              borderLeft: '3px solid #A78BFA',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#A78BFA' }}>
              F2 — Focus
            </p>
            <p className="text-sm italic leading-relaxed" style={{ color: '#E8E9ED' }}>
              {job.focus}
            </p>
          </div>
        )}
      </div>

      <div className="px-5">

        {/* ── Steps ── */}
        <JobStepsSection
          steps={steps}
          jobTitle={job.title}
          jobColor={color}
          jobId={job.id}
          readOnly={!perms.canToggleSteps}
          canCreateSteps={perms.canCreateSteps}
          isDone={isDone}
          isCancelled={isCancelled}
          allDependencies={allDependencies}
          canManageDeps={perms.canCreateSteps}
        />

        {/* ── Comments ── */}
        <Divider label="Comments (F4: Follow-Up)" />

        {(comments ?? []).length === 0 && (
          <p className="text-sm text-center py-4 mb-4" style={{ color: '#8B8F9E' }}>
            No notes yet. Document obstacles, updates, and decisions here.
          </p>
        )}

        <div className="space-y-4 mb-6">
          {(comments ?? []).map(c => (
            <CommentBubble key={c.id} comment={c as unknown as JobComment} />
          ))}
        </div>

        {!isCancelled && perms.canComment && <CommentForm jobId={job.id} />}

        {/* ── Status Controls ── */}
        {!isDone && !isCancelled && perms.canChangeStatus && (
          <>
            <Divider label="Status" />
            <div className="pb-6 space-y-2">
              {/* Row 1 — Waiting / Ready / Queued */}
              <div className="flex gap-2">
                {job.status !== 'waiting' && <MarkWaitingButton jobId={job.id} />}
                {job.status !== 'ready'   && (
                  <StatusButton jobId={job.id} status="ready"  label="Mark Ready"  color="#60A5FA" bg="rgba(96,165,250,0.1)" />
                )}
                {job.status !== 'queued'  && (
                  <StatusButton jobId={job.id} status="queued" label="Mark Queued" color="#8B8F9E" bg="rgba(139,143,158,0.1)" />
                )}
              </div>
              {/* Row 2 — Block / Resume / Complete / Cancel */}
              <div className="flex gap-2">
                {isResumable ? (
                  <StatusButton jobId={job.id} status="in_progress" label="Resume"       color="#60A5FA" bg="rgba(96,165,250,0.1)" />
                ) : (
                  <StatusButton jobId={job.id} status="blocked"     label="Mark Blocked" color="#F87171" bg="rgba(248,113,113,0.1)" />
                )}
                <CompleteJobButton
                  jobId={job.id}
                  jobTitle={job.title}
                  totalSteps={totalSteps}
                  completedSteps={completedSteps}
                />
                <StatusButton jobId={job.id} status="cancelled" label="Cancel"        color="#8B8F9E" bg="rgba(139,143,158,0.1)" />
              </div>
            </div>
          </>
        )}

        {/* Resume cancelled job */}
        {isCancelled && (
          <>
            <Divider label="Status" />
            <div className="pb-6">
              <StatusButton jobId={job.id} status="in_progress" label="Resume Job" color="#60A5FA" bg="rgba(96,165,250,0.1)" />
            </div>
          </>
        )}

        {/* Reopen completed job */}
        {isDone && (
          <>
            <Divider label="Status" />
            <div className="pb-6">
              <form action={async () => { 'use server'; await reopenJob(job.id) }}>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.3)' }}
                >
                  Reopen Job
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
