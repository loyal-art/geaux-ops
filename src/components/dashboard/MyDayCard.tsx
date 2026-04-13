import Link from 'next/link'
import type { Job } from '@/lib/types'

interface Props {
  job: Job
  accentColor: string
}

export function MyDayCard({ job, accentColor }: Props) {
  const totalSteps     = job.job_steps?.length ?? 0
  const completedSteps = job.job_steps?.filter(s => s.done).length ?? 0
  const progress       = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  const clientOrWorkspace = job.client_name
    ?? (job.projects as { name: string } | null)?.name
    ?? null

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="card-hover flex items-center gap-3 px-4 py-3 rounded-xl active:scale-[0.98]"
      style={{
        backgroundColor: '#1A1D27',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      {/* Left: title + client */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>
          {job.title}
        </p>
        {clientOrWorkspace && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>
            {clientOrWorkspace}
          </p>
        )}
      </div>

      {/* Right: progress + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {totalSteps > 0 && (
          <span className="text-xs font-bold" style={{ color: accentColor }}>
            {progress}%
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}
