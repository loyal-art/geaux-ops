import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function InvitesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Owner-only section
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'owner') redirect('/dashboard')

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0F1117', color: '#E8E9ED' }}>
      {children}
      <BottomNav />
    </div>
  )
}
