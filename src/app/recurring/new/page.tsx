import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createRecurringSchedule } from '@/app/recurring/actions'
import type { JobTemplate, TemplateStep, Profile } from '@/lib/types'

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: JobTemplate }) {
  const stepCount = (template.default_steps as TemplateStep[]).length
  return (
    <Link
      href={`/recurring/new?template=${template.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
      style={{
        backgroundColor: '#1A1D27',
        border:          '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: template.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{template.name}</p>
        {stepCount > 0 && (
          <p className="text-[11px]" style={{ color: '#8B8F9E' }}>{stepCount} steps</p>
        )}
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ── Frequency option ──────────────────────────────────────────────────────────

function FrequencyOption({
  value, label, description,
}: {
  value: string; label: string; description: string
}) {
  return (
    <label
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <input
        type="radio"
        name="frequency"
        value={value}
        className="mt-0.5 accent-[#C8A44E]"
        required
      />
      <div>
        <p className="text-sm font-medium" style={{ color: '#E8E9ED' }}>{label}</p>
        <p className="text-[11px]" style={{ color: '#8B8F9E' }}>{description}</p>
      </div>
    </label>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewRecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Owner-only gate
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/recurring')

  const { template: templateId } = await searchParams

  // ── Phase 2: Schedule configuration form ─────────────────────────────────

  if (templateId) {
    const [{ data: template }, { data: members }] = await Promise.all([
      supabase
        .from('job_templates')
        .select('*')
        .eq('id', templateId)
        .single(),
      supabase
        .from('users')
        .select('id, display_name')
        .order('display_name'),
    ])

    if (!template) redirect('/recurring/new')

    const users = (members ?? []) as Pick<Profile, 'id' | 'display_name'>[]

    return (
      <div className="max-w-lg mx-auto px-5 pt-12 pb-6">

        {/* Back */}
        <Link
          href="/recurring/new"
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
            <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Recurring Schedule</h1>
            <p className="text-sm" style={{ color: '#8B8F9E' }}>{template.name}</p>
          </div>
        </div>

        <form action={createRecurringSchedule} className="space-y-6">
          <input type="hidden" name="template_id" value={templateId} />

          {/* Frequency */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#8B8F9E' }}>
              How often? <span style={{ color: '#F87171' }}>*</span>
            </p>
            <div className="space-y-2">
              <FrequencyOption
                value="daily"
                label="Daily"
                description="Every day at midnight UTC — a fresh job appears each morning."
              />
              <FrequencyOption
                value="weekdays"
                label="Weekdays (Mon–Fri)"
                description="Auto-generates Monday through Friday. Skips weekends."
              />
              <FrequencyOption
                value="weekly"
                label="Weekly"
                description="Same day each week — great for recurring household tasks."
              />
              <FrequencyOption
                value="monthly"
                label="Monthly"
                description="Same calendar day each month — bills, deep-cleans, reports."
              />
            </div>
          </div>

          {/* Assignee */}
          {users.length > 0 && (
            <div>
              <label
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                style={{ color: '#8B8F9E' }}
              >
                Assign to (optional)
              </label>
              <select
                name="assigned_to"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border:          '1px solid rgba(255,255,255,0.08)',
                  color:           '#E8E9ED',
                }}
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.display_name ?? u.id}
                  </option>
                ))}
              </select>
              <p className="text-[11px] mt-1.5" style={{ color: '#8B8F9E' }}>
                Each generated job will be assigned to this person.
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
            >
              Save Schedule
            </button>
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

  const business  = (templates ?? []).filter(t => t.category === 'business')  as unknown as JobTemplate[]
  const household = (templates ?? []).filter(t => t.category === 'household') as unknown as JobTemplate[]
  const custom    = (templates ?? []).filter(t => t.category === 'custom')    as unknown as JobTemplate[]

  return (
    <div className="max-w-lg mx-auto px-5 pt-12 pb-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/recurring"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          aria-label="Back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>New Schedule</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Choose a template to repeat</p>
        </div>
      </div>

      <div className="space-y-8">

        {business.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>Business</p>
            <div className="space-y-2">
              {business.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}

        {household.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>Household</p>
            <div className="space-y-2">
              {household.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}

        {custom.length > 0 && (
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#8B8F9E' }}>Custom</p>
            <div className="space-y-2">
              {custom.map(t => <TemplateCard key={t.id} template={t} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
