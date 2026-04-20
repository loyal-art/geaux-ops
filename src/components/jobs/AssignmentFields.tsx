'use client'

import { useMemo, useState, useEffect } from 'react'
import type { AssignableWorkspace } from '@/lib/assignments'

// ── Shared style helpers ─────────────────────────────────────────────────────

const SELECT_CLASS = 'w-full rounded-xl px-4 py-3 text-sm outline-none'
const SELECT_STYLE = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  border:          '1px solid rgba(255,255,255,0.08)',
  color:           '#E8E9ED',
} as const

const LABEL_CLASS = 'block text-xs font-medium mb-1.5 uppercase tracking-wider'
const LABEL_STYLE = { color: '#8B8F9E' } as const

// ── Props ────────────────────────────────────────────────────────────────────

export type AssignmentValue = {
  groupId:        string
  ownerUserId:    string
  assignedTo:     string
  assignedTeamId: string
}

type Props = {
  workspaces:      AssignableWorkspace[]
  currentUserId:   string
  initial?:        Partial<AssignmentValue>
  // Hidden input mode (for server action forms)
  asHiddenInputs?: boolean
  // Controlled mode (for client-side submission like the AI flow)
  onChange?:       (value: AssignmentValue) => void
  // Whether workspace is required (defaults to true for creation, false for edits)
  workspaceRequired?: boolean
}

// ── Component ────────────────────────────────────────────────────────────────

export function AssignmentFields({
  workspaces,
  currentUserId,
  initial,
  asHiddenInputs = false,
  onChange,
  workspaceRequired = true,
}: Props) {
  const [groupId,        setGroupId]        = useState(initial?.groupId ?? '')
  const [ownerUserId,    setOwnerUserId]    = useState(initial?.ownerUserId ?? currentUserId)
  const [assignedTo,     setAssignedTo]     = useState(initial?.assignedTo ?? '')
  const [assignedTeamId, setAssignedTeamId] = useState(initial?.assignedTeamId ?? '')

  const selectedWorkspace = useMemo(
    () => workspaces.find(w => w.id === groupId) ?? null,
    [workspaces, groupId],
  )

  // When the workspace changes, reset dependent selections to valid values
  useEffect(() => {
    if (!selectedWorkspace) {
      if (ownerUserId !== currentUserId) setOwnerUserId(currentUserId)
      if (assignedTo !== '')             setAssignedTo('')
      if (assignedTeamId !== '')         setAssignedTeamId('')
      return
    }
    const memberIds = new Set(selectedWorkspace.members.map(m => m.user_id))
    // Owner default: current user if member, else first member
    if (!memberIds.has(ownerUserId)) {
      setOwnerUserId(memberIds.has(currentUserId) ? currentUserId : (selectedWorkspace.members[0]?.user_id ?? ''))
    }
    if (assignedTo && !memberIds.has(assignedTo)) setAssignedTo('')
    const teamIds = new Set(selectedWorkspace.teams.map(t => t.id))
    if (assignedTeamId && !teamIds.has(assignedTeamId)) setAssignedTeamId('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId])

  // Notify parent of changes
  useEffect(() => {
    onChange?.({ groupId, ownerUserId, assignedTo, assignedTeamId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, ownerUserId, assignedTo, assignedTeamId])

  if (workspaces.length === 0) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-sm"
        style={{ backgroundColor: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.2)', color: '#FB923C' }}
      >
        You need manager+ access to at least one workspace to assign this job. The job will be created without a workspace.
      </div>
    )
  }

  const memberName = (m: { display_name: string | null; email: string | null }) =>
    m.display_name?.trim() || m.email || 'Unknown'

  return (
    <div className="space-y-5">
      {/* Workspace */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>
          Workspace{workspaceRequired && <span style={{ color: '#F87171' }}> *</span>}
        </label>
        <select
          value={groupId}
          onChange={e => setGroupId(e.target.value)}
          required={workspaceRequired}
          className={SELECT_CLASS}
          style={SELECT_STYLE}
        >
          <option value="">— Select a workspace —</option>
          {workspaces.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Owner */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Owner</label>
        <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
          The person accountable for driving this job.
        </p>
        <select
          value={ownerUserId}
          onChange={e => setOwnerUserId(e.target.value)}
          disabled={!selectedWorkspace}
          className={SELECT_CLASS}
          style={{ ...SELECT_STYLE, opacity: selectedWorkspace ? 1 : 0.5 }}
        >
          <option value="">— No owner —</option>
          {selectedWorkspace?.members.map(m => (
            <option key={m.user_id} value={m.user_id}>
              {memberName(m)}{m.user_id === currentUserId ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Assigned to */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Assigned to</label>
        <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
          The individual doing the work. Leave blank if team-assigned.
        </p>
        <select
          value={assignedTo}
          onChange={e => setAssignedTo(e.target.value)}
          disabled={!selectedWorkspace}
          className={SELECT_CLASS}
          style={{ ...SELECT_STYLE, opacity: selectedWorkspace ? 1 : 0.5 }}
        >
          <option value="">— Unassigned —</option>
          {selectedWorkspace?.members.map(m => (
            <option key={m.user_id} value={m.user_id}>
              {memberName(m)}{m.user_id === currentUserId ? ' (you)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Team */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>Assigned team</label>
        <p className="text-[11px] mb-2 italic" style={{ color: '#8B8F9E' }}>
          A whole team to share responsibility.
        </p>
        <select
          value={assignedTeamId}
          onChange={e => setAssignedTeamId(e.target.value)}
          disabled={!selectedWorkspace || (selectedWorkspace.teams.length === 0)}
          className={SELECT_CLASS}
          style={{ ...SELECT_STYLE, opacity: selectedWorkspace && selectedWorkspace.teams.length > 0 ? 1 : 0.5 }}
        >
          <option value="">— No team —</option>
          {selectedWorkspace?.teams.map(t => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.member_count} {t.member_count === 1 ? 'member' : 'members'})
            </option>
          ))}
        </select>
        {selectedWorkspace && selectedWorkspace.teams.length === 0 && (
          <p className="text-[11px] mt-1.5" style={{ color: '#8B8F9E' }}>
            No teams exist in this workspace yet.
          </p>
        )}
      </div>

      {asHiddenInputs && (
        <>
          <input type="hidden" name="group_id"         value={groupId} />
          <input type="hidden" name="owner_user_id"    value={ownerUserId} />
          <input type="hidden" name="assigned_to"      value={assignedTo} />
          <input type="hidden" name="assigned_team_id" value={assignedTeamId} />
        </>
      )}
    </div>
  )
}
