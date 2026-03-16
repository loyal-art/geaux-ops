'use client'

import { useActionState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addStep } from '@/app/jobs/actions'

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

export function AddStepForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(addStep, null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state && !state.error) {
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [state])

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="job_id" value={jobId} />
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
      {state?.error && (
        <p className="text-xs mt-1" style={{ color: '#F87171' }}>{state.error}</p>
      )}
    </form>
  )
}
