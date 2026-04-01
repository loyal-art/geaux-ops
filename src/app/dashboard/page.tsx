import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardFeed } from '@/components/dashboard/DashboardFeed'
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
      className="flex flex-col items-center px-4 py-2 rounded-2xl flex-1"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-xl font-bold" style={{ color }}>{value}</span>
      <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>{label}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const JOB_SELECT = '*, job_templates(name, color), job_steps(id, done), projects(name)'

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
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#E8E9ED' }}>
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
      <div className="px-5 mb-6 flex gap-3">
        <Stat value={inProgressCount} label="In Progress" color="#60A5FA" />
        <Stat value={completedToday}  label="Done Today"  color="#4ADE80" />
        <Stat value={urgentCount}     label="Urgent"      color="#F87171" />
      </div>

      {/* ── Interactive feed (tabs + search + cards) ── */}
      <DashboardFeed activeJobs={activeJobs} completedJobs={completedJobs} />
    </div>
  )
}
