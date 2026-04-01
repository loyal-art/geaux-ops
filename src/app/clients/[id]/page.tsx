import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createProject } from '@/app/projects/actions'
import type { Project, ProjectStatus } from '@/lib/types'

// ── Status badge ──────────────────────────────────────────────────────────────

const PROJECT_STATUS: Record<ProjectStatus, { label: string; bg: string; color: string }> = {
  active:   { label: 'Active',   bg: 'rgba(74,222,128,0.12)',  color: '#4ADE80' },
  paused:   { label: 'Paused',   bg: 'rgba(251,146,60,0.12)',  color: '#FB923C' },
  complete: { label: 'Complete', bg: 'rgba(139,143,158,0.12)', color: '#8B8F9E' },
}

function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, bg, color } = PROJECT_STATUS[status]
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  )
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const jobCount = project.jobs?.length ?? 0

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex items-center gap-4 px-4 py-4 rounded-2xl transition-opacity active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Color dot by status */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
        style={{ backgroundColor: PROJECT_STATUS[project.status].color }}
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>
          {project.name}
        </p>
        {project.description && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <ProjectStatusBadge status={project.status} />
          {jobCount > 0 && (
            <span className="text-[10px]" style={{ color: '#8B8F9E' }}>
              {jobCount} {jobCount === 1 ? 'job' : 'jobs'}
            </span>
          )}
        </div>
      </div>

      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>{label}</p>
        <p className="text-sm truncate" style={{ color: '#E8E9ED' }}>{value}</p>
      </div>
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

// ── Add project form (inline) ─────────────────────────────────────────────────

function AddProjectForm({ clientId }: { clientId: string }) {
  return (
    <form action={createProject} className="space-y-3">
      <input type="hidden" name="client_id" value={clientId} />

      <input
        type="text"
        name="name"
        placeholder="Project name"
        required
        autoFocus
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          backgroundColor: '#1A1D27',
          border: '1px solid rgba(200,164,78,0.3)',
          color: '#E8E9ED',
        }}
      />
      <input
        type="text"
        name="description"
        placeholder="Description (optional)"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{
          backgroundColor: '#1A1D27',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#E8E9ED',
        }}
      />

      {/* Status picker */}
      <div className="flex gap-2">
        {(['active', 'paused', 'complete'] as ProjectStatus[]).map(s => (
          <label
            key={s}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer flex-1 justify-center"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <input type="radio" name="status" value={s} defaultChecked={s === 'active'} className="sr-only" />
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROJECT_STATUS[s].color }} />
            <span style={{ color: PROJECT_STATUS[s].color }}>{PROJECT_STATUS[s].label}</span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
      >
        Create Project
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ add?: string }>
}) {
  const { id } = await params
  const { add } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, jobs(id, status)')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const projectList = (projects ?? []) as unknown as Project[]
  const activeProjects  = projectList.filter(p => p.status === 'active')
  const pausedProjects  = projectList.filter(p => p.status === 'paused')
  const completeProjects = projectList.filter(p => p.status === 'complete')

  const showAddForm = add === '1'

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/clients"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#8B8F9E' }}>
            Clients
          </span>
        </div>

        {/* Client avatar + name */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E' }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight" style={{ color: '#E8E9ED' }}>
              {client.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#8B8F9E' }}>
              {projectList.length} {projectList.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {/* ── Contact info ── */}
        {(client.contact_name || client.contact_email || client.contact_phone) && (
          <div
            className="space-y-3 p-4 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {client.contact_name && (
              <InfoRow
                label="Contact"
                value={client.contact_name}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                }
              />
            )}
            {client.contact_email && (
              <InfoRow
                label="Email"
                value={client.contact_email}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" />
                  </svg>
                }
              />
            )}
            {client.contact_phone && (
              <InfoRow
                label="Phone"
                value={client.contact_phone}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                }
              />
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {client.notes && (
          <div
            className="px-4 py-3 rounded-2xl"
            style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-1.5" style={{ color: '#8B8F9E' }}>Notes</p>
            <p className="text-sm leading-relaxed" style={{ color: '#E8E9ED' }}>{client.notes}</p>
          </div>
        )}

        {/* ── Projects section ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader title="Projects" />
            <Link
              href={`/clients/${id}?add=1`}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#C8A44E' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Project
            </Link>
          </div>

          {/* Quick-add form */}
          {showAddForm && (
            <div
              className="mb-4 p-4 rounded-2xl"
              style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(200,164,78,0.2)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C8A44E' }}>
                New Project
              </p>
              <AddProjectForm clientId={id} />
            </div>
          )}

          {/* Project groups */}
          {projectList.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <p className="text-sm mb-3" style={{ color: '#8B8F9E' }}>No projects yet.</p>
              <Link
                href={`/clients/${id}?add=1`}
                className="text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#C8A44E' }}
              >
                + Add First Project
              </Link>
            </div>
          )}

          {activeProjects.length > 0 && (
            <div className="space-y-2 mb-4">
              {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          )}

          {pausedProjects.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: '#8B8F9E' }}>Paused</p>
              <div className="space-y-2 mb-4">
                {pausedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </>
          )}

          {completeProjects.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: '#8B8F9E' }}>Complete</p>
              <div className="space-y-2">
                {completeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
