import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNavServer } from '@/components/ui/BottomNavServer'

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#0F1117', color: '#E8E9ED' }}>
      {children}
      <BottomNavServer />
    </div>
  )
}
