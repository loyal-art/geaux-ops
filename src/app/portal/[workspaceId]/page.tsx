import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import type { JobStatus } from '@/lib/types'

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
  const pct = Math.round(progress * 100)
  const color = pct === 0
    ? '#3F4150'
    : pct < 26  ? '#F87171'
    : pct < 51  ? '#FB923C'
    : pct < 76  ? '#C8A44E'
    : pct < 100 ? '#A3E635'
    :              '#4ADE80'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums flex-shrink-0" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PortalWorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify the user is a member of this workspace
  const { data: membership } = await supabase
    .from('group_members')
    .select('role_in_group')
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) notFound()

  // Fetch the workspace
  const { data: workspace } = await supabase
    .from('groups')
    .select('id, name, type')
    .eq('id', workspaceId)
    .single()

  if (!workspace) notFound()

  // Fetch jobs belonging to this workspace (exclude archived/cancelled)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, status, due_date, created_at, updated_at, job_steps(id, done)')
    .eq('group_id', workspaceId)
    .not('status', 'in', '("archived","cancelled")')
    .order('created_at', { ascending: false })

  const jobList = (jobs ?? []).map(j => {
    const steps         = (j.job_steps ?? []) as { id: string; done: boolean }[]
    const total         = steps.length
    const completed     = steps.filter(s => s.done).length
    const progress      = total > 0 ? completed / total : 0
    const status        = STATUS_STYLES[j.status as JobStatus] ?? STATUS_STYLES.unassigned
    // Use updated_at if available, fall back to created_at
    const lastUpdatedRaw = (j as unknown as { updated_at?: string }).updated_at ?? j.created_at
    const lastUpdated    = new Date(lastUpdatedRaw).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    return { ...j, progress, status, lastUpdated }
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F1117' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Back to portal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <p className="text-sm font-semibold leading-tight" style={{ color: '#E8E9ED' }}>{workspace.name}</p>
            <p className="text-[11px] capitalize" style={{ color: '#8B8F9E' }}>{workspace.type}</p>
          </div>
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

      <div className="max-w-lg mx-auto px-5 pt-6 pb-12">
        {/* ── Submit Request CTA ── */}
        <Link
          href={`/portal/${workspaceId}/submit`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl mb-6 text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Submit a Request
        </Link>

        {/* ── Job list ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Active Jobs
          </h2>
          <span className="text-xs" style={{ color: '#8B8F9E' }}>{jobList.length}</span>
        </div>

        {jobList.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: '#8B8F9E' }}>
              No active jobs yet. Submit a request to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobList.map(job => (
              <Link
                key={job.id}
                href={`/portal/jobs/${job.id}`}
                className="block rounded-2xl px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99]"
                style={{
                  backgroundColor: '#1A1D27',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Title + status badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="font-semibold text-sm leading-snug flex-1" style={{ color: '#E8E9ED' }}>
                    {job.title}
                  </p>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: job.status.bg, color: job.status.text }}
                  >
                    {job.status.label}
                  </span>
                </div>

                {/* Progress bar */}
                <ProgressBar progress={job.progress} />

                {/* Last updated */}
                <p className="text-[11px] mt-2.5" style={{ color: '#8B8F9E' }}>
                  Updated {job.lastUpdated}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
