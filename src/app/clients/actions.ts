'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Create Client ─────────────────────────────────────────────────────────────

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name         = (formData.get('name') as string)?.trim()
  const contactName  = (formData.get('contact_name') as string)?.trim() || null
  const contactEmail = (formData.get('contact_email') as string)?.trim() || null
  const contactPhone = (formData.get('contact_phone') as string)?.trim() || null
  const notes        = (formData.get('notes') as string)?.trim() || null

  if (!name) redirect('/clients/new?error=Name+is+required')

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ name, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone, notes, created_by: user.id })
    .select()
    .single()

  if (error || !client) {
    redirect(`/clients/new?error=${encodeURIComponent(error?.message ?? 'Failed to create client')}`)
  }

  revalidatePath('/clients')
  redirect(`/clients/${client.id}`)
}

// ── Update Client ─────────────────────────────────────────────────────────────

export async function updateClientRecord(clientId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name         = (formData.get('name') as string)?.trim()
  const contactName  = (formData.get('contact_name') as string)?.trim() || null
  const contactEmail = (formData.get('contact_email') as string)?.trim() || null
  const contactPhone = (formData.get('contact_phone') as string)?.trim() || null
  const notes        = (formData.get('notes') as string)?.trim() || null

  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('clients')
    .update({ name, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone, notes })
    .eq('id', clientId)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { error: null }
}

// ── Delete Client ─────────────────────────────────────────────────────────────

export async function deleteClientRecord(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}
