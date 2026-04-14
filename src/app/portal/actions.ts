'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Submit client request ─────────────────────────────────────────────────────
// Creates a job from the portal "Submit Request" form with status=unassigned
// and submitted_via_portal=true so the team knows to triage it.

export async function submitPortalRequest(
  workspaceId: string,
  formData: FormData,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const description = (formData.get('description') as string)?.trim()
  const finish      = (formData.get('finish') as string)?.trim() || null
  const deadline    = (formData.get('deadline') as string)?.trim() || null

  if (!description) return { error: 'Please describe what you need.' }

  const { error } = await supabase.from('jobs').insert({
    title:                description,
    finish_definition:    finish,
    due_date:             deadline || null,
    status:               'unassigned',
    priority:             'normal',
    category:             'misc',
    group_id:             workspaceId,
    created_by:           user.id,
    submitted_via_portal: true,
  })

  if (error) return { error: error.message }

  revalidatePath(`/portal/${workspaceId}`)
  redirect(`/portal/${workspaceId}`)
}

// ── Add client comment ────────────────────────────────────────────────────────
// Creates a job comment that is visible to clients (is_client_visible=true).

export async function addClientComment(jobId: string, workspaceId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const text = (formData.get('text') as string)?.trim()
  if (!text) return { error: 'Comment cannot be empty.' }

  const { error } = await supabase.from('job_comments').insert({
    job_id:            jobId,
    user_id:           user.id,
    text,
    is_client_visible: true,
  })

  if (error) return { error: error.message }

  revalidatePath(`/portal/jobs/${jobId}`)
}
