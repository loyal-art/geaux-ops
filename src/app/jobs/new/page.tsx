import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createJob } from '@/app/jobs/actions'
import type { JobTemplate, TemplateStep } from '@/lib/types'

// ── Submit button (must be client for useFormStatus, inline here via wrapper) ─

async function SubmitButton() {
  // Server component fallback — JS loading handled by form pending state
  return (
    <button
      type="submit"
      className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
      style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
    >
      Create Job
    </button>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: JobTemplate }) {
  const stepCount = (template.default_steps as TemplateStep[]).length
  return (
    <Link
      href={`/jobs/new?template=${template.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#1A1D27',
        border:          '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: template.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>
          {template.name}
        </p>
        {stepCount > 0 && (
          <p className="text-[11px]" style={{ color: '#8B8F9E' }}>
            {stepCount} steps
          </p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────

function Field({
  name, label, placeholder, required = false, hint, textarea = false,
}: {
  name: string; label: string; placeholder: string
  required?: boolean; hint?: string; textarea?: boolean
}) {
  const base = "w-full rounded-xl px-4 py-3 text-sm outline-none"
  const style = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border:          '1px solid rgba(255,255,255,0.08)',
    color:           '#E8E9ED',
  }
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
        {label}{required && <span style={{ color: '#F87171' }}> *</span>}
      </label>
      {hint && <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>{hint}</p>}
      {textarea
        ? <textarea name={name} placeholder={placeholder} rows={3} className={`${base} resize-none`} style={style} />
        : <input name={name} type="text" placeholder={placeholder} required={required} className={base} style={style} />
      }
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { template: templateId } = await searchParams

  // ── Phase 2: Job creation form ────────────────────────────────────────────

  if (templateId) {
    const { data: template } = await supabase
      .from('job_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) redirect('/jobs/new')

    const steps = (template.default_steps as TemplateStep[]) ?? []

    return (
      <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
        {/* Back */}
        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-70"
          style={{ color: '#8B8F9E' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to templates
        </Link>

        {/* Template identity */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: template.color }} />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Job</h1>
            <p className="text-sm" style={{ color: '#8B8F9E' }}>{template.name}</p>
          </div>
        </div>

        <form action={createJob} className="space-y-5">
          <input type="hidden" name="template_id" value={templateId} />

          <Field name="title" label="Job Title" placeholder="e.g. RON — Sarah Johnson" required />
          <Field name="client_name" label="Client / Contact" placeholder="e.g. Sarah Johnson" />

          <Field
            name="finish_definition"
            label="F1 — What does finished look like?"
            placeholder="e.g. Payment confirmed and documents sent to all parties"
            hint="Define done before you start. This is the F1 — Finish."
            textarea
          />

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Priority
            </label>
            <select
              name="priority"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border:          '1px solid rgba(255,255,255,0.08)',
                color:           '#E8E9ED',
              }}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Steps preview */}
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#8B8F9E' }}>
                Steps ({steps.length})
              </p>
              <div
                className="rounded-2xl px-4 py-3 space-y-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {steps.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: template.color, opacity: 0.6 }} />
                    <p className="text-xs leading-snug" style={{ color: '#8B8F9E' }}>
                      {s.text}
                      {s.is_high_impact && (
                        <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#C8A44E' }}>Focus</span>
                      )}
                    </p>
                  </div>
                ))}
                {steps.length > 5 && (
                  <p className="text-[11px]" style={{ color: '#8B8F9E' }}>
                    + {steps.length - 5} more steps
                  </p>
                )}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: '#8B8F9E' }}>
                You can add, edit, or remove steps after creating the job.
              </p>
            </div>
          )}

          <div className="pt-2">
            <SubmitButton />
          </div>
        </form>
      </div>
    )
  }

  // ── Phase 1: Template picker ───────────────────────────────────────────────

  const { data: templates } = await supabase
    .from('job_templates')
    .select('*')
    .order('category')
    .order('name')

  const business  = (templates ?? []).filter(t => t.category === 'business') as unknown as JobTemplate[]
  const household = (templates ?? []).filter(t => t.category === 'household') as unknown as JobTemplate[]
  const custom    = (templates ?? []).filter(t => t.category === 'custom') as unknown as JobTemplate[]

  return (
    <div className="max-w-lg mx-auto px-5 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Job</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Choose a template to get started</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Business */}
        {business.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>
              Business
            </p>
            <div className="space-y-2">
              {business.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}

        {/* Household */}
        {household.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>
              Household
            </p>
            <div className="space-y-2">
              {household.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}

        {/* Custom */}
        {custom.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>
              Custom
            </p>
            <div className="space-y-2">
              {custom.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
