import { createProject } from '@/app/projects/actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ProjectStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'active',   label: 'Active',   color: '#4ADE80' },
  { value: 'paused',   label: 'Paused',   color: '#FB923C' },
  { value: 'complete', label: 'Complete', color: '#8B8F9E' },
]

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string; error?: string }>
}) {
  const { client_id, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Resolve client name for display
  let clientName: string | null = null
  if (client_id) {
    const { data } = await supabase
      .from('clients')
      .select('name')
      .eq('id', client_id)
      .single()
    clientName = data?.name ?? null
  }

  // Fall back to first client if none provided
  if (!client_id) {
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name')
      .order('name')
      .limit(20)

    const backHref = client_id ? `/clients/${client_id}` : '/clients'

    return (
      <div className="max-w-lg mx-auto">
        <div className="px-5 pt-12 pb-6 flex items-center gap-3">
          <Link
            href={backHref}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Project</h1>
        </div>
        <div className="px-5">
          <p className="text-sm mb-4" style={{ color: '#8B8F9E' }}>Select a client first:</p>
          <div className="space-y-2">
            {(clients ?? []).map(c => (
              <Link
                key={c.id}
                href={`/projects/new?client_id=${c.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl transition-opacity hover:opacity-70"
                style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-sm font-medium" style={{ color: '#E8E9ED' }}>{c.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            ))}
            {(clients ?? []).length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: '#8B8F9E' }}>
                No clients yet.{' '}
                <Link href="/clients/new" style={{ color: '#C8A44E' }}>Add one first.</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const backHref = client_id ? `/clients/${client_id}` : '/clients'

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <Link
          href={backHref}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Project</h1>
          {clientName && (
            <p className="text-xs mt-0.5" style={{ color: '#8B8F9E' }}>for {clientName}</p>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      {/* ── Form ── */}
      <form action={createProject} className="px-5 space-y-5">
        <input type="hidden" name="client_id" value={client_id} />

        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Project Name <span style={{ color: '#F87171' }}>*</span>
          </label>
          <input
            type="text"
            name="name"
            placeholder="Q2 Notarizations"
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Description
          </label>
          <textarea
            name="description"
            rows={2}
            placeholder="What does this project cover?"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Status
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer flex-1 justify-center"
                style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  defaultChecked={opt.value === 'active'}
                  className="sr-only"
                />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                <span style={{ color: opt.color }}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          Create Project
        </button>
      </form>
    </div>
  )
}
