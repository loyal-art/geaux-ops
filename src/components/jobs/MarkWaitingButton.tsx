'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markJobWaiting } from '@/app/jobs/actions'

interface Props {
  jobId: string
}

export function MarkWaitingButton({ jobId }: Props) {
  const [open, setOpen]               = useState(false)
  const [reason, setReason]           = useState('')
  const [isPending, startTransition]  = useTransition()
  const router                        = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = reason.trim()
    if (!trimmed) return
    startTransition(async () => {
      const result = await markJobWaiting(jobId, trimmed)
      if (!result?.error) {
        router.refresh()
        setOpen(false)
        setReason('')
      }
    })
  }

  if (open) {
    return (
      <div className="w-full space-y-2">
        <p className="text-xs font-semibold" style={{ color: '#EAB308' }}>
          What are you waiting on?
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Waiting on client approval for maintenance window"
          className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none"
          rows={2}
          style={{
            backgroundColor: '#1A1D27',
            border:          '1px solid rgba(234,179,8,0.35)',
            color:           '#E8E9ED',
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setOpen(false); setReason('') }}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
            style={{
              backgroundColor: 'rgba(139,143,158,0.1)',
              color:           '#8B8F9E',
              border:          '1px solid rgba(139,143,158,0.25)',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'rgba(234,179,8,0.12)',
              color:           '#EAB308',
              border:          '1px solid rgba(234,179,8,0.35)',
            }}
          >
            {isPending ? 'Saving…' : 'Mark Waiting'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
      style={{
        backgroundColor: 'rgba(234,179,8,0.1)',
        color:           '#EAB308',
        border:          '1px solid rgba(234,179,8,0.3)',
      }}
    >
      Mark Waiting
    </button>
  )
}
