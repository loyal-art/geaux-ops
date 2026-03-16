'use client'

import { useActionState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addComment } from '@/app/jobs/actions'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
    >
      {pending ? 'Posting…' : 'Post'}
    </button>
  )
}

export function CommentForm({ jobId }: { jobId: string }) {
  const [state, action] = useActionState(addComment, null)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (state && !state.error && ref.current) {
      ref.current.value = ''
    }
  }, [state])

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="job_id" value={jobId} />
      <textarea
        ref={ref}
        name="text"
        placeholder="Add a note, obstacle, or update… (F4: Follow-Up)"
        rows={3}
        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
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
      <div className="flex items-center justify-between">
        {state?.error
          ? <p className="text-xs" style={{ color: '#F87171' }}>{state.error}</p>
          : <span />
        }
        <SubmitBtn />
      </div>
    </form>
  )
}
