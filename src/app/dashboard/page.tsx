import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { JobCard } from '@/components/jobs/JobCard'
import type { Job } from '@/lib/types'

// ── Greeting ──────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getUTCHours() // close enough for a greeting
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-2 rounded-2xl flex-1"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>{label}</span>
    </div>
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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg width="80" height="72" viewBox="0 0 100 90" fill="none" className="mb-6 opacity-20">
        <polygon points="50,4 96,84 4,84" fill="none" stroke="#C8A44E" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#E8E9ED' }}>No active jobs</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#8B8F9E' }}>
        Create your first job from one of your templates to get started.
      </p>
      <Link
        href="/jobs/new"
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        Create Your First Job
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: activeJobs }, { data: completedJobs }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, role')
      .eq('id', user.id)
      .single(),

    supabase
      .from('jobs')
      .select('*, job_templates(name, color), job_steps(id, done)')
      .in('status', ['unassigned', 'in_progress', 'blocked'])
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(30),

    supabase
      .from('jobs')
      .select('id, title, completed_at, job_templates(name, color)')
      .eq('status', 'completed')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('completed_at', { ascending: false })
      .limit(5),
  ])

  const jobs = (activeJobs ?? []) as unknown as Job[]

  const inProgress = jobs.filter(j => j.status === 'in_progress')
  const unassigned = jobs.filter(j => j.status === 'unassigned')
  const blocked    = jobs.filter(j => j.status === 'blocked')

  const urgentCount    = jobs.filter(j => j.priority === 'urgent').length
  const completedToday = (completedJobs ?? []).filter(j =>
    j.completed_at && new Date(j.completed_at).toDateString() === new Date().toDateString()
  ).length

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'there'

  // Today's date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#E8E9ED' }}>
              {greeting(displayName)}
            </h1>
            <p className="text-sm" style={{ color: '#8B8F9E' }}>{today}</p>
          </div>
          {/* Notification bell placeholder */}
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
            aria-label="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-5 mb-8 flex gap-3">
        <Stat value={inProgress.length} label="In Progress" color="#60A5FA" />
        <Stat value={completedToday}    label="Done Today"  color="#4ADE80" />
        <Stat value={urgentCount}       label="Urgent"      color="#F87171" />
      </div>

      {/* ── Main content ── */}
      <div className="px-5 space-y-8">

        {jobs.length === 0 && <EmptyState />}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <section>
            <SectionHeader title="In Progress" />
            <div className="space-y-3">
              {inProgress.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </section>
        )}

        {/* Blocked */}
        {blocked.length > 0 && (
          <section>
            <SectionHeader title="Blocked" />
            <div className="space-y-3">
              {blocked.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </section>
        )}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <section>
            <SectionHeader title="Unassigned" />
            <div className="space-y-3">
              {unassigned.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </section>
        )}

        {/* Recently completed */}
        {(completedJobs ?? []).length > 0 && (
          <section className="pb-4">
            <SectionHeader title="Recently Completed" />
            <div className="space-y-2">
              {(completedJobs ?? []).map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: '#1A1D27',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (job.job_templates as { color: string } | null)?.color ?? '#4ADE80' }}
                  />
                  <span className="text-sm flex-1 truncate" style={{ color: '#8B8F9E' }}>
                    {job.title}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
