import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all workspaces this user belongs to
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, role_in_group, groups(id, name, type)')
    .eq('user_id', user.id)

  const workspaces = (memberships ?? [])
    .map(m => {
      const g = Array.isArray(m.groups) ? m.groups[0] : m.groups
      return g ? { id: g.id, name: g.name, type: g.type } : null
    })
    .filter((w): w is { id: string; name: string; type: string } => w !== null)

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const greeting = profile?.display_name
    ? `Welcome, ${profile.display_name.split(' ')[0]}`
    : 'Welcome'

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0F1117' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: '#C8A44E22', color: '#C8A44E' }}
          >
            G
          </div>
          <span className="text-sm font-semibold" style={{ color: '#E8E9ED' }}>Geaux Ops</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: '#8B8F9E', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="max-w-lg mx-auto px-5 pt-8 pb-12">
        {/* Greeting */}
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#E8E9ED' }}>{greeting}</h1>
        <p className="text-sm mb-8" style={{ color: '#8B8F9E' }}>
          {workspaces.length === 1
            ? 'Your workspace is below.'
            : `You have access to ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}.`}
        </p>

        {workspaces.length === 0 ? (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-sm" style={{ color: '#8B8F9E' }}>
              You haven&apos;t been added to any workspace yet. Contact your team to get access.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map(ws => (
              <Link
                key={ws.id}
                href={`/portal/${ws.id}`}
                className="block rounded-2xl px-5 py-4 transition-all hover:opacity-90 active:scale-[0.99]"
                style={{
                  backgroundColor: '#1A1D27',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-base" style={{ color: '#E8E9ED' }}>{ws.name}</p>
                    <p className="text-xs mt-0.5 capitalize" style={{ color: '#8B8F9E' }}>{ws.type}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
