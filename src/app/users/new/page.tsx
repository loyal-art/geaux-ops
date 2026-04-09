import Link from 'next/link'
import { createUser } from '../actions'

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/users"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#E8E9ED' }}>Create User</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              Create an account — permissions come from workspace assignments
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-4">
        <form action={createUser} className="space-y-5">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              {decodeURIComponent(error)}
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Display Name <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input
              type="text"
              name="display_name"
              placeholder="Jane Doe"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Email <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="jane@example.com"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
            />
          </div>

          {/* Temporary Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Temporary Password <span style={{ color: '#F87171' }}>*</span>
            </label>
            <input
              type="text"
              name="password"
              placeholder="Temp password for user"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
            />
            <p className="text-[11px]" style={{ color: '#8B8F9E' }}>
              Share this with the user so they can sign in. They can change it later.
            </p>
          </div>

          <p className="text-xs" style={{ color: '#8B8F9E' }}>
            After creating the user, add them to workspaces and assign their role in each workspace.
          </p>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
          >
            Create User
          </button>
        </form>
      </div>
    </div>
  )
}
