'use client'

import { useState, useEffect } from 'react'
import { StepItem } from './StepItem'
import { AddStepForm } from './AddStepForm'
import { FlowView } from './FlowView'
import type { JobStep, StepDependency } from '@/lib/types'

// ── Icons ─────────────────────────────────────────────────────────────────────

function ListIcon({ active }: { active: boolean }) {
  const c = active ? '#C8A44E' : '#8B8F9E'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6"  x2="21" y2="6"  />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6"  x2="3.01" y2="6"  strokeWidth="2.5" />
      <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5" />
      <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5" />
    </svg>
  )
}

function FlowIcon({ active }: { active: boolean }) {
  const c = active ? '#C8A44E' : '#8B8F9E'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="3"  cy="5"  r="2" />
      <circle cx="21" cy="5"  r="2" />
      <circle cx="3"  cy="19" r="2" />
      <circle cx="21" cy="19" r="2" />
      <line x1="12" y1="9"  x2="4"  y2="7"  />
      <line x1="12" y1="9"  x2="20" y2="7"  />
      <line x1="12" y1="15" x2="4"  y2="17" />
      <line x1="12" y1="15" x2="20" y2="17" />
    </svg>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  steps:            JobStep[]
  jobTitle:         string
  jobColor:         string
  jobId:            string
  readOnly:         boolean
  canCreateSteps:   boolean
  isDone:           boolean
  isCancelled:      boolean
  allDependencies?: StepDependency[]
  canManageDeps?:   boolean
}

// ── JobStepsSection ───────────────────────────────────────────────────────────

const LS_KEY = 'geaux-ops:flow-view'

export function JobStepsSection({
  steps, jobTitle, jobColor, jobId, readOnly, canCreateSteps, isDone, isCancelled,
  allDependencies = [], canManageDeps = false,
}: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'flow'>('list')
  const [hydrated,  setHydrated] = useState(false)

  // Read saved preference after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'flow') setViewMode('flow')
    setHydrated(true)
  }, [])

  function toggleView(mode: 'list' | 'flow') {
    setViewMode(mode)
    localStorage.setItem(LS_KEY, mode)
  }

  const showAddForm = !isDone && !isCancelled && canCreateSteps

  return (
    <>
      {/* ── Section header with view toggle ── */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>Steps</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />

        {/* Toggle pill — only rendered after hydration to avoid flicker */}
        {hydrated && (
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <button
              onClick={() => toggleView('list')}
              className="flex items-center gap-1 px-2.5 py-1.5 transition-colors"
              style={{
                backgroundColor: viewMode === 'list' ? 'rgba(200,164,78,0.12)' : 'transparent',
              }}
              title="List view"
            >
              <ListIcon active={viewMode === 'list'} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: viewMode === 'list' ? '#C8A44E' : '#8B8F9E' }}
              >
                List
              </span>
            </button>
            <div style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <button
              onClick={() => toggleView('flow')}
              className="flex items-center gap-1 px-2.5 py-1.5 transition-colors"
              style={{
                backgroundColor: viewMode === 'flow' ? 'rgba(200,164,78,0.12)' : 'transparent',
              }}
              title="Flow view"
            >
              <FlowIcon active={viewMode === 'flow'} />
              <span
                className="text-[10px] font-semibold"
                style={{ color: viewMode === 'flow' ? '#C8A44E' : '#8B8F9E' }}
              >
                Flow
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── List view ── */}
      {viewMode === 'list' && (
        <>
          {steps.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>
              No steps yet — add your first step below.
            </p>
          )}

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {steps.map(step => (
              <StepItem
                key={step.id}
                step={step}
                allSteps={steps}
                allDependencies={allDependencies}
                readOnly={readOnly}
                canManageDeps={canManageDeps}
              />
            ))}
          </div>

          {showAddForm && <AddStepForm jobId={jobId} existingSteps={steps} />}
        </>
      )}

      {/* ── Flow view ── */}
      {viewMode === 'flow' && (
        <>
          <FlowView
            steps={steps}
            jobTitle={jobTitle}
            jobColor={jobColor}
            readOnly={readOnly}
          />
          {showAddForm && (
            <div className="mt-4">
              <AddStepForm jobId={jobId} existingSteps={steps} />
            </div>
          )}
        </>
      )}
    </>
  )
}
