'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { TemplateStep, StepDependency } from '@/lib/types'

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
  if (!user) return {
    error: 'Not authenticated',
    unlockedStepNames: [] as string[],
    revertedStepNames: [] as string[],
  }

  const revertedStepNames: string[] = []

  if (done) {
    // ── Mark complete: single-row update ────────────────────────────────────
    const { error } = await supabase
      .from('job_steps')
      .update({
        done: true,
        completed_by: user.id,
        completed_at: new Date().toISOString(),
      })
      .eq('id', stepId)

    if (error) return {
      error: error.message,
      unlockedStepNames: [] as string[],
      revertedStepNames: [] as string[],
    }
  } else {
    // ── Mark incomplete: cascade-revert any transitively dependent done steps ─
    // BFS through step_dependencies from stepId following blocked_by → step
    const visited = new Set<string>([stepId])
    let frontier: string[] = [stepId]
    while (frontier.length > 0) {
      const { data: deps } = await supabase
        .from('step_dependencies')
        .select('step_id')
        .in('blocked_by_step_id', frontier)

      const nextFrontier: string[] = []
      for (const d of deps ?? []) {
        if (!visited.has(d.step_id)) {
          visited.add(d.step_id)
          nextFrontier.push(d.step_id)
        }
      }
      frontier = nextFrontier
    }

    // Exclude the original step; find which dependents are currently done
    const dependentIds = Array.from(visited).filter(id => id !== stepId)
    let doneDependentIds: string[] = []
    if (dependentIds.length > 0) {
      const { data: doneDeps } = await supabase
        .from('job_steps')
        .select('id, text')
        .in('id', dependentIds)
        .eq('done', true)

      doneDependentIds = (doneDeps ?? []).map(d => d.id)
      for (const d of doneDeps ?? []) revertedStepNames.push(d.text)
    }

    // Atomic: single UPDATE statement over the original step + all done dependents.
    // PostgreSQL wraps each statement in an implicit transaction, so either every
    // row updates or none do.
    const idsToUpdate = [stepId, ...doneDependentIds]
    const { error } = await supabase
      .from('job_steps')
      .update({ done: false, completed_by: null, completed_at: null })
      .in('id', idsToUpdate)

    if (error) return {
      error: error.message,
      unlockedStepNames: [] as string[],
      revertedStepNames: [] as string[],
    }
  }

  const { data: step } = await supabase
    .from('job_steps')
    .select('job_id')
    .eq('id', stepId)
    .single()

  if (step?.job_id) {
    revalidatePath(`/jobs/${step.job_id}`)
    revalidatePath('/dashboard')
  }

  // When marking done, find dependent steps that are now fully unblocked
  const unlockedStepNames: string[] = []
  if (done) {
    const { data: dependentDeps } = await supabase
      .from('step_dependencies')
      .select('step_id')
      .eq('blocked_by_step_id', stepId)

    for (const dep of dependentDeps ?? []) {
      const { data: allBlockers } = await supabase
        .from('step_dependencies')
        .select('blocked_by_step_id')
        .eq('step_id', dep.step_id)

      if (!allBlockers || allBlockers.length === 0) continue

      const { data: incomplete } = await supabase
        .from('job_steps')
        .select('id')
        .in('id', allBlockers.map(b => b.blocked_by_step_id))
        .eq('done', false)

      if (!incomplete || incomplete.length === 0) {
        const { data: depStep } = await supabase
          .from('job_steps').select('text').eq('id', dep.step_id).single()
        if (depStep?.text) unlockedStepNames.push(depStep.text)
      }
    }
  }

  return { error: null, unlockedStepNames, revertedStepNames }
}

// ── Add Step ──────────────────────────────────────────────────────────────────

