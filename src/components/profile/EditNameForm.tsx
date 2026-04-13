'use client'

import { useState, useTransition } from 'react'
import { updateDisplayName } from '@/app/profile/actions'

export function EditNameForm({ currentName }: { currentName: string }) {
  const [name, setName]   = useState(currentName)
  const [msg, setMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const res = await updateDisplayName(name)
      if (res.error) setMsg({ type: 'err', text: res.error })
      else           setMsg({ type: 'ok',  text: 'Name updated!' })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border:          '1px solid rgba(255,255,255,0.08)',
          color:           '#E8E9ED',
        }}
        placeholder="Your name"
      />
      {msg && (
        <p className="text-xs" style={{ color: msg.type === 'ok' ? '#4ADE80' : '#F87171' }}>
          {msg.text}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        {isPending ? 'Saving…' : 'Save Name'}
      </button>
    </form>
  )
}
