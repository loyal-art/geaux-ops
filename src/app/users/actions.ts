'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: 'Not authenticated' }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'owner') return { supabase, user: null, error: 'Only the owner can do this' }
  return { supabase, user, error: null }
}

// ── Create User (Supabase Admin API) ──────────────────────────────────────────

export async function createUser(formData: FormData) {
  const { error: authError } = await requireOwner()
  if (authError) redirect('/dashboard')

  const email       = (formData.get('email') as string)?.trim().toLowerCase()
  const displayName = (formData.get('display_name') as string)?.trim()
  const password    = formData.get('password') as string
  const role        = formData.get('role') as UserRole

  if (!email || !password || !displayName) {
    redirect('/users/new?error=' + encodeURIComponent('Email, display name, and password are required'))
  }

  const service = createServiceClient()

  // Check if email already exists
  const { data: existing } = await service
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    redirect('/users/new?error=' + encodeURIComponent('A user with that email already exists'))
  }

  // Create auth user via Admin API
  const { data: authData, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (createError) {
    redirect('/users/new?error=' + encodeURIComponent(createError.message))
  }

  // The DB trigger auto-creates the users row, so update role and display_name
  const { error: updateError } = await service
    .from('users')
    .update({ role, display_name: displayName })
    .eq('id', authData.user.id)

  if (updateError) {
    redirect('/users/new?error=' + encodeURIComponent(updateError.message))
  }

  revalidatePath('/users')
  redirect('/users')
}

// ── Update User Role ──────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: UserRole) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  // Prevent changing the owner's own role
  const { data: target } = await supabase!
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (target?.role === 'owner') return { error: 'Cannot change the owner role' }

  const { error } = await supabase!
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Update User Profile ───────────────────────────────────────────────────────

export async function updateUserProfile(userId: string, displayName: string, role: UserRole) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { data: target } = await supabase!
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  // Don't allow changing owner role via this action
  const updateRole = target?.role === 'owner' ? 'owner' : role

  const { error } = await supabase!
    .from('users')
    .update({ display_name: displayName.trim(), role: updateRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Add Group Member ──────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, userId: string) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId })

  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  revalidatePath('/groups/manage')
  return { error: null }
}

// ── Remove Group Member ───────────────────────────────────────────────────────

export async function removeGroupMember(groupId: string, userId: string) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  revalidatePath('/groups/manage')
  return { error: null }
}

// ── Update Workspace Role ─────────────────────────────────────────────────────

export async function updateWorkspaceRole(groupId: string, userId: string, roleInGroup: string) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('group_members')
    .update({ role_in_group: roleInGroup })
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Add User to Workspace ─────────────────────────────────────────────────────

export async function addUserToWorkspace(userId: string, groupId: string, roleInGroup: string) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role_in_group: roleInGroup })

  if (error && error.code === '23505') return { error: 'User is already in this workspace' }
  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Remove User from Workspace ────────────────────────────────────────────────

export async function removeUserFromWorkspace(userId: string, groupId: string) {
  const { supabase, error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await supabase!
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Add User to Team ──────────────────────────────────────────────────────────

export async function addUserToTeam(userId: string, teamId: string, teamRole: string = 'member') {
  const service = createServiceClient()
  const { error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await service
    .from('team_memberships')
    .insert({ team_id: teamId, user_id: userId, team_role: teamRole })

  if (error && error.code === '23505') return { error: 'User is already in this team' }
  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Remove User from Team ─────────────────────────────────────────────────────

export async function removeUserFromTeam(userId: string, teamId: string) {
  const service = createServiceClient()
  const { error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await service
    .from('team_memberships')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}

// ── Update Team Role ──────────────────────────────────────────────────────────

export async function updateTeamRole(userId: string, teamId: string, teamRole: string) {
  const service = createServiceClient()
  const { error: authError } = await requireOwner()
  if (authError) return { error: authError }

  const { error } = await service
    .from('team_memberships')
    .update({ team_role: teamRole })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${userId}`)
  return { error: null }
}
