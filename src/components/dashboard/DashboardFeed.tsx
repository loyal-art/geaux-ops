'use client'

import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { JobCard } from '@/components/jobs/JobCard'
import type { Job, JobCategory, JobStatus } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab  = 'all' | JobCategory
type Mode = 'entering' | 'visible' | 'exiting'

interface AnimState {
  mode: Mode
  /** Monotonic tick so each transition reseeds its CSS animation / particles. */
  tick: number
}

interface Props {
  activeJobs:    Job[]
  completedJobs: Job[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { value: Tab; label: string; emoji: string | null }[] = [
  { value: 'all',      label: 'All',      emoji: null },
  { value: 'business', label: 'Business', emoji: '💼' },
  { value: 'home',     label: 'Home',     emoji: '🏠' },
  { value: 'personal', label: 'Personal', emoji: '👤' },
  { value: 'misc',     label: 'Misc',     emoji: '📁' },
]

const EXIT_MS  = 400
const ENTER_MS = 320

const PARTICLE_COLORS = ['#C8A44E', '#4ADE80', '#60A5FA', '#F87171', '#A78BFA', '#FB923C']

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

// ── Exit particle burst ───────────────────────────────────────────────────────
// Eight particles flying out radially with a deterministic (seed-driven) angle
// and distance jitter. Mounted alongside a card whose `mode === 'exiting'`.

function CardExitBurst({ seed }: { seed: number }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    // Golden-ratio hash for angle jitter — deterministic, render-safe.
    const jitter = ((seed * 0.6180339887) % 1) * Math.PI * 2
    const angle  = (i / 8) * Math.PI * 2 + jitter
    const dist   = 58 + ((seed * 13 + i * 7) % 18)
    const color  = PARTICLE_COLORS[(i + Math.floor(seed)) % PARTICLE_COLORS.length]
    const delay  = (i * 11 + seed * 3) % 40
    return {
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      color,
      delay,
    }
  })
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={i}
          className="geaux-pop-particle"
          style={{
            '--tx':          `${p.tx}px`,
            '--ty':          `${p.ty}px`,
            backgroundColor: p.color,
            animationDelay:  `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardFeed({ activeJobs, completedJobs }: Props) {
  const [tab, setTab]                   = useState<Tab>('all')
  const [search, setSearch]             = useState('')
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  // Index jobs by id for O(1) lookup during the render step below.
  const jobsById = useMemo(() => {
    const m = new Map<string, Job>()
    for (const j of activeJobs)    m.set(j.id, j)
    for (const j of completedJobs) m.set(j.id, j)
    return m
  }, [activeJobs, completedJobs])

  // Unique client names for Business tab chips (from ALL business active jobs)
  const businessClientNames = useMemo(() => {
    const names = activeJobs
      .filter(j => j.category === 'business' && j.client_name)
      .map(j => j.client_name as string)
    return [...new Set(names)].sort()
  }, [activeJobs])

  // ── Active filter → set of matching job IDs ────────────────────────────────
  const matchingIds = useMemo(() => {
    const s = new Set<string>()
    const all = [...activeJobs, ...completedJobs]
    const q = search.trim().toLowerCase()
    for (const j of all) {
      if (tab !== 'all' && j.category !== tab) continue
      if (q) {
        const titleMatch  = j.title.toLowerCase().includes(q)
        const clientMatch = j.client_name?.toLowerCase().includes(q) ?? false
        const projMatch   = (j.projects as { name: string } | null)?.name.toLowerCase().includes(q) ?? false
        if (!titleMatch && !clientMatch && !projMatch) continue
      }
      if (clientFilter && j.client_name !== clientFilter) continue
      s.add(j.id)
    }
    return s
  }, [activeJobs, completedJobs, tab, search, clientFilter])

  // ── Animation state per card ───────────────────────────────────────────────
  // On first mount, every currently-matching card starts in the `visible` mode
  // so there is no enter-animation flash on initial paint.
  const tickRef  = useRef(0)
  const nextTick = () => ++tickRef.current

  const [animStates, setAnimStates] = useState<Map<string, AnimState>>(() => {
    const m = new Map<string, AnimState>()
    for (const j of [...activeJobs, ...completedJobs]) {
      // tab=all by default → every job is matching on mount
      m.set(j.id, { mode: 'visible', tick: 0 })
    }
    return m
  })

  // Sync animStates whenever the matching set changes. Tab changes drive the
  // animated in/out transitions; search/clientFilter changes apply instantly
  // (no animation) so typing feels responsive.
  const prevTabRef = useRef<Tab>(tab)
  useEffect(() => {
    const wasTabChange = prevTabRef.current !== tab
    prevTabRef.current = tab

    setAnimStates(prev => {
      const next = new Map(prev)

      // Cards that now match but weren't rendered (or were exiting) come in.
      for (const id of matchingIds) {
        const cur = next.get(id)
        if (!cur) {
          next.set(id, { mode: wasTabChange ? 'entering' : 'visible', tick: nextTick() })
        } else if (cur.mode === 'exiting') {
          next.set(id, { mode: wasTabChange ? 'entering' : 'visible', tick: nextTick() })
        }
      }

      // Cards that no longer match: tab change → animate out; search/client
      // filter change → remove immediately.
      for (const [id, state] of prev) {
        if (!matchingIds.has(id) && state.mode !== 'exiting') {
          if (wasTabChange) {
            next.set(id, { mode: 'exiting', tick: nextTick() })
          } else {
            next.delete(id)
          }
        }
      }

      // Also drop entries for jobs that no longer exist in the source data.
      for (const id of prev.keys()) {
        if (!jobsById.has(id)) next.delete(id)
      }

      return next
    })
  }, [matchingIds, tab, jobsById])

  // Finalize transitions: exiting → removed, entering → visible.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const [id, state] of animStates) {
      if (state.mode === 'exiting') {
        timers.push(setTimeout(() => {
          setAnimStates(prev => {
            const cur = prev.get(id)
            if (!cur || cur.tick !== state.tick || cur.mode !== 'exiting') return prev
            const next = new Map(prev)
            next.delete(id)
            return next
          })
        }, EXIT_MS + 20))
      } else if (state.mode === 'entering') {
        timers.push(setTimeout(() => {
          setAnimStates(prev => {
            const cur = prev.get(id)
            if (!cur || cur.tick !== state.tick || cur.mode !== 'entering') return prev
            const next = new Map(prev)
            next.set(id, { mode: 'visible', tick: cur.tick })
            return next
          })
        }, ENTER_MS + 20))
      }
    }
    return () => timers.forEach(clearTimeout)
  }, [animStates])

  // ── FLIP: smooth reflow for visible cards that move to new grid cells ─────
  const cardRefs      = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevRectsRef  = useRef<Map<string, DOMRect>>(new Map())

  const setCardRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el)
    else    cardRefs.current.delete(id)
  }, [])

  useLayoutEffect(() => {
    const prev = prevRectsRef.current
    const nextRects = new Map<string, DOMRect>()

    for (const [id, el] of cardRefs.current) {
      const rect = el.getBoundingClientRect()
      nextRects.set(id, rect)

      const state = animStates.get(id)
      // Only FLIP-animate cards that are settled (`visible`); entering and
      // exiting cards are running their own transform animations.
      if (!state || state.mode !== 'visible') continue

      const prevRect = prev.get(id)
      if (!prevRect) continue

      const dx = prevRect.left - rect.left
      const dy = prevRect.top  - rect.top
      if (dx === 0 && dy === 0) continue

      // FLIP: invert then play. Writing to `el.style` is a direct DOM mutation
      // that side-steps React's render cycle, which is exactly what the
      // technique requires — so these six writes are explicitly allowed.
      /* eslint-disable react-hooks/immutability */
      el.style.transition = 'none'
      el.style.transform  = `translate(${dx}px, ${dy}px)`
      // Force layout so the transform is applied before the transition kicks in.
      el.getBoundingClientRect()
      el.style.transition = 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
      el.style.transform  = 'translate(0, 0)'
      /* eslint-enable react-hooks/immutability */
    }

    prevRectsRef.current = nextRects
  }, [animStates, tab, search, clientFilter])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleTabChange(t: Tab) {
    if (t === tab) return
    setTab(t)
    setClientFilter(null)
  }

  // ── Build per-section render lists (includes in-flight exiting cards) ─────
  function cardsForStatus(status: JobStatus): { job: Job; state: AnimState }[] {
    const out: { job: Job; state: AnimState }[] = []
    for (const [id, state] of animStates) {
      const job = jobsById.get(id)
      if (!job) continue
      if (job.status !== status) continue
      // Completed jobs live in the "Recently Completed" section below, not
      // the "Completed" status section (there isn't one).
      out.push({ job, state })
    }
    return out
  }

  const inProgress  = cardsForStatus('in_progress')
  const waiting     = cardsForStatus('waiting')
  const ready       = cardsForStatus('ready')
  const queued      = cardsForStatus('queued')
  const blocked     = cardsForStatus('blocked')
  const unassigned  = cardsForStatus('unassigned')
  const recentDone  = cardsForStatus('completed')

  const hasAnyJobs = activeJobs.length > 0 || completedJobs.length > 0
  const hasResults =
    inProgress.length > 0 || waiting.length > 0 || ready.length > 0 ||
    queued.length > 0 || blocked.length > 0 || unassigned.length > 0 ||
    recentDone.length > 0

  // Section renderer: responsive grid of job cards for the given status
  function Section({
    title,
    cards,
    bottomPad = false,
  }: {
    title: string
    cards: { job: Job; state: AnimState }[]
    bottomPad?: boolean
  }) {
    if (cards.length === 0) return null
    return (
      <section className={bottomPad ? 'pb-4' : undefined}>
        <SectionHeader title={title} />
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 'var(--space-4)' }}
        >
          {cards.map(({ job, state }) => {
            const cls =
              state.mode === 'exiting'  ? 'relative geaux-card-exit'  :
              state.mode === 'entering' ? 'relative geaux-card-enter' :
                                          'relative geaux-card-reflow'
            return (
              <div key={job.id} ref={setCardRef(job.id)} className={cls}>
                {state.mode === 'exiting' && <CardExitBurst seed={state.tick} />}
                <JobCard job={job} />
              </div>
            )
          })}
        </div>
      </section>
    )
  }

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
                className="flex-shrink-0 inline-flex items-center gap-1.5 transition-all active:scale-95"
                style={{
                  padding:      '8px 16px',
                  fontSize:     '13px',
                  fontWeight:   active ? 'var(--weight-extra)' : 'var(--weight-semibold)',
                  borderRadius: 'var(--radius-full)',
                  background:   active ? 'var(--gradient-gold)'   : 'var(--bg-tertiary)',
                  color:        active ? '#0F1117'                : 'var(--text-secondary)',
                  boxShadow:    active ? 'var(--glow-gold)'       : 'none',
                  border:       active ? '1px solid transparent'  : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {t.emoji && <span aria-hidden>{t.emoji}</span>}
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

        <Section title="In Progress" cards={inProgress} />
        <Section title="Waiting"     cards={waiting}    />
        <Section title="Ready"       cards={ready}      />
        <Section title="Queued"      cards={queued}     />
        <Section title="Blocked"     cards={blocked}    />
        <Section title="Unassigned"  cards={unassigned} />
        <Section title="Recently Completed" cards={recentDone} bottomPad />
      </div>
    </div>
  )
}
