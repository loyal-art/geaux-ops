'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

// ── Update User Role ───────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Belt-and-suspenders owner check on top of RLS
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'owner') return { error: 'Only the owner can change roles' }

  // Prevent changing the owner's own role
  const { data: target } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (target?.role === 'owner') return { error: 'Cannot change the owner role' }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  return { error: null }
}

// ── Add Group Member ───────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })

  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/users')
  revalidatePath('/groups/manage')
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

  revalidatePath('/users')
  revalidatePath('/groups/manage')
  return { error: null }
}
