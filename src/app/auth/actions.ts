'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signIn(_: unknown, formData: FormData) {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signUp(_: unknown, formData: FormData) {
  const displayName = formData.get('display_name') as string
  const email       = (formData.get('email') as string)?.trim().toLowerCase()
  const password    = formData.get('password') as string

  // ── Invite gate ─────────────────────────────────────────────────────────────
  // Use the service-role client so we can read the invites table without being
  // authenticated (RLS only allows owners to see invites normally).
  const service = createServiceClient()

  // Allow the very first signup (the owner) through without an invite.
  const { count: ownerCount } = await service
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'owner')

  let inviteId:   string | null = null
  let inviteRole: string | null = null

  if ((ownerCount ?? 0) > 0) {
    // At least one owner exists — require a valid pending invite
    const { data: invite } = await service
      .from('invites')
      .select('id, role')
      .eq('email', email)
      .is('accepted_at', null)
      .maybeSingle()

    if (!invite) {
      return { error: 'You need an invitation to join. Contact the admin.' }
    }

    inviteId   = invite.id
    inviteRole = invite.role
  }

  // ── Sign up ─────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayName } },
  })

  if (error) return { error: error.message }

  // ── Post-signup: apply invite role and mark accepted ─────────────────────────
  if (inviteId && inviteRole && data.user) {
    await Promise.all([
      service
        .from('users')
        .update({ role: inviteRole })
        .eq('id', data.user.id),
      service
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', inviteId),
    ])
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signInWithGoogle() {
  const supabase    = await createClient()
  const headersList = await headers()
  const origin      = headersList.get('origin') ?? headersList.get('x-forwarded-host') ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? 'Failed to initiate Google sign-in')}`)
  }

  redirect(data.url)
}
