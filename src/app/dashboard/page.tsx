import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the user's display name from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, role')
    .eq('id', user.id)
    .single()

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ backgroundColor: '#0F1117' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <polygon points="16,3 30,27 2,27" fill="#C8A44E" opacity="0.9" />
          <polygon points="16,10 25,25 7,25" fill="#0F1117" />
          <polygon points="16,14 22,24 10,24" fill="#C8A44E" opacity="0.5" />
        </svg>
        <span className="text-xl font-bold tracking-widest" style={{ color: '#C8A44E' }}>
          GEAUX OPS
        </span>
      </div>

      {/* Status card */}
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          backgroundColor: '#1A1D27',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-5"
          style={{
            backgroundColor: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.2)',
            color: '#4ADE80',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Auth working
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: '#E8E9ED' }}>
          Welcome, {profile?.display_name ?? user.email}
        </h1>
        <p className="text-sm mb-1" style={{ color: '#8B8F9E' }}>
          Role: <span style={{ color: '#C8A44E' }}>{profile?.role ?? 'loading…'}</span>
        </p>
        <p className="text-sm mb-8" style={{ color: '#8B8F9E' }}>
          {user.email}
        </p>

        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#8B8F9E' }}>
          Authentication is set up and working.
          The full dashboard is coming in the next step.
        </p>

        <form action={signOut}>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
            style={{
              backgroundColor: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#F87171',
            }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </main>
  )
}
