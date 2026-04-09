'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Create Contact ───────────────────────────────────────────────────────────

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const groupId = formData.get('group_id') as string
  const name    = (formData.get('name') as string)?.trim()
  const email   = (formData.get('email') as string)?.trim() || null
  const phone   = (formData.get('phone') as string)?.trim() || null
  const company = (formData.get('company') as string)?.trim() || null
  const notes   = (formData.get('notes') as string)?.trim() || null

  if (!groupId || !name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('contacts')
    .insert({ group_id: groupId, name, email, phone, company, notes, created_by: user.id })

  if (error) return { error: error.message }

  revalidatePath(`/people/groups/${groupId}`)
  return { error: null }
}

// ── Update Contact ───────────────────────────────────────────────────────────

export async function updateContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id      = formData.get('id') as string
  const groupId = formData.get('group_id') as string
  const name    = (formData.get('name') as string)?.trim()
  const email   = (formData.get('email') as string)?.trim() || null
  const phone   = (formData.get('phone') as string)?.trim() || null
  const company = (formData.get('company') as string)?.trim() || null
  const notes   = (formData.get('notes') as string)?.trim() || null

  if (!id || !name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('contacts')
    .update({ name, email, phone, company, notes })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/people/groups/${groupId}`)
  return { error: null }
}

// ── Delete Contact ───────────────────────────────────────────────────────────

export async function deleteContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const id      = formData.get('id') as string
  const groupId = formData.get('group_id') as string

  if (!id) return { error: 'Contact ID is required' }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/people/groups/${groupId}`)
  return { error: null }
}
