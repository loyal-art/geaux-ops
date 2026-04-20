import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardFeed } from '@/components/dashboard/DashboardFeed'
import { MyDaySection } from '@/components/dashboard/MyDaySection'
import type { Job } from '@/lib/types'

// ── Greeting ──────────────────────────────────────────────────────────────────

function timeOfDay(): { label: string; emoji: string } {
  const h = new Date().getUTCHours()
  if (h < 12) return { label: 'Good morning', emoji: '☕' }
  if (h < 17) return { label: 'Good afternoon', emoji: '⚡' }
  return { label: 'Good evening', emoji: '🌙' }
}

const TAGLINES = [
  "Let's crush some pops today",
  'Ready when you are',
  'One bubble at a time',
  "Let's make today count",
  'Small wins stack up fast',
  'Fresh day, clean queue',
]

function pickTagline(): string {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
}

// ── Stat bubble ───────────────────────────────────────────────────────────────

function StatBubble({ value, color, glow }: { value: number; color: string; glow: string }) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width:        '58px',
        height:       '58px',
        borderRadius: 'var(--radius-full)',
        background:   `radial-gradient(circle at 30% 30%, ${color}FF 0%, ${color}DD 55%, ${color}99 100%)`,
        boxShadow:    glow,
      }}
    >
      {/* Shine highlight ellipse */}
      <span
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top:          '18%',
          left:         '22%',
          width:        '18px',
          height:       '10px',
          borderRadius: '9999px',
          background:   'rgba(255,255,255,0.5)',
          filter:       'blur(1.5px)',
        }}
      />
      <span
        className="relative"
        style={{
          fontSize:   '20px',
          fontWeight: 'var(--weight-extra)',
          color:      '#0F1117',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
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
      .in('status', ['unassigned', 'in_progress', 'waiting', 'ready', 'queued', 'blocked'])
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
  const waitingFollowUpJobs: Job[] = []

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

    // Waiting Follow-Up: waiting jobs with no activity in 3+ days
    if (job.status === 'waiting') {
      const latestComment  = latestCommentByJob.get(job.id)
      const latestActivity = new Date(
        Math.max(
          new Date(job.created_at).getTime(),
          latestComment ? new Date(latestComment).getTime() : 0,
        ),
      )
      if (latestActivity < threeDaysAgo) {
        waitingFollowUpJobs.push(job)
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
  const firstName   = displayName.split(' ')[0] || displayName
  const today       = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const { label: greetLabel, emoji: greetEmoji } = timeOfDay()
  const tagline     = pickTagline()

  return (
    <div className="relative max-w-lg mx-auto">
      {/* ── Decorative blur orbs (behind everything) ── */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top:          '-60px',
          right:        '-80px',
          width:        '260px',
          height:       '260px',
          borderRadius: 'var(--radius-full)',
          background:   'radial-gradient(circle, rgba(200,164,78,0.18) 0%, rgba(200,164,78,0) 65%)',
          filter:       'blur(30px)',
          zIndex:       0,
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom:       '120px',
          left:         '-90px',
          width:        '280px',
          height:       '280px',
          borderRadius: 'var(--radius-full)',
          background:   'radial-gradient(circle, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0) 65%)',
          filter:       'blur(32px)',
          zIndex:       0,
        }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        {/* ── Header ── */}
        <div className="pt-14" style={{ paddingLeft: 'var(--space-5)', paddingRight: 'var(--space-5)', paddingBottom: 'var(--space-6)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1
                className="leading-tight"
                style={{
                  fontSize:      '28px',
                  fontWeight:    'var(--weight-extra)',
                  color:         'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                  marginBottom:  '4px',
                }}
              >
                {greetLabel}, {firstName} <span aria-hidden>{greetEmoji}</span>
              </h1>
              <p
                className="mb-1"
                style={{
                  fontSize:   'var(--text-sm)',
                  color:      'var(--text-secondary)',
                  fontWeight: 'var(--weight-semibold)',
                }}
              >
                {tagline}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {today}
              </p>
            </div>
            <button
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-70"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border:          '1px solid rgba(255,255,255,0.06)',
                borderRadius:    'var(--radius-md)',
              }}
              aria-label="Notifications"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Stats row: 3 bubbles + legend ── */}
        <div
          className="flex items-center"
          style={{
            paddingLeft:  'var(--space-5)',
            paddingRight: 'var(--space-5)',
            gap:          'var(--space-4)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div className="flex items-center" style={{ gap: 'var(--space-3)' }}>
            <StatBubble value={inProgressCount} color="#60A5FA" glow="var(--glow-blue)" />
            <StatBubble value={completedToday}  color="#4ADE80" glow="var(--glow-green)" />
            <StatBubble value={urgentCount}     color="#F87171" glow="var(--glow-red)" />
          </div>
          <p
            className="flex-1"
            style={{
              fontSize:      'var(--text-xs)',
              color:         'var(--text-tertiary)',
              fontWeight:    'var(--weight-semibold)',
              letterSpacing: 'var(--tracking-wide)',
              lineHeight:    1.5,
            }}
          >
            In Progress · Done · Urgent
          </p>
        </div>

        {/* ── My Day ── */}
        <MyDaySection
          overdue={overdueJobs}
          dueToday={dueTodayJobs}
          todaysRecurring={todaysRecurringJobs}
          needsAttention={needsAttentionJobs}
          almostDone={almostDoneJobs}
          waitingFollowUp={waitingFollowUpJobs}
        />

        {/* ── Interactive feed (tabs + search + cards) ── */}
        <DashboardFeed activeJobs={activeJobs} completedJobs={completedJobs} />
      </div>
    </div>
  )
}
