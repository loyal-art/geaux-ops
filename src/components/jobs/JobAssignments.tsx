'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AssignmentFields, type AssignmentValue } from './AssignmentFields'
import { updateJobAssignments } from '@/app/jobs/actions'
import type { AssignableWorkspace } from '@/lib/assignments'

// ── Types ────────────────────────────────────────────────────────────────────

type UserLite = { id: string; display_name: string | null; email: string | null }
type TeamLite = { id: string; name: string; member_count: number }
type GroupLite = { id: string; name: string }

type Props = {
  jobId:           string
  currentUserId:   string
  canEdit:         boolean
  workspaces:      AssignableWorkspace[]
  group:           GroupLite | null
  owner:           UserLite | null
  assignee:        UserLite | null
  team:            TeamLite | null
  groupId:         string | null
  ownerUserId:     string | null
  assignedTo:      string | null
  assignedTeamId:  string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined, fallback: string | null | undefined): string {
  const n = (name ?? fallback ?? '?').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return n[0].toUpperCase()
}

function Avatar({ name, email }: { name: string | null; email: string | null }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
      style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E' }}
    >
      {initials(name, email)}
    </div>
  )
}

function displayName(u: UserLite): string {
  return u.display_name?.trim() || u.email || 'Unknown'
}

// ── Component ────────────────────────────────────────────────────────────────

export function JobAssignments(props: Props) {
  const {
    jobId, currentUserId, canEdit, workspaces,
    group, owner, assignee, team,
    groupId, ownerUserId, assignedTo, assignedTeamId,
  } = props

  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState<AssignmentValue>({
    groupId:        groupId        ?? '',
    ownerUserId:    ownerUserId    ?? '',
    assignedTo:     assignedTo     ?? '',
    assignedTeamId: assignedTeamId ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updateJobAssignments(jobId, {
        group_id:         value.groupId        || null,
        owner_user_id:    value.ownerUserId    || null,
        assigned_to:      value.assignedTo     || null,
        assigned_team_id: value.assignedTeamId || null,
      })
      if (res.error) {
        setError(res.error)
      } else {
        setEditing(false)
      }
    })
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────

  if (editing) {
    return (
      <div
        className="rounded-2xl px-4 py-4 mb-4"
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#C8A44E' }}>
            Edit Assignments
          </p>
          <button
            onClick={() => { setEditing(false); setError(null) }}
            disabled={pending}
            className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: '#8B8F9E' }}
          >
            Cancel
          </button>
        </div>

        <AssignmentFields
          workspaces={workspaces}
          currentUserId={currentUserId}
          initial={{
            groupId:        groupId ?? '',
            ownerUserId:    ownerUserId ?? '',
            assignedTo:     assignedTo ?? '',
            assignedTeamId: assignedTeamId ?? '',
          }}
          onChange={setValue}
          workspaceRequired={false}
        />

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl mt-3" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={pending}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          {pending ? 'Saving…' : 'Save Assignments'}
        </button>
      </div>
    )
  }

  // ── Display mode ───────────────────────────────────────────────────────────

  const hasAny = group || owner || assignee || team

  return (
    <div
      className="rounded-2xl px-4 py-3 mb-4"
      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
          Assignments
        </p>
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: '#C8A44E', backgroundColor: 'rgba(200,164,78,0.1)' }}
          >
            Edit Assignments
          </button>
        )}
      </div>

      {!hasAny && (
        <p className="text-sm italic" style={{ color: '#8B8F9E' }}>No assignments yet.</p>
      )}

      <div className="space-y-2.5">
        {/* Workspace */}
        {group && (
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(200,164,78,0.12)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8A44E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>Workspace</p>
              <Link
                href={`/people/groups/${group.id}`}
                className="text-sm font-medium truncate transition-opacity hover:opacity-70"
                style={{ color: '#E8E9ED' }}
              >
                {group.name}
              </Link>
            </div>
          </div>
        )}

        {/* Owner */}
        {owner && (
          <div className="flex items-center gap-3">
            <Avatar name={owner.display_name} email={owner.email} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>Owner</p>
              <p className="text-sm truncate" style={{ color: '#E8E9ED' }}>{displayName(owner)}</p>
            </div>
          </div>
        )}

        {/* Assignee (only if different from owner) */}
        {assignee && assignee.id !== owner?.id && (
          <div className="flex items-center gap-3">
            <Avatar name={assignee.display_name} email={assignee.email} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>Assigned to</p>
              <p className="text-sm truncate" style={{ color: '#E8E9ED' }}>{displayName(assignee)}</p>
            </div>
          </div>
        )}

        {/* Team */}
        {team && (
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(96,165,250,0.12)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#8B8F9E' }}>Team</p>
              <p className="text-sm truncate" style={{ color: '#E8E9ED' }}>
                {team.name}
                <span className="ml-1.5 text-xs" style={{ color: '#8B8F9E' }}>
                  · {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
