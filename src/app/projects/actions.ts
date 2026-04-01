'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Create Project ────────────────────────────────────────────────────────────

export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const clientId    = formData.get('client_id') as string
  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const status      = (formData.get('status') as string) || 'active'

  if (!name || !clientId) {
    redirect(`/projects/new?client_id=${clientId}&error=Name+is+required`)
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({ client_id: clientId, name, description, status, created_by: user.id })
    .select()
    .single()

  if (error || !project) {
    redirect(`/projects/new?client_id=${clientId}&error=${encodeURIComponent(error?.message ?? 'Failed to create project')}`)
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  redirect(`/projects/${project.id}`)
}

// ── Update Project Status ─────────────────────────────────────────────────────

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: project, error } = await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .select('client_id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectId}`)
  if (project?.client_id) revalidatePath(`/clients/${project.client_id}`)
  revalidatePath('/clients')
  return { error: null }
}

// ── Delete Project ────────────────────────────────────────────────────────────

export async function deleteProject(projectId: string, clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
  return { error: null }
}
