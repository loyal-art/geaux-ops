import { createClientRecord } from '@/app/clients/actions'
import Link from 'next/link'

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label, name, type = 'text', placeholder, required,
}: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
        {label} {required && <span style={{ color: '#F87171' }}>*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          backgroundColor: '#1A1D27',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E8E9ED',
        }}
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-3">
        <Link
          href="/clients"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Client</h1>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mx-5 mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          {decodeURIComponent(error)}
        </div>
      )}

      {/* ── Form ── */}
      <form action={createClientRecord} className="px-5 space-y-5">
        <Field label="Client Name"    name="name"          placeholder="Acme Corp" required />
        <Field label="Contact Name"   name="contact_name"  placeholder="Jane Smith" />
        <Field label="Contact Email"  name="contact_email" type="email" placeholder="jane@acme.com" />
        <Field label="Contact Phone"  name="contact_phone" type="tel"   placeholder="+1 (555) 000-0000" />

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
            Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any relevant context, contract details, preferences…"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
            style={{
              backgroundColor: '#1A1D27',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E8E9ED',
            }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          Create Client
        </button>
      </form>
    </div>
  )
}
