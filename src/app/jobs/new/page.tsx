import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

// ── Job type card ─────────────────────────────────────────────────────────────

function TypeCard({
  href, title, description, emoji, accent, accentSoft,
}: {
  href: string
  title: string
  description: string
  emoji: string
  accent: string
  accentSoft: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-5 py-5 rounded-2xl transition-all active:scale-[0.98] card-hover"
      style={{
        backgroundColor: accentSoft,
        border:          `1px solid ${accent}26`,
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl"
        style={{ backgroundColor: `${accent}22` }}
      >
        <span aria-hidden>{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold mb-0.5" style={{ color: accent }}>
          {title}
        </p>
        <p className="text-xs leading-snug" style={{ color: '#8B8F9E' }}>
          {description}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
          <h1 className="text-xl font-bold" style={{ color: '#E8E9ED' }}>What kind of job?</h1>
          <p className="text-sm" style={{ color: '#8B8F9E' }}>Pick the type that fits.</p>
        </div>
      </div>

      <div className="space-y-3">
        <TypeCard
          href="/jobs/new/notary"
          title="Notary Request"
          description="Structured intake for mobile notary appointments — client, location, document, quote."
          emoji="📜"
          accent="#C8A44E"
          accentSoft="rgba(200,164,78,0.06)"
        />

        <TypeCard
          href="/jobs/new/vues"
          title="Southern VUEs Job"
          description="Real estate media — photo, video, drone, and virtual tour work."
          emoji="🎥"
          accent="#60A5FA"
          accentSoft="rgba(96,165,250,0.06)"
        />

        <TypeCard
          href="/jobs/new/misc"
          title="Misc Job"
          description="Pick a template or start from scratch for everything else."
          emoji="🗂️"
          accent="#8B8F9E"
          accentSoft="rgba(139,143,158,0.06)"
        />

        <TypeCard
          href="/jobs/ai"
          title="AI Generated"
          description="Describe the job and let AI build the steps."
          emoji="✨"
          accent="#A78BFA"
          accentSoft="rgba(167,139,250,0.06)"
        />
      </div>
    </div>
  )
}
