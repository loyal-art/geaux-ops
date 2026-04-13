'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { TemplateStep } from '@/lib/types'

// ── Create Job ────────────────────────────────────────────────────────────────

export async function createJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const templateId       = formData.get('template_id') as string | null
  const title            = formData.get('title') as string
  const clientName       = formData.get('client_name') as string
  const finishDefinition = formData.get('finish_definition') as string
  const priority         = (formData.get('priority') as string) || 'normal'
  const category         = (formData.get('category') as string) || 'misc'
  const focus            = formData.get('focus') as string | null

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      template_id:       templateId || null,
      title:             title.trim(),
      client_name:       clientName?.trim() || null,
      finish_definition: finishDefinition?.trim() || null,
      focus:             focus?.trim() || null,
      priority,
      category,
      status:            'in_progress',
      assigned_to:       user.id,
      created_by:        user.id,
    })
    .select()
    .single()

  if (jobError || !job) {
    redirect(`/jobs/new?error=${encodeURIComponent(jobError?.message ?? 'Failed to create job')}`)
  }

  // Copy steps from template
  if (templateId) {
    const { data: template } = await supabase
      .from('job_templates')
      .select('default_steps')
      .eq('id', templateId)
      .single()

    const steps = (template?.default_steps as TemplateStep[] | null) ?? []
    if (steps.length > 0) {
      await supabase.from('job_steps').insert(
        steps.map(s => ({
          job_id:           job.id,
          text:             s.text,
          sort_order:       s.sort_order,
          is_high_impact:   s.is_high_impact,
          allowance_amount: s.allowance_amount ?? 0,
          done:             false,
        }))
      )
    }
  }

  revalidatePath('/dashboard')
  redirect(`/jobs/${job.id}`)
}

// ── Toggle Step ───────────────────────────────────────────────────────────────

export async function toggleStep(stepId: string, done: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('job_steps')
    .update({
      done,
      completed_by: done ? user.id : null,
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', stepId)

  if (error) return { error: error.message }

  const { data: step } = await supabase
    .from('job_steps')
    .select('job_id')
    .eq('id', stepId)
    .single()

  if (step?.job_id) {
    revalidatePath(`/jobs/${step.job_id}`)
    revalidatePath('/dashboard')
  }

  return { error: null }
}

// ── Add Step ──────────────────────────────────────────────────────────────────

export async function addStep(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const jobId = formData.get('job_id') as string
  const text  = (formData.get('text') as string)?.trim()
  if (!text) return { error: 'Step text is required' }

  const { data: existing } = await supabase
    .from('job_steps')
    .select('sort_order')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { error } = await supabase
    .from('job_steps')
    .insert({ job_id: jobId, text, sort_order: nextOrder, done: false })

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}`)
  return { error: null }
}

// ── Add Comment ───────────────────────────────────────────────────────────────

export async function addComment(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const jobId = formData.get('job_id') as string
  const text  = (formData.get('text') as string)?.trim()
  if (!text) return { error: 'Comment cannot be empty' }

  const { error } = await supabase
    .from('job_comments')
    .insert({ job_id: jobId, user_id: user.id, text })

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}`)
  return { error: null }
}

// ── Update Job Category ───────────────────────────────────────────────────────

export async function updateJobCategory(jobId: string, category: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('jobs')
    .update({ category })
    .eq('id', jobId)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

// ── Update Job Status ─────────────────────────────────────────────────────────

export async function updateJobStatus(jobId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const updates: Record<string, unknown> = { status }
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)

  if (error) return { error: error.message }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { error: null }
}

// ── Mark Job Waiting (with reason comment) ────────────────────────────────────

export async function markJobWaiting(jobId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error: statusError } = await supabase
    .from('jobs')
    .update({ status: 'waiting' })
    .eq('id', jobId)

  if (statusError) return { error: statusError.message }

  // Auto-generate a comment recording who/what the job is waiting on
  const commentText = `Status changed to Waiting: ${reason}`
  await supabase
    .from('job_comments')
    .insert({ job_id: jobId, user_id: user.id, text: commentText })

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')
  return { error: null }
}
