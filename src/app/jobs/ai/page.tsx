'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────

interface AiResult {
  title: string
  steps: string[]
  priority: 'urgent' | 'normal' | 'low'
  category: 'business' | 'home' | 'personal' | 'misc'
}

// ── Reusable field ───────────────────────────────────────────────────────────

function Field({
  label, hint, placeholder, value, onChange, textarea = false,
}: {
  label: string; hint: string; placeholder: string
  value: string; onChange: (v: string) => void; textarea?: boolean
}) {
  const base = 'w-full rounded-xl px-4 py-3 text-sm outline-none'
  const style = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8E9ED',
  }
  return (
    <div>
      <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
        {label}
      </label>
      <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>{hint}</p>
      {textarea
        ? <textarea placeholder={placeholder} rows={3} className={`${base} resize-none`} style={style} value={value} onChange={e => onChange(e.target.value)} />
        : <input type="text" placeholder={placeholder} className={base} style={style} value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AiJobPage() {
  const router = useRouter()

  // Phase 1: prompt inputs
  const [description, setDescription] = useState('')
  const [client, setClient] = useState('')
  const [finish, setFinish] = useState('')
  const [focus, setFocus] = useState('')

  // Phase 2: AI result preview
  const [result, setResult] = useState<AiResult | null>(null)

  // Editable preview state
  const [editTitle, setEditTitle] = useState('')
  const [editSteps, setEditSteps] = useState<string[]>([])
  const [editPriority, setEditPriority] = useState<'urgent' | 'normal' | 'low'>('normal')
  const [editCategory, setEditCategory] = useState<'business' | 'home' | 'personal' | 'misc'>('misc')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ── Generate ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!description.trim()) {
      setError('Please describe the job.')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/generate-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, client, finish, focus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const ai: AiResult = data
      setResult(ai)
      setEditTitle(ai.title)
      setEditSteps([...ai.steps])
      setEditPriority(ai.priority)
      setEditCategory(ai.category)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // ── Step editing helpers ─────────────────────────────────────────────────

  function updateStep(idx: number, text: string) {
    setEditSteps(s => s.map((v, i) => i === idx ? text : v))
  }

  function removeStep(idx: number) {
    setEditSteps(s => s.filter((_, i) => i !== idx))
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= editSteps.length) return
    setEditSteps(s => {
      const copy = [...s]
      ;[copy[idx], copy[target]] = [copy[target], copy[idx]]
      return copy
    })
  }

  function addStep() {
    setEditSteps(s => [...s, ''])
  }

  // ── Confirm & create ─────────────────────────────────────────────────────

  async function handleConfirm() {
    const validSteps = editSteps.filter(s => s.trim())
    if (!editTitle.trim() || validSteps.length === 0) {
      setError('Title and at least one step are required.')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/ai/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          client_name: client.trim() || null,
          finish_definition: finish.trim() || null,
          focus: focus.trim() || null,
          priority: editPriority,
          category: editCategory,
          steps: validSteps,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create job')
      router.push(`/jobs/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  // ── Render: Prompt form ──────────────────────────────────────────────────

  if (!result) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/jobs/new"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>AI Generate Job</h1>
            <p className="text-sm" style={{ color: '#8B8F9E' }}>Describe it, and AI builds the steps</p>
          </div>
        </div>

        {/* AI sparkle badge */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-6"
          style={{ backgroundColor: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>
          <span className="text-xs font-medium" style={{ color: '#A78BFA' }}>
            Powered by Claude AI
          </span>
        </div>

        <div className="space-y-5">
          <Field
            label="What's the job?"
            hint="Short description of what needs to be done."
            placeholder="e.g. Film and edit a podcast episode with two guests"
            value={description}
            onChange={setDescription}
          />

          <Field
            label="Who's this for?"
            hint="Client or contact name."
            placeholder="e.g. Sarah Johnson"
            value={client}
            onChange={setClient}
          />

          <Field
            label="What does finished look like?"
            hint="F1 — Define done before you start."
            placeholder="e.g. Edited episode uploaded and published to all platforms"
            value={finish}
            onChange={setFinish}
            textarea
          />

          <Field
            label="What's your focus?"
            hint="F2 — Your mindset or priority areas for this job."
            placeholder="e.g. Audio quality is top priority, keep transitions tight"
            value={focus}
            onChange={setFocus}
            textarea
          />

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: '#A78BFA', color: '#0F1117' }}
          >
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
      </div>
    )
  }

  // ── Render: Preview & edit ───────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setResult(null)}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          aria-label="Back to prompts"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>Review & Edit</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Adjust the AI-generated job before creating</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E8E9ED',
            }}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Priority
          </label>
          <select
            value={editPriority}
            onChange={e => setEditPriority(e.target.value as 'urgent' | 'normal' | 'low')}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E8E9ED',
            }}
          >
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Category
          </label>
          <select
            value={editCategory}
            onChange={e => setEditCategory(e.target.value as 'business' | 'home' | 'personal' | 'misc')}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E8E9ED',
            }}
          >
            <option value="misc">Misc</option>
            <option value="business">Business</option>
            <option value="home">Home</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Steps ({editSteps.length})
            </label>
            <button
              onClick={addStep}
              className="text-xs font-medium px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: '#A78BFA', backgroundColor: 'rgba(167,139,250,0.1)' }}
            >
              + Add step
            </button>
          </div>

          <div className="space-y-2">
            {editSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span className="text-[11px] font-bold mt-2.5 flex-shrink-0 w-5 text-right" style={{ color: '#8B8F9E' }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={step}
                  onChange={e => updateStep(idx, e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: '#E8E9ED' }}
                  placeholder="Step description..."
                />
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded transition-opacity disabled:opacity-20 hover:opacity-70"
                    aria-label="Move up"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === editSteps.length - 1}
                    className="p-1 rounded transition-opacity disabled:opacity-20 hover:opacity-70"
                    aria-label="Move down"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeStep(idx)}
                    className="p-1 rounded transition-opacity hover:opacity-70"
                    aria-label="Remove step"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* F1 & F2 summary */}
        {(finish.trim() || focus.trim()) && (
          <div
            className="rounded-xl px-4 py-3 space-y-2"
            style={{ backgroundColor: 'rgba(200,164,78,0.06)', borderLeft: '3px solid #C8A44E' }}
          >
            {finish.trim() && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8A44E' }}>F1 — Finish</p>
                <p className="text-sm italic" style={{ color: '#E8E9ED' }}>{finish}</p>
              </div>
            )}
            {focus.trim() && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8A44E' }}>F2 — Focus</p>
                <p className="text-sm italic" style={{ color: '#E8E9ED' }}>{focus}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          {saving ? 'Creating Job...' : 'Create Job'}
        </button>
      </div>
    </div>
  )
}
