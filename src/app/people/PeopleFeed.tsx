'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { GroupType, UserRole } from '@/lib/types'

// ── Type configs ───────────────────────────────────────────────────────────────

const GROUP_TYPE: Record<GroupType, { label: string; bg: string; color: string }> = {
  business:  { label: 'Business',  bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  household: { label: 'Household', bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
  personal:  { label: 'Personal',  bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
  misc:      { label: 'Misc',      bg: 'rgba(139,143,158,0.15)', color: '#8B8F9E' },
}

const ROLE_STYLE: Record<UserRole, { label: string; bg: string; color: string }> = {
  owner:         { label: 'Owner',       bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  admin:         { label: 'Admin',       bg: 'rgba(200,164,78,0.15)',  color: '#C8A44E' },
  partner:       { label: 'Partner',     bg: 'rgba(167,139,250,0.15)', color: '#A78BFA' },
  manager:       { label: 'Manager',     bg: 'rgba(251,146,60,0.15)',  color: '#FB923C' },
  worker:        { label: 'Worker',      bg: 'rgba(96,165,250,0.15)',  color: '#60A5FA' },
  team_member:   { label: 'Team Member', bg: 'rgba(56,189,248,0.15)',  color: '#38BDF8' },
  family_member: { label: 'Family',      bg: 'rgba(74,222,128,0.15)',  color: '#4ADE80' },
  viewer:        { label: 'Viewer',      bg: 'rgba(139,143,158,0.15)', color: '#8B8F9E' },
}

// ── Data shapes ────────────────────────────────────────────────────────────────

export interface GroupRow {
  id:            string
  name:          string
  description:   string | null
  type:          GroupType
  contact_email: string | null
  contact_phone: string | null
  memberCount:   number
}

export interface PersonRow {
  id:           string
  display_name: string | null
  email:        string
  role:         UserRole
  groups:       string[]   // group names they belong to
}

// ── Group card ─────────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: GroupRow }) {
  const ts = GROUP_TYPE[group.type] ?? GROUP_TYPE.misc
  const initial = group.name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/people/groups/${group.id}`}
      className="card-hover flex items-center gap-4 px-5 py-4 rounded-2xl active:opacity-70"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ backgroundColor: ts.bg, color: ts.color }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>{group.name}</p>
        {group.description && (
          <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>{group.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: ts.bg, color: ts.color }}
          >
            {ts.label}
          </span>
          {group.contact_email && (
            <span className="text-[10px] truncate" style={{ color: '#8B8F9E' }}>{group.contact_email}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#8B8F9E' }}
        >
          {group.memberCount}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  )
}

// ── Person card ────────────────────────────────────────────────────────────────

function PersonCard({ person }: { person: PersonRow }) {
  const role      = person.role ?? 'family_member'
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.family_member
  const name      = person.display_name ?? person.email.split('@')[0]
  const initial   = name.charAt(0).toUpperCase()

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 rounded-2xl"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#E8E9ED' }}>{name}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: '#8B8F9E' }}>{person.email}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}
          >
            {roleStyle.label}
          </span>
          {person.groups.map(g => (
            <span
              key={g}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: '#8B8F9E' }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

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

// ── Feed ───────────────────────────────────────────────────────────────────────

export function PeopleFeed({ groups, people }: { groups: GroupRow[]; people: PersonRow[] }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const filteredGroups  = q ? groups.filter(g => g.name.toLowerCase().includes(q)) : groups
  const filteredPeople  = q ? people.filter(p => {
    const name = (p.display_name ?? p.email).toLowerCase()
    return name.includes(q) || p.email.toLowerCase().includes(q)
  }) : people

  return (
    <div>
      {/* Search bar */}
      <div className="px-5 mb-6">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search groups and people…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#8B8F9E]"
            style={{ color: '#E8E9ED' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ color: '#8B8F9E' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="px-5 space-y-8 pb-4">
        {/* Groups section */}
        <section>
          <SectionHeader title={`Groups (${filteredGroups.length})`} />
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>
              {q ? 'No groups match your search.' : 'No groups yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map(g => <GroupCard key={g.id} group={g} />)}
            </div>
          )}
        </section>

        {/* People section */}
        <section>
          <SectionHeader title={`People (${filteredPeople.length})`} />
          {filteredPeople.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>
              {q ? 'No people match your search.' : 'No people yet.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredPeople.map(p => <PersonCard key={p.id} person={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
