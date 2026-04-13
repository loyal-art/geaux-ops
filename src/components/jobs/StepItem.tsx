'use client'

import { useState, useTransition } from 'react'
import { toggleStep } from '@/app/jobs/actions'
import type { JobStep } from '@/lib/types'

interface StepItemProps {
  step:      JobStep
  readOnly?: boolean   // true for viewers — no toggle, no checkbox interaction
}

export function StepItem({ step, readOnly = false }: StepItemProps) {
  const [done, setDone]       = useState(step.done)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    if (readOnly) return
    const next = !done
    setDone(next)
    startTransition(async () => {
      const result = await toggleStep(step.id, next)
      if (result?.error) setDone(done) // revert on error
    })
  }

  const inner = (
    <>
      {/* Checkbox */}
      <div
        className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all"
        style={{
          backgroundColor: done ? '#4ADE80' : 'transparent',
          borderColor:     done ? '#4ADE80' : 'rgba(255,255,255,0.15)',
          opacity: readOnly ? 0.5 : 1,
        }}
      >
        {done && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1.5" stroke="#0F1117" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Step text */}
      <span
        className="flex-1 text-sm leading-snug transition-all"
        style={{
          color:          done ? '#8B8F9E' : '#E8E9ED',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {step.text}
      </span>

      {/* High-impact badge (F2: Focus) */}
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
    </>
  )

  if (readOnly) {
    return (
      <div className="w-full flex items-start gap-3 py-3">
        {inner}
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="w-full flex items-start gap-3 py-3 text-left group transition-opacity disabled:opacity-60"
    >
      {inner}
    </button>
  )
}
