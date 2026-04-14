import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import { addClientComment } from '@/app/portal/actions'
import type { JobStatus, JobComment } from '@/lib/types'

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

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const pct   = Math.round(progress * 100)
  const color = pct === 0
    ? '#3F4150'
    : pct < 26  ? '#F87171'
    : pct < 51  ? '#FB923C'
    : pct < 76  ? '#C8A44E'
    : pct < 100 ? '#A3E635'
    :              '#4ADE80'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#8B8F9E' }}>Progress</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ── Comment bubble ────────────────────────────────────────────────────────────

function CommentBubble({ comment }: { comment: JobComment }) {
  const name = comment.users?.display_name ?? 'Team'
  const time = new Date(comment.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
  return (
    <div className="flex gap-3">
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
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#E8E9ED',
          }}
        >
          {comment.text}
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PortalJobDetailPage({
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
      .select('*, job_steps(id, done)')
      .eq('id', id)
      .single(),

    supabase
      .from('job_comments')
      .select('*, users(display_name)')
      .eq('job_id', id)
      .eq('is_client_visible', true)
      .order('created_at', { ascending: true }),
  ])

  if (!job) notFound()

  // Verify the user has access via workspace membership
  if (job.group_id) {
    const { data: membership } = await supabase
      .from('group_members')
      .select('role_in_group')
      .eq('group_id', job.group_id)
      .eq('user_id', user.id)
      .single()
    if (!membership) notFound()
  }

  const steps      = (job.job_steps ?? []) as { id: string; done: boolean }[]
  const total      = steps.length
  const completed  = steps.filter(s => s.done).length
  const progress   = total > 0 ? completed / total : 0
  const status     = STATUS_STYLES[job.status as JobStatus] ?? STATUS_STYLES.unassigned
  const backHref   = job.group_id ? `/portal/${job.group_id}` : '/portal'

  const addComment = addClientComment.bind(null, id, job.group_id ?? '')

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F1117' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="text-sm font-semibold" style={{ color: '#E8E9ED' }}>Job Details</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: '#8B8F9E', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-6 pb-16">

        {/* Title + status */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <h1 className="text-xl font-bold leading-snug flex-1" style={{ color: '#E8E9ED' }}>
            {job.title}
          </h1>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="rounded-2xl px-5 py-4 mb-4"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <ProgressBar progress={progress} />
          {total > 0 && (
            <p className="text-[11px] mt-2" style={{ color: '#8B8F9E' }}>
              {completed} of {total} steps complete
            </p>
          )}
        </div>

        {/* F1: Finish definition */}
        {job.finish_definition && (
          <div
            className="rounded-2xl px-5 py-4 mb-4"
            style={{
              backgroundColor: 'rgba(200,164,78,0.06)',
              borderLeft: '3px solid #C8A44E',
              border: '1px solid rgba(200,164,78,0.15)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#C8A44E' }}>
              What done looks like
            </p>
            <p className="text-sm leading-relaxed italic" style={{ color: '#E8E9ED' }}>
              {job.finish_definition}
            </p>
          </div>
        )}

        {/* ── Client comments ── */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>Messages</span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
          </div>

          {(comments ?? []).length === 0 && (
            <p className="text-sm text-center py-4 mb-4" style={{ color: '#8B8F9E' }}>
              No messages yet. Leave a note for the team below.
            </p>
          )}

          <div className="space-y-4 mb-6">
            {(comments ?? []).map(c => (
              <CommentBubble key={c.id} comment={c as unknown as JobComment} />
            ))}
          </div>

          {/* Comment form */}
          <form action={addComment} className="flex gap-2 items-end">
            <textarea
              name="text"
              placeholder="Write a message..."
              rows={2}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E9ED',
              }}
            />
            <button
              type="submit"
              className="px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 flex-shrink-0"
              style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
