import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadAssignableWorkspaces } from '@/lib/assignments'
import AiJobClient from './AiJobClient'

export default async function AiJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const workspaces = await loadAssignableWorkspaces(supabase, user.id)

  return <AiJobClient workspaces={workspaces} currentUserId={user.id} />
}
