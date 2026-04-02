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

  // Try to match client name to an existing client
  let projectId: string | null = null
  if (client_name) {
    const { data: matchedClient } = await supabase
      .from('clients')
      .select('id, projects(id)')
      .ilike('name', client_name.trim())
      .limit(1)
      .single()

    // If client has projects, link to the first one (user can change later)
    if (matchedClient?.projects && Array.isArray(matchedClient.projects) && matchedClient.projects.length > 0) {
      projectId = matchedClient.projects[0].id
    }
  }

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      title: title.trim(),
      client_name: client_name?.trim() || null,
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
