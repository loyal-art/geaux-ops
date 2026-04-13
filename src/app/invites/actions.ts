'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendInviteEmail } from '@/lib/email/sendInviteEmail'

const SIGNUP_URL = 'https://geaux-ops.vercel.app/signup'

// ── Create Invite ─────────────────────────────────────────────────────────────

export async function createInvite(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role  = (formData.get('role')  as string) || 'team_member'

  if (!email) redirect('/invites?error=Email+is+required')

  // Confirm the caller is actually an owner (belt-and-suspenders over RLS)
  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/invites?error=Only+the+owner+can+send+invites')

  // Block inviting someone who already has an account
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) redirect('/invites?error=That+email+already+has+an+account')

  const { error } = await supabase
    .from('invites')
    .insert({ email, role, invited_by: user.id })

  if (error) {
    const msg = error.code === '23505'
      ? 'A+pending+invite+already+exists+for+that+email'
      : encodeURIComponent(error.message)
    redirect(`/invites?error=${msg}`)
  }

  // ── Send invite email (best-effort — never blocks the invite) ─────────────
  const inviterName = profile?.display_name ?? 'Your workspace owner'
  try {
    const emailResult = await sendInviteEmail({ to: email, inviterName, role, signupUrl: SIGNUP_URL })
    if (emailResult.error) {
      console.error('[createInvite] Email send failed (invite still created):', emailResult.error)
    }
  } catch (err) {
    console.error('[createInvite] Unexpected email error (invite still created):', err)
  }

  revalidatePath('/invites')
  redirect('/invites')
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
