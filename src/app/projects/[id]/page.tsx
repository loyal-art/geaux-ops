import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { JobCard } from '@/components/jobs/JobCard'
import { updateProjectStatus } from '@/app/projects/actions'
import type { Job, JobStatus, ProjectStatus } from '@/lib/types'

// ── Status config ─────────────────────────────────────────────────────────────

const PROJECT_STATUS: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  active:   { label: 'Active',   bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80' },
  paused:   { label: 'Paused',   bg: 'rgba(251,146,60,0.12)',  color: '#FB923C' },
  complete: { label: 'Complete', bg: 'rgba(139,143,158,0.12)', color: '#8B8F9E' },
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
        {title}
        {count !== undefined && count > 0 && (
          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(139,143,158,0.15)', color: '#8B8F9E' }}>
            {count}
          </span>
        )}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ── Status cycle button ───────────────────────────────────────────────────────

function StatusCycleButton({
  projectId, currentStatus,
}: {
  projectId: string; currentStatus: ProjectStatus
}) {
  const next: Record<ProjectStatus, ProjectStatus> = {
    active:   'paused',
    paused:   'complete',
    complete: 'active',
  }
  const nextStatus = next[currentStatus]
  const cfg = PROJECT_STATUS[nextStatus]

  return (
    <form action={async () => { 'use server'; await updateProjectStatus(projectId, nextStatus) }}>
      <button
        type="submit"
        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all active:scale-95"
        style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}
      >
        Mark {cfg.label}
      </button>
    </form>
  )
}

// ── Job status ordering ───────────────────────────────────────────────────────

const STATUS_ORDER: JobStatus[] = ['in_progress', 'waiting', 'ready', 'queued', 'blocked', 'unassigned', 'completed', 'cancelled', 'archived']

const STATUS_LABELS: Record<JobStatus, string> = {
  in_progress: 'In Progress',
  waiting:     'Waiting',
  ready:       'Ready',
  queued:      'Queued',
  blocked:     'Blocked',
  unassigned:  'Unassigned',
  completed:   'Completed',
  cancelled:   'Cancelled',
  archived:    'Archived',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, clients(id, name)')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const { data: jobsRaw } = await supabase
    .from('jobs')
    .select('*, job_templates(name, color), job_steps(id, done)')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const jobs = (jobsRaw ?? []) as unknown as Job[]

  // Group jobs by status, only include statuses that have jobs
  const grouped = STATUS_ORDER.reduce<Record<string, Job[]>>((acc, status) => {
    const bucket = jobs.filter(j => j.status === status)
    if (bucket.length > 0) acc[status] = bucket
    return acc
  }, {})

  const statusGroups = Object.entries(grouped) as [JobStatus, Job[]][]

  const cfg = PROJECT_STATUS[project.status as ProjectStatus]
  const clientName = (project.clients as { id: string; name: string } | null)?.name ?? null
  const clientId   = (project.clients as { id: string; name: string } | null)?.id ?? null

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-xs" style={{ color: '#8B8F9E' }}>
          <Link href="/clients" className="hover:opacity-70 transition-opacity">Clients</Link>
          {clientName && clientId && (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
              <Link href={`/clients/${clientId}`} className="hover:opacity-70 transition-opacity">{clientName}</Link>
            </>
          )}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          <span style={{ color: '#E8E9ED' }}>Project</span>
        </div>

        {/* Project name + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#E8E9ED' }}>
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#8B8F9E' }}>
                {project.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <StatusCycleButton projectId={id} currentStatus={project.status as ProjectStatus} />
          </div>
        </div>

        {/* Stats */}
        {jobs.length > 0 && (
          <div className="flex gap-3 mt-5">
            {([
              { status: 'in_progress', color: '#60A5FA' },
              { status: 'blocked',     color: '#F87171' },
              { status: 'completed',   color: '#4ADE80' },
            ] as { status: JobStatus; color: string }[]).map(({ status, color }) => {
              const count = jobs.filter(j => j.status === status).length
              if (count === 0) return null
              return (
                <div
                  key={status}
                  className="flex flex-col items-center px-3 py-2 rounded-xl flex-1"
                  style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="text-lg font-bold" style={{ color }}>{count}</span>
                  <span className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#8B8F9E' }}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              )
            })}
            <div
              className="flex flex-col items-center px-3 py-2 rounded-xl flex-1"
              style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-lg font-bold" style={{ color: '#C8A44E' }}>{jobs.length}</span>
              <span className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#8B8F9E' }}>Total</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Add job CTA ── */}
      <div className="px-5 mb-6">
        <Link
          href={`/jobs/new?project_id=${id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: 'rgba(200,164,78,0.1)', color: '#C8A44E', border: '1px dashed rgba(200,164,78,0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Job to Project
        </Link>
      </div>

      {/* ── Jobs grouped by status ── */}
      <div className="px-5 space-y-8 pb-4">
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#8B8F9E' }}>No jobs in this project yet.</p>
          </div>
        )}

        {statusGroups.map(([status, bucket]) => (
          <section key={status}>
            <SectionHeader title={STATUS_LABELS[status]} count={bucket.length} />
            <div className="space-y-3">
              {bucket.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
