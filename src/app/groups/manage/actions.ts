'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Create Group ───────────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) redirect('/groups/manage?error=Group+name+is+required')

  const { error } = await supabase
    .from('groups')
    .insert({ name, description, created_by: user.id })

  if (error) redirect(`/groups/manage?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/groups/manage')
  redirect('/groups/manage')
}

// ── Update Group ───────────────────────────────────────────────────────────────

export async function updateGroup(groupId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!name) return { error: 'Group name is required' }

  const { error } = await supabase
    .from('groups')
    .update({ name, description })
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/groups/manage')
  return { error: null }
}

// ── Add Group Member ───────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, userId: string, roleInGroup: string = 'worker') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role_in_group: roleInGroup })

  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/groups/manage')
  revalidatePath('/users')
  return { error: null }
}

// ── Remove Group Member ────────────────────────────────────────────────────────

export async function removeGroupMember(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/groups/manage')
  revalidatePath('/users')
  return { error: null }
}
