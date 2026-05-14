import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createNotaryJob } from '@/app/jobs/actions'

// ── Field styles (shared) ─────────────────────────────────────────────────────

const INPUT_CLASS = 'w-full rounded-xl px-4 py-3 text-sm outline-none'
const INPUT_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border:          '1px solid rgba(255,255,255,0.08)',
  color:           '#E8E9ED',
} as const

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
      {children}{required && <span style={{ color: '#F87171' }}> *</span>}
    </label>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NotaryNewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await searchParams

  return (
    <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
      {/* Back */}
      <Link
        href="/jobs/new"
        className="inline-flex items-center gap-2 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: '#8B8F9E' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Back to job types
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
          style={{ backgroundColor: 'rgba(200,164,78,0.15)' }}
        >
          <span aria-hidden>📜</span>
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>Notary Request</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Structured intake for a mobile notary appointment</p>
        </div>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-xl mb-5" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          {error}
        </p>
      )}

      <form action={createNotaryJob} className="space-y-5">
        {/* Client Name */}
        <div>
          <Label required>Client Name</Label>
          <input name="client_name" type="text" required className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>

        {/* Client Email */}
        <div>
          <Label required>Client Email</Label>
          <input name="client_email" type="email" required className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>

        {/* Client Phone */}
        <div>
          <Label required>Client Phone</Label>
          <input name="client_phone" type="tel" required className={INPUT_CLASS} style={INPUT_STYLE} />
        </div>

        {/* Signer Name */}
        <div>
          <Label>Signer Name</Label>
          <input
            name="signer_name"
            type="text"
            placeholder="Same as Client Name if blank"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Location */}
        <div>
          <Label required>Location</Label>
          <input
            name="location_address"
            type="text"
            required
            placeholder="123 Main St, Baton Rouge, LA 70809"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Proposed Date + Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Proposed Date</Label>
            <input name="proposed_date" type="date" required className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
          <div>
            <Label required>Proposed Time</Label>
            <input name="proposed_time" type="time" required className={INPUT_CLASS} style={INPUT_STYLE} />
          </div>
        </div>

        {/* Document Type */}
        <div>
          <Label required>Document Type</Label>
          <input
            name="document_type"
            type="text"
            required
            placeholder="POA, Loan Documents, Affidavit, etc."
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Number of Signatures */}
        <div>
          <Label required>Number of Signatures</Label>
          <input
            name="number_of_signatures"
            type="number"
            min={1}
            required
            defaultValue={1}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Witness Requirement */}
        <div>
          <Label required>Witness Requirement</Label>
          <select name="witness_requirement" required defaultValue="None" className={INPUT_CLASS} style={INPUT_STYLE}>
            <option value="None">None</option>
            <option value="1 Witness">1 Witness</option>
            <option value="2 Witnesses">2 Witnesses</option>
            <option value="Ask Client">Ask Client</option>
          </select>
        </div>

        {/* Service Quote */}
        <div>
          <Label required>Service Quote (paid upfront)</Label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: '#8B8F9E' }}
              aria-hidden
            >
              $
            </span>
            <input
              name="service_quote"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="0.00"
              className={`${INPUT_CLASS} pl-7`}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <Label>Special Instructions</Label>
          <textarea
            name="special_instructions"
            rows={3}
            placeholder="Gate codes, parking notes, anything else the notary should know"
            className={`${INPUT_CLASS} resize-none`}
            style={INPUT_STYLE}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
          >
            Create Notary Job
          </button>
        </div>
      </form>
    </div>
  )
}
