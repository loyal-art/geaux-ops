'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Update display name ───────────────────────────────────────────────────────

export async function updateDisplayName(displayName: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = displayName.trim()
  if (!trimmed) return { error: 'Name cannot be empty' }

  const { error } = await supabase
    .from('users')
    .update({ display_name: trimmed })
    .eq('id', user.id)

  if (error) return { error: error.message }

  // Keep auth metadata in sync
  await supabase.auth.updateUser({ data: { full_name: trimmed } })

  revalidatePath('/profile')
  return { error: null }
}

// ── Change password ───────────────────────────────────────────────────────────

export async function changePassword(password: string, confirm: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!password)          return { error: 'Password cannot be empty' }
  if (password.length < 6) return { error: 'Password must be at least 6 characters' }
  if (password !== confirm) return { error: 'Passwords do not match' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { error: null }
}

// ── Update avatar color ───────────────────────────────────────────────────────

export async function updateAvatarColor(colorKey: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ avatar_url: colorKey })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { error: null }
}
