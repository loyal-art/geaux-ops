'use client'

import { useState, useTransition, useRef } from 'react'
import { toggleStep, addStepDependency, removeStepDependency } from '@/app/jobs/actions'
import type { JobStep, StepDependency } from '@/lib/types'

// ── Inline dependency panel ───────────────────────────────────────────────────

function DependencyPanel({ step, allSteps, blockerDeps }: {
  step:        JobStep
  allSteps:    JobStep[]
  blockerDeps: StepDependency[]
}) {
  const [deps, setDeps]             = useState<StepDependency[]>(blockerDeps)
  const [adding, setAdding]         = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [isPending, start]          = useTransition()

  const usedIds  = new Set(deps.map(d => d.blocked_by_step_id))
  const available = allSteps.filter(s => s.id !== step.id && !usedIds.has(s.id))

  function handleAdd() {
    if (!selectedId) return
    const captured: string = selectedId
    const optimistic: StepDependency = {
      id: `opt-${Date.now()}`,
      step_id: step.id,
      blocked_by_step_id: captured,
      created_at: new Date().toISOString(),
    }
    setDeps(p => [...p, optimistic])
    setSelectedId('')
    setAdding(false)
    setError(null)
    start(async () => {
      const r = await addStepDependency(step.id, captured)
      if (r.error) {
        setDeps(p => p.filter(d => d.id !== optimistic.id))
        setError(r.error)
      } else if (r.data) {
        setDeps(p => p.map(d => d.id === optimistic.id ? r.data! : d))
      }
    })
  }

  function handleRemove(dep: StepDependency) {
    setDeps(p => p.filter(d => d.id !== dep.id))
    setError(null)
    start(async () => {
      const r = await removeStepDependency(dep.id)
      if (r.error) {
        setDeps(p => [...p, dep])
        setError(r.error)
      }
    })
  }

  return (
    <div
      className="mt-1 mb-2 ml-8 rounded-xl p-3 space-y-2"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
        Blocked by
      </p>

      {deps.length === 0 && (
        <p className="text-xs" style={{ color: '#8B8F9E' }}>
          No blockers — this step can start immediately.
        </p>
      )}

      {deps.map(dep => {
        const blocker = allSteps.find(s => s.id === dep.blocked_by_step_id)
        return (
          <div key={dep.id} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: blocker?.done ? '#4ADE80' : '#EAB308' }}
            />
            <span
              className="flex-1 text-xs truncate"
              style={{
                color:          blocker?.done ? '#8B8F9E' : '#E8E9ED',
                textDecoration: blocker?.done ? 'line-through' : 'none',
              }}
            >
              {blocker?.text ?? '(unknown step)'}
            </span>
            <button
              onClick={() => handleRemove(dep)}
              disabled={isPending}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-opacity opacity-50 hover:opacity-100 disabled:opacity-25"
              style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#F87171' }}
              aria-label="Remove blocker"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M1 1l6 6M7 1L1 7" />
              </svg>
            </button>
          </div>
        )
      })}

      {error && (
        <p className="text-[11px]" style={{ color: '#F87171' }}>{error}</p>
      )}

      {adding ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="flex-1 text-xs rounded-lg px-2 py-1.5 outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#E8E9ED',
            }}
          >
            <option value="">Choose a step…</option>
            {available.map(s => (
              <option key={s.id} value={s.id}>{s.text}</option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectedId || isPending}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-40"
            style={{
              backgroundColor: 'rgba(200,164,78,0.15)',
              color: '#C8A44E',
              border: '1px solid rgba(200,164,78,0.25)',
            }}
          >
            Add
          </button>
          <button
            onClick={() => { setAdding(false); setSelectedId(''); setError(null) }}
            className="text-[11px] px-2 py-1 rounded-lg"
            style={{ color: '#8B8F9E' }}
          >
            Cancel
          </button>
        </div>
      ) : available.length > 0 && (
        <button
          onClick={() => setAdding(true)}
          className="text-[11px] font-medium transition-opacity hover:opacity-80"
          style={{ color: '#C8A44E' }}
        >
          + Add blocker
        </button>
      )}
    </div>
  )
}

// ── StepItem ──────────────────────────────────────────────────────────────────

interface StepItemProps {
  step:             JobStep
  allSteps?:        JobStep[]
  allDependencies?: StepDependency[]
  readOnly?:        boolean
  canManageDeps?:   boolean
}