export async function addStep(_: unknown, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const jobId        = formData.get('job_id') as string
  const text         = (formData.get('text') as string)?.trim()
  const parentStepId = (formData.get('parent_step_id') as string)?.trim() || null

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
    .insert({
      job_id:         jobId,
      text,
      sort_order:     nextOrder,
      done:           false,
      parent_step_id: parentStepId,
    })

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

// ── Reopen Job ────────────────────────────────────────────────────────────────

export async function reopenJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { error } = await supabase
    .from('jobs')
    .update({ status: 'in_progress', completed_at: null })
    .eq('id', jobId)

  if (error) return { error: error.message }

  const name = profile?.display_name ?? 'Unknown'
  await supabase
    .from('job_comments')
    .insert({ job_id: jobId, user_id: user.id, text: `Job reopened by ${name}` })

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

// ── Complete Job (with confetti notifications) ────────────────────────────────
//
// Marks the job complete, then fires team notifications via the service-role
// client (bypasses RLS so we can insert notifications for all workspace members).
// Notification failures are non-fatal — the status update always takes priority.

export async function completeJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Mark complete
  const { error: updateError } = await supabase
    .from('jobs')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', jobId)

  if (updateError) return { error: updateError.message }

  revalidatePath(`/jobs/${jobId}`)
  revalidatePath('/dashboard')

  // 2. Notifications (best-effort; never blocks the response)
  try {
    const service = createServiceClient()

    const [{ data: completingUser }, { data: job }] = await Promise.all([
      service.from('users').select('display_name').eq('id', user.id).single(),
      service.from('jobs').select('title, group_id, assigned_to, project_id').eq('id', jobId).single(),
    ])

    if (!job) return { error: null }

    const name           = completingUser?.display_name ?? 'Someone'
    const completionMsg  = `${name} completed "${job.title}"`

    // --- Workspace notifications ---
    type NotifRow = { user_id: string; type: string; job_id: string; message: string }
    const notifs: NotifRow[] = []

    if (job.group_id) {
      const { data: members } = await service
        .from('group_members')
        .select('user_id')
        .eq('group_id', job.group_id)

      for (const m of members ?? []) {
        notifs.push({ user_id: m.user_id, type: 'job_completed', job_id: jobId, message: completionMsg })
      }
    }

    // Ensure at least the completing user gets one
    if (notifs.length === 0) {
      notifs.push({ user_id: user.id, type: 'job_completed', job_id: jobId, message: completionMsg })
    }

    // Dedup by user_id
    const seen    = new Set<string>()
    const deduped = notifs.filter(n => { if (seen.has(n.user_id)) return false; seen.add(n.user_id); return true })
    if (deduped.length > 0) await service.from('notifications').insert(deduped)

    // --- Specific notification to assigned_to (if not the one completing) ---
    if (job.assigned_to && job.assigned_to !== user.id) {
      await service.from('notifications').insert({
        user_id: job.assigned_to,
        type:    'job_completed_assigned',
        job_id:  jobId,
        message: `${name} completed your job: "${job.title}"`,
      })
    }

    // --- Project nudge: next ready/queued job in the same project ---
    if (job.project_id && job.group_id) {
      const { data: nextJobs } = await service
        .from('jobs')
        .select('title')
        .eq('project_id', job.project_id)
        .in('status', ['queued', 'ready'])
        .neq('id', jobId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (nextJobs && nextJobs.length > 0) {
        const nudgeMsg      = `"${job.title}" is done — "${nextJobs[0].title}" is ready to go.`
        const { data: members } = await service
          .from('group_members').select('user_id').eq('group_id', job.group_id)

        const nudges = (members ?? []).map(m => ({
          user_id: m.user_id, type: 'next_job_ready', job_id: jobId, message: nudgeMsg,
        }))
        if (nudges.length > 0) await service.from('notifications').insert(nudges)
      }
    }
  } catch {
    // Notification errors never surface to the user
  }

  return { error: null }
}

// ── Step Dependencies ─────────────────────────────────────────────────────────

// BFS to detect if adding (stepId depends on blockedByStepId) would create a cycle.
// A cycle exists when stepId is reachable from blockedByStepId following blocked_by edges.
async function hasCircularDependency(
  supabase: Awaited<ReturnType<typeof createClient>>,
  stepId: string,
  blockedByStepId: string,
): Promise<boolean> {
  const visited = new Set<string>()
  const queue   = [blockedByStepId]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current === stepId) return true
    if (visited.has(current))  continue
    visited.add(current)

    const { data } = await supabase
      .from('step_dependencies')
      .select('blocked_by_step_id')
      .eq('step_id', current)

    for (const dep of data ?? []) {
      queue.push(dep.blocked_by_step_id)
    }
  }

  return false
}

export async function addStepDependency(stepId: string, blockedByStepId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: null }

  if (await hasCircularDependency(supabase, stepId, blockedByStepId)) {
    return { error: 'Adding this dependency would create a circular dependency', data: null }
  }

  const { data, error } = await supabase
    .from('step_dependencies')
    .insert({ step_id: stepId, blocked_by_step_id: blockedByStepId })
    .select()
    .single()

  if (error) return { error: error.message, data: null }

  const { data: step } = await supabase
    .from('job_steps')
    .select('job_id')
    .eq('id', stepId)
    .single()

  if (step?.job_id) revalidatePath(`/jobs/${step.job_id}`)

  return { error: null, data: data as StepDependency }
}

export async function removeStepDependency(dependencyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: dep } = await supabase
    .from('step_dependencies')
    .select('step_id')
    .eq('id', dependencyId)
    .single()

  const { error } = await supabase
    .from('step_dependencies')
    .delete()
    .eq('id', dependencyId)

  if (error) return { error: error.message }

  if (dep?.step_id) {
    const { data: step } = await supabase
      .from('job_steps')
      .select('job_id')
      .eq('id', dep.step_id)
      .single()

    if (step?.job_id) revalidatePath(`/jobs/${step.job_id}`)
  }

  return { error: null }
}

export async function getStepDependencies(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: steps } = await supabase
    .from('job_steps')
    .select('id')
    .eq('job_id', jobId)

  if (!steps || steps.length === 0) return { data: [] as StepDependency[], error: null }

  const stepIds = steps.map(s => s.id)

  const { data, error } = await supabase
    .from('step_dependencies')
    .select('*')
    .in('step_id', stepIds)

  if (error) return { data: null, error: error.message }

  return { data: data as StepDependency[], error: null }
}

// Returns the names of any incomplete blocker steps, or an empty array if unlocked.
export async function isStepLocked(stepId: string): Promise<{ locked: boolean; blockerNames: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { locked: false, blockerNames: [] }

  const { data: deps } = await supabase
    .from('step_dependencies')
    .select('blocked_by_step_id')
    .eq('step_id', stepId)

  if (!deps || deps.length === 0) return { locked: false, blockerNames: [] }

  const blockerIds = deps.map(d => d.blocked_by_step_id)

  const { data: incompleteBlockers } = await supabase
    .from('job_steps')
    .select('text')
    .in('id', blockerIds)
    .eq('done', false)

  const blockerNames = (incompleteBlockers ?? []).map(s => s.text)
  return { locked: blockerNames.length > 0, blockerNames }
}
