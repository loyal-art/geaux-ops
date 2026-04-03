'use client'

import { useTransition, useState } from 'react'
import { updateUserRole, addGroupMember, removeGroupMember } from './actions'
import type { UserRole } from '@/lib/types'

const ROLE_OPTIONS: { value: Exclude<UserRole, 'owner'>; label: string; color: string }[] = [
  { value: 'partner',       label: 'Partner',     color: '#A78BFA' },
  { value: 'team_member',   label: 'Team Member', color: '#60A5FA' },
  { value: 'family_member', label: 'Family',      color: '#4ADE80' },
]

interface Group {
  id:   string
  name: string
}

interface Props {
  userId:       string
  currentRole:  UserRole
  isOwner:      boolean
  allGroups:    Group[]
  memberGroups: string[]   // group IDs this user belongs to
}

export function UserControls({ userId, currentRole, isOwner, allGroups, memberGroups }: Props) {
  const [pending, startTransition] = useTransition()
  const [role, setRole]             = useState<UserRole>(currentRole)
  const [groups, setGroups]         = useState<Set<string>>(new Set(memberGroups))
  const [roleError, setRoleError]   = useState<string | null>(null)

  function handleRoleChange(newRole: UserRole) {
    if (newRole === role) return
    const prev = role
    setRole(newRole)
    setRoleError(null)
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole)
      if (res?.error) {
        setRole(prev)
        setRoleError(res.error)
      }
    })
  }

  function handleGroupToggle(groupId: string) {
    const isMember = groups.has(groupId)
    const next = new Set(groups)
    if (isMember) {
      next.delete(groupId)
    } else {
      next.add(groupId)
    }
    setGroups(next)
    startTransition(async () => {
      if (isMember) {
        await removeGroupMember(groupId, userId)
      } else {
        await addGroupMember(groupId, userId)
      }
    })
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Role change */}
      {!isOwner && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B8F9E' }}>
            Role
          </p>
          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map(opt => {
              const active = role === opt.value
              return (
                <button
                  key={opt.value}
                  disabled={pending}
                  onClick={() => handleRoleChange(opt.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: active ? `${opt.color}22` : 'rgba(255,255,255,0.05)',
                    color:           active ? opt.color : '#8B8F9E',
                    border:          active ? `1px solid ${opt.color}44` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {roleError && (
            <p className="text-[11px] mt-1" style={{ color: '#F87171' }}>{roleError}</p>
          )}
        </div>
      )}

      {/* Group assignment */}
      {allGroups.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B8F9E' }}>
            Groups
          </p>
          <div className="flex flex-wrap gap-2">
            {allGroups.map(g => {
              const member = groups.has(g.id)
              return (
                <button
                  key={g.id}
                  disabled={pending}
                  onClick={() => handleGroupToggle(g.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                  style={{
                    backgroundColor: member ? 'rgba(200,164,78,0.12)' : 'rgba(255,255,255,0.05)',
                    color:           member ? '#C8A44E' : '#8B8F9E',
                    border:          member ? '1px solid rgba(200,164,78,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {member && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {g.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
