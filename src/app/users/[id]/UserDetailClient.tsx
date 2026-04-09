'use client'

import { useTransition, useState } from 'react'
import {
  updateUserProfile,
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateWorkspaceRole,
  addUserToTeam,
  removeUserFromTeam,
  updateTeamRole,
} from '../actions'
import type { UserRole } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Workspace {
  id: string
  name: string
}

interface WorkspaceMembership {
  group_id: string
  role_in_group: string | null
  groups: { name: string } | null
}

interface Team {
  id: string
  name: string
  group_id: string
  groups?: { name: string } | null
}

interface TeamMembership {
  team_id: string
  team_role: string
  teams: { id: string; name: string; group_id: string; groups?: { name: string } | null } | null
}

interface Props {
  userId: string
  displayName: string
  email: string
  role: UserRole
  isOwnerUser: boolean
  workspaceMemberships: WorkspaceMembership[]
  teamMemberships: TeamMembership[]
  allWorkspaces: Workspace[]
  allTeams: Team[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'owner',         label: 'Owner',       color: '#C8A44E' },
  { value: 'admin',         label: 'Admin',       color: '#C8A44E' },
  { value: 'partner',       label: 'Partner',     color: '#A78BFA' },
  { value: 'manager',       label: 'Manager',     color: '#FB923C' },
  { value: 'worker',        label: 'Worker',      color: '#60A5FA' },
  { value: 'team_member',   label: 'Team Member', color: '#38BDF8' },
  { value: 'family_member', label: 'Family',      color: '#4ADE80' },
  { value: 'viewer',        label: 'Viewer',      color: '#8B8F9E' },
]

const WORKSPACE_ROLES = ['owner', 'admin', 'partner', 'manager', 'worker', 'viewer']
const TEAM_ROLES = ['lead', 'member']

// ── Component ─────────────────────────────────────────────────────────────────

