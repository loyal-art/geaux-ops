import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardFeed } from '@/components/dashboard/DashboardFeed'
import { MyDaySection } from '@/components/dashboard/MyDaySection'
import type { Job } from '@/lib/types'

// ── Greeting ──────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getUTCHours()
  if (h < 12) return `Good morning, ${name}`
  if (h < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center px-4 py-4 rounded-2xl flex-1"
      style={{
        backgroundColor: '#1A1D27',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: `2px solid ${color}40`,
      }}
    >
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>{label}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const JOB_SELECT = '*, job_templates(name, color), job_steps(id, done, completed_at), projects(name)'

  const [{ data: profile }, { data: activeRaw }, { data: completedRaw }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, role')
      .eq('id', user.id)
      .single(),

    supabase
      .from('jobs')
      .select(JOB_SELECT)
      .in('status', ['unassigned', 'in_progress', 'blocked'])
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('jobs')
      .select(JOB_SELECT)
      .eq('status', 'completed')
      .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
      .order('completed_at', { ascending: false })
      .limit(10),
  ])

  const activeJobs    = (activeRaw    ?? []) as unknown as Job[]
  const completedJobs = (completedRaw ?? []) as unknown as Job[]

  // ── Phase 2: My Day supplemental queries ───────────────────────────────────
  const activeJobIds = activeJobs.map(j => j.id)

  const [{ data: recentComments }, { data: recurringSchedules }] = await Promise.all([
    activeJobIds.length > 0
      ? supabase
          .from('job_comments')
          .select('job_id, created_at')
          .in('job_id', activeJobIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as { job_id: string; created_at: string }[] }),

    supabase
      .from('recurring_schedules')
      .select('template_id')
      .eq('active', true),
  ])

  // Build lookup: latest comment per job
  const latestCommentByJob = new Map<string, string>()
  for (const c of recentComments ?? []) {
    if (!latestCommentByJob.has(c.job_id)) {
      latestCommentByJob.set(c.job_id, c.created_at)
    }
  }

  // Build set of recurring template IDs
  const recurringTemplateIds = new Set(
    (recurringSchedules ?? []).map((s: { template_id: string }) => s.template_id),
  )

  // ── Compute My Day sections ────────────────────────────────────────────────
  const now       = new Date()
  const todayStr  = now.toDateString()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  const overdueJobs:         Job[] = []
  const dueTodayJobs:        Job[] = []
  const todaysRecurringJobs: Job[] = []
  const needsAttentionJobs:  Job[] = []
  const almostDoneJobs:      Job[] = []

  for (const job of activeJobs) {
    const isTerminal = job.status === 'completed' || job.status === 'archived'

    // Overdue: due_date in the past, not completed/archived
    if (job.due_date && !isTerminal && new Date(job.due_date) < todayStart) {
      overdueJobs.push(job)
    }

    // Due Today: due_date is today, not completed/archived
    if (job.due_date && !isTerminal && new Date(job.due_date).toDateString() === todayStr) {
      dueTodayJobs.push(job)
    }

    // Today's Recurring: template matches active schedule, created today
    if (job.template_id && recurringTemplateIds.has(job.template_id) && new Date(job.created_at).toDateString() === todayStr) {
      todaysRecurringJobs.push(job)
    }

    // Needs Attention (F4 nudge): in_progress, no steps checked, no recent activity
    if (job.status === 'in_progress') {
      const steps = job.job_steps ?? []
      const hasCheckedStep = steps.some(s => s.done)
      if (!hasCheckedStep && steps.length > 0) {
        const latestComment = latestCommentByJob.get(job.id)
        const latestActivity = new Date(
          Math.max(
            new Date(job.created_at).getTime(),
            latestComment ? new Date(latestComment).getTime() : 0,
          ),
        )
        if (latestActivity < threeDaysAgo) {
          needsAttentionJobs.push(job)
        }
      }
    }

    // Almost Done (F5 nudge): 80%+ steps done, not yet completed
    if (job.status !== 'completed') {
      const steps = job.job_steps ?? []
      const total = steps.length
      const done  = steps.filter(s => s.done).length
      if (total > 0 && done / total >= 0.8) {
        almostDoneJobs.push(job)
      }
    }
  }

  // Stats — always reflect the full unfiltered counts (keep-as-is per spec)
  const inProgressCount = activeJobs.filter(j => j.status === 'in_progress').length
  const urgentCount     = activeJobs.filter(j => j.priority === 'urgent').length
  const completedToday  = completedJobs.filter(j =>
    j.completed_at && new Date(j.completed_at).toDateString() === new Date().toDateString()
  ).length

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-14 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-0.5 leading-tight" style={{ color: '#E8E9ED' }}>
              {greeting(displayName)}
            </h1>
            <p className="text-sm" style={{ color: '#8B8F9E' }}>{today}</p>
          </div>
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
        <Stat value={inProgressCount} label="In Progress" color="#60A5FA" />
        <Stat value={completedToday}  label="Done Today"  color="#4ADE80" />
        <Stat value={urgentCount}     label="Urgent"      color="#F87171" />
      </div>

      {/* ── My Day ── */}
      <MyDaySection
        overdue={overdueJobs}
        dueToday={dueTodayJobs}
        todaysRecurring={todaysRecurringJobs}
        needsAttention={needsAttentionJobs}
        almostDone={almostDoneJobs}
      />

      {/* ── Interactive feed (tabs + search + cards) ── */}
      <DashboardFeed activeJobs={activeJobs} completedJobs={completedJobs} />
    </div>
  )
}
