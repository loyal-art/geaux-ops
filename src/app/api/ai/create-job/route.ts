import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { title, client_name, finish_definition, focus, priority, category, steps } = await request.json()

  if (!title?.trim() || !Array.isArray(steps) || steps.length === 0) {
    return NextResponse.json({ error: 'Title and steps are required' }, { status: 400 })
  }

  // Try to match the "who's this for?" input against group names first,
  // then fall back to storing as plain client_name text.
  let groupId:    string | null = null
  let projectId:  string | null = null
  let resolvedClientName: string | null = client_name?.trim() || null

  if (client_name?.trim()) {
    const term = client_name.trim()

    // 1. Match against groups
    const { data: matchedGroup } = await supabase
      .from('groups')
      .select('id, name')
      .ilike('name', term)
      .limit(1)
      .maybeSingle()

    if (matchedGroup) {
      groupId = matchedGroup.id
      resolvedClientName = null  // group link is sufficient; no need for text field
    } else {
      // 2. Match against contacts (external people in workspaces)
      const { data: matchedContact } = await supabase
        .from('contacts')
        .select('id, name, group_id')
        .ilike('name', term)
        .limit(1)
        .maybeSingle()

      if (matchedContact) {
        groupId = matchedContact.group_id
        resolvedClientName = matchedContact.name  // keep name for display
      } else {
        // 3. Fall back: match against legacy clients table (keep project link)
        const { data: matchedClient } = await supabase
          .from('clients')
          .select('id, projects(id)')
          .ilike('name', term)
          .limit(1)
          .maybeSingle()

        if (matchedClient?.projects && Array.isArray(matchedClient.projects) && matchedClient.projects.length > 0) {
          projectId = matchedClient.projects[0].id
        }
      }
    }
  }

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      title: title.trim(),
      client_name: resolvedClientName,
      group_id: groupId,
      finish_definition: finish_definition?.trim() || null,
      focus: focus?.trim() || null,
      priority: priority || 'normal',
      category: category || 'misc',
      project_id: projectId,
      status: 'in_progress',
      assigned_to: user.id,
      created_by: user.id,
    })
    .select()
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? 'Failed to create job' }, { status: 500 })
  }

  // Insert steps
  const stepRows = steps
    .filter((s: string) => s.trim())
    .map((text: string, idx: number) => ({
      job_id: job.id,
      text: text.trim(),
      sort_order: idx,
      done: false,
    }))

  if (stepRows.length > 0) {
    const { error: stepsError } = await supabase.from('job_steps').insert(stepRows)
    if (stepsError) {
      console.error('Failed to insert steps:', stepsError)
    }
  }

  revalidatePath('/dashboard')

  return NextResponse.json({ id: job.id })
}
