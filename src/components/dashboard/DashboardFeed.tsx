'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { JobCard } from '@/components/jobs/JobCard'
import type { Job, JobCategory } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'all' | JobCategory

interface Props {
  activeJobs:    Job[]
  completedJobs: Job[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'business', label: 'Business' },
  { value: 'home',     label: 'Home' },
  { value: 'personal', label: 'Personal' },
  { value: 'misc',     label: 'Misc' },
]

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

// ── No-results state ──────────────────────────────────────────────────────────

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.5" strokeLinecap="round" className="mb-3 opacity-40">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <p className="text-sm font-medium mb-1" style={{ color: '#E8E9ED' }}>No results</p>
      <p className="text-xs" style={{ color: '#8B8F9E' }}>
        Nothing matched <span style={{ color: '#C8A44E' }}>&ldquo;{query}&rdquo;</span>
      </p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardFeed({ activeJobs, completedJobs }: Props) {
  const [tab, setTab]               = useState<Tab>('all')
  const [search, setSearch]         = useState('')
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  function handleTabChange(t: Tab) {
    setTab(t)
    setClientFilter(null)
  }

  // Unique client names for Business tab chips (from ALL business active jobs)
  const businessClientNames = useMemo(() => {
    const names = activeJobs
      .filter(j => j.category === 'business' && j.client_name)
      .map(j => j.client_name as string)
    return [...new Set(names)].sort()
  }, [activeJobs])

  // Core filter: tab + search + client chip
  function filterJobs(jobs: Job[]): Job[] {
    return jobs
      .filter(j => tab === 'all' || j.category === tab)
      .filter(j => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
          j.title.toLowerCase().includes(q) ||
          (j.client_name?.toLowerCase().includes(q) ?? false) ||
          ((j.projects as { name: string } | null)?.name.toLowerCase().includes(q) ?? false)
        )
      })
      .filter(j => !clientFilter || j.client_name === clientFilter)
  }

  const filteredActive    = filterJobs(activeJobs)
  const filteredCompleted = filterJobs(completedJobs)

  const inProgress = filteredActive.filter(j => j.status === 'in_progress')
  const waiting    = filteredActive.filter(j => j.status === 'waiting')
  const ready      = filteredActive.filter(j => j.status === 'ready')
  const queued     = filteredActive.filter(j => j.status === 'queued')
  const blocked    = filteredActive.filter(j => j.status === 'blocked')
  const unassigned = filteredActive.filter(j => j.status === 'unassigned')

  const hasAnyJobs = activeJobs.length > 0 || completedJobs.length > 0
  const hasResults =
    inProgress.length > 0 || waiting.length > 0 || ready.length > 0 ||
    queued.length > 0 || blocked.length > 0 || unassigned.length > 0 ||
    filteredCompleted.length > 0

  return (
    <div>
      {/* ── Category tabs ── */}
      <div className="px-5 mb-5">
        <div
          className="flex gap-2"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {TABS.map(t => {
            const active = tab === t.value
            return (
              <button
                key={t.value}
                onClick={() => handleTabChange(t.value)}
                className="flex-shrink-0 px-4 py-2 text-xs font-bold rounded-full transition-all active:scale-95"
                style={{
                  backgroundColor: active ? '#C8A44E' : 'rgba(255,255,255,0.06)',
                  color:           active ? '#0F1117' : '#8B8F9E',
                  boxShadow:       active ? '0 0 14px rgba(200,164,78,0.4)' : 'none',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="px-5 mb-4">
        <div className="relative flex items-center">
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round"
            className="absolute left-3.5 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search jobs, clients, projects…"
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none"
            style={{
              backgroundColor: '#1A1D27',
              border:          '1px solid rgba(255,255,255,0.07)',
              color:           '#E8E9ED',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 transition-opacity hover:opacity-70"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Client chips (Business tab only) ── */}
      {tab === 'business' && businessClientNames.length > 0 && (
        <div className="px-5 mb-4">
          <div
            className="flex gap-2 pb-1"
            style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
          >
            {/* All chip */}
            <button
              onClick={() => setClientFilter(null)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all active:scale-95"
              style={{
                backgroundColor: !clientFilter ? '#C8A44E'                    : 'rgba(255,255,255,0.07)',
                color:           !clientFilter ? '#0F1117'                    : '#8B8F9E',
                border:          !clientFilter ? '1px solid transparent'      : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              All
            </button>

            {businessClientNames.map(name => {
              const active = clientFilter === name
              return (
                <button
                  key={name}
                  onClick={() => setClientFilter(active ? null : name)}
                  className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all active:scale-95 max-w-[140px] truncate"
                  style={{
                    backgroundColor: active ? '#C8A44E'                    : 'rgba(255,255,255,0.07)',
                    color:           active ? '#0F1117'                    : '#8B8F9E',
                    border:          active ? '1px solid transparent'      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Job card sections ── */}
      <div className="px-5 space-y-8">

        {/* Empty: no jobs at all */}
        {!hasAnyJobs && <EmptyState />}

        {/* Empty: jobs exist but nothing matches filters */}
        {hasAnyJobs && !hasResults && search && <NoResults query={search} />}

        {/* Empty: jobs exist but tab has nothing and no search active */}
        {hasAnyJobs && !hasResults && !search && (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: '#8B8F9E' }}>
              No jobs in <span style={{ color: '#C8A44E' }}>
                {TABS.find(t => t.value === tab)?.label}
              </span> yet.
            </p>
          </div>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <section>
            <SectionHeader title="In Progress" />
            <div className="space-y-3">
              {inProgress.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Waiting */}
        {waiting.length > 0 && (
          <section>
            <SectionHeader title="Waiting" />
            <div className="space-y-3">
              {waiting.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Ready */}
        {ready.length > 0 && (
          <section>
            <SectionHeader title="Ready" />
            <div className="space-y-3">
              {ready.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Queued */}
        {queued.length > 0 && (
          <section>
            <SectionHeader title="Queued" />
            <div className="space-y-3">
              {queued.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Blocked */}
        {blocked.length > 0 && (
          <section>
            <SectionHeader title="Blocked" />
            <div className="space-y-3">
              {blocked.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <section>
            <SectionHeader title="Unassigned" />
            <div className="space-y-3">
              {unassigned.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

        {/* Recently Completed */}
        {filteredCompleted.length > 0 && (
          <section className="pb-4">
            <SectionHeader title="Recently Completed" />
            <div className="space-y-3">
              {filteredCompleted.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