export function UserDetailClient({
  userId,
  displayName: initialName,
  email,
  role: initialRole,
  isOwnerUser,
  workspaceMemberships: initialWS,
  teamMemberships: initialTM,
  allWorkspaces,
  allTeams,
}: Props) {
  const [pending, startTransition] = useTransition()

  // Profile state
  const [name, setName] = useState(initialName)
  const [role, setRole] = useState<UserRole>(initialRole)
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Workspace state
  const [wsMemberships, setWsMemberships] = useState(initialWS)
  const [addWsId, setAddWsId] = useState('')
  const [addWsRole, setAddWsRole] = useState('worker')
  const [wsMsg, setWsMsg] = useState<string | null>(null)

  // Team state
  const [tmMemberships, setTmMemberships] = useState(initialTM)
  const [addTmId, setAddTmId] = useState('')
  const [addTmRole, setAddTmRole] = useState('member')
  const [tmMsg, setTmMsg] = useState<string | null>(null)

  // Workspaces user is NOT in
  const memberWsIds = new Set(wsMemberships.map(m => m.group_id))
  const availableWorkspaces = allWorkspaces.filter(w => !memberWsIds.has(w.id))

  // Teams user is NOT in
  const memberTmIds = new Set(tmMemberships.map(m => m.team_id))
  const availableTeams = allTeams.filter(t => !memberTmIds.has(t.id))

  // ── Profile save ──

  function handleSaveProfile() {
    setProfileMsg(null)
    startTransition(async () => {
      const res = await updateUserProfile(userId, name, role)
      if (res?.error) setProfileMsg({ type: 'err', text: res.error })
      else setProfileMsg({ type: 'ok', text: 'Saved' })
    })
  }

  // ── Workspace actions ──

  function handleAddWorkspace() {
    if (!addWsId) return
    setWsMsg(null)
    const wsId = addWsId
    const wsRole = addWsRole
    startTransition(async () => {
      const res = await addUserToWorkspace(userId, wsId, wsRole)
      if (res?.error) {
        setWsMsg(res.error)
      } else {
        const ws = allWorkspaces.find(w => w.id === wsId)
        setWsMemberships(prev => [...prev, {
          group_id: wsId,
          role_in_group: wsRole,
          groups: { name: ws?.name ?? 'Unknown' },
        }])
        setAddWsId('')
      }
    })
  }

  function handleRemoveWorkspace(groupId: string) {
    startTransition(async () => {
      const res = await removeUserFromWorkspace(userId, groupId)
      if (!res?.error) {
        setWsMemberships(prev => prev.filter(m => m.group_id !== groupId))
      }
    })
  }

  function handleWsRoleChange(groupId: string, newRole: string) {
    setWsMemberships(prev => prev.map(m =>
      m.group_id === groupId ? { ...m, role_in_group: newRole } : m
    ))
    startTransition(async () => {
      await updateWorkspaceRole(groupId, userId, newRole)
    })
  }

  // ── Team actions ──

  function handleAddTeam() {
    if (!addTmId) return
    setTmMsg(null)
    const tmId = addTmId
    const tmRole = addTmRole
    startTransition(async () => {
      const res = await addUserToTeam(userId, tmId, tmRole)
      if (res?.error) {
        setTmMsg(res.error)
      } else {
        const team = allTeams.find(t => t.id === tmId)
        setTmMemberships(prev => [...prev, {
          team_id: tmId,
          team_role: tmRole,
          teams: team ? { id: team.id, name: team.name, group_id: team.group_id, groups: team.groups } : null,
        }])
        setAddTmId('')
      }
    })
  }

  function handleRemoveTeam(teamId: string) {
    startTransition(async () => {
      const res = await removeUserFromTeam(userId, teamId)
      if (!res?.error) {
        setTmMemberships(prev => prev.filter(m => m.team_id !== teamId))
      }
    })
  }

  function handleTmRoleChange(teamId: string, newRole: string) {
    setTmMemberships(prev => prev.map(m =>
      m.team_id === teamId ? { ...m, team_role: newRole } : m
    ))
    startTransition(async () => {
      await updateTeamRole(userId, teamId, newRole)
    })
  }

  return (
    <div className="space-y-8">
      {/* ── Profile Section ── */}
      <section>
        <SectionHeader title="Profile" />
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Email
            </label>
            <p className="text-sm" style={{ color: '#E8E9ED' }}>{email}</p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#E8E9ED' }}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8B8F9E' }}>
              Role
            </label>
            {isOwnerUser ? (
              <p className="text-sm font-semibold" style={{ color: '#C8A44E' }}>Owner (cannot change)</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.filter(o => o.value !== 'owner').map(opt => {
                  const active = role === opt.value
                  return (
                    <button
                      key={opt.value}
                      disabled={pending}
                      onClick={() => setRole(opt.value)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50"
                      style={{
                        backgroundColor: active ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                        color: active ? opt.color : '#8B8F9E',
                        border: active ? `1px solid ${opt.color}44` : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={pending}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
            >
              Save Profile
            </button>
            {profileMsg && (
              <span className="text-xs" style={{ color: profileMsg.type === 'ok' ? '#4ADE80' : '#F87171' }}>
                {profileMsg.text}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Workspace Assignments ── */}
      <section>
        <SectionHeader title="Workspace Assignments" />
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {wsMemberships.length === 0 && (
            <p className="text-sm" style={{ color: '#8B8F9E' }}>Not assigned to any workspaces.</p>
          )}

          {wsMemberships.map(m => (
            <div key={m.group_id} className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: '#E8E9ED' }}>
                {m.groups?.name ?? 'Unknown'}
              </span>
              <select
                value={m.role_in_group ?? 'viewer'}
                onChange={e => handleWsRoleChange(m.group_id, e.target.value)}
                disabled={pending}
                className="text-xs px-2 py-1.5 rounded-lg outline-none disabled:opacity-50"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                {WORKSPACE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveWorkspace(m.group_id)}
                disabled={pending}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add to workspace */}
          {availableWorkspaces.length > 0 && (
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <select
                value={addWsId}
                onChange={e => setAddWsId(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                <option value="">Select workspace...</option>
                {availableWorkspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <select
                value={addWsRole}
                onChange={e => setAddWsRole(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                {WORKSPACE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={handleAddWorkspace}
                disabled={pending || !addWsId}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E', border: '1px solid rgba(200,164,78,0.25)' }}
              >
                + Add
              </button>
            </div>
          )}

          {wsMsg && (
            <p className="text-[11px]" style={{ color: '#F87171' }}>{wsMsg}</p>
          )}
        </div>
      </section>

      {/* ── Team Assignments ── */}
      <section>
        <SectionHeader title="Team Assignments" />
        <div
          className="p-5 rounded-2xl space-y-4"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {tmMemberships.length === 0 && (
            <p className="text-sm" style={{ color: '#8B8F9E' }}>Not assigned to any teams.</p>
          )}

          {tmMemberships.map(m => (
            <div key={m.team_id} className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block" style={{ color: '#E8E9ED' }}>
                  {m.teams?.name ?? 'Unknown'}
                </span>
                {m.teams?.groups?.name && (
                  <span className="text-[10px]" style={{ color: '#8B8F9E' }}>
                    in {m.teams.groups.name}
                  </span>
                )}
              </div>
              <select
                value={m.team_role}
                onChange={e => handleTmRoleChange(m.team_id, e.target.value)}
                disabled={pending}
                className="text-xs px-2 py-1.5 rounded-lg outline-none disabled:opacity-50"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                {TEAM_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveTeam(m.team_id)}
                disabled={pending}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }}
              >
                Remove
              </button>
            </div>
          ))}

          {/* Add to team */}
          {availableTeams.length > 0 && (
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <select
                value={addTmId}
                onChange={e => setAddTmId(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg outline-none flex-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                <option value="">Select team...</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.groups?.name ? ` (${t.groups.name})` : ''}
                  </option>
                ))}
              </select>
              <select
                value={addTmRole}
                onChange={e => setAddTmRole(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
              >
                {TEAM_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                onClick={handleAddTeam}
                disabled={pending || !addTmId}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E', border: '1px solid rgba(200,164,78,0.25)' }}
              >
                + Add
              </button>
            </div>
          )}

          {tmMsg && (
            <p className="text-[11px]" style={{ color: '#F87171' }}>{tmMsg}</p>
          )}
        </div>
      </section>
    </div>
  )
}

// ── Shared section header ─────────────────────────────────────────────────────

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
