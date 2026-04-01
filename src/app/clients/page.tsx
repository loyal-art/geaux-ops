import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Client, ProjectStatus } from '@/lib/types'

// ── Status dot config ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<ProjectStatus, string> = {
  active:   '#4ADE80',
  paused:   '#FB923C',
  complete: '#8B8F9E',
}

// ── Client card ───────────────────────────────────────────────────────────────

function ClientCard({ client }: { client: Client }) {
  const projects = client.projects ?? []
  const activeCount   = projects.filter(p => p.status === 'active').length
  const pausedCount   = projects.filter(p => p.status === 'paused').length
  const completeCount = projects.filter(p => p.status === 'complete').length
  const total = projects.length

  return (
    <Link
      href={`/clients/${client.id}`}
      className="card-hover flex items-center gap-4 px-5 py-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Avatar initial */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E' }}
      >
        {client.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>
          {client.name}
        </p>
        {client.contact_name && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>
            {client.contact_name}
          </p>
        )}
        {/* Project status dots */}
        <div className="flex items-center gap-2 mt-1.5">
          {total === 0 ? (
            <span className="text-[10px]" style={{ color: '#8B8F9E' }}>No projects</span>
          ) : (
            <>
              {activeCount > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: STATUS_COLOR.active }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.active }} />
                  {activeCount} active
                </span>
              )}
              {pausedCount > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: STATUS_COLOR.paused }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.paused }} />
                  {pausedCount} paused
                </span>
              )}
              {completeCount > 0 && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: STATUS_COLOR.complete }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR.complete }} />
                  {completeCount} complete
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Project count + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {total > 0 && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(200,164,78,0.12)', color: '#C8A44E' }}
          >
            {total}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: 'rgba(200,164,78,0.1)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: '#E8E9ED' }}>No clients yet</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#8B8F9E' }}>
        Add your first client to start organizing jobs and projects.
      </p>
      <Link
        href="/clients/new"
        className="px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        Add First Client
      </Link>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
        {title}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('clients')
    .select('*, projects(id, status)')
    .order('name')

  const clients = (data ?? []) as unknown as Client[]

  const activeClients   = clients.filter(c => (c.projects ?? []).some(p => p.status === 'active'))
  const inactiveClients = clients.filter(c => !(c.projects ?? []).some(p => p.status === 'active'))

  const totalProjects = clients.reduce((sum, c) => sum + (c.projects?.length ?? 0), 0)
  const activeProjects = clients.reduce(
    (sum, c) => sum + (c.projects ?? []).filter(p => p.status === 'active').length,
    0
  )

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#E8E9ED' }}>Clients</h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
              {totalProjects > 0 && ` · ${totalProjects} projects`}
            </p>
          </div>
          <Link
            href="/clients/new"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
            style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F1117" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Client
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      {clients.length > 0 && (
        <div className="px-5 mb-8 flex gap-3">
          <div
            className="flex flex-col items-center px-4 py-4 rounded-2xl flex-1"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid rgba(200,164,78,0.4)' }}
          >
            <span className="text-2xl font-bold" style={{ color: '#C8A44E' }}>{clients.length}</span>
            <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>Clients</span>
          </div>
          <div
            className="flex flex-col items-center px-4 py-4 rounded-2xl flex-1"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid rgba(74,222,128,0.4)' }}
          >
            <span className="text-2xl font-bold" style={{ color: '#4ADE80' }}>{activeProjects}</span>
            <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>Active</span>
          </div>
          <div
            className="flex flex-col items-center px-4 py-4 rounded-2xl flex-1"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)', borderTop: '2px solid rgba(96,165,250,0.4)' }}
          >
            <span className="text-2xl font-bold" style={{ color: '#60A5FA' }}>{totalProjects}</span>
            <span className="text-[10px] tracking-wide uppercase mt-0.5" style={{ color: '#8B8F9E' }}>Projects</span>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-5 space-y-8">
        {clients.length === 0 && <EmptyState />}

        {activeClients.length > 0 && (
          <section>
            <SectionHeader title="Active" />
            <div className="space-y-2">
              {activeClients.map(c => <ClientCard key={c.id} client={c} />)}
            </div>
          </section>
        )}

        {inactiveClients.length > 0 && (
          <section>
            <SectionHeader title={activeClients.length > 0 ? 'Others' : 'All Clients'} />
            <div className="space-y-2">
              {inactiveClients.map(c => <ClientCard key={c.id} client={c} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
