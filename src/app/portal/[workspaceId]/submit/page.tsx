'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PortalSubmitPage() {
  const params      = useParams()
  const workspaceId = params.workspaceId as string
  const router      = useRouter()

  const [description, setDescription] = useState('')
  const [finish, setFinish]           = useState('')
  const [deadline, setDeadline]       = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please describe what you need.')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const fd = new FormData()
      fd.append('description', description.trim())
      fd.append('finish', finish.trim())
      fd.append('deadline', deadline)

      const res = await fetch(`/api/portal/submit`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          description: description.trim(),
          finish: finish.trim() || null,
          deadline: deadline || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit request')

      router.push(`/portal/${workspaceId}?submitted=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F1117' }}
      >
        <Link
          href={`/portal/${workspaceId}`}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Back"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#E8E9ED' }}>Submit a Request</p>
          <p className="text-[11px]" style={{ color: '#8B8F9E' }}>Tell us what you need</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-16">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Q1 */}
          <div>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              What do you need?
            </label>
            <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
              Describe the request in a sentence or two.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Update the homepage hero section with new copy and imagery"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E9ED',
              }}
            />
          </div>

          {/* Q2 */}
          <div>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              What does done look like?
            </label>
            <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
              How will you know the work is complete?
            </p>
            <textarea
              rows={3}
              placeholder="e.g. New copy is live on the site and matches the approved brand guide"
              value={finish}
              onChange={e => setFinish(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#E8E9ED',
              }}
            />
          </div>

          {/* Q3 */}
          <div>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Any deadline? <span style={{ color: '#8B8F9E', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span>
            </label>
            <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
              Leave blank if there&apos;s no hard date.
            </p>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: deadline ? '#E8E9ED' : '#8B8F9E',
                colorScheme: 'dark',
              }}
            />
          </div>

          {error && (
            <p
              className="text-sm px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
