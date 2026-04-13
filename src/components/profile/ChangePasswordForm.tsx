'use client'

import { useState, useTransition } from 'react'
import { changePassword } from '@/app/profile/actions'

export function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [msg, setMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Client-side gate — server also validates
    if (password.length < 6) { setMsg({ type: 'err', text: 'Password must be at least 6 characters' }); return }
    if (password !== confirm) { setMsg({ type: 'err', text: 'Passwords do not match' }); return }
    setMsg(null)
    startTransition(async () => {
      const res = await changePassword(password, confirm)
      if (res.error) {
        setMsg({ type: 'err', text: res.error })
      } else {
        setMsg({ type: 'ok', text: 'Password updated!' })
        setPassword('')
        setConfirm('')
      }
    })
  }

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border:          '1px solid rgba(255,255,255,0.08)',
    color:           '#E8E9ED',
  } as const

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        placeholder="New password"
        autoComplete="new-password"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={inputStyle}
      />
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        required
        placeholder="Confirm new password"
        autoComplete="new-password"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={inputStyle}
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
        style={{
          backgroundColor: 'rgba(96,165,250,0.1)',
          color:           '#60A5FA',
          border:          '1px solid rgba(96,165,250,0.3)',
        }}
      >
        {isPending ? 'Updating…' : 'Change Password'}
      </button>
    </form>
  )
}
