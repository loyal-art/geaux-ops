'use client'

import { useActionState, useRef, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { addStep } from '@/app/jobs/actions'
import type { JobStep } from '@/lib/types'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
    >
      {pending ? '…' : 'Add'}
    </button>
  )
}

interface Props {
  jobId:          string
  /** When provided, shows an optional "Add as child of…" parent selector */
  existingSteps?: JobStep[]
}

export function AddStepForm({ jobId, existingSteps }: Props) {
  const [state, action] = useActionState(addStep, null)
  const inputRef        = useRef<HTMLInputElement>(null)
  const [showParent, setShowParent] = useState(false)
  const [parentId,   setParentId]   = useState('')

  // Clear input on successful add
  useEffect(() => {
    if (state && !state.error) {
      if (inputRef.current) inputRef.current.value = ''
      setParentId('')
      setShowParent(false)
    }
  }, [state])

  // Top-level steps only (can't nest more than one level in the UI)
  const topLevelSteps = (existingSteps ?? []).filter(s => !s.parent_step_id)

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="job_id"         value={jobId}   />
      <input type="hidden" name="parent_step_id" value={parentId || ''} />

      <div className="flex gap-2">
        <input
          ref={inputRef}
          name="text"
          type="text"
          placeholder="Add a step…"
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border:          '1px solid rgba(255,255,255,0.08)',
            color:           '#E8E9ED',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#C8A44E'
            e.currentTarget.style.boxShadow   = '0 0 0 2px rgba(200,164,78,0.12)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.boxShadow   = 'none'
          }}
        />
        <SubmitBtn />
      </div>

      {/* Parent step selector — shown when there are top-level steps to choose from */}
      {topLevelSteps.length > 0 && (
        <div className="mt-1.5">
          {!showParent ? (
            <button
              type="button"
              onClick={() => setShowParent(true)}
              className="text-[11px] transition-opacity hover:opacity-70"
              style={{ color: '#8B8F9E' }}
            >
              + Add as child step
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="flex-1 rounded-xl px-3 py-1.5 text-xs outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border:          '1px solid rgba(255,255,255,0.08)',
                  color:           parentId ? '#E8E9ED' : '#8B8F9E',
                }}
              >
                <option value="">Top-level (no parent)</option>
                {topLevelSteps.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.text.length > 40 ? s.text.slice(0, 40) + '…' : s.text}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => { setShowParent(false); setParentId('') }}
                className="text-[11px] transition-opacity hover:opacity-70"
                style={{ color: '#8B8F9E' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {state?.error && (
        <p className="text-xs mt-1" style={{ color: '#F87171' }}>{state.error}</p>
      )}
    </form>
  )
}
