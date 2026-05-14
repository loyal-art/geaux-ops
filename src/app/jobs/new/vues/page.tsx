import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

// ── Placeholder server action: create a blank VUEs job ────────────────────────
//
// Real form lands later — for now Create just spins up a stub job tagged as
// a VUEs job in job_metadata so we can wire the rest of the pipeline against
// it.

async function createBlankVuesJob() {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vuesGroup } = await supabase
    .from('groups')
    .select('id')
    .ilike('name', 'Southern VUEs')
    .maybeSingle()

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title:         'New Southern VUEs Job',
      category:      'business',
      priority:      'normal',
      status:        'in_progress',
      group_id:      vuesGroup?.id ?? null,
      owner_user_id: user.id,
      created_by:    user.id,
      job_metadata:  { job_type: 'vues' },
    })
    .select()
    .single()

  if (error || !job) {
    redirect(`/jobs/new/vues?error=${encodeURIComponent(error?.message ?? 'Failed to create job')}`)
  }

  revalidatePath('/dashboard')
  redirect(`/jobs/${job.id}`)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VuesNewJobPage({
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
          style={{ backgroundColor: 'rgba(96,165,250,0.15)' }}
        >
          <span aria-hidden>🎥</span>
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>Southern VUEs Job</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Real estate media work</p>
        </div>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-xl mb-5" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          {error}
        </p>
      )}

      <div
        className="px-4 py-3 rounded-xl mb-6"
        style={{ backgroundColor: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}
      >
        <p className="text-sm leading-relaxed" style={{ color: '#E8E9ED' }}>
          Structured Southern VUEs intake is on the way. For now you can spin up a
          blank job tagged as a VUEs job and fill in the rest on the job detail page.
        </p>
      </div>

      <form action={createBlankVuesJob}>
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#60A5FA', color: '#0F1117' }}
        >
          Create Blank VUEs Job
        </button>
      </form>
    </div>
  )
}