export function StepItem({
  step,
  allSteps        = [],
  allDependencies = [],
  readOnly        = false,
  canManageDeps   = false,
}: StepItemProps) {
  const [done, setDone]              = useState(step.done)
  const [isPending, startTransition] = useTransition()
  const [showPanel, setShowPanel]    = useState(false)
  const [toast, setToast]            = useState<string | null>(null)
  const [lockedMsg, setLockedMsg]    = useState(false)
  const toastTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Compute locked state from props (updates on each render / server revalidation)
  const blockerDeps        = allDependencies.filter(d => d.step_id === step.id)
  const allBlockerSteps    = blockerDeps.map(d => allSteps.find(s => s.id === d.blocked_by_step_id)).filter((s): s is JobStep => !!s)
  const incompleteBlockers = allBlockerSteps.filter(s => !s.done)
  const isLocked           = !done && incompleteBlockers.length > 0

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }

  function handleToggle() {
    if (readOnly) return
    if (isLocked) {
      setLockedMsg(true)
      setTimeout(() => setLockedMsg(false), 2500)
      return
    }
    const next = !done
    setDone(next)
    startTransition(async () => {
      const result = await toggleStep(step.id, next)
      if (result?.error) {
        setDone(done)
      } else if (next && result.unlockedStepNames.length > 0) {
        const names = result.unlockedStepNames
        showToast(
          names.length === 1
            ? `Unblocked "${names[0]}"`
            : `Unblocked ${names.length} steps`
        )
      }
    })
  }

  const checkboxEl = (
    <div
      className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all"
      style={{
        backgroundColor: done    ? '#4ADE80'               : isLocked ? 'rgba(234,179,8,0.08)' : 'transparent',
        borderColor:     done    ? '#4ADE80'               : isLocked ? 'rgba(234,179,8,0.4)'  : 'rgba(255,255,255,0.15)',
        opacity: readOnly ? 0.5 : 1,
      }}
    >
      {done ? (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1.5" stroke="#0F1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : isLocked ? (
        <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="#EAB308" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="5" width="8" height="6.5" rx="1.5" />
          <path d="M3 5V3.5a2 2 0 0 1 4 0V5" />
        </svg>
      ) : null}
    </div>
  )

  const textEl = (
    <div className="flex-1 min-w-0">
      <span
        className="text-sm leading-snug block"
        style={{
          color:          done ? '#8B8F9E' : isLocked ? '#9CA3AF' : '#E8E9ED',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {step.text}
      </span>

      {/* Blocked-by label — shown when blockers exist and step isn't done */}
      {allBlockerSteps.length > 0 && !done && (
        <p className="text-[11px] mt-0.5 leading-snug" style={{ color: isLocked ? '#EAB308' : '#6B7280' }}>
          {isLocked ? '🔒 ' : '✓ '}
          Blocked by: {allBlockerSteps.map(b => b.text).join(', ')}
        </p>
      )}

      {/* Transient lock message shown on tap */}
      {lockedMsg && (
        <p className="text-[11px] mt-0.5 font-medium" style={{ color: '#EAB308' }}>
          Complete {incompleteBlockers.map(b => `"${b.text}"`).join(', ')} first
        </p>
      )}
    </div>
  )

  return (
    <div>
      {/* Unblock toast */}
      {toast && (
        <div
          className="text-[11px] font-medium px-3 py-1.5 rounded-lg mb-1"
          style={{
            backgroundColor: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ADE80',
          }}
        >
          {toast}
        </div>
      )}

      <div className="flex items-start gap-3 py-3">
        {/* Toggle zone — button wraps only the checkbox + text */}
        {readOnly ? (
          <div className="flex flex-1 min-w-0 items-start gap-3">
            {checkboxEl}
            {textEl}
          </div>
        ) : (
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="flex flex-1 min-w-0 items-start gap-3 text-left transition-opacity disabled:opacity-60"
          >
            {checkboxEl}
            {textEl}
          </button>
        )}

        {/* Focus badge */}
        {step.is_high_impact && (
          <span
            className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-0.5"
            style={{
              backgroundColor: 'rgba(200,164,78,0.12)',
              color: '#C8A44E',
              border: '1px solid rgba(200,164,78,0.2)',
            }}
          >
            Focus
          </span>
        )}

        {/* Manage dependencies button */}
        {canManageDeps && !done && (
          <button
            onClick={() => setShowPanel(p => !p)}
            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 transition-colors"
            style={{
              backgroundColor: showPanel ? 'rgba(200,164,78,0.15)' : 'rgba(255,255,255,0.04)',
              border:          showPanel ? '1px solid rgba(200,164,78,0.3)' : '1px solid rgba(255,255,255,0.07)',
              color:           showPanel ? '#C8A44E' : '#8B8F9E',
            }}
            title="Manage dependencies"
            aria-label="Manage step dependencies"
          >
            {/* Chain-link / dep graph icon */}
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8"  cy="3.5" r="1.5" />
              <circle cx="3"  cy="12"  r="1.5" />
              <circle cx="13" cy="12"  r="1.5" />
              <path d="M8 5V9.5M8 9.5L3 10.5M8 9.5L13 10.5" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline dependency management panel */}
      {showPanel && !readOnly && (
        <DependencyPanel
          step={step}
          allSteps={allSteps}
          blockerDeps={allDependencies.filter(d => d.step_id === step.id)}
        />
      )}
    </div>
  )
}
