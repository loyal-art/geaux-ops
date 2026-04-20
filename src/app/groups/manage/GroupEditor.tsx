'use client'

import { useTransition, useState } from 'react'
import { updateGroup, addGroupMember, removeGroupMember } from './actions'
import { updateWorkspaceRole } from '@/app/users/actions'

interface User {
  id:           string
  display_name: string | null
  email:        string
  role:         string
}

interface Member {
  user_id:       string
  role_in_group: string | null
  users:         User | null
}

interface Props {
  groupId:     string
  groupName:   string
  description: string | null
  members:     Member[]
  allUsers:    User[]
}

const ROLE_OPTIONS = ['owner', 'admin', 'partner', 'manager', 'worker', 'viewer'] as const
const DEFAULT_ROLE = 'worker'

export function GroupEditor({ groupId, groupName, description, members, allUsers }: Props) {
  const [pending, startTransition]     = useTransition()
  const [editing, setEditing]          = useState(false)
  const [name, setName]                = useState(groupName)
  const [desc, setDesc]                = useState(description ?? '')
  const [nameError, setNameError]      = useState<string | null>(null)
  const [memberIds, setMemberIds]      = useState<Set<string>>(new Set(members.map(m => m.user_id)))
  const [memberRoles, setMemberRoles]  = useState<Map<string, string>>(
    () => new Map(members.map(m => [m.user_id, m.role_in_group ?? DEFAULT_ROLE])),
  )
  const [selectedAdd, setSelectedAdd]  = useState('')
  const [addRole, setAddRole]          = useState<string>(DEFAULT_ROLE)
  const [roleError, setRoleError]      = useState<string | null>(null)

  const nonMembers = allUsers.filter(u => !memberIds.has(u.id))

  function handleSave() {
    if (!name.trim()) { setNameError('Name is required'); return }
    setNameError(null)
    const fd = new FormData()
    fd.append('name', name.trim())
    fd.append('description', desc.trim())
    startTransition(async () => {
      const res = await updateGroup(groupId, fd)
      if (res?.error) {
        setNameError(res.error)
      } else {
        setEditing(false)
      }
    })
  }

  function handleAddMember() {
    if (!selectedAdd) return
    const userId = selectedAdd
    const role   = addRole
    setSelectedAdd('')
    setAddRole(DEFAULT_ROLE)
    setMemberIds(prev => new Set([...prev, userId]))
    setMemberRoles(prev => new Map(prev).set(userId, role))
    startTransition(async () => {
      await addGroupMember(groupId, userId, role)
    })
  }

  function handleRemoveMember(userId: string) {
    setMemberIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    setMemberRoles(prev => { const m = new Map(prev); m.delete(userId); return m })
    startTransition(async () => {
      await removeGroupMember(groupId, userId)
    })
  }

  function handleRoleChange(userId: string, newRole: string) {
    const previous = memberRoles.get(userId) ?? DEFAULT_ROLE
    if (previous === newRole) return
    setRoleError(null)
    setMemberRoles(prev => new Map(prev).set(userId, newRole))
    startTransition(async () => {
      const res = await updateWorkspaceRole(groupId, userId, newRole)
      if (res?.error) {
        setRoleError(res.error)
        // Revert optimistic change
        setMemberRoles(prev => new Map(prev).set(userId, previous))
      }
    })
  }

  const currentMembers = allUsers.filter(u => memberIds.has(u.id))

  return (
    <div className="space-y-4">
      {/* Name / description edit */}
      {editing ? (
        <div className="space-y-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
          />
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E9ED' }}
          />
          {nameError && <p className="text-[11px]" style={{ color: '#F87171' }}>{nameError}</p>}
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={handleSave}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setName(groupName); setDesc(description ?? ''); setNameError(null) }}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#8B8F9E', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#8B8F9E', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Edit
        </button>
      )}

      {/* Members list */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B8F9E' }}>
          Members ({memberIds.size})
        </p>
        {roleError && (
          <p className="text-[11px] mb-2" style={{ color: '#F87171' }}>{roleError}</p>
        )}
        {currentMembers.length === 0 ? (
          <p className="text-xs" style={{ color: '#8B8F9E' }}>No members yet.</p>
        ) : (
          <div className="space-y-1.5">
            {currentMembers.map(u => {
              const display = u.display_name ?? u.email.split('@')[0]
              const initial = display.charAt(0).toUpperCase()
              const role    = memberRoles.get(u.id) ?? DEFAULT_ROLE
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: 'rgba(200,164,78,0.12)', color: '#C8A44E' }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#E8E9ED' }}>{display}</p>
                    <p className="text-[10px] truncate" style={{ color: '#8B8F9E' }}>{u.email}</p>
                  </div>
                  <select
                    disabled={pending}
                    value={role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    aria-label={`Role for ${display}`}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg outline-none disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(200,164,78,0.1)', color: '#C8A44E', border: '1px solid rgba(200,164,78,0.18)' }}
                  >
                    {ROLE_OPTIONS.map(r => (
                      <option key={r} value={r} style={{ backgroundColor: '#1A1D27', color: '#E8E9ED' }}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={pending}
                    onClick={() => handleRemoveMember(u.id)}
                    className="text-[10px] font-semibold px-2 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.15)' }}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add member */}
      {nonMembers.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedAdd}
            onChange={e => setSelectedAdd(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: selectedAdd ? '#E8E9ED' : '#8B8F9E' }}
          >
            <option value="" disabled>Add member…</option>
            {nonMembers.map(u => (
              <option key={u.id} value={u.id} style={{ backgroundColor: '#1A1D27', color: '#E8E9ED' }}>
                {u.display_name ?? u.email.split('@')[0]}
              </option>
            ))}
          </select>
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value)}
            aria-label="Initial role"
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{ backgroundColor: 'rgba(200,164,78,0.1)', color: '#C8A44E', border: '1px solid rgba(200,164,78,0.18)' }}
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r} value={r} style={{ backgroundColor: '#1A1D27', color: '#E8E9ED' }}>
                {r}
              </option>
            ))}
          </select>
          <button
            disabled={pending || !selectedAdd}
            onClick={handleAddMember}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E', border: '1px solid rgba(200,164,78,0.2)' }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}
