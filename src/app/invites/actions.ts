'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Create Invite ─────────────────────────────────────────────────────────────

export async function createInvite(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role  = (formData.get('role')  as string) || 'team_member'

  if (!email) return { error: 'Email is required' }

  // Confirm the caller is actually an owner (belt-and-suspenders over RLS)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') return { error: 'Only the owner can send invites' }

  // Block inviting someone who already has an account
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) return { error: 'That email already has an account' }

  const { error } = await supabase
    .from('invites')
    .insert({ email, role, invited_by: user.id })

  if (error) {
    // Unique index violation = already a pending invite
    if (error.code === '23505') return { error: 'A pending invite already exists for that email' }
    return { error: error.message }
  }

  revalidatePath('/invites')
  return { error: null }
}

// ── Revoke Invite ─────────────────────────────────────────────────────────────

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('invites')
    .delete()
    .eq('id', inviteId)

  if (error) return { error: error.message }

  revalidatePath('/invites')
  return { error: null }
}
