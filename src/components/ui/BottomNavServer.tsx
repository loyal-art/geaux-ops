import { createClient } from '@/lib/supabase/server'
import { getUserEffectiveRole, getPermissions } from '@/lib/permissions'
import { BottomNav } from './BottomNav'

/**
 * Server component wrapper for BottomNav.
 * Fetches the current user's effective role (highest across all workspaces)
 * and passes the computed permissions to the client BottomNav component.
 */
export async function BottomNavServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <BottomNav canCreateJobs={false} />

  const role = await getUserEffectiveRole(supabase, user.id)
  const { canCreateJobs } = getPermissions(role)

  return <BottomNav canCreateJobs={canCreateJobs} />
}
