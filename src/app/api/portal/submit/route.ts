import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { workspaceId, description, finish, deadline } = await request.json()

  if (!workspaceId || !description?.trim()) {
    return NextResponse.json({ error: 'workspaceId and description are required' }, { status: 400 })
  }

  // Verify the requesting user is a member of this workspace
  const { data: membership } = await supabase
    .from('group_members')
    .select('role_in_group')
    .eq('group_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title:                description.trim(),
      finish_definition:    finish?.trim() || null,
      due_date:             deadline || null,
      status:               'unassigned',
      priority:             'normal',
      category:             'misc',
      group_id:             workspaceId,
      created_by:           user.id,
      submitted_via_portal: true,
    })
    .select('id')
    .single()

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create job' }, { status: 500 })
  }

  revalidatePath(`/portal/${workspaceId}`)
  revalidatePath('/dashboard')

  return NextResponse.json({ id: job.id })
}
