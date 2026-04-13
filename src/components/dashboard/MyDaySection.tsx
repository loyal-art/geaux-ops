'use client'

import { useEffect, useRef } from 'react'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { MyDayCard } from './MyDayCard'
import type { Job } from '@/lib/types'

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
  overdue:          Job[]
  dueToday:         Job[]
  todaysRecurring:  Job[]
  needsAttention:   Job[]
  almostDone:       Job[]
  waitingFollowUp:  Job[]
}

interface SubSectionProps {
  emoji: string
  title: string
  color: string
  jobs:  Job[]
}

// ── Sub-section ──────────────────────────────────────────────────────────────

function MyDaySubSection({ emoji, title, color, jobs }: SubSectionProps) {
  return (
    <div className="mb-5 last:mb-0">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {title}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {jobs.length}
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {jobs.map(job => (
          <MyDayCard key={job.id} job={job} accentColor={color} />
        ))}
      </div>
    </div>
  )
}

// ── All-clear message ────────────────────────────────────────────────────────

function AllClear() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ backgroundColor: 'rgba(200,164,78,0.12)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: '#C8A44E' }}>
        You&apos;re all caught up. Nice work.
      </p>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function MyDaySection({ overdue, dueToday, todaysRecurring, needsAttention, almostDone, waitingFollowUp }: Props) {
  const [expanded, setExpanded]     = useLocalStorage('geaux-myday-expanded', false)
  const [isHomepage]                = useLocalStorage('geaux-myday-homepage', false)
  const hasAutoExpanded             = useRef(false)

  const totalItems = overdue.length + dueToday.length + todaysRecurring.length + needsAttention.length + almostDone.length + waitingFollowUp.length
  const allEmpty   = totalItems === 0

  // Auto-expand and scroll to top when "Make My Day your homepage" is enabled
  useEffect(() => {
    if (isHomepage && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true
      setExpanded(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isHomepage, setExpanded])

  return (
    <section className="px-5 mb-6">
      {/* ── Header toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3 group"
      >
        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#C8A44E" strokeWidth="2.5" strokeLinecap="round"
          className="transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>

        {/* Title */}
        <span className="text-sm font-bold tracking-wide" style={{ color: '#C8A44E' }}>
          My Day
        </span>

        {/* Count badge */}
        {totalItems > 0 && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E' }}
          >
            {totalItems}
          </span>
        )}

        {/* Divider line */}
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(200,164,78,0.2)' }} />
      </button>

      {/* ── Collapsible content ── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-2 pb-1">
            {allEmpty ? (
              <AllClear />
            ) : (
              <>
                {overdue.length > 0 && (
                  <MyDaySubSection emoji="🔴" title="Overdue" color="#F87171" jobs={overdue} />
                )}
                {dueToday.length > 0 && (
                  <MyDaySubSection emoji="📅" title="Due Today" color="#C8A44E" jobs={dueToday} />
                )}
                {todaysRecurring.length > 0 && (
                  <MyDaySubSection emoji="🔁" title="Today's Recurring" color="#60A5FA" jobs={todaysRecurring} />
                )}
                {needsAttention.length > 0 && (
                  <MyDaySubSection emoji="⏸" title="Needs Attention" color="#FB923C" jobs={needsAttention} />
                )}
                {waitingFollowUp.length > 0 && (
                  <MyDaySubSection emoji="⏳" title="Still Waiting? Time to follow up." color="#EAB308" jobs={waitingFollowUp} />
                )}
                {almostDone.length > 0 && (
                  <MyDaySubSection emoji="🏁" title="Almost Done" color="#4ADE80" jobs={almostDone} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
