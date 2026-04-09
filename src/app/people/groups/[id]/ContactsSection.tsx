'use client'

import { useTransition, useState } from 'react'
import { createContact, updateContact, deleteContact } from './actions'
import type { Contact } from '@/lib/types'

// ── Contact Form (shared for add/edit) ───────────────────────────────────────

function ContactForm({
  groupId,
  contact,
  onDone,
}: {
  groupId: string
  contact?: Contact
  onDone: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const action = contact ? updateContact : createContact
      const result = await action(formData)
      if (result.error) setError(result.error)
      else onDone()
    })
  }

  const inputStyle = {
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8E9ED',
  }

  return (
    <form action={handleSubmit} className="space-y-3 p-4 rounded-2xl" style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.08)' }}>
      <input type="hidden" name="group_id" value={groupId} />
      {contact && <input type="hidden" name="id" value={contact.id} />}

      {error && (
        <p className="text-xs" style={{ color: '#F87171' }}>{error}</p>
      )}

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B8F9E' }}>
          Name <span style={{ color: '#F87171' }}>*</span>
        </label>
        <input
          type="text" name="name" required placeholder="Contact name"
          defaultValue={contact?.name ?? ''}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B8F9E' }}>Email</label>
          <input
            type="email" name="email" placeholder="email@example.com"
            defaultValue={contact?.email ?? ''}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B8F9E' }}>Phone</label>
          <input
            type="text" name="phone" placeholder="555-1234"
            defaultValue={contact?.phone ?? ''}
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B8F9E' }}>Company</label>
        <input
          type="text" name="company" placeholder="Company name"
          defaultValue={contact?.company ?? ''}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#8B8F9E' }}>Notes</label>
        <textarea
          name="notes" rows={2} placeholder="Any notes about this contact…"
          defaultValue={contact?.notes ?? ''}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
          style={inputStyle}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: '#C8A44E', color: '#0F1117' }}
        >
          {pending ? 'Saving…' : contact ? 'Save' : 'Add Contact'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: '#8B8F9E' }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  groupId,
  canManage,
}: {
  contact: Contact
  groupId: string
  canManage: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()

  if (editing) {
    return <ContactForm groupId={groupId} contact={contact} onDone={() => setEditing(false)} />
  }

  function handleDelete() {
    if (!confirm(`Delete contact "${contact.name}"?`)) return
    const fd = new FormData()
    fd.set('id', contact.id)
    fd.set('group_id', groupId)
    startTransition(async () => {
      await deleteContact(fd)
    })
  }

  const initial = contact.name.charAt(0).toUpperCase()

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.05)', opacity: pending ? 0.5 : 1 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ backgroundColor: 'rgba(139,143,158,0.15)', color: '#8B8F9E' }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#E8E9ED' }}>{contact.name}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {contact.company && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>
              {contact.company}
            </span>
          )}
          {contact.email && (
            <span className="text-[10px] truncate" style={{ color: '#8B8F9E' }}>{contact.email}</span>
          )}
          {contact.phone && (
            <span className="text-[10px]" style={{ color: '#8B8F9E' }}>{contact.phone}</span>
          )}
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            title="Edit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B8F9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgba(248,113,113,0.08)' }}
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Section ─────────────────────────────────────────────────────────────

export function ContactsSection({
  groupId,
  contacts,
  canManage,
}: {
  groupId: string
  contacts: Contact[]
  canManage: boolean
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8B8F9E' }}>
          Contacts ({contacts.length})
        </span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
        {canManage && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(200,164,78,0.15)', color: '#C8A44E' }}
          >
            + Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-3">
          <ContactForm groupId={groupId} onDone={() => setAdding(false)} />
        </div>
      )}

      {contacts.length === 0 && !adding ? (
        <p className="text-sm text-center py-4" style={{ color: '#8B8F9E' }}>
          No contacts yet — external people like clients and vendors go here.
        </p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} groupId={groupId} canManage={canManage} />
          ))}
        </div>
      )}
    </section>
  )
}
